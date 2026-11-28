"use strict";

import assert from "node:assert/strict";
import test from "node:test";
import {
  transitionOccupancy,
  type OccupancyConfig,
  type OccupancyOutput
} from "../lib/occupancy-fusion";

const pirOnly: OccupancyConfig = {presenceMode: "ignore"};
const pirAndPresence: OccupancyConfig = {presenceMode: "hold"};

function occupancy(result: ReturnType<typeof transitionOccupancy>): OccupancyOutput["payload"][] {
  return result.outputs.map((message) => message.payload);
}

test("PIR-only occupancy follows motion edges", () => {
  const active = transitionOccupancy(undefined, {source: "motion", payload: {motion: true}}, pirOnly);
  assert.deepEqual(occupancy(active), [{
    kind: "occupancy",
    occupied: true,
    trigger: "motion",
    reason: "motion-active",
    sources: {motion: true, presence: null}
  }]);

  const inactive = transitionOccupancy(active.state, {source: "motion", payload: {motion: false}}, pirOnly);
  assert.equal(occupancy(inactive)[0]!.occupied, false);
  assert.equal(occupancy(inactive)[0]!.reason, "all-sources-inactive");
});

test("presence holds motion-established occupancy but cannot establish it", () => {
  const presence = transitionOccupancy(undefined, {source: "presence", payload: {presence: true}}, pirAndPresence);
  assert.equal(occupancy(presence).length, 0);
  assert.equal(presence.state.occupied, false);

  const motionOn = transitionOccupancy(presence.state, {source: "motion", payload: {motion: true}}, pirAndPresence);
  const motionOff = transitionOccupancy(motionOn.state, {source: "motion", payload: {motion: false}}, pirAndPresence);
  assert.equal(occupancy(motionOff).length, 0);
  assert.equal(motionOff.state.occupied, true);

  const presenceOff = transitionOccupancy(motionOff.state, {source: "presence", payload: {presence: false}}, pirAndPresence);
  assert.equal(occupancy(presenceOff)[0]!.occupied, false);
});

test("a new PIR edge retriggers while presence holds occupancy", () => {
  let result = transitionOccupancy(undefined, {source: "motion", payload: true}, pirAndPresence);
  result = transitionOccupancy(result.state, {source: "presence", payload: true}, pirAndPresence);
  result = transitionOccupancy(result.state, {source: "motion", payload: false}, pirAndPresence);
  result = transitionOccupancy(result.state, {source: "motion", payload: true}, pirAndPresence);

  assert.equal(occupancy(result).length, 1);
  assert.equal(occupancy(result)[0]!.trigger, "motion");
});

test("unknown and unavailable sensor states do not clear occupancy", () => {
  const active = transitionOccupancy(undefined, {source: "motion", payload: "on"}, pirOnly);
  const unknown = transitionOccupancy(active.state, {source: "motion", payload: "unavailable"}, pirOnly);

  assert.equal(unknown.state.occupied, true);
  assert.equal(occupancy(unknown).length, 0);
  assert.equal(unknown.traces[0]!.reason, "unknown-state");
});

test("the fused state changes only with an emit", () => {
  // dev-review repro: motion off while presence is on set occupied silently.
  let result = transitionOccupancy(undefined, {source: "presence", payload: true}, pirAndPresence);
  result = transitionOccupancy(result.state, {source: "motion", payload: false}, pirAndPresence);
  assert.equal(result.status.occupied, false);
  assert.deepEqual(occupancy(result), []);

  // Every change of the fused state is emitted, and nothing else is.
  let occupied = result.state.occupied;
  for (const [source, payload] of [
    ["motion", true], ["motion", false], ["presence", false], ["presence", true],
    ["motion", false], ["motion", true], ["presence", false], ["motion", false]
  ] as const) {
    result = transitionOccupancy(result.state, {source, payload}, pirAndPresence);
    const emitted = occupancy(result).map(({occupied: value}) => value);
    if (result.state.occupied !== occupied) assert.deepEqual(emitted, [result.state.occupied], `${source}=${payload}`);
    else if (!(source === "motion" && payload === true)) assert.deepEqual(emitted, [], `${source}=${payload}`);
    occupied = result.state.occupied;
  }
});

test("a baseline: someone there as Node-RED starts is occupied with nothing sent; an empty room is vacant as usual", () => {
  for (const source of ["motion", "presence"] as const) {
    const there = transitionOccupancy(undefined, {source, payload: true, baseline: true}, pirAndPresence);
    assert.deepEqual([there.outputs, there.state.occupied], [[], true], source);
  }
  const empty = transitionOccupancy(undefined, {source: "motion", payload: false, baseline: true}, pirAndPresence);
  assert.deepEqual(occupancy(empty).map(({occupied}) => occupied), [false]);
  // After an occupied baseline, motion's next change acts.
  const there = transitionOccupancy(undefined, {source: "motion", payload: true, baseline: true}, pirOnly);
  const gone = transitionOccupancy(there.state, {source: "motion", payload: false}, pirOnly);
  assert.deepEqual(occupancy(gone).map(({occupied}) => occupied), [false]);
});
