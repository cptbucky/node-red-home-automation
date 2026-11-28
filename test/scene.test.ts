"use strict";

import assert from "node:assert/strict";
import test from "node:test";
import type {LightCommandMessage, LightRoomMessage} from "../lib/light-contract";
import {transitionRoom, type RoomConfig, type RoomState} from "../lib/room-controller";
import {RENEW_MS, normaliseSceneConfig, sceneTickAt, transitionScene, type SceneConfig, type SceneState} from "../lib/scene";
import {sceneDiscovery, sceneInbound, sceneStateOutputs} from "../lib/scene-publishing";

const at = (seconds: number) => Date.parse("2026-11-27T20:00:00Z") + seconds * 1000;
const exercise = normaliseSceneConfig({owner: "scene:Exercise", safetyHours: 4,
  lights: JSON.stringify([{area: "lounge", target: "main", state: "OFF"}, {area: "lounge", target: "tv", state: "ON"}])});
const bath = normaliseSceneConfig({owner: "scene:Bath", safetyHours: 0,
  lights: JSON.stringify([{area: "lounge", target: "main", state: "ON", brightnessPct: 30, colorTempKelvin: 2700}])});

function run(config: SceneConfig, state: Partial<SceneState> | undefined, scene: Record<string, unknown>, seconds: number) {
  return transitionScene(state, {scene}, config, at(seconds));
}

test("settings: lights as a JSON array of a room's area, a target, ON or OFF, and values for an ON light; the safety timer in hours", () => {
  assert.deepEqual(exercise.lights, [{area: "lounge", target: "main", state: "OFF"}, {area: "lounge", target: "tv", state: "ON"}]);
  assert.equal(exercise.safetyMs, 4 * 3_600_000);
  assert.equal(normaliseSceneConfig({owner: "o"}).safetyMs, 4 * 3_600_000, "4 hours by default");
  assert.deepEqual(normaliseSceneConfig({owner: "o"}).lights, [], "a scene may only pause motion");
  const one = (fields: Record<string, unknown>) => JSON.stringify([{area: "hall", target: "a", ...fields}]);
  for (const [lights, message] of [
    ["{}", /lights must be a JSON array/],
    [JSON.stringify([{area: "hall", state: "ON"}]), /light 1 needs a target/],
    [JSON.stringify([{target: "a", state: "ON"}]), /light 1 \(a\) needs an area/],
    [one({area: "--", state: "ON"}), /needs an area/],
    [one({state: "DIM"}), /state must be ON or OFF/],
    [JSON.stringify([{area: "hall", target: "a", state: "ON"}, {area: "Hall", target: "a", state: "OFF"}]), /a in Hall is listed twice/],
    [one({state: "OFF", brightnessPct: 5}), /an OFF light takes no brightnessPct/],
    [one({state: "ON", brightnessPct: 101}), /0-100/],
    [one({state: "ON", colorTempKelvin: 0}), /above 0/],
    [one({state: "ON", brightness: 5}), /unknown field brightness/],
    ["not json", /lights must be valid JSON/]
  ] as const) assert.throws(() => normaliseSceneConfig({owner: "o", lights}), message, lights);
  // The same id in two rooms is two lights.
  assert.equal(normaliseSceneConfig({owner: "o", lights: JSON.stringify([{area: "hall", target: "main", state: "ON"}, {area: "study", target: "main", state: "OFF"}])}).lights.length, 2);
  assert.throws(() => normaliseSceneConfig({owner: "o", safetyHours: -1}), /0 \(off\) or more/);
  assert.equal(normaliseSceneConfig({owner: "o", safetyHours: "0"}).safetyMs, 0);
});

test("starting holds each light for the scene and pauses motion; ending releases them and the pause", () => {
  const started = run(exercise, undefined, {kind: "start"}, 0);
  assert.deepEqual(started.lighting, [
    {lighting: {kind: "intent", area: "lounge", targets: ["main"], state: "OFF", owner: "scene:Exercise", source: "scene"}},
    {lighting: {kind: "intent", area: "lounge", targets: ["tv"], state: "ON", owner: "scene:Exercise", source: "scene"}}
  ]);
  assert.deepEqual(started.motion, [{source: "pause", payload: true, owner: "scene:Exercise"}]);
  assert.deepEqual(started.status, {fill: "green", shape: "dot", text: "on · 4h 0m left"});

  const ended = run(exercise, started.state, {kind: "end", by: "trainer off"}, 600);
  assert.deepEqual(ended.lighting, [{lighting: {kind: "release", area: "lounge", owner: "scene:Exercise", targets: ["main", "tv"], source: "scene"}}]);
  assert.deepEqual(ended.motion, [{source: "pause", payload: false, owner: "scene:Exercise"}]);
  assert.deepEqual(ended.status, {fill: "grey", shape: "dot", text: "off · ended by trainer off"});
  assert.deepEqual(run(exercise, ended.state, {kind: "end"}, 601).traces.map(({reason}) => reason), ["not-active"], "already off");

  // Values go on the intent; a plain end is by request.
  const bathOn = run(bath, undefined, {kind: "start"}, 0);
  assert.deepEqual(bathOn.lighting[0]!.lighting.values, {brightnessPct: 30, colorTempKelvin: 2700});
  assert.equal(bathOn.status.text, "on", "no timer: no time left shown");
  assert.equal(run(bath, bathOn.state, {kind: "end"}, 5).status.text, "off · ended by request");
});

test("on again renews its timer and pause and leaves its lights as they are", () => {
  const started = run(exercise, undefined, {kind: "start"}, 0);
  const again = run(exercise, started.state, {kind: "start"}, 3600);
  assert.deepEqual(again.lighting, [], "a person's change during the scene stands");
  assert.deepEqual(again.motion, [{source: "pause", payload: true, owner: "scene:Exercise"}]);
  assert.equal(again.state.endsAt, at(3600) + 4 * 3_600_000);
});

test("its ticks renew the motion pause, and end it when the safety timer runs out", () => {
  const started = run(exercise, undefined, {kind: "start"}, 0);
  assert.equal(sceneTickAt(started.state, at(0)), at(0) + RENEW_MS);
  const tick = run(exercise, started.state, {kind: "tick"}, 60);
  assert.deepEqual(tick.motion, [{source: "pause", payload: true, owner: "scene:Exercise"}]);
  assert.deepEqual(tick.lighting, []);
  assert.equal(tick.status.text, "on · 3h 59m left");
  assert.equal(sceneTickAt(tick.state, at(4 * 3600 - 30)), at(4 * 3600), "the timer's end, when sooner");
  const done = run(exercise, tick.state, {kind: "tick"}, 4 * 3600);
  assert.equal(done.status.text, "off · ended by timer");
  assert.equal(done.lighting[0]!.lighting.kind, "release");
  assert.equal(sceneTickAt(done.state, at(4 * 3600)), null);
});

test("after a restart it stays on with its timer, or ends at once if its time ran out meanwhile", () => {
  const started = run(exercise, undefined, {kind: "start"}, 0);
  const saved = JSON.parse(JSON.stringify(started.state)) as SceneState;
  const back = run(exercise, saved, {kind: "startup"}, 600);
  assert.deepEqual([back.state.active, back.lighting, back.motion.map(({payload}) => payload)], [true, [], [true]], "its lights aren't asked again");
  assert.equal(back.state.endsAt, started.state.endsAt);
  const late = run(exercise, saved, {kind: "startup"}, 5 * 3600);
  assert.equal(late.status.text, "off · ended by timer");
  // It releases what it took, even if its settings changed since.
  const changed = normaliseSceneConfig({owner: "scene:Exercise", lights: "[{\"area\":\"study\",\"target\":\"lamp\",\"state\":\"ON\"}]"});
  assert.deepEqual(run(changed, saved, {kind: "end"}, 700).lighting[0]!.lighting.targets, ["main", "tv"]);
  // Off, a startup does nothing.
  assert.deepEqual(run(exercise, undefined, {kind: "startup"}, 0).motion, []);
});

test("Home Assistant: a switch per scene, its state, and ON or OFF on its set topic", () => {
  const publishing = {area: "lounge", name: "Exercise mode", publishState: true, discovery: true, discoveryPrefix: "homeassistant", nodeId: "s1", idScheme: "node" as const};
  const [entry] = sceneDiscovery(publishing);
  const config = JSON.parse(entry!.payload) as Record<string, unknown>;
  assert.equal(entry!.topic, "homeassistant/switch/nrha_s1_scene_exercise_mode/config");
  assert.deepEqual([config.command_topic, config.state_topic, config.availability_topic],
    ["home/lounge/scene/exercise_mode/set", "home/lounge/scene/exercise_mode/state", "home/lounge/scene/exercise_mode/availability"]);
  assert.deepEqual(sceneStateOutputs(publishing, true), [{topic: "home/lounge/scene/exercise_mode/state", payload: "ON", retain: true}]);
  assert.deepEqual(sceneStateOutputs({...publishing, publishState: false}, true), []);
  const set = (payload: unknown, retain = false) => sceneInbound({topic: "home/lounge/scene/exercise_mode/set", payload, retain}, publishing);
  assert.equal(set("ON")?.kind, "start");
  assert.equal(set("off")?.kind, "end");
  assert.deepEqual(set("ON", true)?.traces.map(({reason}) => reason), ["retained-message"]);
  assert.deepEqual(set("maybe")?.traces.map(({reason}) => reason), ["not-on-or-off"]);
  assert.equal(sceneInbound({topic: "elsewhere", payload: "ON"}, publishing), null);
});

// A room with main and tv, styled at 60% 3000K, motion having switched main
// on, and its commands answered at once (the light shows what it was sent).
const roomConfig: RoomConfig = {area: "lounge", displayName: "", initialTransitionSeconds: 1, targets: [{id: "main"}, {id: "tv", onOffOnly: true}]};
function room(config: RoomConfig = roomConfig) {
  const roomConfig = config;
  let state: RoomState | undefined;
  const commands: Array<[string, string, number | undefined]> = [];
  function send(msg: object, seconds: number) {
    const result = transitionRoom(state, msg as Parameters<typeof transitionRoom>[1], roomConfig, at(seconds));
    state = result.state;
    for (const command of result.commands as LightRoomMessage[]) {
      if (command.kind !== "command") continue;
      const {target, state: power, brightnessPct} = command as LightCommandMessage;
      commands.push([target, power, brightnessPct]);
      const reading = {kind: "observed", target, on: power === "ON", ...(brightnessPct !== undefined ? {brightnessPct} : {}),
        fields: ["brightness"], showsLast: true, observedAt: new Date(at(seconds)).toISOString()};
      state = transitionRoom(state, {light: reading}, roomConfig, at(seconds)).state;
    }
  }
  send({lighting: {kind: "style", source: "circadian", values: {brightnessPct: 60, colorTempKelvin: 3000}, transitionSeconds: 30,
    until: new Date(at(86_400)).toISOString()}}, 0);
  send({lighting: {kind: "intent", targets: ["main"], state: "ON", source: "motion"}}, 0);
  commands.length = 0;
  return {send, commands, state: () => state!};
}

for (const order of [["bath", "exercise"], ["exercise", "bath"]] as const) {
  test(`two scenes overlapping through the room: exercise, then bath on top, ended ${order[0]} first`, () => {
    const lounge = room();
    let exerciseState = run(exercise, undefined, {kind: "start"}, 10);
    for (const msg of exerciseState.lighting) lounge.send(msg, 10);
    let bathState = run(bath, undefined, {kind: "start"}, 20);
    for (const msg of bathState.lighting) lounge.send(msg, 20);
    assert.deepEqual(lounge.commands, [["main", "OFF", undefined], ["tv", "ON", undefined], ["main", "ON", 30]]);
    assert.deepEqual(lounge.state().control.main, {state: "overridden", owner: "scene:Bath"});
    lounge.commands.length = 0;

    for (const [index, which] of order.entries()) {
      const seconds = 30 + index * 10;
      if (which === "bath") {
        bathState = run(bath, bathState.state, {kind: "end"}, seconds);
        for (const msg of bathState.lighting) lounge.send(msg, seconds);
      } else {
        exerciseState = run(exercise, exerciseState.state, {kind: "end"}, seconds);
        for (const msg of exerciseState.lighting) lounge.send(msg, seconds);
      }
    }
    if (order[0] === "bath") {
      // Bath ends: main goes back to exercise's OFF; then exercise ends: main
      // back on in the room's style, tv back off.
      assert.deepEqual(lounge.commands, [["main", "OFF", undefined], ["main", "ON", 60], ["tv", "OFF", undefined]]);
    } else {
      // Exercise ends beneath bath: main stays bath's, tv goes back off; then
      // bath ends: main back in the room's style.
      assert.deepEqual(lounge.commands, [["tv", "OFF", undefined], ["main", "ON", 60]]);
    }
    assert.deepEqual(lounge.state().control, {});
    assert.deepEqual([lounge.state().desired.main, lounge.state().desired.tv], [true, false]);
  });
}

test("lights by area: two rooms each with a main, one scene for one of them; a room with no Area takes none of its lights", () => {
  const lounge = room();
  const study = room({...roomConfig, area: "Study"});
  const unnamed = room({...roomConfig, area: ""});
  const quiet = normaliseSceneConfig({owner: "scene:Quiet", lights: JSON.stringify([{area: "study", target: "main", state: "OFF"}])});
  let scene = run(quiet, undefined, {kind: "start"}, 10);
  for (const msg of scene.lighting) for (const each of [lounge, study, unnamed]) each.send(msg, 10);
  assert.deepEqual([lounge.commands, study.commands, unnamed.commands], [[], [["main", "OFF", undefined]], []]);
  assert.deepEqual([lounge.state().control, unnamed.state().control], [{}, {}]);
  assert.deepEqual(study.state().control.main, {state: "overridden", owner: "scene:Quiet"});
  scene = run(quiet, scene.state, {kind: "end"}, 20);
  for (const msg of scene.lighting) for (const each of [lounge, study, unnamed]) each.send(msg, 20);
  assert.deepEqual([lounge.commands, study.commands, unnamed.commands], [[], [["main", "OFF", undefined], ["main", "ON", 60]], []]);
  // An intent or release with no area reaches any room, as before.
  const any = transitionRoom(lounge.state(), {lighting: {kind: "intent", targets: ["main"], state: "OFF", source: "dashboard"}}, roomConfig, at(30));
  assert.equal(any.state.desired.main, false);
  const other = transitionRoom(lounge.state(), {lighting: {kind: "intent", area: "study", targets: ["main"], state: "OFF", source: "scene"}}, roomConfig, at(30));
  assert.deepEqual(other.traces.map(({event, outcome, reason}) => [event, outcome, reason]), [["intent", "ignored", "other-area"]]);
});


test("End below: power under it, held for its seconds while on, ends the scene by power; a reading at or above starts the wait again", () => {
  const plug = normaliseSceneConfig({owner: "scene:Exercise", lights: "[]", endBelowWatts: 20, endBelowSeconds: 60});
  assert.deepEqual([plug.endBelowWatts, plug.endBelowMs], [20, 60000]);
  // Saved before the setting, or left empty: no power end; the hold defaults to a minute.
  assert.deepEqual([normaliseSceneConfig({owner: "o"}).endBelowWatts, normaliseSceneConfig({owner: "o", endBelowWatts: ""}).endBelowWatts,
    normaliseSceneConfig({owner: "o"}).endBelowMs], [null, null, 60000]);
  assert.throws(() => normaliseSceneConfig({owner: "o", endBelowWatts: 0}), /more than 0 watts/);
  let result = run(plug, undefined, {kind: "start"}, 0);
  result = run(plug, result.state, {kind: "power", watts: 150}, 10);
  assert.equal(result.state.powerBelowSince, null);
  result = run(plug, result.state, {kind: "power", watts: 5}, 20);
  assert.deepEqual([result.state.active, result.state.powerBelowSince], [true, at(20)]);
  // A short dip: back above before a minute, so the wait starts again.
  result = run(plug, result.state, {kind: "power", watts: 120}, 50);
  assert.deepEqual([result.state.active, result.state.powerBelowSince], [true, null]);
  result = run(plug, result.state, {kind: "power", watts: 4}, 60);
  assert.equal(sceneTickAt(result.state, at(60), plug), at(120), "the scene wakes when the hold would end");
  // No further reading (a plug reports only on change): the timer ends it.
  result = run(plug, result.state, {kind: "tick"}, 120);
  assert.deepEqual([result.state.active, result.state.ended?.by], [false, "power"]);
  // Off, or without End below: a reading changes nothing.
  assert.equal(run(plug, result.state, {kind: "power", watts: 1}, 130).traces[0]?.reason, "not-active");
  const none = run(exercise, run(exercise, undefined, {kind: "start"}, 0).state, {kind: "power", watts: 1}, 1);
  assert.deepEqual([none.state.active, none.traces[0]?.reason], [true, "no-end-below"]);
});


test("End below arms only once the device has been used: standby jitter before use never ends the scene", () => {
  const plug = normaliseSceneConfig({owner: "scene:Exercise", lights: "[]", endBelowWatts: 20, endBelowSeconds: 60});
  let result = run(plug, undefined, {kind: "start"}, 0);
  // Idle: its standby draw wanders, below the threshold, for well over the hold.
  for (const [seconds, watts] of [[10, 1.3], [40, 1.6], [100, 1.2]] as const) result = run(plug, result.state, {kind: "power", watts}, seconds);
  result = run(plug, result.state, {kind: "tick"}, 300);
  assert.deepEqual([result.state.active, result.state.powerUsed, result.state.powerBelowSince], [true, false, null]);
  assert.equal(sceneTickAt(result.state, at(300), plug), at(300) + RENEW_MS, "no hold to wake for");
  // Used, then low for the time: it ends.
  result = run(plug, result.state, {kind: "power", watts: 180}, 400);
  result = run(plug, result.state, {kind: "power", watts: 1.4}, 500);
  result = run(plug, result.state, {kind: "tick"}, 560);
  assert.deepEqual([result.state.active, result.state.ended?.by], [false, "power"]);
  // A new start must be used again.
  result = run(plug, result.state, {kind: "start"}, 600);
  result = run(plug, result.state, {kind: "power", watts: 1.4}, 610);
  assert.equal(run(plug, result.state, {kind: "tick"}, 700).state.active, true);
});
