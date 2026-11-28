"use strict";

import assert from "node:assert/strict";
import test from "node:test";
import {normaliseZ2mPowerConfig, transitionZ2mPower, type Z2mPowerMessage, type Z2mPowerState} from "../lib/z2m-power";

const config = normaliseZ2mPowerConfig({baseTopic: "z2m", friendlyName: "study/socket"});
const at = (seconds: number) => new Date(Date.parse("2026-11-28T10:00:00Z") + seconds * 1000);
const apply = (state: Partial<Z2mPowerState> | undefined, msg: Z2mPowerMessage, seconds = 0) => transitionZ2mPower(state, msg, config, at(seconds));
const report = (fields: Record<string, unknown>) => ({topic: "z2m/study/socket", payload: JSON.stringify(fields)});

test("Zigbee2MQTT power settings: no default device; the base topic defaults", () => {
  assert.deepEqual(normaliseZ2mPowerConfig({friendlyName: "a"}), {baseTopic: "zigbee2mqtt", friendlyName: "a"});
  assert.throws(() => normaliseZ2mPowerConfig({}), /friendly name is required/);
  assert.throws(() => normaliseZ2mPowerConfig({friendlyName: "a/#"}), /\+ or #/);
});

test("a plug's power becomes msg.power, watts only and changes only", () => {
  let result = apply(undefined, report({power: 140, energy: 12.5, voltage: 230, state: "ON"}), 1);
  assert.deepEqual(result.readings, [{power: {kind: "observed", watts: 140, observedAt: at(1).toISOString()}}]);
  result = apply(result.state, report({power: 140, energy: 12.6}), 2);
  assert.deepEqual(result.readings, [], "unchanged");
  result = apply(result.state, report({power: 3}), 3);
  assert.deepEqual(result.readings.map(({power}) => power.watts), [3]);
  // Not watts: ignored with a trace; no power at all: nothing.
  result = apply(result.state, report({power: "high"}), 4);
  assert.deepEqual([result.readings, result.traces[0]?.reason], [[], "not-watts"]);
  result = apply(result.state, report({state: "ON"}), 5);
  assert.deepEqual([result.readings, result.traces], [[], []]);
});

test("a read request asks the plug on /get; availability shows on the state only", () => {
  let result = apply(undefined, {power: {kind: "read"}});
  assert.deepEqual(result.publications, [{topic: "z2m/study/socket/get", payload: "{\"power\":\"\"}"}]);
  result = apply(result.state, {topic: "z2m/study/socket/availability", payload: "{\"state\":\"offline\"}"});
  assert.deepEqual([result.state.online, result.readings], [false, []]);
  result = apply(result.state, {power: {kind: "observed", watts: 5}});
  assert.equal(result.traces[0]?.reason, "not-a-read-request");
});
