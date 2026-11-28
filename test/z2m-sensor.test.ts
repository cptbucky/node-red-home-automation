"use strict";

import assert from "node:assert/strict";
import test from "node:test";
import {normaliseZ2mSensorConfig, transitionZ2mSensor, type Z2mSensorMessage, type Z2mSensorState} from "../lib/z2m-sensor";

const config = normaliseZ2mSensorConfig({baseTopic: "z2m", friendlyName: "hall/motion"});
const apply = (state: Partial<Z2mSensorState> | undefined, msg: Z2mSensorMessage, settings = config) => transitionZ2mSensor(state, msg, settings);
const report = (payload: Record<string, unknown>, retain = false) => ({topic: "z2m/hall/motion", payload: JSON.stringify(payload), retain});

test("Zigbee2MQTT sensor settings: no default device; occupancy is motion unless set to presence", () => {
  assert.deepEqual(normaliseZ2mSensorConfig({friendlyName: "a"}), {baseTopic: "zigbee2mqtt", friendlyName: "a", occupancyIs: "motion"});
  assert.equal(normaliseZ2mSensorConfig({friendlyName: "a", occupancyIs: "presence"}).occupancyIs, "presence");
  assert.throws(() => normaliseZ2mSensorConfig({}), /friendly name is required/);
  assert.throws(() => normaliseZ2mSensorConfig({friendlyName: "a", occupancyIs: "radar"}), /motion or presence/);
  assert.throws(() => normaliseZ2mSensorConfig({friendlyName: "a/#"}), /\+ or #/);
});

test("a report's occupancy, presence and light level become fusion's and the motion policy's messages, changes only", () => {
  let result = apply(undefined, report({occupancy: true, illuminance: 12, battery: 90}));
  assert.deepEqual([result.occupancy, result.light], [[{source: "motion", payload: true}], [{source: "illuminance", payload: 12}]]);
  // A battery report with nothing else changed: nothing sent.
  result = apply(result.state, report({occupancy: true, illuminance: 12, battery: 89}));
  assert.deepEqual([result.occupancy, result.light], [[], []]);
  result = apply(result.state, report({occupancy: false, illuminance: 12}));
  assert.deepEqual(result.occupancy, [{source: "motion", payload: false}]);
  // An mmWave sensor's presence; illuminance_lux beside a raw illuminance.
  result = apply(result.state, report({presence: true, illuminance: 3500, illuminance_lux: 40}));
  assert.deepEqual([result.occupancy, result.light], [[{source: "presence", payload: true}], [{source: "illuminance", payload: 40}]]);
  // Occupancy is presence, for an mmWave device that reports it as occupancy.
  result = apply(undefined, report({occupancy: true}), normaliseZ2mSensorConfig({baseTopic: "z2m", friendlyName: "hall/motion", occupancyIs: "presence"}));
  assert.deepEqual(result.occupancy, [{source: "presence", payload: true}]);
});

test("a retained occupancy is never acted on, and the next live one is passed on whatever it says", () => {
  let result = apply(undefined, report({occupancy: true, illuminance: 5}, true));
  assert.deepEqual(result.occupancy, [], "an old reading after a restart");
  assert.deepEqual(result.light, [{source: "illuminance", payload: 5}], "a retained light level is passed on");
  result = apply(result.state, report({occupancy: true, illuminance: 5}));
  assert.deepEqual(result.occupancy, [{source: "motion", payload: true}]);
});

test("availability shows on the state only; other topics are ignored; a report must be an object", () => {
  let result = apply(undefined, {topic: "z2m/hall/motion/availability", payload: "{\"state\":\"offline\"}"});
  assert.deepEqual([result.state.online, result.occupancy, result.light], [false, [], []]);
  result = apply(result.state, {topic: "z2m/hall/motion/availability", payload: "online"});
  assert.equal(result.state.online, true);
  result = apply(result.state, {topic: "z2m/hall/motion/spots", payload: "{}"});
  assert.equal(result.traces[0]?.reason, "other-topic");
  assert.throws(() => apply(undefined, {topic: "z2m/hall/motion", payload: "ON"}), /state object/);
});
