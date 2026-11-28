"use strict";

import assert from "node:assert/strict";
import test from "node:test";
import {normaliseEsphomeSensorConfig, transitionEsphomeSensor, type EsphomeSensorMessage, type EsphomeSensorState} from "../lib/esphome-sensor";
import {transitionOccupancy, type OccupancyState} from "../lib/occupancy-fusion";
import {transitionMotion, type MotionEffect, type MotionState} from "../lib/motion-policy";

const ep1 = normaliseEsphomeSensorConfig({device: "office-sensor", model: "everything-presence-one"});
const apollo = normaliseEsphomeSensorConfig({device: "kitchen-sensor", model: "apollo-r-pro-1"});
type Config = typeof ep1;
const apply = (state: Partial<EsphomeSensorState> | undefined, msg: EsphomeSensorMessage, config: Config = ep1) =>
  transitionEsphomeSensor(state, msg, config);
const binary = (config: Config, entity: string, value: string, retain = false) =>
  ({topic: `${config.device}/binary_sensor/${entity}/state`, payload: value, retain});
const sensor = (config: Config, entity: string, value: string, retain = false) =>
  ({topic: `${config.device}/sensor/${entity}/state`, payload: value, retain});
const status = (config: Config, value: string, retain = false) => ({topic: `${config.device}/status`, payload: value, retain});

test("ESPHome sensor settings: a named model and the device's topic prefix, which has no default", () => {
  assert.throws(() => normaliseEsphomeSensorConfig({model: "apollo-r-pro-1"}), /topic prefix is required/);
  assert.throws(() => normaliseEsphomeSensorConfig({device: "a", model: "custom"}), /unknown model/);
  assert.throws(() => normaliseEsphomeSensorConfig({device: "a/#", model: "apollo-r-pro-1"}), /\+ or #/);
});

test("Everything Presence One: pir is motion, mmwave presence, illuminance the light level; its own occupancy isn't read", () => {
  let result = apply(undefined, status(ep1, "online"));
  result = apply(result.state, binary(ep1, "pir", "ON"));
  assert.deepEqual(result.occupancy, [{source: "motion", payload: true}]);
  result = apply(result.state, binary(ep1, "mmwave", "ON"));
  assert.deepEqual(result.occupancy, [{source: "presence", payload: true}]);
  result = apply(result.state, binary(ep1, "occupancy", "OFF"));
  assert.equal(result.traces[0]?.reason, "other-topic");
  result = apply(result.state, sensor(ep1, "illuminance", "4.8"));
  assert.deepEqual(result.light, [{source: "illuminance", payload: 4.8}]);
  // Changes only.
  result = apply(result.state, binary(ep1, "pir", "ON"));
  assert.deepEqual(result.occupancy, []);
});

test("Apollo R PRO-1: either radar is enough for on; off once both are off", () => {
  let result = apply(undefined, status(apollo, "online"), apollo);
  result = apply(result.state, binary(apollo, "moving_target", "OFF"), apollo);
  assert.deepEqual(result.occupancy, [], "the other radar not known yet");
  result = apply(result.state, binary(apollo, "ld2412_moving_target", "ON"), apollo);
  assert.deepEqual(result.occupancy, [{source: "motion", payload: true}]);
  result = apply(result.state, binary(apollo, "ld2412_moving_target", "OFF"), apollo);
  assert.deepEqual(result.occupancy, [{source: "motion", payload: false}]);
  result = apply(result.state, binary(apollo, "presence", "ON"), apollo);
  assert.deepEqual(result.occupancy, [{source: "presence", payload: true}]);
  result = apply(result.state, sensor(apollo, "ltr390_light", "6.3"), apollo);
  assert.deepEqual(result.light, [{source: "illuminance", payload: 6.3}]);
});

test("fixed contracts: only ON or OFF on output 1, only a number on output 2; anything else traced, never passed", () => {
  let result = apply(undefined, status(ep1, "online"));
  result = apply(result.state, binary(ep1, "pir", "unknown"));
  assert.deepEqual([result.occupancy, result.traces[0]?.reason], [[], "not-on-or-off"]);
  result = apply(result.state, sensor(ep1, "illuminance", "nan"));
  assert.deepEqual([result.light, result.traces[0]?.reason], [[], "not-a-number"]);
});

test("as Node-RED starts: retained states pass as a baseline while the device is online, are held until its status, and are ignored when it's offline", () => {
  // The status first, then the states.
  let result = apply(undefined, status(ep1, "online", true));
  result = apply(result.state, binary(ep1, "pir", "OFF", true));
  assert.deepEqual(result.occupancy, [{source: "motion", payload: false, baseline: true}]);
  // The states first: held, then sent with the status, presence first.
  result = apply(undefined, binary(ep1, "pir", "OFF", true));
  result = apply(result.state, binary(ep1, "mmwave", "ON", true));
  assert.deepEqual(result.occupancy, []);
  result = apply(result.state, status(ep1, "online", true));
  assert.deepEqual(result.occupancy, [{source: "presence", payload: true, baseline: true}, {source: "motion", payload: false, baseline: true}]);
  // A device that isn't online: its retained states aren't current.
  result = apply(undefined, status(ep1, "offline", true));
  result = apply(result.state, binary(ep1, "pir", "ON", true));
  result = apply(result.state, sensor(ep1, "illuminance", "50", true));
  assert.deepEqual([result.occupancy, result.light], [[], []]);
});

// Through occupancy fusion and the motion lighting policy, as wired.
function room(baselines: Array<{source: "motion" | "presence"; payload: boolean; baseline?: true}>) {
  const motionConfig = {area: "office", onTargets: ["main"], offTargets: ["main"], defaultDelaySeconds: 120, defaultIlluminanceCutoff: 10};
  let fusion: Partial<OccupancyState> | undefined;
  let motion: Partial<MotionState> | undefined;
  const effects: MotionEffect[] = [];
  for (const message of baselines) {
    const fused = transitionOccupancy(fusion, message, {presenceMode: "hold"});
    fusion = fused.state;
    for (const output of fused.outputs) {
      const result = transitionMotion(motion, output, motionConfig, true, 1000);
      motion = result.state;
      effects.push(...result.effects);
    }
  }
  return {fusion: fusion as OccupancyState, motion: motion as MotionState | undefined, effects, motionConfig};
}

test("a restart with the room empty starts its vacancy: the lights go off when the delay runs out", () => {
  const sent: Parameters<typeof room>[0] = [];
  let result = apply(undefined, status(ep1, "online", true));
  for (const msg of [binary(ep1, "mmwave", "OFF", true), binary(ep1, "pir", "OFF", true)]) {
    result = apply(result.state, msg);
    sent.push(...result.occupancy);
  }
  const empty = room(sent);
  assert.equal(empty.fusion.occupied, false);
  // The latest countdown: each first "off" reading (presence, then motion) starts it again.
  const timer = empty.effects.filter((effect) => effect.kind === "schedule-off-timer").at(-1) as Extract<MotionEffect, {kind: "schedule-off-timer"}>;
  assert.ok(timer, "the vacancy countdown started");
  assert.equal(timer.delayMs, 120000);
  const fired = transitionMotion(empty.motion, {source: "off-timer", generation: timer.generation}, empty.motionConfig, true, 121000);
  assert.ok(fired.effects.some((effect) => effect.kind === "send" && (effect.message as {lighting: {state: string}}).lighting.state === "OFF"));
});

test("a restart with someone there switches nothing on, and motion acts from its next change", () => {
  const sent: Parameters<typeof room>[0] = [];
  let result = apply(undefined, status(ep1, "online", true));
  for (const msg of [binary(ep1, "mmwave", "ON", true), binary(ep1, "pir", "OFF", true)]) {
    result = apply(result.state, msg);
    sent.push(...result.occupancy);
  }
  const occupied = room(sent);
  assert.equal(occupied.fusion.occupied, true);
  assert.deepEqual(occupied.effects, [], "nothing sent, no countdown");
  // They leave: presence off with motion off empties the room as usual.
  result = apply(result.state, binary(ep1, "mmwave", "OFF"));
  const left = transitionOccupancy(occupied.fusion, result.occupancy[0]!, {presenceMode: "hold"});
  assert.deepEqual(left.outputs.map(({payload}) => payload.occupied), [false]);
});
