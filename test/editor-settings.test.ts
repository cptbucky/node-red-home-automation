"use strict";

import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import test from "node:test";
import {movedCircadianSettings, targetsWithTopics} from "../lib/room-controller";
import {normaliseAvrConfig} from "../lib/avr-controller";

interface Definition {
  category?: string;
  oneditprepare?: (this: Record<string, unknown>) => void;
  oneditsave?: (this: Record<string, unknown>) => void;
  defaults: Record<string, {value: unknown; type?: string; required?: boolean; validate?: (this: Record<string, unknown>, value: unknown) => boolean}>;
  outputs?: number;
  outputLabels?: string[] | ((this: Record<string, unknown>, index: number) => string);
  onadd?: (this: Record<string, unknown>) => void;
}

// Runs a node's editor script against a stand-in RED and returns its
// definition. Outside an open edit dialog, jQuery finds no inputs.
function editorDefinition(file: string, $: unknown = () => ({length: 0})): Definition {
  const html = readFileSync(resolve(__dirname, "../../nodes", file), "utf8");
  const script = /<script type="text\/javascript">([\s\S]*?)<\/script>/.exec(html)![1]!;
  let definition: Definition | undefined;
  const RED = {
    nodes: {registerType: (_name: string, value: Definition) => { definition = value; }},
    validators: {number: () => () => true}
  };
  new Function("RED", "$", script)(RED, $);
  assert.ok(definition);
  return definition;
}

// A node as the editor creates one from the palette: every default, then onadd.
function newNode(definition: Definition): Record<string, unknown> {
  const node: Record<string, unknown> = Object.fromEntries(Object.entries(definition.defaults).map(([key, {value}]) => [key, value]));
  definition.onadd!.call(node);
  return node;
}

test("scene: a name another scene has, compared as in its topics, is marked in the editor", () => {
  const html = readFileSync(resolve(__dirname, "../../nodes/scene.html"), "utf8");
  const script = /<script type="text\/javascript">([\s\S]*?)<\/script>/.exec(html)![1]!;
  const flow = [{id: "s1", type: "home-scene", name: "Bath"}, {id: "s2", type: "home-scene", name: "Exercise mode"}, {id: "r1", type: "home-room-lighting-controller", name: "Gym"}];
  let definition: Definition | undefined;
  const RED = {nodes: {registerType: (_name: string, value: Definition) => { definition = value; }, eachNode: (visit: (node: Record<string, unknown>) => void) => flow.forEach(visit)}};
  new Function("RED", "$", script)(RED, () => ({length: 0}));
  const name = (id: string, value: string) => definition!.defaults.name!.validate!.call({id}, value) as unknown;
  assert.equal(name("s2", "Exercise mode"), true, "its own name");
  assert.equal(name("s2", "BATH"), "another scene has this name");
  assert.equal(name("s2", "exercise_mode"), true, "the same as its own, in topics");
  assert.equal(name("s3", "exercise mode"), "another scene has this name");
  assert.equal(name("s3", "Gym"), true, "another kind of node's name");
  assert.equal(name("s3", "--"), false, "no letter or digit");
});

test("room: one Home Assistant choice, a Broker needed unless it's off, and the two old settings kept and read as the runtime reads them", () => {
  const definition = editorDefinition("room-controller.html");
  for (const key of ["homeAssistant", "broker", "publishState", "discovery"]) assert.ok(key in definition.defaults, key);
  assert.equal(definition.defaults.broker!.type, "mqtt-broker");
  const added = newNode(definition);
  assert.deepEqual([added.homeAssistant, added.publishState, added.discovery], ["off", false, false], "a new room starts off");
  const broker = (node: Record<string, unknown>, value: string) => definition.defaults.broker!.validate!.call(node, value) as unknown;
  assert.equal(broker({homeAssistant: "off"}, ""), true);
  assert.equal(broker({homeAssistant: "state"}, ""), "choose a broker, or set Publish to Don't publish");
  assert.equal(broker({homeAssistant: "discovery"}, "_ADD_"), "choose a broker, or set Publish to Don't publish");
  assert.equal(broker({homeAssistant: "state"}, "b1"), true);
  // A room saved before the choice: its old settings decide, and not set means on.
  assert.equal(broker({homeAssistant: null, publishState: false, discovery: false}, ""), true);
  // A room saved before the choice that published keeps publishing through output 1: valid with no broker (E1),
  // as is one opened and saved since without one; a new one set to publish needs one.
  assert.equal(broker({homeAssistant: null, publishState: true, discovery: true}, ""), true);
  assert.equal(broker({homeAssistant: undefined}, ""), true, "6.1.0's unset settings: published, through output 1");
  assert.equal(broker({homeAssistant: "discovery", publishState: true, discovery: true, publishesThroughOutput: true}, ""), true);
  assert.equal(broker({homeAssistant: "state", publishesThroughOutput: false}, ""), "choose a broker, or set Publish to Don't publish");
  assert.equal(definition.defaults.publishesThroughOutput!.value, false);
  // Its area: needed whenever publishing, and for a saved room whenever either old setting was on.
  const area = (node: Record<string, unknown>, value: string) => definition.defaults.area!.validate!.call(node, value);
  assert.equal(area({homeAssistant: "off"}, ""), true);
  assert.equal(area({homeAssistant: "state"}, ""), false);
  assert.equal(area({homeAssistant: null, publishState: false, discovery: true}, ""), false, "as in 6.1.0");
});

test("E1: a node saved before the Publish choice that published stays valid with no broker; a new one set to publish needs one", () => {
  const broker = (file: string, node: Record<string, unknown>) => editorDefinition(file).defaults.broker!.validate!.call(node, "") as unknown;
  // As 6.1.0 saved them: the old settings, no choice, no broker.
  const saved: Array<[string, Record<string, unknown>]> = [
    ["scene.html", {publishState: true, discovery: true}],
    ["cover-controller.html", {publishState: true, discovery: false}],
    ["motion-policy.html", {publishState: true, discovery: true}],
    ["occupancy-fusion.html", {publishState: true, discovery: false}],
    ["circadian-policy.html", {publishState: true, discovery: true}],
    ["avr-controller.html", {publishState: true, discovery: true}],
    ["house-schedule-mqtt.html", {discovery: true}],
    ["theatre-state-contract.html", {discovery: null}]
  ];
  for (const [file, settings] of saved) {
    assert.equal(broker(file, {...settings}), true, `${file}: saved, publishing through its output`);
    assert.equal(broker(file, {...settings, homeAssistant: "discovery", publishesThroughOutput: true}), true, `${file}: opened and saved since`);
    const chosen = file === "house-schedule-mqtt.html" || file === "theatre-state-contract.html" ? "state" : "discovery";
    assert.notEqual(broker(file, {homeAssistant: chosen, publishesThroughOutput: false}), true, `${file}: a new node set to publish`);
    assert.equal(editorDefinition(file).defaults.publishesThroughOutput!.value, false, file);
  }
  // New nodes from the palette that always publish start with their choice, so they need a broker.
  const house = editorDefinition("house-schedule-mqtt.html");
  assert.equal(newNode(house).homeAssistant, "discovery");
  const contract = editorDefinition("theatre-state-contract.html");
  assert.equal(newNode(contract).homeAssistant, "state");
});

test("device adapters: a Broker, needed for a new node; one saved before 6.2 keeps its MQTT in and out nodes and stays valid", () => {
  for (const file of ["z2m-light.html", "z2m-cover.html", "shelly-cover.html", "shelly-switch.html"]) {
    const definition = editorDefinition(file);
    assert.equal(definition.defaults.broker!.type, "mqtt-broker", file);
    // A node saved before 6.2 loads without the setting: the editor applies no defaults to the deployed flows
    // (Node-RED 5.0.10 red.js importNodes, applyNodeDefaults false). It counts as using its MQTT in and out nodes.
    const broker = (node: Record<string, unknown>, value: string) => definition.defaults.broker!.validate!.call(node, value) as unknown;
    assert.equal(broker({name: "", topicPrefix: "x", friendlyName: "y"}, ""), true, `${file}: loaded without the setting`);
    assert.equal(broker({publishesThroughOutput: true}, ""), true, file);
    assert.equal(definition.defaults.publishesThroughOutput!.value, false, `${file}: nothing relies on the default`);
    const added = newNode(definition);
    assert.deepEqual([added.name, added.publishesThroughOutput], ["", false], file);
    assert.equal(broker(added, ""), "choose a broker", file);
    assert.equal(broker(added, "b1"), true, file);
  }
});

const ONADD_NODES = ["room-controller.html", "theatre-state-contract.html", "occupancy-fusion.html", "motion-policy.html",
  "avr-controller.html", "house-schedule-mqtt.html", "cover-controller.html"];

test("importing, pasting or restoring a saved node keeps its settings; only a new node gets the new-node ones", () => {
  for (const file of ONADD_NODES) {
    const definition = editorDefinition(file);
    // As the editor imports: the saved values only (no defaults filled in), then onadd.
    for (const saved of [
      {name: "", publishState: true, discovery: true, idScheme: null},
      {name: "Hall lights", publishState: true, discovery: true, idScheme: "area"},
      {publishState: true, discovery: true}
    ]) {
      const node: Record<string, unknown> = {...saved};
      definition.onadd!.call(node);
      assert.deepEqual(node, saved, `${file}: ${JSON.stringify(saved)}`);
    }
    const fresh = newNode(definition);
    assert.equal(fresh.name, "", `${file}: the marker doesn't stay`);
    assert.equal(fresh.idScheme, "node", file);
  }
});

test("new nodes start with publishing off; saved flows keep their behaviour", () => {
  for (const [file, settings] of [["room-controller.html", ["publishState", "discovery"]], ["theatre-state-contract.html", ["discovery"]]] as const) {
    const definition = editorDefinition(file);
    const node = newNode(definition);
    for (const setting of settings) {
      assert.equal(node[setting], false, `${file} ${setting} for a new node`);
      // null means "not set", so the editor never fills in "off" for an older node.
      assert.equal(definition.defaults[setting]!.value, null, `${file} ${setting} default`);
    }
  }
});

test("the editor flags a missing area only when publishing needs it", () => {
  const room = editorDefinition("room-controller.html").defaults.area!.validate!;
  assert.equal(room.call({publishState: false, discovery: false}, ""), true);
  assert.equal(room.call({publishState: true, discovery: false}, ""), false);
  assert.equal(room.call({publishState: null, discovery: null}, ""), false, "an older node, loaded with null, publishes");
  assert.equal(room.call({}, ""), false, "an older node without the fields publishes");
  assert.equal(room.call({publishState: true, discovery: true}, "hall"), true);
  const contract = editorDefinition("theatre-state-contract.html").defaults.area!.validate!;
  assert.equal(contract.call({discovery: false, baseTopic: "media/theatre"}, ""), true);
  assert.equal(contract.call({discovery: false, baseTopic: ""}, ""), false, "the default base topic needs it");
  assert.equal(contract.call({discovery: true, baseTopic: "media/theatre"}, ""), false);
  assert.equal(contract.call({discovery: true, baseTopic: ""}, "hall"), true);
});

test("JSON fields with no sensible default are flagged until filled in, matching the runtime", () => {
  const examples = Object.fromEntries(["Home theatre activity.json", "Home theatre equipment.json"].flatMap((file) =>
    (JSON.parse(readFileSync(resolve(__dirname, "../../examples", file), "utf8")) as Array<Record<string, unknown>>)
      .map((node) => [String(node.type), node])));
  const fields = [
    ["activity-lighting-controller.html", "profiles", "home-activity-lighting-controller"],
    ["source-capability-controller.html", "sources", "home-source-capability-controller"],
    ["theatre-activity-controller.html", "activityProfiles", "home-theatre-activity-controller"],
    ["theatre-state-contract.html", "activities", "home-theatre-state-contract"]
  ] as const;
  for (const [file, field, type] of fields) {
    const setting = editorDefinition(file).defaults[field]!;
    const valid = (value: unknown) => setting.validate!.call({}, value);
    assert.equal(valid(setting.value), false, `${file} ${field}: the empty default is flagged`);
    assert.equal(valid(examples[type]![field]), true, `${file} ${field}: the example's value passes`);
    for (const junk of ["", "{broken", "null", "5", field === "activities" ? "{}" : "[]"]) {
      assert.equal(valid(junk), false, `${file} ${field}: ${JSON.stringify(junk)}`);
    }
  }
});

test("the discovery prefix field matches the runtime on both publishing nodes", () => {
  for (const file of ["room-controller.html", "theatre-state-contract.html"]) {
    const setting = editorDefinition(file).defaults.discoveryPrefix!;
    const valid = (value: unknown) => setting.validate!.call({}, value);
    assert.equal(setting.value, "homeassistant", file);
    assert.equal(valid("homeassistant"), true, file);
    assert.equal(valid("/ha/discovery/"), true, file);
    for (const value of ["", " ", "/", "ha/+", "#"]) assert.equal(valid(value), false, `${file} ${JSON.stringify(value)}`);
  }
});

test("new nodes name their Home Assistant entities after the node; saved nodes keep the area scheme", () => {
  for (const file of ["room-controller.html", "theatre-state-contract.html"]) {
    const definition = editorDefinition(file);
    assert.equal(definition.defaults.idScheme?.value, null, `${file}: a saved node without the setting is not set`);
    assert.equal(newNode(definition).idScheme, "node", file);
  }
});

test("occupancy and motion publishing start off, and a new node is named after itself", () => {
  for (const file of ["occupancy-fusion.html", "motion-policy.html", "avr-controller.html"]) {
    const definition = editorDefinition(file);
    assert.equal(definition.defaults.publishState?.value, false, file);
    assert.equal(definition.defaults.discovery?.value, false, file);
    assert.equal(newNode(definition).idScheme, "node", file);
  }
});

test("the contract editor asks for an area only where the runtime needs one", () => {
  const area = editorDefinition("theatre-state-contract.html").defaults.area!;
  const valid = (value: string, node: Record<string, unknown>) => area.validate!.call(node, value);
  assert.equal(valid("", {discovery: true, baseTopic: "media/theatre", idScheme: "node"}), true, "new contract with a base topic");
  assert.equal(valid("", {discovery: true, baseTopic: "media/theatre", idScheme: null}), false, "saved contract with discovery");
  assert.equal(valid("", {discovery: false, baseTopic: "media/theatre", idScheme: null}), true);
  assert.equal(valid("", {discovery: false, baseTopic: "", idScheme: "node"}), false, "the default base topic needs it");
  assert.equal(valid("!!!", {discovery: false, baseTopic: "x", idScheme: "node"}), false);
});

test("a house schedule is a config node circadian lighting policies may reference; its MQTT node names its entities after the node", () => {
  const house = editorDefinition("house-schedule.html");
  assert.deepEqual([house.category, house.defaults.name?.value, house.defaults.wakeTime?.value, house.defaults.bedTime?.value],
    ["config", "house", "07:00", "23:00"]);
  const circadian = editorDefinition("circadian-policy.html").defaults.houseSchedule;
  assert.deepEqual([circadian?.value, circadian?.type, circadian?.required], ["", "home-house-schedule", false], "not required: none means its own times");
  const roomSchedule = editorDefinition("room-controller.html").defaults.houseSchedule;
  assert.deepEqual([roomSchedule?.value, roomSchedule?.type], ["", undefined], "a room keeps an old one only to show it; it no longer follows one");
  const mqtt = editorDefinition("house-schedule-mqtt.html");
  assert.deepEqual([mqtt.defaults.schedule?.type, mqtt.defaults.schedule?.required, mqtt.defaults.idScheme?.value], ["home-house-schedule", true, null]);
  assert.equal(newNode(mqtt).idScheme, "node");
});

test("a cover group has the group's result, then one output per member labelled from Members", () => {
  const group = editorDefinition("cover-group.html");
  assert.equal(group.defaults.outputs?.value, 3, "two members by default, and the result");
  const labels = group.outputLabels as (this: Record<string, unknown>, index: number) => string;
  const node = {members: "[\"left\",\"middle\",\"right\"]"};
  assert.deepEqual([0, 1, 2, 3].map((index) => labels.call(node, index)), ["group result", "left", "middle", "right"]);
});

// An edit dialog for the cover group: its Members input and the hidden
// outputs field, then what the Node-RED 5.0.10 editor does on Done: count the
// outputs from the port map (red.js 43889-43925) and move or drop each wire
// (updateNodeProperties, red.js 40927-40946). Wires are {port: cover}.
function editCoverGroup(members: string[], wires: Record<number, string>, edit: string[]) {
  const fields: Record<string, string> = {"#node-input-members": JSON.stringify(members), "#node-input-outputs": ""};
  const handlers: Array<() => void> = [];
  const $ = (selector: string) => ({
    val(value?: string) {
      if (value === undefined) return fields[selector];
      fields[selector] = value;
      return this;
    },
    on(_events: string, handler: () => void) { handlers.push(handler); }
  });
  const group = editorDefinition("cover-group.html", $) as Definition & {oneditprepare: (this: Record<string, unknown>) => void};
  group.oneditprepare.call({members: JSON.stringify(members)});
  fields["#node-input-members"] = JSON.stringify(edit);
  for (const handler of handlers) handler();
  // A plain number sets the count and moves nothing; a map moves wires.
  const value = JSON.parse(fields["#node-input-outputs"]!) as number | Record<string, string>;
  const map = typeof value === "number" ? {} : value;
  const count = typeof value === "number" ? value
    : Object.entries(map).filter(([key, port]) => Number.isNaN(Number(key)) || port !== "-1").length;
  const moved: Record<number, string> = {};
  for (const [port, cover] of Object.entries(wires)) {
    const to = Object.hasOwn(map, port) ? map[port]! : port;
    if (to !== "-1" && Number(to) < count) moved[Number(to)] = cover;
  }
  return {count, wires: moved};
}

test("editing a cover group's members moves each member's wire with its name", () => {
  const wired = {0: "result", 1: "left cover", 2: "mid cover", 3: "right cover"};
  assert.deepEqual(editCoverGroup(["left", "mid", "right"], wired, ["left", "mid", "right"]), {count: 4, wires: wired}, "untouched");
  assert.deepEqual(editCoverGroup(["left", "mid", "right"], wired, ["left", "right"]),
    {count: 3, wires: {0: "result", 1: "left cover", 2: "right cover"}}, "remove the middle: right's wire moves to port 2, mid's goes");
  assert.deepEqual(editCoverGroup(["left", "mid", "right"], wired, ["right", "mid", "left"]),
    {count: 4, wires: {0: "result", 1: "right cover", 2: "mid cover", 3: "left cover"}}, "reorder swaps the wires");
  assert.deepEqual(editCoverGroup(["left", "mid", "right"], wired, ["left", "mid", "right", "extra"]),
    {count: 5, wires: wired}, "add at the end keeps them");
  assert.deepEqual(editCoverGroup(["left", "right"], {0: "result", 1: "left cover", 2: "right cover"}, ["left", "extra", "right"]),
    {count: 4, wires: {0: "result", 1: "left cover", 3: "right cover"}}, "add in the middle moves right along");
});

test("a cover starts with publishing off, named after the node, and has a fourth output", () => {
  const cover = editorDefinition("cover-controller.html");
  assert.deepEqual([cover.defaults.publishState?.value, cover.defaults.discovery?.value, cover.defaults.topicName?.value, cover.defaults.idScheme?.value],
    [false, false, "", null]);
  // No default name: flagged while it publishes, not otherwise.
  const name = (value: string, node: Record<string, unknown>) => cover.defaults.topicName!.validate!.call(node, value);
  assert.deepEqual([name("", {publishState: true}), name("", {discovery: true}), name("left", {publishState: true}), name("", {publishState: false})],
    [false, false, true, true]);
  assert.equal(newNode(cover).idScheme, "node");
  assert.deepEqual(cover.outputLabels, ["device commands", "state and results", "moving", "MQTT publications"]);
});

test("the shelly cover adapter has no default device and two labelled outputs", () => {
  const definition = editorDefinition("shelly-cover.html");
  assert.deepEqual([definition.defaults.topicPrefix!.value, definition.defaults.channel!.value], ["", 0]);
  const valid = (key: string, value: unknown) => definition.defaults[key]!.validate!.call({}, value);
  assert.deepEqual([valid("topicPrefix", ""), valid("topicPrefix", "shellyplus2pm-a8032ab12345"), valid("topicPrefix", "a/#")], [false, true, false]);
  assert.deepEqual([valid("channel", 1), valid("channel", "-1"), valid("channel", "1.5")], [true, false, false]);
  assert.deepEqual([definition.outputs, definition.outputLabels], [2, ["to the device (MQTT out, without a broker)", "to the cover controller"]]);
});

test("the shelly switch adapter has no default device, a mode as the device is set up, no default Target, and three labelled outputs", () => {
  const definition = editorDefinition("shelly-switch.html");
  assert.deepEqual([definition.defaults.topicPrefix!.value, definition.defaults.channel!.value, definition.defaults.mode!.value], ["", 0, "auto"]);
  const valid = (key: string, value: unknown) => definition.defaults[key]!.validate!.call({}, value);
  assert.deepEqual([valid("topicPrefix", ""), valid("topicPrefix", "shellyplus1-a8032ab12345"), valid("topicPrefix", "a/+")], [false, true, false]);
  assert.deepEqual([valid("channel", 2), valid("channel", "-1")], [true, false]);
  assert.deepEqual([definition.outputs, definition.outputLabels],
    [3, ["to the device (MQTT out, without a broker)", "to the switch policy (detached), or the relay's state", "to the room lighting controller (with a Target)"]]);
  assert.equal(definition.defaults.target!.value, "", "not a room light unless set");
});

test("each ESPHome device node needs a broker and its device name, has no model setting, and labels its two outputs", () => {
  for (const file of ["everything-presence-one.html", "apollo-r-pro-1.html"]) {
    const definition = editorDefinition(file);
    assert.deepEqual([definition.defaults.broker!.type, definition.defaults.broker!.required, definition.defaults.device!.value], ["mqtt-broker", true, ""], file);
    assert.equal(definition.defaults.model, undefined, `${file}: the model is the node's`);
    const valid = (value: unknown) => definition.defaults.device!.validate!.call({}, value);
    assert.deepEqual([valid(""), valid("kitchen-sensor"), valid("a/#")], [false, true, false], file);
    assert.deepEqual([definition.outputs, definition.outputLabels],
      [2, ["motion and presence, to occupancy fusion", "light level, to the motion lighting policy"]], file);
  }
});

test("the zigbee2mqtt sensor needs a broker and its device, defaults occupancy to motion, and labels its two outputs", () => {
  const definition = editorDefinition("z2m-sensor.html");
  assert.deepEqual([definition.defaults.broker!.type, definition.defaults.broker!.required, definition.defaults.friendlyName!.value,
    definition.defaults.baseTopic!.value, definition.defaults.occupancyIs!.value], ["mqtt-broker", true, "", "zigbee2mqtt", "motion"]);
  const valid = (key: string, value: unknown) => definition.defaults[key]!.validate!.call({}, value);
  assert.deepEqual([valid("friendlyName", ""), valid("friendlyName", "hall/motion"), valid("occupancyIs", "presence"), valid("occupancyIs", "radar")],
    [false, true, true, false]);
  assert.deepEqual([definition.outputs, definition.outputLabels],
    [2, ["motion and presence, to occupancy fusion", "light level, to the motion lighting policy"]]);
});

test("the WLED adapter needs a broker and its device topic, which has no default, and has one labelled output", () => {
  const definition = editorDefinition("wled.html");
  assert.deepEqual([definition.defaults.broker!.type, definition.defaults.broker!.required, definition.defaults.deviceTopic!.value],
    ["mqtt-broker", true, ""]);
  const valid = (value: unknown) => definition.defaults.deviceTopic!.validate!.call({}, value);
  assert.deepEqual([valid(""), valid("wled/strip"), valid("wled/#")], [false, true, false]);
  assert.deepEqual([definition.outputs, definition.outputLabels], [1, ["to the backlighting controller"]]);
});

test("the zigbee2mqtt cover adapter defaults the base topic, has no default device, and two labelled outputs", () => {
  const definition = editorDefinition("z2m-cover.html");
  assert.deepEqual([definition.defaults.baseTopic!.value, definition.defaults.friendlyName!.value], ["zigbee2mqtt", ""]);
  const valid = (key: string, value: unknown) => definition.defaults[key]!.validate!.call({}, value);
  assert.deepEqual([valid("friendlyName", ""), valid("friendlyName", "garden/blind"), valid("friendlyName", "a+b")], [false, true, false]);
  assert.deepEqual([valid("baseTopic", ""), valid("baseTopic", "z2m"), valid("baseTopic", "z2m/#")], [false, true, false]);
  assert.deepEqual([definition.outputs, definition.outputLabels], [2, ["to the device (MQTT out, without a broker)", "to the cover controller"]]);
});

test("a display node's projector power meter host is optional: empty is valid unless the removed old name is still set", () => {
  const definition = editorDefinition("display-mode-controller.html");
  const {projectorPowerMeterHost: setting} = definition.defaults;
  assert.equal(setting!.required, undefined);
  assert.deepEqual([setting!.validate!.call({}, ""), setting!.validate!.call({}, "meter.example")], [true, true]);
  assert.equal(definition.outputs, 3);
  assert.deepEqual(definition.outputLabels, ["projector IR fallback", "state and results", "projector power queries"]);
});

// A saved node as the editor holds it: only the properties its defaults
// name (Node-RED's importNodes copies those and nothing else).
function asLoaded(definition: Definition, saved: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.keys(definition.defaults).filter((key) => key in saved).map((key) => [key, saved[key]]));
}

// A stand-in jQuery over an edit dialog's input values.
function dialog(values: Record<string, unknown> = {}) {
  return Object.assign((selector: string) => ({
    val(value?: unknown) {
      if (value === undefined) return values[selector];
      values[selector] = value;
      return this;
    },
    prop() { return this; },
    on() { return this; },
    trigger() { return this; },
    length: 1
  }), {values});
}

test("a display node naming only projectorMeterHost (removed in 6.0) keeps it through the editor and shows invalid until the new host is set", () => {
  const $ = dialog();
  const definition = editorDefinition("display-mode-controller.html", $);
  // Kept in defaults, so a deploy from the editor carries it and the runtime stays invalid, not silently meterless.
  const node = asLoaded(definition, {type: "home-display-mode-controller", projectorMeterHost: "meter.example"});
  assert.equal(node.projectorMeterHost, "meter.example");
  const valid = (target: Record<string, unknown>) => definition.defaults.projectorPowerMeterHost!.validate!.call(target, target.projectorPowerMeterHost);
  assert.equal(valid(node), false, "invalid in the editor");
  assert.equal(valid({}), true, "no host at all is fine: the flow reports power");
  assert.equal(valid({projectorPowerMeterHost: "meter.example", projectorMeterHost: "meter.example"}), true);
  // Saving with the new host set clears the old name.
  $.values["#node-input-projectorPowerMeterHost"] = "meter.example";
  definition.oneditsave!.call(node);
  assert.equal(node.projectorMeterHost, "");
});

test("a receiver saved before 5.0 keeps its 0-98 bounds (removed in 6.0) through the editor, and is invalid until the dB bounds are set", () => {
  const $ = dialog();
  const definition = editorDefinition("avr-controller.html", $);
  // Kept in defaults: without them, a deploy from the editor would leave no bounds, which the runtime would give the louder defaults.
  const node = asLoaded(definition, {type: "home-avr-controller", minVolume: 10, maxVolume: 50, publishState: false});
  assert.deepEqual([node.minVolume, node.maxVolume], [10, 50]);
  const valid = (key: string) => definition.defaults[key]!.validate!.call(node, node[key]);
  assert.deepEqual([valid("minVolumeDb"), valid("maxVolumeDb")], [false, false]);
  // Deployed from the editor as it is (only the properties defaults name are exported): still an
  // invalid configuration at runtime, never the default -80..-20 dB bounds.
  const deployed = asLoaded(definition, {...node, sources: "{\"shield\":\"SAT/CBL\"}"});
  assert.throws(() => normaliseAvrConfig({...deployed, sources: {shield: "SAT/CBL"}}), /0-98 were removed in 6\.0/);
  assert.equal(definition.defaults.minVolumeDb!.validate!.call({}, "quiet"), false);
  assert.equal(definition.defaults.minVolumeDb!.validate!.call({}, -60), true);
  // Saving with dB bounds set clears the old ones.
  $.values["#node-input-minVolumeDb"] = -70;
  $.values["#node-input-maxVolumeDb"] = -30;
  definition.oneditsave!.call(node);
  assert.deepEqual([node.minVolume, node.maxVolume], ["", ""]);
});

test("the screen viewing position has no default: empty uses the screen's own open, and a saved position is kept", () => {
  const definition = editorDefinition("display-mode-controller.html");
  const setting = definition.defaults.screenOpenPosition!;
  assert.deepEqual([setting.value, setting.required], ["", undefined]);
  const valid = (value: unknown) => setting.validate!.call({}, value);
  assert.deepEqual([valid(""), valid(82), valid("82"), valid(100), valid(0), valid(101), valid("wide")], [true, true, true, true, false, false, false]);
  // A node saved before 5.0 with 82 keeps it as loaded, and it is valid; a
  // hand-written node without the key stays without it (the screen's own open).
  const saved = asLoaded(definition, {type: "home-display-mode-controller", screenOpenPosition: 82});
  assert.deepEqual([saved.screenOpenPosition, valid(saved.screenOpenPosition)], [82, true]);
  assert.equal(Object.hasOwn(asLoaded(definition, {type: "home-display-mode-controller"}), "screenOpenPosition"), false);
});

test("a room saved before 6.0 keeps its circadian settings through the editor, shows invalid, and saving the dialog migrates it", () => {
  const definition = editorDefinition("room-controller.html", dialog());
  // As 5.x saved it: every circadian setting, which moved to the circadian lighting policy.
  const old = {type: "home-room-lighting-controller", area: "hall", targets: "[]", initialTransitionSeconds: 1, wakeTime: "06:30", bedTime: "23:30",
    maxBrightnessPct: 90, maxColorTempKelvin: 5000, sleepBrightnessPct: 2, sleepColorTempKelvin: 2200, refreshTransitionSeconds: 45,
    refreshSeconds: 60, initialSleep: false, houseSchedule: "house1"};
  const loaded = asLoaded(definition, old);
  // Kept in defaults, so an editor deploy carries them and the runtime stays invalid rather than quietly unstyled.
  for (const key of ["wakeTime", "bedTime", "maxBrightnessPct", "maxColorTempKelvin", "sleepBrightnessPct", "sleepColorTempKelvin",
    "refreshTransitionSeconds", "refreshSeconds", "initialSleep", "houseSchedule"]) {
    assert.equal(loaded[key], (old as Record<string, unknown>)[key], key);
    assert.equal(definition.defaults[key]!.validate!.call(loaded, loaded[key]), false, `${key} shows the room invalid`);
  }
  assert.ok(movedCircadianSettings(loaded).length > 0, "the deployed node is still an invalid configuration");
  // Saving the dialog clears them: the room is valid, and runs.
  definition.oneditsave!.call(loaded);
  assert.deepEqual(movedCircadianSettings(loaded), []);
  for (const key of ["wakeTime", "initialSleep"]) assert.equal(definition.defaults[key]!.validate!.call(loaded, loaded[key]), true, key);
  // A new 6.0 room has them empty, so it is valid from the start.
  assert.deepEqual(movedCircadianSettings(newNode(definition)), []);
});


// The room's editor script with a stand-in for the editor's node store: what
// the "Create Zigbee2MQTT light nodes" button adds, links and records.
function roomEditorWith(store: {nodes: Array<Record<string, unknown>>; links: Array<{source: unknown; sourcePort: number; target: unknown}>}) {
  const html = readFileSync(resolve(__dirname, "../../nodes/room-controller.html"), "utf8");
  const script = /<script type="text\/javascript">([\s\S]*?)<\/script>/.exec(html)![1]!;
  let definition: (Definition & Record<string, unknown>) | undefined;
  const history: unknown[] = [];
  let next = 0;
  const RED = {
    nodes: {
      registerType: (_name: string, value: Definition & Record<string, unknown>) => { definition = value; },
      node: (id: string) => store.nodes.find((n) => n.id === id) ?? null,
      eachLink: (callback: (link: unknown) => void) => store.links.forEach(callback),
      id: () => `new${++next}`,
      import: (nodes: Array<Record<string, unknown>>) => {
        store.nodes.push(...nodes);
        const links = nodes.flatMap((n) => (n.wires as string[][]).flatMap((port, sourcePort) => port.map((id) => ({source: n, sourcePort, target: nodes.find((m) => m.id === id)}))));
        store.links.push(...links);
        return {nodes, links};
      },
      addLink: (link: {source: unknown; sourcePort: number; target: unknown}) => { store.links.push(link); },
      dirty: () => false
    },
    history: {push: (event: unknown) => { history.push(event); }},
    view: {redraw: () => {}},
    validators: {number: () => () => true}
  };
  new Function("RED", "$", script)(RED, () => ({length: 0}));
  return {definition: definition!, history};
}

test("a 5.x room's lights: each with Zigbee2MQTT topics gets a zigbee2mqtt light; others are flagged to set up by hand", () => {
  const {definition} = roomEditorWith({nodes: [], links: []});
  const plan = (definition.lightPlan as (targets: unknown[]) => Array<Record<string, unknown>>)([
    {id: "ceiling", stateTopic: "z2m/hall ceiling", commandTopic: "z2m/hall ceiling/set"},
    {id: "lamp", stateTopic: "home/lamp/state", commandTopic: "home/lamp/command", onOffOnly: true},
    {id: "already"}
  ]);
  assert.deepEqual(plan.map(({id, z2m}) => [id, z2m]), [["ceiling", {baseTopic: "z2m", friendlyName: "hall ceiling"}], ["lamp", null]]);
  const neutral = definition.neutralTargets as (targets: unknown[]) => unknown[];
  assert.deepEqual(neutral([{id: "ceiling", stateTopic: "z2m/c", commandTopic: "z2m/c/set"}, {id: "lamp", stateTopic: "z2m/l", commandTopic: "z2m/l/set", onOffOnly: true}]),
    [{id: "ceiling"}, {id: "lamp", onOffOnly: true}]);
  // A light whose topics weren't Zigbee2MQTT's keeps them: the room stays refused, naming it, rather than losing it.
  assert.deepEqual(neutral([{id: "ceiling", stateTopic: "z2m/c", commandTopic: "z2m/c/set"}, {id: "lamp", stateTopic: "home/lamp/state", commandTopic: "home/lamp/command"}]),
    [{id: "ceiling"}, {id: "lamp", stateTopic: "home/lamp/state", commandTopic: "home/lamp/command"}]);
});

test("saving a 5.x room's dialog keeps only its lights' ids in Targets JSON", () => {
  const $ = dialog({"#node-input-targets": JSON.stringify([{id: "ceiling", stateTopic: "z/c", commandTopic: "z/c/set"}, {id: "lamp", stateTopic: "z/l", commandTopic: "z/l/set", onOffOnly: true}])});
  const definition = editorDefinition("room-controller.html", $);
  definition.oneditsave!.call({});
  assert.equal($.values["#node-input-targets"], JSON.stringify([{id: "ceiling"}, {id: "lamp", onOffOnly: true}]));
  // A 6.0 room's targets are left as they are.
  const unchanged = dialog({"#node-input-targets": "[{\"id\":\"ceiling\"}]"});
  editorDefinition("room-controller.html", unchanged).oneditsave!.call({});
  assert.equal(unchanged.values["#node-input-targets"], "[{\"id\":\"ceiling\"}]");
});

test("\"Create Zigbee2MQTT light nodes\" adds a light per Zigbee2MQTT target, wired to the room and its MQTT out, in one undo step", () => {
  const room = {id: "room1", type: "home-room-lighting-controller", z: "tab", x: 300, y: 100};
  const out = {id: "out1", type: "mqtt out", broker: "broker1"};
  const store = {nodes: [room, out] as Array<Record<string, unknown>>, links: [{source: room, sourcePort: 0, target: out}] as Array<{source: unknown; sourcePort: number; target: unknown}>};
  const {definition, history} = roomEditorWith(store);
  const plan = (definition.lightPlan as (targets: unknown[]) => unknown[])([
    {id: "ceiling", stateTopic: "z2m/ceiling", commandTopic: "z2m/ceiling/set"},
    {id: "lamp", stateTopic: "home/lamp/state", commandTopic: "home/lamp/command"}
  ]);
  assert.equal((definition.createLights as (id: string, plan: unknown[]) => number)("room1", plan), 1, "only the Zigbee2MQTT one");
  const light = store.nodes.find((n) => n.type === "home-z2m-light")!;
  assert.deepEqual([light.target, light.baseTopic, light.friendlyName, light.z], ["ceiling", "z2m", "ceiling", "tab"]);
  const mqttIn = store.nodes.find((n) => n.type === "mqtt in")!;
  assert.deepEqual([mqttIn.topic, mqttIn.broker, mqttIn.datatype], ["z2m/ceiling/#", "broker1", "auto-detect"]);
  const linked = (source: unknown, port: number, target: unknown) => store.links.some((l) => l.source === source && l.sourcePort === port && l.target === target);
  assert.ok(linked(room, 1, light), "room's light commands → the light");
  assert.ok(linked(light, 1, room), "the light's readings → room");
  assert.ok(linked(light, 0, out), "the light's publications → the room's MQTT out");
  assert.ok(linked(mqttIn, 0, light), "its MQTT in → the light");
  assert.equal(history.length, 1);
  assert.deepEqual((history[0] as {nodes: string[]}).nodes.sort(), [light.id, mqttIn.id].sort());
  assert.equal((history[0] as {links: unknown[]}).links.length, 4);
});

test("a 5.x room's topic targets survive an editor deploy (Targets JSON is one setting), so the runtime still refuses it until migrated", () => {
  const definition = editorDefinition("room-controller.html", dialog());
  const targets = JSON.stringify([{id: "ceiling", stateTopic: "z2m/c", commandTopic: "z2m/c/set"}]);
  const loaded = asLoaded(definition, {type: "home-room-lighting-controller", area: "", targets, publishState: false, discovery: false});
  assert.equal(loaded.targets, targets);
  assert.deepEqual(targetsWithTopics(loaded.targets), ["ceiling"]);
});
