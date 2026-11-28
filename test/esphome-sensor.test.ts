"use strict";

import assert from "node:assert/strict";
import test from "node:test";
import {esphomeSensorTopics, normaliseEsphomeSensorConfig, transitionEsphomeSensor, type EsphomeSensorMessage, type EsphomeSensorState} from "../lib/esphome-sensor";
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

test("ESPHome sensor settings: a named model and the device's name, which has no default; the discovery prefix defaults", () => {
  assert.throws(() => normaliseEsphomeSensorConfig({model: "apollo-r-pro-1"}), /name is required/);
  assert.equal(normaliseEsphomeSensorConfig({device: "a", model: "apollo-r-pro-1"}).discoveryPrefix, "homeassistant");
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

test("Apollo R PRO-1: either radar is enough for on; off once every radar that has reported is off", () => {
  let result = apply(undefined, status(apollo, "online"), apollo);
  result = apply(result.state, binary(apollo, "moving_target", "OFF"), apollo);
  assert.deepEqual(result.occupancy, [{source: "motion", payload: false}], "the radars that have reported");
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

test("Apollo R PRO-1, both firmware namings: the room empties whichever the device publishes (ld2450_ or not)", () => {
  for (const radar of ["", "ld2450_"]) {
    let result = apply(undefined, status(apollo, "online"), apollo);
    const sent: string[] = [];
    for (const [entity, value] of [[`${radar}presence`, "ON"], [`${radar}moving_target`, "ON"], ["ld2412_presence", "ON"], ["ld2412_moving_target", "ON"],
      [`${radar}presence`, "OFF"], [`${radar}moving_target`, "OFF"], ["ld2412_presence", "OFF"], ["ld2412_moving_target", "OFF"]] as const) {
      result = apply(result.state, binary(apollo, entity, value), apollo);
      sent.push(...result.occupancy.map(({source, payload}) => `${source}=${payload}`));
    }
    assert.deepEqual(sent, ["presence=true", "motion=true", "presence=false", "motion=false"], radar || "unprefixed");
  }
});

// A discovery entry in Home Assistant's format, as ESPHome publishes it (abbreviated keys), written for these tests.
const describe = (config: Config, component: string, object: string, deviceClass: string | null, model: string, stateTopic?: string) => ({
  topic: `homeassistant/${component}/${config.device}/${object}/config`,
  retain: true,
  payload: JSON.stringify({name: object, ...(deviceClass ? {dev_cla: deviceClass} : {}),
    stat_t: stateTopic ?? `${config.device}/${component}/${object}/state`, avty_t: `${config.device}/status`,
    dev: {ids: "test", name: "Test", mdl: model}})
});

test("discovery first: the Everything Presence One's entities by device class, its combined occupancy left out", () => {
  let result = apply(undefined, describe(ep1, "binary_sensor", "pir", "motion", "Everything Presence One"));
  for (const entry of [describe(ep1, "binary_sensor", "mmwave", "occupancy", "Everything Presence One"),
    describe(ep1, "binary_sensor", "occupancy", "occupancy", "Everything Presence One"),
    describe(ep1, "sensor", "illuminance", "illuminance", "Everything Presence One"),
    describe(ep1, "sensor", "temperature", "temperature", "Everything Presence One")]) {
    result = apply(result.state, entry);
  }
  assert.deepEqual([result.roles.source, result.roles.motion, result.roles.presence, result.roles.illuminance],
    ["discovered", ["office-sensor/binary_sensor/pir/state"], ["office-sensor/binary_sensor/mmwave/state"], ["office-sensor/sensor/illuminance/state"]]);
  // The device's own occupancy isn't read.
  result = apply(result.state, status(ep1, "online"));
  result = apply(result.state, binary(ep1, "occupancy", "ON"));
  assert.deepEqual(result.occupancy, []);
});

test("discovery first: a renamed entity is followed, and the difference from the preset is traced", () => {
  let result = apply(undefined, describe(ep1, "binary_sensor", "pir", "motion", "Everything Presence One"));
  result = apply(result.state, describe(ep1, "binary_sensor", "radar", "occupancy", "Everything Presence One"));
  assert.ok(result.traces.some((entry) => entry.event === "roles" && entry.reason === "differs-from-preset"));
  assert.ok(result.topics.includes("office-sensor/binary_sensor/radar/state"), "the node subscribes to it");
  result = apply(result.state, status(ep1, "online"));
  result = apply(result.state, binary(ep1, "radar", "ON"));
  assert.deepEqual(result.occupancy, [{source: "presence", payload: true}]);
  // The preset's name is no longer read.
  result = apply(result.state, binary(ep1, "mmwave", "OFF"));
  assert.deepEqual(result.occupancy, []);
  // An entity removed from the device (an empty discovery entry).
  result = apply(result.state, {topic: "homeassistant/binary_sensor/office-sensor/radar/config", payload: "", retain: true});
  assert.ok(!result.roles.presence.includes("office-sensor/binary_sensor/radar/state"));
});

test("discovery first: the Apollo with discovery on (either radar naming), without it the preset, and another model's discovery the preset", () => {
  assert.equal(apply(undefined, status(apollo, "online"), apollo).roles.source, "preset");
  let result = apply(undefined, describe(apollo, "binary_sensor", "ld2450_presence", "occupancy", "R_PRO-1"), apollo);
  for (const entry of [describe(apollo, "binary_sensor", "ld2412_presence", "occupancy", "R_PRO-1"),
    describe(apollo, "binary_sensor", "ld2450_moving_target", "motion", "R_PRO-1"),
    describe(apollo, "binary_sensor", "ld2412_moving_target", "motion", "R_PRO-1"),
    describe(apollo, "sensor", "ltr390_light", "illuminance", "R_PRO-1")]) {
    result = apply(result.state, entry, apollo);
  }
  assert.deepEqual([result.roles.source, result.roles.presence.length, result.roles.motion.length, result.roles.illuminance.length], ["discovered", 2, 2, 1]);
  const other = apply(undefined, describe(apollo, "binary_sensor", "pir", "motion", "Everything Presence One"), apollo);
  assert.equal(other.roles.source, "preset-other-model");
  // As the node starts: the discovery topic and the preset's topics.
  assert.ok(esphomeSensorTopics(apollo).initial.includes("homeassistant/+/kitchen-sensor/+/config"));
});
