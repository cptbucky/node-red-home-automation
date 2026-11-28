"use strict";

import assert from "node:assert/strict";
import {EventEmitter} from "node:events";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import test from "node:test";
import type {NodeInitializer} from "node-red";
import registerActivityLighting from "../nodes/activity-lighting-controller";
import registerBacklighting from "../nodes/backlighting-controller";
import registerTheatreActivity from "../nodes/theatre-activity-controller";
import registerTheatreStateContract from "../nodes/theatre-state-contract";
import registerAvr from "../nodes/avr-controller";
import registerCover from "../nodes/cover-controller";
import registerCoverGroup from "../nodes/cover-group";
import registerDisplay from "../nodes/display-mode-controller";
import registerMotion from "../nodes/motion-policy";
import registerSwitch from "../nodes/switch-policy";
import registerOccupancy from "../nodes/occupancy-fusion";
import registerRoom from "../nodes/room-controller";
import registerCircadian from "../nodes/circadian-policy";
import registerHouse from "../nodes/house-schedule";
import registerZ2mLight from "../nodes/z2m-light";
import registerHouseMqtt from "../nodes/house-schedule-mqtt";
import registerShellyCover from "../nodes/shelly-cover";
import registerShellySwitch from "../nodes/shelly-switch";
import registerZ2mCover from "../nodes/z2m-cover";
import registerWled from "../nodes/wled";
import registerZ2mSensor from "../nodes/z2m-sensor";
import registerScene from "../nodes/scene";
import {fakeBroker} from "./helpers/fake-broker";
import type {SharedSchedule} from "../lib/house-schedule";
import registerSource from "../nodes/source-capability-controller";
import type {TraceRecord} from "../lib/bounded-trace";
import {transitionActivityLighting} from "../lib/activity-lighting-controller";
import {transitionAvr} from "../lib/avr-controller";
import {transitionBacklighting} from "../lib/backlighting-controller";
import {normaliseConfig as normaliseDisplayConfig, transitionDisplay, type DisplayCommand} from "../lib/display-mode-controller";
import {transitionSource} from "../lib/source-capability-controller";

interface RuntimeContext {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  global: {
    get(key: string): unknown;
    set(key: string, value: unknown): void;
  };
}

interface RuntimeNode {
  on: EventEmitter["on"];
  emit: EventEmitter["emit"];
  sent: unknown[];
  errors: unknown[];
  statuses: unknown[];
  send(message: unknown): void;
  error(error: unknown, msg?: unknown): void;
  warnings: unknown[];
  warn(warning: unknown): void;
  status(status: unknown): void;
  context(): RuntimeContext;
  // What Node-RED does to the node's context once it has closed.
  closeContext?(): void;
}

interface WireMessage {
  source?: string;
  payload?: unknown;
  topic?: string;
  retain?: boolean;
  lighting?: Record<string, unknown>;
  avr_command?: Record<string, unknown>;
  activityLighting?: Record<string, unknown>;
  activityLightingCommand?: Record<string, unknown>;
  backlighting?: Record<string, unknown>;
  backlightingCommand?: Record<string, unknown>;
  sourceCommand?: Record<string, unknown>;
  theatreCommand?: Record<string, unknown>;
  theatreStateContract?: Record<string, unknown>;
  theatre?: Record<string, unknown>;
}

type SendEnvelope = Array<WireMessage[] | null>;
type RuntimeConstructor = new (config: Record<string, unknown>) => RuntimeNode;

// For tests of what a node keeps across a redeploy or restart: those need a
// configured context store, the setup the README recommends.
const STORE = {contextStore: true};

// Every node the tests have built, from any runtime, by ID.
const builtNodes = new Map<string, unknown>();

function runtime(
  register: NodeInitializer,
  credentials: Record<string, string> = {},
  // `flows`: other nodes deployed in the same flows (as their saved configs,
  // with their type), which eachNode lists too.
  {contextStore = false, flows = []}: {contextStore?: boolean; flows?: Array<{id: string; type: string} & Record<string, unknown>>} = {}
): {Constructor: RuntimeConstructor; events: EventEmitter; flowNodeIds: Set<string>} {
  let Constructor: RuntimeConstructor | undefined;
  const globalValues = new Map<string, unknown>([["MOTION_ENABLED_STATE", true]]);
  // Every node's context, by node ID. As in Node-RED 5.0.10, a node's context
  // is deleted when it closes (a redeploy of it, or a restart) unless a
  // context store is configured (runtime/lib/nodes/Node.js:359-370,
  // context/index.js:557-583); contextStore: true simulates one.
  const values = new Map<string, unknown>();
  // Node-RED's runtime events, such as "flows:started" after a deploy.
  const events = new EventEmitter();
  const flowNodeIds = new Set<string>();
  // Each node's saved config with its type, as Node-RED's eachNode gives it.
  const flowConfigs = new Map<string, Record<string, unknown>>();
  let typeName = "";
  const RED = {
    events,
    nodes: {
      createNode(node: RuntimeNode, config?: {id?: string}) {
        (node as RuntimeNode & {credentials: Record<string, string>}).credentials = credentials;
        // As Node-RED does, the node takes its ID from its saved config.
        (node as RuntimeNode & {id?: string}).id = config?.id;
        flowNodeIds.add(config?.id ?? "");
        flowConfigs.set(config?.id ?? "", {type: typeName, ...config});
        if (config?.id) builtNodes.set(config.id, node);
        const emitter = new EventEmitter();
        node.on = emitter.on.bind(emitter);
        node.emit = emitter.emit.bind(emitter);
        (node as RuntimeNode & {listenerCount?: (event: string) => number}).listenerCount = emitter.listenerCount.bind(emitter);
        node.sent = [];
        node.errors = [];
        node.statuses = [];
        node.send = (message: unknown) => {
          node.sent.push(message);
        };
        node.error = (error: unknown) => {
          node.errors.push(error);
        };
        node.warnings = [];
        node.warn = (warning: unknown) => {
          node.warnings.push(warning);
        };
        node.status = (status: unknown) => {
          node.statuses.push(status);
        };
        // Each node ID has its own context, as in Node-RED; nodes built
        // without one share it.
        const own = (key: string) => `${config?.id ?? ""}:${key}`;
        node.closeContext = () => {
          if (contextStore) return;
          for (const key of [...values.keys()]) if (key.startsWith(`${config?.id ?? ""}:`)) values.delete(key);
        };
        node.context = () => ({
          get: (key: string) => values.get(own(key)),
          set: (key: string, value: unknown) => {
            values.set(own(key), value);
          },
          global: {
            get: (key: string) => globalValues.get(key),
            set: (key: string, value: unknown) => {
              globalValues.set(key, value);
            }
          }
        });
      },
      // Any node built so far, by ID, as a node finds its config node.
      getNode(id: string) {
        return builtNodes.get(id) ?? null;
      },
      // The deployed flows: every node built here, until a test deletes one.
      eachNode(callback: (node: {id: string} & Record<string, unknown>) => void) {
        for (const id of flowNodeIds) callback({...flowConfigs.get(id), id});
        for (const other of flows) callback(other);
      },
      registerType(name: string, implementation: RuntimeConstructor) {
        typeName = name;
        Constructor = implementation;
      }
    }
  };
  register(RED as unknown as Parameters<NodeInitializer>[0]);
  assert.ok(Constructor);
  return {Constructor, events, flowNodeIds};
}

function receive<T>(
  node: RuntimeNode,
  msg: Record<string, unknown>
): Promise<T[]> {
  return new Promise<T[]>((resolve, reject) => {
    const sent: T[] = [];
    // As Node-RED's done does, an error is reported against the message.
    node.emit("input", msg, (message: T) => sent.push(message), (error?: Error) => {
      if (error) {
        node.error(error, msg);
        reject(error);
      } else {
        resolve(sent);
      }
    });
  });
}

// Closes the node, then deals with its context as Node-RED does.
// As Node-RED does: a node with no close handler is closed at once.
function close(node: RuntimeNode): Promise<void> {
  const handlers = (node as RuntimeNode & {listenerCount?: (event: string) => number}).listenerCount?.("close") ?? 1;
  return new Promise<void>((resolve) => {
    if (handlers === 0) resolve();
    else node.emit("close", false, resolve);
  }).then(() => node.closeContext?.());
}

function traces(node: RuntimeNode): TraceRecord[] {
  return node.context().get("trace") as TraceRecord[];
}

test("enable inputs: a value other than true or false is refused visibly, once in the log and on the status, never read as off", async (t) => {
  const motionRuntime = runtime(registerMotion);
  const motion = new motionRuntime.Constructor({area: "kitchen", onTargets: "[\"cooking\"]", offTargets: "[\"cooking\"]"});
  t.after(() => close(motion));
  await receive(motion, {source: "area-enabled", payload: "off"});
  await receive(motion, {source: "area-enabled", payload: "OFF"});
  assert.equal(motion.warnings.length, 1, "once per input per deploy");
  assert.match(String(motion.warnings[0]), /area-enabled takes only true or false: "off" was refused/);
  assert.deepEqual(motion.statuses.at(-1), {fill: "yellow", shape: "ring", text: "refused area-enabled \"OFF\": send true or false"});
  assert.equal((motion.context().get("state") as {areaEnabled: boolean}).areaEnabled, true, "still enabled");
  await receive(motion, {source: "pause", payload: "on", owner: "blind"});
  assert.equal(motion.warnings.length, 2, "a second input warns once too");
  await receive(motion, {source: "area-enabled", payload: false});
  assert.equal((motion.context().get("state") as {areaEnabled: boolean}).areaEnabled, false);
  assert.match(String((motion.statuses.at(-1) as {text: string}).text), /^disabled/);

  const targets = "[{\"id\":\"main\"}]";
  const room = new (runtime(registerRoom).Constructor)({targets, area: "", publishState: false, discovery: false});
  t.after(() => close(room));
  // Circadian switches are the circadian lighting policy's since 6.0: a room ignores them, with one warning.
  await receive(room, {lighting: {kind: "circadian", enabled: false}});
  await receive(room, {lighting: {kind: "sleep", enabled: true}});
  assert.equal(room.warnings.length, 1);
  assert.match(String(room.warnings[0]), /circadian, sleep and schedule messages go to the circadian lighting policy since 6\.0/);
});

test("motion adapter emits intents and persists standard traces", async (t) => {
  const {Constructor} = runtime(registerMotion);
  const node = new Constructor({
    area: "kitchen",
    onTargets: "[\"cooking\",\"dining\"]",
    offTargets: "[\"cooking\",\"dining\",\"cabinets\"]",
    defaultDelaySeconds: 30,
    defaultIlluminanceCutoff: 150,
    switchWindowMs: 500
  });
  t.after(() => close(node));

  await receive<WireMessage>(node, {source: "illuminance", payload: 1});
  const sent = await receive<WireMessage>(
    node,
    {source: "occupancy", payload: {occupied: true, trigger: "motion"}}
  );
  assert.equal(sent.length, 1);
  // Lighting intents on output 1.
  assert.equal((sent[0] as unknown as [WireMessage, null])[0]?.lighting?.state, "ON");
  const trace = traces(node);
  assert.equal(trace.at(-1)?.component, "motion-policy");
  assert.equal(trace.at(-1)?.area, "kitchen");
  assert.equal(trace.at(-1)?.event, "occupancy");
  assert.equal(trace.at(-1)?.outcome, "emit-on");
  assert.equal(node.errors.length, 0);
});

test("switch adapter emits gestures without motion state", async (t) => {
  const {Constructor} = runtime(registerSwitch);
  const node = new Constructor({
    area: "room",
    targets: "[\"main\"]",
    switchWindowMs: 500
  });
  t.after(() => close(node));

  assert.deepEqual(
    await receive<WireMessage>(node, {
      source: "switch-action",
      payload: {action: "double"},
      retain: true
    }),
    []
  );
  const sent = await receive<WireMessage>(node, {
    source: "switch-action",
    payload: {action: "double"}
  });
  assert.equal(sent.length, 1);
  assert.equal(sent[0]?.lighting?.state, "ON");
  assert.deepEqual(sent[0]?.lighting?.values, {brightnessPct: 100});
  assert.equal(traces(node).at(-1)?.component, "switch-policy");
  assert.equal(node.errors.length, 0);
});

test("occupancy adapter emits normalised occupancy and standard traces", async () => {
  const {Constructor} = runtime(registerOccupancy);
  const node = new Constructor({
    area: "kitchen",
    presenceMode: "hold"
  });

  assert.deepEqual(
    await receive<WireMessage>(node, {source: "presence", payload: {presence: true}}),
    []
  );
  // Occupancy events on output 1; nothing on output 2 with publishing off.
  const sent = await receive<[WireMessage, null]>(node, {source: "motion", payload: {motion: true}});
  assert.equal(sent.length, 1);
  assert.equal(sent[0]?.[1], null);
  assert.equal(sent[0]?.[0]?.source, "occupancy");
  const occupancy = sent[0]?.[0]?.payload as {occupied?: boolean} | undefined;
  assert.equal(occupancy?.occupied, true);
  const trace = traces(node);
  assert.equal(trace.at(-1)?.component, "occupancy-fusion");
  assert.equal(trace.at(-1)?.event, "motion");
  assert.equal(trace.at(-1)?.outcome, "triggered");
  assert.equal(node.errors.length, 0);
});

test("room adapter publishes startup messages and standard traces", async (t) => {
  const {Constructor} = runtime(registerRoom);
  const node = new Constructor({
    area: "kitchen",
    displayName: "Kitchen",
    targets: "[{\"id\":\"cooking\"}]",
    initialTransitionSeconds: 1
  });
  t.after(() => close(node));

  const startup = await receive<SendEnvelope>(node, {lighting: {kind: "startup"}});
  assert.equal(startup.length, 1);
  // First, the circadian entry it published before 6.0, cleared.
  assert.deepEqual([startup[0]?.[0]?.[0]?.topic, startup[0]?.[0]?.[0]?.payload], ["homeassistant/switch/kitchen_circadian_lighting/config", ""]);
  const commanded = await receive<SendEnvelope>(node, {
    lighting: {kind: "intent", targets: ["cooking"], state: "OFF", source: "test"}
  });
  // Output 2: the neutral command, for the light's adapter.
  const command = (commanded[0] as unknown as Array<Array<{light?: {kind: string; target: string; state: string}}> | null>)[1]?.[0]?.light;
  assert.deepEqual([command?.kind, command?.target, command?.state], ["command", "cooking", "OFF"]);
  assert.deepEqual(
    await receive<SendEnvelope>(node, {
      topic: "home/kitchen/light/group/cooking/set",
      payload: {state: "ON"},
      retain: true,
      lighting: {kind: "command-observed", target: "cooking"}
    }),
    []
  );
  const trace = traces(node);
  assert.equal(trace.at(-1)?.component, "room-controller");
  assert.equal(trace.at(-1)?.event, "intent");
  assert.equal(trace.at(-1)?.outcome, "commanded");
  assert.equal(node.errors.length, 0);
});

test("room adapter: a room saved before 6.0 is an invalid configuration until migrated to a circadian lighting policy and light adapters", () => {
  const targets = "[{\"id\":\"main\"}]";
  const oldTargets = "[{\"id\":\"main\",\"stateTopic\":\"z2m/main\",\"commandTopic\":\"z2m/main/set\"}]";
  const {Constructor} = runtime(registerRoom);
  // As saved by 5.x (the editor wrote every circadian setting), and by 2.2.x (coordinates, no times).
  for (const saved of [
    {wakeTime: "07:00", bedTime: "23:00", maxBrightnessPct: 100, refreshSeconds: 60, initialSleep: false, houseSchedule: ""},
    {latitude: 51.5074, longitude: -0.1278, minBrightnessPct: 1, minColorTempKelvin: 2000}
  ]) {
    // Not closed: an invalid node registers no close handler.
    const node = new Constructor({area: "room", displayName: "Room", targets, ...saved});
    assert.equal((node.statuses.at(-1) as {text?: string}).text, "invalid configuration");
    assert.match(String(node.errors[0]), /saved before 6\.0: circadian lighting moved to its own node \(add a circadian lighting policy wired to this room/);
  }
  // Its lights' topics alone, or with the circadian settings: both moves named.
  const lights = new Constructor({area: "room", displayName: "Room", targets: oldTargets});
  assert.match(String(lights.errors[0]), /saved before 6\.0: its lights are reached through light adapters \(add one for main: a zigbee2mqtt light, or your own on the neutral light contract, and remove their topics from Targets JSON\); then open and save this room/);
  const both = new Constructor({area: "room", displayName: "Room", targets: oldTargets, wakeTime: "07:00"});
  assert.match(String(both.errors[0]), /circadian lighting moved .*, and its lights are reached through light adapters/);
  // Migrated (the old settings cleared, as saving the dialog does), it runs.
  const migrated = new Constructor({area: "room", displayName: "Room", targets, wakeTime: "", bedTime: "", maxBrightnessPct: "", initialSleep: ""});
  assert.deepEqual(migrated.errors, []);
  assert.notEqual((migrated.statuses.at(-1) as {text?: string} | undefined)?.text, "invalid configuration");
});

test("AVR adapter emits protocol commands and bounded traces", async (t) => {
  const {Constructor} = runtime(registerAvr);
  const node = new Constructor({
    area: "lounge",
    sources: "{\"shield\":\"SAT/CBL\",\"playstation\":\"GAME\"}",
    retryMs: 2000,
    maxAttempts: 3
  });
  t.after(() => close(node));

  await receive<SendEnvelope>(
    node,
    {avr: {kind: "observed", line: "PWON\rZMON\rSISAT/CBL\rMV31\r"}}
  );
  const sent = await receive<SendEnvelope>(node, {
    avr: {
      kind: "intent",
      requestId: "adapter-test",
      generation: 1,
      power: "on",
      source: "playstation"
    }
  });
  const payload = sent[0]?.[0]?.[0]?.payload;
  assert.ok(Buffer.isBuffer(payload));
  assert.equal(payload.toString(), "SIGAME\r");
  assert.equal(sent[0]?.[0]?.[0]?.avr_command?.operation, "source");
  const trace = traces(node);
  assert.equal(trace.at(-1)?.component, "avr-controller");
  const accepted = trace.find((entry) => entry.event === "intent");
  assert.equal(accepted?.outcome, "accepted");
  assert.equal(trace.at(-1)?.event, "command");
  assert.equal(node.errors.length, 0);
});

test("source adapter emits semantic commands and target-state evidence", async (t) => {
  const {Constructor} = runtime(registerSource);
  const node = new Constructor({
    area: "lounge",
    sources: JSON.stringify({
      streamer: {activation: "command", deactivation: "command", confirmation: "active"}
    }),
    pollMs: 2000,
    confirmationTimeoutMs: 15000,
    maxAttempts: 2
  });
  t.after(() => close(node));

  const intent = await receive<SendEnvelope>(node, {
    sourceCapability: {
      kind: "intent",
      requestId: "source-adapter-test",
      generation: 1,
      sourceId: "streamer",
      action: "activate"
    }
  });
  assert.equal(intent[0]?.[0]?.[0]?.sourceCommand?.operation, "activate");
  assert.equal(intent[1]?.[1]?.[0]?.theatre?.status, "transitioning");

  const observedAt = new Date().toISOString();
  const observed = await receive<SendEnvelope>(node, {
    sourceCapability: {
      kind: "observed",
      sourceId: "streamer",
      generation: 1,
      status: "active",
      observedAt
    }
  });
  assert.equal(observed[0]?.[1]?.[0]?.theatre?.status, "ready");
  const trace = traces(node);
  assert.equal(trace.at(-1)?.component, "source-capability-controller");
  assert.equal(trace.at(-1)?.outcome, "ready");
  assert.equal(node.errors.length, 0);
});

test("activity lighting adapter preserves ownership and emits target evidence", async (t) => {
  const {Constructor} = runtime(registerActivityLighting);
  const node = new Constructor({
    area: "lounge",
    profiles: JSON.stringify({
      tv: {targets: ["wall", "lamp"], values: {brightnessPct: 25}}
    }),
    confirmationTimeoutMs: 15000,
    maxAttempts: 2
  });
  t.after(() => close(node));

  const intent = await receive<SendEnvelope>(node, {
    activityLighting: {
      kind: "intent",
      requestId: "lighting-adapter-test",
      generation: 1,
      profile: "tv"
    }
  });
  assert.equal(intent[0]?.[0]?.[0]?.lighting?.preserveManual, true);
  assert.equal(intent[0]?.[0]?.[0]?.lighting?.updateOnOnly, true);
  assert.equal(intent[1]?.[1]?.[0]?.theatre?.status, "transitioning");

  const observedAt = new Date().toISOString();
  await receive<SendEnvelope>(node, {
    activityLighting: {
      kind: "observed",
      generation: 1,
      target: "wall",
      on: true,
      manual: true,
      fields: ["brightness"], showsLast: false,
      observedAt
    }
  });
  const observed = await receive<SendEnvelope>(node, {
    activityLighting: {
      kind: "observed",
      generation: 1,
      target: "lamp",
      on: false,
      fields: [], showsLast: false,
      observedAt
    }
  });
  assert.equal(observed[0]?.[1]?.[0]?.theatre?.status, "ready");
  assert.equal(traces(node).at(-1)?.component, "activity-lighting-controller");
  assert.equal(node.errors.length, 0);
});

test("backlighting adapter waits for observed power before ready", async (t) => {
  const {Constructor} = runtime(registerBacklighting);
  const node = new Constructor({
    area: "lounge",
    pollMs: 2000,
    confirmationTimeoutMs: 15000,
    maxAttempts: 2
  });
  t.after(() => close(node));

  const intent = await receive<SendEnvelope>(node, {
    backlighting: {
      kind: "intent",
      requestId: "backlighting-adapter-test",
      generation: 1,
      power: "on"
    }
  });
  assert.equal(intent[0]?.[0]?.[0]?.backlightingCommand?.operation, "set_power");
  assert.equal(intent[1]?.[1]?.[0]?.theatre?.status, "transitioning");

  const result = await receive<SendEnvelope>(node, {
    backlighting: {
      kind: "command_result",
      generation: 1,
      ok: true
    }
  });
  assert.notEqual(result[0]?.[1]?.[0]?.theatre?.status, "ready");

  const observed = await receive<SendEnvelope>(node, {
    backlighting: {
      kind: "observed",
      generation: 1,
      power: "on",
      observedAt: new Date().toISOString()
    }
  });
  assert.equal(observed[0]?.[1]?.[0]?.theatre?.status, "ready");
  assert.equal(traces(node).at(-1)?.component, "backlighting-controller");
  assert.equal(node.errors.length, 0);
});

test("theatre activity adapter emits semantic target plans and complete state", async (t) => {
  const {Constructor} = runtime(registerTheatreActivity);
  const profile = {
    display: {mode: "tv"},
    avr: {power: "on", source: "streamer"},
    source: {action: "activate", sourceId: "streamer", readiness: "required"},
    lighting: {profile: "tv"},
    backlighting: {power: "on"}
  };
  const node = new Constructor({
    area: "lounge",
    freshnessMs: 30000,
    activityProfiles: JSON.stringify({tv_streamer: profile})
  });
  t.after(() => close(node));

  const sent = await receive<SendEnvelope>(node, {
    theatre: {
      kind: "intent",
      requestId: "activity-adapter-test",
      generation: 1,
      activity: "tv_streamer",
      requestedAt: "2026-11-21T17:00:00.000Z"
    }
  });
  assert.equal(sent[0]?.[0]?.length, 5);
  assert.equal(sent[0]?.[0]?.[0]?.theatreCommand?.target, "display");
  const state = sent[1]?.[1]?.find((entry) => entry.theatre?.kind === "state");
  assert.equal(state?.theatre?.desiredActivity, "tv_streamer");
  assert.equal(state?.theatre?.requestedAt, "2026-11-21T17:00:00.000Z");
  assert.equal(traces(node).at(-1)?.component, "theatre-activity-controller");
  assert.equal(node.errors.length, 0);
});

test("theatre state adapter bridges non-retained requests and retained HA truth", async (t) => {
  const {Constructor} = runtime(registerTheatreStateContract);
  const node = new Constructor({
    area: "lounge",
    displayName: "Lounge",
    baseTopic: "home/lounge/theatre",
    discoveryPrefix: "homeassistant",
    activities: "[\"off\",\"tv_streamer\"]"
  });
  t.after(() => close(node));

  const startup = await receive<SendEnvelope>(node, {
    theatreStateContract: {kind: "startup"}
  });
  assert.equal(startup[0]?.[1]?.length, 14);
  assert.equal(startup[0]?.[1]?.every((entry) => entry.retain === true), true);

  const requested = await receive<SendEnvelope>(node, {
    topic: "home/lounge/theatre/request",
    payload: {requestId: "mqtt-adapter-test", activity: "tv_streamer"},
    retain: false
  });
  assert.equal(requested[0]?.[0]?.[0]?.theatre?.kind, "intent");
  assert.equal(requested[0]?.[0]?.[0]?.theatre?.generation, 1);

  const published = await receive<SendEnvelope>(node, {
    theatre: {
      kind: "state",
      area: "lounge",
      requestId: "mqtt-adapter-test",
      generation: 1,
      desiredActivity: "tv_streamer",
      requestedAt: new Date().toISOString(),
      currentActivity: "unknown",
      phase: "transitioning",
      availability: "unknown",
      transitionStartedAt: new Date().toISOString(),
      transitionCompletedAt: null,
      targets: {},
      failure: null,
      degraded: []
    }
  });
  const phase = published[0]?.[1]?.find((entry) => entry.topic === "home/lounge/theatre/phase");
  assert.equal(phase?.payload, "transitioning");
  assert.equal(phase?.retain, true);
  assert.equal(traces(node).at(-1)?.component, "theatre-state-contract");
  assert.equal(node.errors.length, 0);
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function savedState(node: RuntimeNode): Record<string, unknown> {
  return node.context().get("state") as Record<string, unknown>;
}

const motionConfig = {
  area: "kitchen",
  onTargets: "[\"cooking\"]",
  offTargets: "[\"cooking\"]",
  defaultDelaySeconds: 0.2,
  defaultIlluminanceCutoff: 150,
  switchWindowMs: 500
};

test("motion adapter re-arms a pending off-timer after a redeploy", async (t) => {
  const {Constructor} = runtime(registerMotion, {}, STORE);
  const before = new Constructor(motionConfig);
  await receive<WireMessage>(before, {source: "occupancy", payload: {occupied: false}});
  assert.equal(typeof savedState(before).offTimerDueAt, "number");
  await close(before);

  const after = new Constructor(motionConfig);
  t.after(() => close(after));
  assert.equal(after.sent.length, 0);
  await wait(400);
  assert.deepEqual((after.sent as Array<[WireMessage, null]>).map(([message]) => message.lighting?.state), ["OFF"]);
  assert.equal(savedState(after).offTimerDueAt, null);
});

test("motion node: a pause that runs out wakes the policy, which acts on a vacancy that came meanwhile (#193)", async (t) => {
  const node = new (runtime(registerMotion).Constructor)({...motionConfig, id: "motion-lapse", maxPauseSeconds: 1, defaultDelaySeconds: 0.2});
  t.after(() => close(node));
  await receive(node, {source: "occupancy", payload: {occupied: true}});
  await receive(node, {source: "pause", payload: true, owner: "scene:Bath"});
  await receive(node, {source: "occupancy", payload: {occupied: false}});
  node.sent.length = 0;
  // Nothing more is sent to it: the pause runs out after 1 s, then the 0.2 s vacancy delay.
  await wait(1600);
  assert.deepEqual((node.sent as Array<[{lighting?: {state: string}}, null]>).map(([message]) => message.lighting?.state), ["OFF"]);
});

test("motion node: a pause longer than setTimeout can wait is waited for in parts, never in a loop", async (t) => {
  // 40 days: longer than setTimeout's 2^31-1 ms, which would fire at once.
  const delays: number[] = [];
  const realSetTimeout = globalThis.setTimeout;
  globalThis.setTimeout = ((handler: () => void, ms?: number) => { delays.push(Number(ms)); return realSetTimeout(handler, Math.min(Number(ms) || 0, 1_000_000)); }) as typeof setTimeout;
  t.after(() => { globalThis.setTimeout = realSetTimeout; });
  const node = new (runtime(registerMotion).Constructor)({...motionConfig, id: "motion-long-pause", maxPauseSeconds: 40 * 86_400});
  t.after(() => close(node));
  await receive(node, {source: "pause", payload: true, owner: "scene:Bath"});
  await wait(30);
  assert.ok(delays.length > 0 && delays.every((ms) => ms <= 2 ** 31 - 1), JSON.stringify(delays));
  assert.equal(traces(node).filter(({event}) => event === "pause").length, 1, "no wake-up loop");
});

test("motion adapter started with nothing saved sends its off intent after the vacancy delay", async (t) => {
  const {Constructor} = runtime(registerMotion);
  const node = new Constructor({...motionConfig, id: "motion-cold"});
  t.after(() => close(node));
  assert.equal(node.sent.length, 0, "nothing sent at the start");
  await wait(400);
  assert.deepEqual((node.sent as Array<[WireMessage, null]>).map(([message]) => message.lighting?.state), ["OFF"]);

  // Occupancy before the delay cancels it.
  const occupied = new Constructor({...motionConfig, id: "motion-cold-occupied"});
  t.after(() => close(occupied));
  await receive(occupied, {source: "occupancy", payload: {occupied: true}});
  await wait(400);
  assert.ok(!(occupied.sent as Array<[WireMessage, null]>).some(([message]) => message.lighting?.state === "OFF"));
});

test("motion adapter fires an off-timer that fell due during the restart straight away", async (t) => {
  const {Constructor} = runtime(registerMotion);
  const before = new Constructor({...motionConfig, defaultDelaySeconds: 30});
  await receive<WireMessage>(before, {source: "occupancy", payload: {occupied: false}});
  await close(before);
  before.context().set("state", {...savedState(before), offTimerDueAt: Date.now() - 1000});

  const after = new Constructor({...motionConfig, defaultDelaySeconds: 30});
  t.after(() => close(after));
  await wait(50);
  assert.deepEqual((after.sent as Array<[WireMessage, null]>).map(([message]) => message.lighting?.state), ["OFF"]);
});

test("motion adapter arms nothing at startup without a pending off-timer", async (t) => {
  const {Constructor} = runtime(registerMotion, {}, STORE);
  const before = new Constructor(motionConfig);
  await receive<WireMessage>(before, {source: "occupancy", payload: {occupied: false}});
  await receive<WireMessage>(before, {source: "occupancy", payload: {occupied: true}});
  assert.equal(savedState(before).offTimerDueAt, null);
  await close(before);

  const after = new Constructor(motionConfig);
  t.after(() => close(after));
  await wait(400);
  assert.equal(after.sent.length, 0);
});

test("activity lighting adapter re-observes a deadline that passed during a redeploy", async (t) => {
  const {Constructor} = runtime(registerActivityLighting, {}, STORE);
  const lightingConfig = {
    area: "lounge",
    profiles: JSON.stringify({tv: {targets: ["wall"], values: {brightnessPct: 25}}}),
    confirmationTimeoutMs: 15000,
    maxAttempts: 1
  };
  const before = new Constructor(lightingConfig);
  await receive<SendEnvelope>(before, {
    activityLighting: {kind: "intent", requestId: "lighting-redeploy", generation: 1, profile: "tv"}
  });
  await close(before);
  const state = savedState(before);
  const pending = state.pending as Record<string, unknown>;
  before.context().set("state", {...state, pending: {...pending, deadlineAt: Date.now() - 1000}});

  const after = new Constructor(lightingConfig);
  t.after(() => close(after));
  assert.equal(after.sent.length, 0);
  await wait(50);
  const envelopes = after.sent as SendEnvelope[];
  assert.deepEqual(envelopes.flatMap((envelope) => envelope[0] ?? []).map((message) => message.activityLightingCommand?.operation), ["observe"]);
  assert.deepEqual(envelopes.map((envelope) => envelope[1]?.[0]?.theatre?.status).filter(Boolean), ["confirming"]);
  assert.equal(traces(after).at(-1)?.event, "startup");
});

test("backlighting adapter re-observes a pending command after a redeploy", async (t) => {
  const {Constructor} = runtime(registerBacklighting, {}, STORE);
  const backlightingConfig = {area: "lounge", pollMs: 2000, confirmationTimeoutMs: 15000, maxAttempts: 2};
  const before = new Constructor(backlightingConfig);
  await receive<SendEnvelope>(before, {
    backlighting: {kind: "intent", requestId: "backlighting-redeploy", generation: 1, power: "on"}
  });
  await close(before);
  const state = savedState(before);
  const pending = state.pending as Record<string, unknown>;
  before.context().set("state", {...state, pending: {...pending, nextAt: Date.now() + 100}});

  const after = new Constructor(backlightingConfig);
  t.after(() => close(after));
  assert.equal(after.sent.length, 0);
  await wait(50);
  const operations = (after.sent as SendEnvelope[]).flatMap((envelope) => envelope[0] ?? [])
    .map((message) => message.backlightingCommand?.operation);
  assert.deepEqual(operations, ["observe"]);
  assert.equal((savedState(after).pending as Record<string, unknown>).operation, "observe");
});

// Fake TV, screen and projector meter: TV in standby, screen open, projector at `watts`.
function fakeDisplayDevices(t: {after(fn: () => void): void}) {
  const realFetch = globalThis.fetch;
  const devices = {watts: 2};
  globalThis.fetch = (async (url: string | URL | Request) => {
    const key = String(url instanceof Request ? url.url : url);
    const body = key.includes("sony")
      ? {result: [{status: "standby"}], id: 50}
      : key.includes("Cover.GetStatus")
        ? {current_pos: 100, state: "stopped"}
        : {apower: devices.watts};
    return new Response(JSON.stringify(body), {status: 200});
  }) as typeof fetch;
  t.after(() => {
    globalThis.fetch = realFetch;
  });
  return devices;
}

const displayConfig = {
  area: "lounge",
  tvHost: "tv.invalid",
  screenHost: "screen.invalid",
  projectorPowerMeterHost: "projector.invalid",
  screenOpenPosition: 100
};

function powerToggles(node: RuntimeNode): number {
  return (node.sent as Array<Array<Record<string, unknown> | null>>)
    .filter((envelope) => envelope[0]?.payload === "power").length;
}

test("display node: a flow file naming only projectorMeterHost (removed in 6.0) is an invalid configuration that says what to set", async () => {
  const {projectorPowerMeterHost: _new, ...base} = displayConfig;
  const old = new (runtime(registerDisplay, {tvPsk: "synthetic"}).Constructor)({...base, projectorMeterHost: "old-meter.invalid"});
  assert.equal((old.statuses.at(-1) as {text?: string}).text, "invalid configuration");
  assert.match(String(old.errors[0]), /projectorMeterHost was removed in 6\.0: set Projector power meter host/);
  // Beside the new setting, the old name is ignored.
  const both = new (runtime(registerDisplay, {tvPsk: "synthetic"}).Constructor)({...base, projectorPowerMeterHost: "new-meter.invalid", projectorMeterHost: "old-meter.invalid"});
  assert.deepEqual(both.errors, []);
  await close(both);
});

test("display node: with no power meter host, it asks for the projector's power on output 3 and reads what the flow sends", async (t) => {
  const devices = fakeDisplayDevices(t);
  const asked: string[] = [];
  const fakeFetch = globalThis.fetch;
  globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => {
    asked.push(String(url instanceof Request ? url.url : url));
    return fakeFetch(url, init);
  }) as typeof fetch;
  const {projectorPowerMeterHost: _meter, ...withoutMeter} = displayConfig;
  const node = new (runtime(registerDisplay, {tvPsk: "synthetic"}).Constructor)(withoutMeter);
  t.after(() => close(node));
  assert.deepEqual(node.errors, []);
  await receive(node, {display: {kind: "startup"}});
  await wait(50);
  const queries = (node.sent as SendEnvelope[]).flatMap((envelope) => envelope[2] ?? []);
  assert.deepEqual(queries.map(({payload}) => payload), ["query"]);
  assert.equal((queries[0] as {display_command?: DisplayCommand}).display_command?.operation, "query_power");
  assert.ok(!asked.some((url) => url.includes("Switch.GetStatus")), "no built-in meter");
  assert.equal(devices.watts, 2);
  // The flow's reading, as any adapter would send it.
  await receive(node, {display: {kind: "observed", device: "projector", power: "standby", source: "plug"}});
  const state = savedState(node) as {observed: {projector: {power: string; watts: number | null; source: string}}};
  assert.deepEqual(state.observed.projector, {...state.observed.projector, power: "standby", watts: null, source: "plug"});
});

async function displayStartingProjector(t: {after(fn: () => void): void}) {
  const devices = fakeDisplayDevices(t);
  const {Constructor} = runtime(registerDisplay, {tvPsk: "synthetic"}, STORE);
  const before = new Constructor(displayConfig);
  await receive<SendEnvelope>(before, {display: {kind: "intent", requestId: "display-restart", generation: 1, mode: "projector"}});
  await wait(200);
  assert.equal((savedState(before).pending as Record<string, unknown>).operation, "projector_start");
  assert.equal(powerToggles(before), 1);
  await close(before);
  return {Constructor, before, devices};
}

test("display adapter recovers a projector start that timed out during a restart", async (t) => {
  // dev-review repro: the projector warmed up while Node-RED was down.
  const {Constructor, before, devices} = await displayStartingProjector(t);
  const state = savedState(before);
  before.context().set("state", {
    ...state,
    // Downtime longer than the warm-up: its deadline and minimum have passed.
    pending: {...(state.pending as Record<string, unknown>), deadlineAt: Date.now() - 1000, nextAt: Date.now() - 1000, readyAt: Date.now() - 1000}
  });
  devices.watts = 300;

  const after = new Constructor(displayConfig);
  t.after(() => close(after));
  await wait(300);
  assert.equal(savedState(after).failure, null);
  await receive<SendEnvelope>(after, {display: {kind: "startup"}});
  await wait(300);
  const recovered = savedState(after);
  assert.equal(recovered.phase, "ready");
  assert.equal(recovered.failure, null);
  assert.equal(recovered.blockedGeneration, null);
  assert.equal(powerToggles(after), 0);
  assert.equal(traces(after).some((entry) => entry.outcome === "failed"), false);
});

test("display adapter redeploy during warm-up never toggles the projector again", async (t) => {
  // dev-review: a startup during warm-up used to re-issue the start toggle,
  // switching the warming projector off. The start in flight is now kept.
  const {Constructor, devices} = await displayStartingProjector(t);
  devices.watts = 5;

  const after = new Constructor(displayConfig);
  t.after(() => close(after));
  await wait(300);
  assert.equal(powerToggles(after), 0);
  await receive<SendEnvelope>(after, {display: {kind: "startup"}});
  await wait(300);
  assert.equal(powerToggles(after), 0);
  assert.equal((savedState(after).pending as Record<string, unknown>).operation, "projector_start");
});

test("AVR adapter recovers a source change whose retries ran out during a restart", async (t) => {
  const {Constructor} = runtime(registerAvr, {}, STORE);
  const avrConfig = {area: "lounge", sources: "{\"shield\":\"SAT/CBL\",\"playstation\":\"GAME\"}", retryMs: 1000, maxAttempts: 3};
  const before = new Constructor(avrConfig);
  await receive<SendEnvelope>(before, {avr: {kind: "observed", line: "PWON\rZMON\rSISAT/CBL\rMV31\r"}});
  await receive<SendEnvelope>(before, {avr: {kind: "intent", requestId: "avr-restart", generation: 1, power: "on", source: "playstation"}});
  await close(before);
  const state = savedState(before);
  before.context().set("state", {
    ...state,
    pending: {...(state.pending as Record<string, unknown>), attempt: 3, deadlineAt: Date.now() - 1000}
  });

  const after = new Constructor(avrConfig);
  t.after(() => close(after));
  await wait(50);
  await receive<SendEnvelope>(after, {avr: {kind: "startup"}});
  await receive<SendEnvelope>(after, {avr: {kind: "observed", line: "PWON\rZMON\rSIGAME\rMV31\r"}});
  const recovered = savedState(after);
  assert.equal(recovered.phase, "ready");
  assert.equal(recovered.blockedGeneration, null);
  assert.equal(traces(after).some((entry) => entry.outcome === "failed"), false);
  const statuses = (after.sent as SendEnvelope[]).flatMap((envelope) => envelope[1] ?? [])
    .map((message) => message.theatre?.status);
  assert.equal(statuses.includes("failed"), false);
});

test("a flow startup after the construction startup changes nothing but repeats discovery", () => {
  // Same clock for both, so a harmless second startup reproduces the first exactly.
  const now = new Date("2026-11-21T10:00:00Z");
  const later = new Date("2026-11-21T10:05:00Z");
  const twice = (
    name: string,
    transition: (saved: unknown, msg: Record<string, unknown>, config: unknown, at: Date) => {state: unknown; commands: unknown; events: unknown},
    key: string,
    config: unknown,
    intent: Record<string, unknown>
  ) => {
    const pending = transition(undefined, {[key]: {kind: "intent", requestId: name, generation: 1, ...intent}}, config, now).state;
    const first = transition(pending, {[key]: {kind: "startup"}}, config, later);
    const second = transition(first.state, {[key]: {kind: "startup"}}, config, later);
    assert.deepEqual(second.state, first.state, name);
    assert.deepEqual(second.commands, first.commands, name);
    assert.deepEqual(second.events, first.events, name);
  };
  type Loose = Parameters<typeof twice>[1];
  twice("activity", transitionActivityLighting as unknown as Loose, "activityLighting", {
    profiles: {tv: {targets: ["wall"], values: {brightnessPct: 25}}}, confirmationTimeoutMs: 15000, maxAttempts: 2
  }, {profile: "tv"});
  twice("backlighting", transitionBacklighting as unknown as Loose, "backlighting", {
    pollMs: 2000, confirmationTimeoutMs: 15000, maxAttempts: 2
  }, {power: "on"});
  twice("source", transitionSource as unknown as Loose, "sourceCapability", {
    sources: {streamer: {activation: "command", deactivation: "command", confirmation: "active"}},
    pollMs: 2000, confirmationTimeoutMs: 15000, maxAttempts: 2
  }, {sourceId: "streamer", action: "activate"});
  twice("avr", transitionAvr as unknown as Loose, "avr", {
    area: "lounge", sources: {shield: "SAT/CBL", playstation: "GAME"}, retryMs: 1000, maxAttempts: 3, minVolumeDb: -80, maxVolumeDb: -20
  }, {power: "on", source: "playstation"});
  twice("display", transitionDisplay as unknown as Loose, "display", {
    screenOpenPosition: 82, screenTolerance: 2, pollMs: 1000, queryTimeoutMs: 1000, tvTimeoutMs: 4000,
    screenTimeoutMs: 5000, projectorWarmupMs: 4000, projectorMinimumWarmupMs: 3000, projectorShutdownConfirmMs: 2000,
    projectorCooldownMs: 5000, maxAttempts: 2, projectorOnWatts: 20, projectorOffWatts: 10, projectorPowerFallback: false
  }, {mode: "projector"});
});

test("wired contract and activity controller never lose a request to a recovery generation", async (t) => {
  // Wired as in examples/Home theatre activity.json: contract output 1 to the
  // controller, controller output 2 back to the contract. The user's request
  // reaches the contract before the controller's recovery snapshot does.
  const profiles = JSON.stringify({
    off: {display: {mode: "off"}, avr: {power: "off"}, source: {action: "deactivate", readiness: "optional"}, lighting: {profile: "off"}, backlighting: {power: "off"}},
    tv: {display: {mode: "tv"}, avr: {power: "on", source: "shield"}, source: {action: "activate", sourceId: "streamer", readiness: "required"}, lighting: {profile: "tv"}, backlighting: {power: "on"}}
  });
  const contract = new (runtime(registerTheatreStateContract).Constructor)({
    area: "room", displayName: "Room", baseTopic: "home/room/theatre", discoveryPrefix: "homeassistant", activities: "[\"off\",\"tv\"]"
  });
  const controller = new (runtime(registerTheatreActivity).Constructor)({
    area: "room", freshnessMs: 30000, activityProfiles: profiles
  });
  t.after(() => close(contract));
  t.after(() => close(controller));
  const output = (envelopes: SendEnvelope[], index: number) => envelopes.flatMap((envelope) => envelope[index] ?? []);

  await receive<SendEnvelope>(controller, {theatre: {kind: "startup"}});
  const recovery = await receive<SendEnvelope>(controller, {theatre: {kind: "recover", reason: "startup", observations: {}}});
  const snapshots = output(recovery, 1);

  // Two back-to-back requests reach the contract before any snapshot does.
  const first = await receive<SendEnvelope>(contract, {topic: "home/room/theatre/request", payload: {requestId: "user-request-1", activity: "tv"}});
  const second = await receive<SendEnvelope>(contract, {topic: "home/room/theatre/request", payload: {requestId: "user-request-2", activity: "off"}});
  const intents = [...output(first, 0), ...output(second, 0)];
  assert.equal(intents.length, 2);
  const states: Array<Record<string, unknown>> = [];
  for (const intent of intents) {
    const answer = await receive<SendEnvelope>(controller, intent as Record<string, unknown>);
    assert.equal(output(answer, 1).some((message) => message.theatre?.kind === "rejected"), false);
    states.push(...output(answer, 1) as Array<Record<string, unknown>>);
  }
  const state = controller.context().get("state") as {desired: {requestId: string; activity: string; generation: number}};
  assert.equal(state.desired.requestId, "user-request-2");
  assert.equal(state.desired.activity, "off");

  // The late recovery snapshots and the new states then reach the contract in order.
  for (const message of [...snapshots, ...states]) await receive<SendEnvelope>(contract, message as Record<string, unknown>);
  const contractState = contract.context().get("state") as {generation: number};
  assert.equal(contractState.generation, state.desired.generation);
});

test("AVR adapter rejects a configuration the reducer would reject, at deploy", () => {
  for (const [label, overrides, reason] of [
    ["lowercase source code", {sources: "{\"shield\":\"sat/cbl\"}"}, /Denon source codes/],
    ["minimum volume above maximum", {minVolumeDb: -10, maxVolumeDb: -20}, /volume bounds/]
  ] as const) {
    const {Constructor} = runtime(registerAvr);
    const node = new Constructor({
      area: "lounge",
      sources: "{\"shield\":\"SAT/CBL\"}",
      retryMs: 2000,
      maxAttempts: 3,
      ...overrides
    });
    const status = node.statuses.at(-1) as {fill?: string; text?: string} | undefined;
    assert.equal(status?.fill, "red", label);
    assert.equal(status?.text, "invalid configuration", label);
    assert.match(String(node.errors[0]), /^invalid configuration: /, label);
    assert.match(String(node.errors[0]), reason, label);
    // Inert: no input handler was registered.
    assert.equal(node.emit("input", {avr: {kind: "startup"}}, () => {}, () => {}), false, label);
  }
});

test("the circadian lighting policy rejects an unusable wake and bed schedule at deploy", () => {
  for (const [label, times, reason] of [
    ["not a time", {wakeTime: "7am", bedTime: "23:00"}, /HH:MM/],
    ["a blank wake time is an error", {wakeTime: "", bedTime: "07:00"}, /wake time is required/],
    ["the same time", {wakeTime: "07:00", bedTime: "07:00"}, /differ/]
  ] as const) {
    const {Constructor} = runtime(registerCircadian);
    const node = new Constructor({...times});
    const status = node.statuses.at(-1) as {fill?: string; text?: string} | undefined;
    assert.equal(status?.fill, "red", label);
    assert.equal(status?.text, "invalid configuration", label);
    assert.match(String(node.errors[0]), /^invalid configuration: /, label);
    assert.match(String(node.errors[0]), reason, label);
  }
});

test("the example theatre flow reaches ready with no translation and stays ready through refreshes", async (t) => {
  t.mock.timers.enable({apis: ["setTimeout", "setInterval", "Date"], now: Date.parse("2026-11-23T20:00:00Z")});
  const flow = JSON.parse(readFileSync(resolve(__dirname, "../../examples/Home theatre activity.json"), "utf8")) as
    Array<Record<string, unknown> & {id: string; type: string; name?: string; wires?: string[][]}>;
  const registers: Record<string, NodeInitializer> = {
    "home-theatre-state-contract": registerTheatreStateContract,
    "home-theatre-activity-controller": registerTheatreActivity,
    "home-display-mode-controller": registerDisplay,
    "home-avr-controller": registerAvr,
    "home-source-capability-controller": registerSource,
    "home-activity-lighting-controller": registerActivityLighting,
    "home-backlighting-controller": registerBacklighting,
    "home-room-lighting-controller": registerRoom,
    "home-z2m-light": registerZ2mLight
  };

  // The devices behind the controllers. The display controller reaches its
  // devices itself, so they answer its HTTP calls.
  const devices = {tv: "standby", screen: 0, projectorWatts: 0, avr: {PW: "STANDBY", ZM: "OFF", SI: "GAME", MV: "30"},
    source: {status: "inactive", changedAt: ""}, backlighting: "off"};
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    const href = String(url);
    const body = init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : {};
    let answer: unknown = {};
    if (href.endsWith("/sony/system")) {
      if (body.method === "getPowerStatus") answer = {result: [{status: devices.tv === "on" ? "active" : "standby"}]};
      else {
        devices.tv = (body.params as Array<{status: boolean}>)[0]!.status ? "on" : "standby";
        answer = {result: []};
      }
    } else if (href.includes("Cover.GetStatus")) answer = {current_pos: devices.screen, state: "stopped"};
    else if (href.includes("Cover.GoToPosition")) devices.screen = Number(body.pos);
    else if (href.includes("Switch.GetStatus")) answer = {apower: devices.projectorWatts};
    return new Response(JSON.stringify(answer), {status: 200, headers: {"content-type": "application/json"}});
  }) as typeof fetch;
  t.after(() => {
    globalThis.fetch = realFetch;
  });

  // The example's broker: the contract reads its requests from it, and the light publishes to it.
  const broker = fakeBroker();
  builtNodes.set("example-mqtt-broker", broker);
  const nodes = new Map<string, RuntimeNode>();
  for (const entry of flow) {
    const register = registers[entry.type];
    if (!register) continue;
    // What the example leaves for the user to fill in.
    const config = entry.type === "home-display-mode-controller"
      ? {...entry, tvHost: "tv.example", screenHost: "screen.example", projectorPowerMeterHost: "meter.example"}
      : entry.type === "home-theatre-state-contract"
        ? {...entry, area: "lounge"}
        : entry;
    const node = new (runtime(register, {tvPsk: "example"}).Constructor)(config);
    assert.deepEqual(node.errors, [], entry.type);
    nodes.set(entry.id, node);
    t.after(() => close(node));
  }
  const byId = new Map(flow.map((entry) => [entry.id, entry]));
  const property = (msg: Record<string, unknown>, path: string) =>
    path.split(".").reduce<unknown>((value, key) => (value as Record<string, unknown> | undefined)?.[key], msg);
  const queue: Array<[string, Record<string, unknown>]> = [];
  const refreshes: string[] = [];
  // The topics the state contract publishes on its MQTT output.
  const contractTopics: string[] = [];

  function route(id: string, envelope: unknown) {
    const outputs = Array.isArray(envelope) ? envelope : [envelope];
    outputs.forEach((output, index) => {
      for (const msg of output === null || output === undefined ? [] : Array.isArray(output) ? output : [output]) {
        if (byId.get(id)!.type === "home-theatre-state-contract" && index === 1) contractTopics.push(String((msg as {topic?: unknown}).topic));
        for (const target of byId.get(id)!.wires?.[index] ?? []) queue.push([target, structuredClone(msg)]);
      }
    });
  }

  // The devices answer the commands that reach the example's debug nodes.
  function device(name: string, msg: Record<string, unknown>) {
    const now = new Date().toISOString();
    if (name === "avr commands") {
      for (const query of Buffer.from(msg.payload as Uint8Array).toString("utf8").split("\r").filter(Boolean)) {
        const code = query.slice(0, 2) as keyof typeof devices.avr;
        if (!query.endsWith("?")) devices.avr[code] = query.slice(2);
        queue.push([avrId, {avr: {kind: "observed", line: code + devices.avr[code]}}]);
      }
    } else if (name === "source commands") {
      const command = msg.sourceCommand as {operation: string; generation: number; sourceId: string};
      if (command.operation !== "observe") {
        devices.source = {status: command.operation === "activate" ? "active" : "inactive", changedAt: now};
      }
      // A quiet source: its reading keeps the time it last changed.
      queue.push([sourceId, {sourceCapability: {kind: "observed", generation: command.generation, sourceId: command.sourceId,
        status: devices.source.status, observedAt: devices.source.changedAt || now}}]);
    } else if (name === "backlighting commands") {
      const command = msg.backlightingCommand as {operation: string; generation: number; power: string};
      if (command.operation === "set_power") devices.backlighting = command.power;
      queue.push([backlightingId, {backlighting: {kind: "observed", generation: command.generation,
        power: devices.backlighting, observedAt: now}}]);
    }
  }
  const idOf = (type: string) => flow.find((entry) => entry.type === type)!.id;
  const avrId = idOf("home-avr-controller");
  const sourceId = idOf("home-source-capability-controller");
  const backlightingId = idOf("home-backlighting-controller");
  const activityId = idOf("home-theatre-activity-controller");

  async function settle() {
    for (let round = 0; round < 200; round += 1) {
      for (let flush = 0; flush < 5; flush += 1) await new Promise((done) => setImmediate(done));
      for (const [id, node] of nodes) for (const envelope of node.sent.splice(0)) route(id, envelope);
      if (!queue.length) return;
      while (queue.length) {
        const [id, msg] = queue.shift()!;
        const entry = byId.get(id)!;
        const node = nodes.get(id);
        if (node) {
          for (const envelope of await receive<unknown>(node, msg)) route(id, envelope);
        } else if (entry.type === "switch") {
          const rules = entry.rules as Array<{t: string; v: string}>;
          const value = property(msg, String(entry.property));
          const envelope = rules.map((rule) => {
            assert.equal(rule.t, "eq");
            return rule.v === value ? msg : null;
          });
          if (property(msg, "theatreCommand.kind") === "refresh") refreshes.push(String(value));
          route(id, envelope);
        } else if (entry.type === "change") {
          for (const rule of entry.rules as Array<{t: string; p: string; to: string}>) {
            assert.equal(rule.t, "move");
            msg[rule.to] = msg[rule.p];
            delete msg[rule.p];
          }
          route(id, msg);
        } else if (entry.type === "debug") {
          device(String(entry.name), msg);
        } else {
          assert.fail(`unexpected node type ${entry.type}`);
        }
      }
    }
    assert.fail("the flow did not settle");
  }
  const activity = () => nodes.get(activityId)!.context().get("state") as
    {phase: string; currentActivity: string; degraded: Array<{target: string; reason: string}>};

  // The broker connects, and someone asks for the tv activity on the contract's request topic.
  broker.connect();
  await settle();
  broker.deliver("home/lounge/theatre/request", JSON.stringify({requestId: "example-request-1", activity: "tv"}));
  await settle();
  for (let second = 0; second < 180 && activity().phase !== "ready"; second += 1) {
    t.mock.timers.tick(1000);
    await settle();
  }
  assert.equal(activity().phase, "ready", JSON.stringify((nodes.get(activityId)!.context().get("state") as Record<string, unknown>).failure) +
    JSON.stringify((nodes.get(activityId)!.context().get("state") as Record<string, unknown>).targets));
  assert.equal(activity().currentActivity, "tv");

  // Five minutes of refreshes: every required target and the source keep
  // re-confirming, so none of them is reported stale or unanswered, and the
  // contract publishes no state topic again: nothing but times changed (#206).
  for (let second = 0; second < 15; second += 1) {
    t.mock.timers.tick(1000);
    await settle();
  }
  contractTopics.length = 0;
  for (let second = 0; second < 300; second += 1) {
    t.mock.timers.tick(1000);
    await settle();
    assert.equal(activity().phase, "ready", `at ${second} s: ${JSON.stringify(activity().degraded)}`);
  }
  for (const target of ["display", "avr", "source", "backlighting"]) assert.ok(refreshes.includes(target), target);
  assert.deepEqual(contractTopics.filter((topic) => topic.startsWith("home/lounge/theatre/")), []);
  assert.deepEqual(activity().degraded.filter((entry) => entry.target !== "lighting"), []);

  // The example's off activity confirms too: the receiver goes to standby.
  broker.deliver("home/lounge/theatre/request", JSON.stringify({requestId: "example-request-2", activity: "off"}));
  await settle();
  for (let second = 0; second < 180 && activity().currentActivity !== "off"; second += 1) {
    t.mock.timers.tick(1000);
    await settle();
  }
  const offState = nodes.get(activityId)!.context().get("state") as Record<string, unknown>;
  assert.equal(activity().phase, "ready", JSON.stringify(offState.targets));
  assert.equal(activity().currentActivity, "off");
  assert.equal(devices.avr.PW, "STANDBY");
});

test("a zigbee2mqtt group with no state after 30 s says to have Zigbee2MQTT retain it; one that reported doesn't", async (t) => {
  const Light = runtime(registerZ2mLight).Constructor;
  const text = (node: RuntimeNode) => (node.statuses.at(-1) as {text?: string} | undefined)?.text;
  // One that reports at once (its hint timer is a real one, cleared on close).
  const heard = new Light({id: "group-heard", target: "main", baseTopic: "z2m", friendlyName: "hall", group: true});
  t.after(() => close(heard));
  await receive(heard, {topic: "z2m/hall", payload: "{\"state\":\"ON\"}"});
  t.mock.timers.enable({apis: ["setTimeout"]});
  const silent = new Light({id: "group-silent", target: "main", baseTopic: "z2m", friendlyName: "lounge", group: true});
  const single = new Light({id: "single-silent", target: "main", baseTopic: "z2m", friendlyName: "lamp"});
  for (const node of [silent, single]) t.after(() => close(node));
  t.mock.timers.tick(29_000);
  assert.equal(text(silent), "group · waiting for its state");
  t.mock.timers.tick(1_000);
  assert.deepEqual(silent.statuses.at(-1), {fill: "yellow", shape: "ring", text: "group · no state yet: set retain: true for it in Zigbee2MQTT"});
  assert.equal(text(heard), "on");
  assert.equal(text(single), "waiting for the device");
});

test("the example theatre flow, started with nothing saved while the devices show tv, recovers the tv activity and commands nothing", async (t) => {
  t.mock.timers.enable({apis: ["setTimeout", "setInterval", "Date"], now: Date.parse("2026-11-23T20:00:00Z")});
  const flow = JSON.parse(readFileSync(resolve(__dirname, "../../examples/Home theatre activity.json"), "utf8")) as
    Array<Record<string, unknown> & {id: string; type: string; name?: string; wires?: string[][]}>;
  const registers: Record<string, NodeInitializer> = {
    "home-theatre-state-contract": registerTheatreStateContract,
    "home-theatre-activity-controller": registerTheatreActivity,
    "home-display-mode-controller": registerDisplay,
    "home-avr-controller": registerAvr,
    "home-source-capability-controller": registerSource,
    "home-activity-lighting-controller": registerActivityLighting,
    "home-backlighting-controller": registerBacklighting,
    "home-room-lighting-controller": registerRoom,
    "home-z2m-light": registerZ2mLight
  };

  // The devices behind the controllers. The display controller reaches its
  // devices itself, so they answer its HTTP calls.
  // The tv activity, as the devices show it after a restart.
  const devices = {tv: "on", screen: 0, projectorWatts: 0, avr: {PW: "ON", ZM: "ON", SI: "SAT/CBL", MV: "30"},
    source: {status: "active", changedAt: ""}, backlighting: "on"};
  // Anything the flow asks a device to change.
  const changes: string[] = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    const href = String(url);
    const body = init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : {};
    let answer: unknown = {};
    if (href.endsWith("/sony/system")) {
      if (body.method === "getPowerStatus") answer = {result: [{status: devices.tv === "on" ? "active" : "standby"}]};
      else {
        changes.push("tv set power");
        devices.tv = (body.params as Array<{status: boolean}>)[0]!.status ? "on" : "standby";
        answer = {result: []};
      }
    } else if (href.includes("Cover.GetStatus")) answer = {current_pos: devices.screen, state: "stopped"};
    else if (href.includes("Cover.GoToPosition")) {
      changes.push("screen move");
      devices.screen = Number(body.pos);
    }
    else if (href.includes("Switch.GetStatus")) answer = {apower: devices.projectorWatts};
    return new Response(JSON.stringify(answer), {status: 200, headers: {"content-type": "application/json"}});
  }) as typeof fetch;
  t.after(() => {
    globalThis.fetch = realFetch;
  });

  // The example's broker: the contract reads its requests from it, and the light publishes to it.
  const broker = fakeBroker();
  builtNodes.set("example-mqtt-broker", broker);
  const nodes = new Map<string, RuntimeNode>();
  for (const entry of flow) {
    const register = registers[entry.type];
    if (!register) continue;
    // What the example leaves for the user to fill in.
    const config = entry.type === "home-display-mode-controller"
      ? {...entry, tvHost: "tv.example", screenHost: "screen.example", projectorPowerMeterHost: "meter.example"}
      : entry.type === "home-theatre-state-contract"
        ? {...entry, area: "lounge"}
        : entry;
    const node = new (runtime(register, {tvPsk: "example"}).Constructor)(config);
    assert.deepEqual(node.errors, [], entry.type);
    nodes.set(entry.id, node);
    t.after(() => close(node));
  }
  const byId = new Map(flow.map((entry) => [entry.id, entry]));
  const property = (msg: Record<string, unknown>, path: string) =>
    path.split(".").reduce<unknown>((value, key) => (value as Record<string, unknown> | undefined)?.[key], msg);
  const queue: Array<[string, Record<string, unknown>]> = [];
  const refreshes: string[] = [];
  // The topics the state contract publishes on its MQTT output.
  const contractTopics: string[] = [];

  function route(id: string, envelope: unknown) {
    const outputs = Array.isArray(envelope) ? envelope : [envelope];
    outputs.forEach((output, index) => {
      for (const msg of output === null || output === undefined ? [] : Array.isArray(output) ? output : [output]) {
        if (byId.get(id)!.type === "home-theatre-state-contract" && index === 1) contractTopics.push(String((msg as {topic?: unknown}).topic));
        for (const target of byId.get(id)!.wires?.[index] ?? []) queue.push([target, structuredClone(msg)]);
      }
    });
  }

  // The devices answer the commands that reach the example's debug nodes.
  function device(name: string, msg: Record<string, unknown>) {
    const now = new Date().toISOString();
    if (name === "avr commands") {
      for (const query of Buffer.from(msg.payload as Uint8Array).toString("utf8").split("\r").filter(Boolean)) {
        const code = query.slice(0, 2) as keyof typeof devices.avr;
        if (!query.endsWith("?")) changes.push(`avr ${query}`);
        if (!query.endsWith("?")) devices.avr[code] = query.slice(2);
        queue.push([avrId, {avr: {kind: "observed", line: code + devices.avr[code]}}]);
      }
    } else if (name === "source commands") {
      const command = msg.sourceCommand as {operation: string; generation: number; sourceId: string};
      if (command.operation !== "observe") {
        changes.push(`source ${command.operation}`);
        devices.source = {status: command.operation === "activate" ? "active" : "inactive", changedAt: now};
      }
      // A quiet source: its reading keeps the time it last changed.
      queue.push([sourceId, {sourceCapability: {kind: "observed", generation: command.generation, sourceId: command.sourceId,
        status: devices.source.status, observedAt: devices.source.changedAt || now}}]);
    } else if (name === "backlighting commands") {
      const command = msg.backlightingCommand as {operation: string; generation: number; power: string};
      if (command.operation === "set_power") changes.push(`backlighting ${command.power}`);
      if (command.operation === "set_power") devices.backlighting = command.power;
      queue.push([backlightingId, {backlighting: {kind: "observed", generation: command.generation,
        power: devices.backlighting, observedAt: now}}]);
    }
  }
  const idOf = (type: string) => flow.find((entry) => entry.type === type)!.id;
  const avrId = idOf("home-avr-controller");
  const sourceId = idOf("home-source-capability-controller");
  const backlightingId = idOf("home-backlighting-controller");
  const activityId = idOf("home-theatre-activity-controller");

  async function settle() {
    for (let round = 0; round < 200; round += 1) {
      for (let flush = 0; flush < 5; flush += 1) await new Promise((done) => setImmediate(done));
      for (const [id, node] of nodes) for (const envelope of node.sent.splice(0)) route(id, envelope);
      if (!queue.length) return;
      while (queue.length) {
        const [id, msg] = queue.shift()!;
        const entry = byId.get(id)!;
        const node = nodes.get(id);
        if (node) {
          for (const envelope of await receive<unknown>(node, msg)) route(id, envelope);
        } else if (entry.type === "switch") {
          const rules = entry.rules as Array<{t: string; v: string}>;
          const value = property(msg, String(entry.property));
          const envelope = rules.map((rule) => {
            assert.equal(rule.t, "eq");
            return rule.v === value ? msg : null;
          });
          if (property(msg, "theatreCommand.kind") === "refresh") refreshes.push(String(value));
          route(id, envelope);
        } else if (entry.type === "change") {
          for (const rule of entry.rules as Array<{t: string; p: string; to: string}>) {
            assert.equal(rule.t, "move");
            msg[rule.to] = msg[rule.p];
            delete msg[rule.p];
          }
          route(id, msg);
        } else if (entry.type === "debug") {
          device(String(entry.name), msg);
        } else {
          assert.fail(`unexpected node type ${entry.type}`);
        }
      }
    }
    assert.fail("the flow did not settle");
  }
  const activity = () => nodes.get(activityId)!.context().get("state") as {phase: string; currentActivity: string; metrics: {recoveriesAdopted: number}};

  // Node-RED starts with nothing saved: the activity controller's startup probes every target.
  queue.push([activityId, {theatre: {kind: "startup"}}]);
  await settle();
  for (let second = 0; second < 60 && activity().phase !== "ready"; second += 1) {
    t.mock.timers.tick(1000);
    await settle();
  }
  assert.deepEqual([activity().phase, activity().currentActivity, activity().metrics.recoveriesAdopted], ["ready", "tv", 1]);
  assert.deepEqual(changes, [], "nothing commanded");
});

test("a WLED node and a backlighting controller, through a broker: on, read back from WLED, and a change made elsewhere", async (t) => {
  const broker = fakeBroker();
  builtNodes.set("broker-wled", broker);
  const wled = new (runtime(registerWled).Constructor)({id: "wled-strip", deviceTopic: "home/test/light/strip", broker: "broker-wled"});
  const backlight = new (runtime(registerBacklighting).Constructor)({id: "backlight", area: ""});
  for (const node of [wled, backlight]) t.after(() => close(node));
  assert.deepEqual([wled.errors, backlight.errors], [[], []]);
  assert.deepEqual([...broker.subscriptions.keys()].sort(), ["home/test/light/strip/g", "home/test/light/strip/status"]);
  broker.connect();
  // The controller's commands to WLED, and WLED's readings back, as wired.
  const run = async (node: RuntimeNode, msg: Record<string, unknown>) => {
    for (const envelope of await receive<unknown>(node, msg)) {
      const outputs = (Array.isArray(envelope) ? envelope : [envelope]) as unknown[];
      const port = outputs[0];
      for (const out of port === null || port === undefined ? [] : Array.isArray(port) ? port : [port]) {
        await run(node === backlight ? wled : backlight, out as Record<string, unknown>);
      }
    }
  };
  await run(backlight, {backlighting: {kind: "intent", requestId: "on-1", generation: 1, power: "on"}});
  assert.deepEqual(broker.published.map(({topic, payload}) => [topic, payload]), [["home/test/light/strip", "ON"]]);
  // WLED reports its brightness: the controller is ready.
  wled.sent.length = 0;
  broker.deliver("home/test/light/strip/g", "128");
  for (const envelope of wled.sent.splice(0) as unknown[][]) {
    for (const msg of envelope[0] as Array<Record<string, unknown>>) await run(backlight, msg);
  }
  assert.equal((backlight.context().get("state") as {phase: string}).phase, "ready");
  // Switched off from WLED's own app: a manual change.
  broker.deliver("home/test/light/strip/g", "0");
  for (const envelope of wled.sent.splice(0) as unknown[][]) {
    for (const msg of envelope[0] as Array<Record<string, unknown>>) await run(backlight, msg);
  }
  assert.equal((backlight.context().get("state") as {phase: string}).phase, "manual_override");
  // No broker: an invalid configuration.
  const lonely = new (runtime(registerWled).Constructor)({id: "wled-lonely", deviceTopic: "home/test/light/other"});
  t.after(() => close(lonely));
  assert.match(String(lonely.errors[0]), /choose its MQTT broker/);
});

test("a zigbee2mqtt sensor through a broker: occupancy fusion hears its motion, the motion policy its light level", async (t) => {
  const broker = fakeBroker();
  builtNodes.set("broker-sensor", broker);
  const sensor = new (runtime(registerZ2mSensor).Constructor)({id: "hall-sensor", baseTopic: "z2m", friendlyName: "hall/motion", broker: "broker-sensor"});
  const fusion = new (runtime(registerOccupancy).Constructor)({id: "hall-fusion", area: "", presenceMode: "none"});
  for (const node of [sensor, fusion]) t.after(() => close(node));
  assert.deepEqual([sensor.errors, fusion.errors], [[], []]);
  assert.deepEqual([...broker.subscriptions.keys()].sort(), ["z2m/hall/motion", "z2m/hall/motion/availability"]);
  broker.connect();
  assert.deepEqual(broker.published, [], "nothing to read on connect");
  // A retained report after a restart: no motion passed on.
  broker.deliver("z2m/hall/motion", "{\"occupancy\":true,\"illuminance\":8}", true);
  const first = sensor.sent.splice(0) as Array<Array<Array<Record<string, unknown>> | null>>;
  assert.deepEqual(first.map(([occupancy, light]) => [occupancy, light]), [[null, [{source: "illuminance", payload: 8}]]]);
  // Someone walks in: fusion goes occupied.
  broker.deliver("z2m/hall/motion", "{\"occupancy\":true,\"illuminance\":8}");
  const sent = sensor.sent.splice(0) as Array<Array<Array<Record<string, unknown>> | null>>;
  for (const msg of sent[0]?.[0] ?? []) await receive(fusion, msg);
  assert.equal((fusion.context().get("state") as {occupied: boolean}).occupied, true);
  broker.deliver("z2m/hall/motion/availability", "{\"state\":\"offline\"}");
  assert.equal((sensor.statuses.at(-1) as {text: string}).text, "offline");
  const lonely = new (runtime(registerZ2mSensor).Constructor)({id: "sensor-lonely", friendlyName: "x"});
  t.after(() => close(lonely));
  assert.match(String(lonely.errors[0]), /choose its MQTT broker/);
});

test("every adapter shows the same badge for a configuration it cannot use, and logs why", () => {
  // One badge text lets people, and the Node-RED smoke, spot any broken node;
  // the reason goes to node.error.
  const broken: Array<[string, NodeInitializer, Record<string, unknown>, RegExp]> = [
    ["activity lighting", registerActivityLighting, {area: "room", profiles: "{not json"}, /JSON/],
    ["source capability", registerSource, {area: "room", sources: "{not json"}, /JSON/],
    ["theatre activity", registerTheatreActivity, {area: "room", activityProfiles: "{not json"}, /JSON/],
    ["theatre state contract", registerTheatreStateContract, {area: "room", activities: "{not json"}, /./],
    ["display", registerDisplay, {area: "room", tvHost: "", screenHost: "", projectorPowerMeterHost: ""}, /TV host is required/],
    ["motion", registerMotion, {area: "room", onTargets: "[1]"}, /targets/],
    ["switch", registerSwitch, {area: "room", targets: "{not json"}, /JSON|targets/]
  ];
  for (const [name, register, config, reason] of broken) {
    const node = new (runtime(register).Constructor)(config);
    assert.deepEqual(node.statuses.at(-1), {fill: "red", shape: "ring", text: "invalid configuration"}, name);
    assert.equal(node.errors.length, 1, name);
    assert.match(String(node.errors[0]), /^invalid configuration: /, name);
    assert.match(String(node.errors[0]), reason, name);
  }
});

test("an emptied or non-numeric number setting is an invalid configuration that names the setting", () => {
  // One node per family; the setting is otherwise valid config for that node.
  const cases: Array<[string, NodeInitializer, Record<string, unknown>, string]> = [
    ["receiver", registerAvr, {area: "a", sources: "{}", retryMs: ""}, "retry interval"],
    ["display", registerDisplay, {area: "a", tvHost: "tv", screenHost: "s", projectorPowerMeterHost: "m", tvTimeoutMs: "  "}, "TV timeout"],
    ["source", registerSource, {area: "a", sources: "{\"streamer\":{\"activation\":\"command\",\"deactivation\":\"command\",\"confirmation\":\"active\"}}", pollMs: "abc"}, "poll interval"],
    ["backlighting", registerBacklighting, {area: "a", maxAttempts: ""}, "max attempts"],
    ["activity lighting", registerActivityLighting, {area: "a", profiles: "{\"off\":{\"targets\":[],\"values\":{}}}", confirmationTimeoutMs: ""}, "confirmation timeout"],
    ["room", registerRoom, {area: "a", targets: "[]", initialTransitionSeconds: ""}, "initial transition"],
    ["circadian", registerCircadian, {refreshSeconds: ""}, "restyle interval"],
    ["motion", registerMotion, {area: "a", onTargets: "[\"main\"]", defaultDelaySeconds: "abc"}, "vacancy delay"],
    ["switch", registerSwitch, {area: "a", targets: "[\"main\"]", switchWindowMs: ""}, "switch window"],
    ["theatre activity", registerTheatreActivity, {area: "a", freshnessMs: "", activityProfiles: JSON.stringify({
      off: {display: {mode: "off"}, avr: {power: "standby"}, source: {action: "deactivate", readiness: "optional"}, lighting: {profile: "off"}, backlighting: {power: "off"}}
    })}, "freshness"],
    ["theatre state contract", registerTheatreStateContract, {area: "a", activities: "[\"off\"]", sloWindowSize: ""}, "SLO window"]
  ];
  for (const [name, register, config, label] of cases) {
    const node = new (runtime(register, {tvPsk: "key"}).Constructor)(config);
    assert.deepEqual(node.statuses.at(-1), {fill: "red", shape: "ring", text: "invalid configuration"}, name);
    assert.deepEqual(node.errors.map(String), [`invalid configuration: ${label} must be a number`], name);
  }
});

test("a number setting absent from an older saved flow takes its default; a typed 0 is kept", async (t) => {
  const node = new (runtime(registerMotion).Constructor)({area: "hall", onTargets: "[\"main\"]", defaultIlluminanceCutoff: "0"});
  t.after(() => close(node));
  assert.deepEqual(node.errors, []);
  await receive(node, {source: "motion", payload: true});
  const state = node.context().get("state") as {delaySeconds: number; illuminanceCutoff: number};
  assert.equal(state.delaySeconds, 120, "absent: the default");
  assert.equal(state.illuminanceCutoff, 0, "typed 0 is kept");
});

test("the theatre contract requires an area: its topics and Home Assistant IDs are built from it", () => {
  for (const [name, register] of [["theatre state contract", registerTheatreStateContract]] as const) {
    for (const area of [undefined, "", "  "]) {
      const node = new (runtime(register).Constructor)(area === undefined ? {} : {area});
      assert.deepEqual(node.statuses.at(-1), {fill: "red", shape: "ring", text: "invalid configuration"}, `${name} ${JSON.stringify(area)}`);
      assert.deepEqual(node.errors.map(String), ["invalid configuration: area is required"], name);
    }
  }
});

test("every other node runs with no area, and reports none instead of a made-up one", async (t) => {
  const backlighting = new (runtime(registerBacklighting).Constructor)({});
  t.after(() => close(backlighting));
  assert.deepEqual(backlighting.errors, []);
  await receive(backlighting, {backlighting: {kind: "intent", requestId: "r1", generation: 1, power: "on"}});
  assert.equal(traces(backlighting).at(-1)?.area, "");

  const receiver = new (runtime(registerAvr).Constructor)({sources: "{\"shield\":\"SAT/CBL\"}"});
  t.after(() => close(receiver));
  assert.deepEqual(receiver.errors, []);
  const sent = await receive<SendEnvelope>(receiver, {avr: {kind: "intent", requestId: "r1", generation: 1, power: "on"}});
  const events = sent.flatMap((envelope) => envelope[1] ?? []);
  assert.ok(events.length > 0);
  for (const event of events as Array<{avr?: {area?: string}}>) if (event.avr) assert.equal(event.avr.area, "");

  const theatre = new (runtime(registerTheatreActivity).Constructor)({activityProfiles: JSON.stringify({
    off: {display: {mode: "off"}, avr: {power: "standby"}, source: {action: "deactivate", readiness: "optional"}, lighting: {profile: "off"}, backlighting: {power: "off"}}
  })});
  t.after(() => close(theatre));
  assert.deepEqual(theatre.errors, []);
  const state = await receive<SendEnvelope>(theatre, {theatre: {kind: "intent", requestId: "r1", generation: 1, activity: "off"}});
  const snapshot = state.flatMap((envelope) => envelope[1] ?? []).find((message) => message.theatre?.kind === "state");
  assert.equal(snapshot?.theatre?.area, "");

  // The rest may reject {} for other settings, but never for the area. A node
  // that rejected its configuration started nothing, so only started ones close.
  for (const register of [registerActivityLighting, registerDisplay, registerMotion, registerSwitch, registerOccupancy, registerSource]) {
    const node = new (runtime(register).Constructor)({});
    // Occupancy keeps no timers and registers no close handler.
    if (node.errors.length === 0 && register !== registerOccupancy) t.after(() => close(node));
    assert.equal(node.errors.some((error) => /area/.test(String(error))), false);
  }
});

test("a room controller with publishing off and no area still commands its lights, and publishes nothing else", async (t) => {
  const node = new (runtime(registerRoom).Constructor)({
    publishState: false,
    discovery: false,
    targets: "[{\"id\":\"main\"}]"
  });
  t.after(() => close(node));
  assert.deepEqual(node.errors, []);
  const startup = await receive<Array<Array<{topic?: string}>>>(node, {lighting: {kind: "startup"}});
  const on = await receive<Array<Array<{topic?: string; payload?: Record<string, unknown>}>>>(node, {
    lighting: {kind: "intent", targets: ["main"], state: "ON", source: "motion"}
  });
  const circadian = await receive<Array<Array<{topic?: string}>>>(node, {lighting: {kind: "circadian", enabled: false}});
  // Nothing on output 1 (publications); its light's command and reading request on output 2, for its adapter.
  const outputs = (sent: unknown[], port: number) => sent.flatMap((envelope) => (envelope as Array<unknown[] | null>)[port] ?? []);
  assert.deepEqual([...startup, ...on, ...circadian].flatMap((envelope) => outputs([envelope], 0)), [], "nothing published");
  assert.deepEqual(outputs(startup, 1), [{payload: undefined, light: {kind: "observe", target: "main"}}]);
  assert.deepEqual((outputs(on, 1) as Array<{light: {kind: string; target: string; state: string}}>).map(({light}) => [light.kind, light.target, light.state]),
    [["command", "main", "ON"]]);
});

test("publish settings: the area is required only when something named after it is published", async (t) => {
  const room = runtime(registerRoom).Constructor;
  const targets = "[{\"id\":\"main\"}]";
  // A saved flow from before the settings: both count as on, so it needs an area.
  for (const settings of [{}, {publishState: true, discovery: false}, {publishState: false, discovery: true}]) {
    const node = new room({targets, ...settings});
    assert.deepEqual(node.errors.map(String), ["invalid configuration: area is required"], JSON.stringify(settings));
  }
  const quiet = new room({targets, publishState: false, discovery: false});
  t.after(() => close(quiet));
  assert.deepEqual(quiet.errors, []);
  const legacy = new room({targets, area: "hall"});
  t.after(() => close(legacy));
  const startup = await receive<Array<Array<{topic?: string}>>>(legacy, {lighting: {kind: "startup"}});
  assert.ok(startup.flat(2).some((message) => message.topic === "homeassistant/switch/hall_circadian_lighting/config"),
    "an older saved flow keeps publishing discovery");

  const contract = runtime(registerTheatreStateContract).Constructor;
  const base = {activities: "[\"off\"]"};
  for (const settings of [{}, {discovery: true, baseTopic: "media/theatre"}, {discovery: false}]) {
    const node = new contract({...base, ...settings});
    assert.deepEqual(node.errors.map(String), ["invalid configuration: area is required"], JSON.stringify(settings));
  }
  const topicOnly = new contract({...base, discovery: false, baseTopic: "media/theatre"});
  assert.deepEqual(topicOnly.errors, []);
  const cleared = await receive<Array<Array<{topic?: string; payload?: unknown}>>>(new contract({...base, area: "hall", discovery: "false"}), {theatreStateContract: {kind: "startup"}});
  const clearedMessages = cleared.flat(2).filter((message) => message !== null);
  const discoveryMessages = clearedMessages.filter((message) => message.topic !== "home/hall/theatre/availability");
  assert.ok(discoveryMessages.length > 0 && discoveryMessages.every((message) => message.payload === ""), "discovery off clears its entries");
});

test("publish settings: null and a missing field mean on; only false means off", async (t) => {
  const room = runtime(registerRoom).Constructor;
  const targets = "[{\"id\":\"main\"}]";
  const discoveryOf = async (settings: Record<string, unknown>) => {
    const node = new room({targets, area: "hall", ...settings});
    t.after(() => close(node));
    assert.deepEqual(node.errors, []);
    const startup = await receive<Array<Array<{topic?: string; payload?: unknown} | null>>>(node, {lighting: {kind: "startup"}});
    const entry = startup.flat(2).find((message) => message?.topic === "homeassistant/sensor/hall_main_control/config");
    return entry ? (typeof entry.payload === "object" ? "published" : "cleared") : "none";
  };
  assert.equal(await discoveryOf({publishState: null, discovery: null}), "published", "null (the editor's not-set) is on");
  assert.equal(await discoveryOf({}), "published", "an old flow without the fields is on");
  assert.equal(await discoveryOf({publishState: true, discovery: false}), "cleared", "false (what onadd sets) is off");
  assert.equal(await discoveryOf({publishState: true, discovery: "false"}), "cleared");
  // An empty string is not "not set": it's an invalid configuration.
  const emptied = new room({targets, area: "hall", publishState: "", discovery: ""});
  assert.deepEqual(emptied.errors.map(String), ["invalid configuration: publish state must be on or off"]);
});

test("an emptied JSON or text setting is an invalid configuration that names the setting", () => {
  const cases: Array<[string, NodeInitializer, Record<string, unknown>, string]> = [
    ["receiver", registerAvr, {sources: ""}, "sources must be valid JSON"],
    ["display", registerDisplay, {tvHost: "tv", screenHost: " ", projectorPowerMeterHost: "m"}, "screen host is required"],
    ["source", registerSource, {sources: "{broken"}, "sources must be valid JSON"],
    ["activity lighting", registerActivityLighting, {profiles: "{\"off\":{\"targets\":[],\"values\":{}}}", owner: ""}, "owner is required"],
    ["room", registerRoom, {targets: "", publishState: false, discovery: false}, "targets must be valid JSON"],
    ["motion", registerMotion, {onTargets: "[\"main\"]", offTargets: ""}, "off targets must be valid JSON"],
    ["switch", registerSwitch, {targets: ""}, "targets must be valid JSON"],
    ["occupancy", registerOccupancy, {presenceMode: "always"}, "presence sensor must be none or hold"],
    ["theatre activity", registerTheatreActivity, {activityProfiles: ""}, "activity profiles must be valid JSON"],
    ["theatre state contract", registerTheatreStateContract, {area: "a", activities: "[\"off\"]", discoveryPrefix: ""}, "discovery prefix is required"]
  ];
  for (const [name, register, config, reason] of cases) {
    const node = new (runtime(register, {tvPsk: "key"}).Constructor)(config);
    assert.deepEqual(node.statuses.at(-1), {fill: "red", shape: "ring", text: "invalid configuration"}, name);
    assert.deepEqual(node.errors.map(String), [`invalid configuration: ${reason}`], name);
  }
});

test("the display's projector fallback reads \"true\" as on", async (t) => {
  const node = new (runtime(registerDisplay, {tvPsk: "key"}).Constructor)({tvHost: "tv", screenHost: "s", projectorPowerMeterHost: "m", projectorPowerFallback: "true"});
  t.after(() => close(node));
  assert.deepEqual(node.errors, []);
  assert.equal(normaliseDisplayConfig({projectorPowerFallback: "true"}).projectorPowerFallback, true);
  assert.equal(normaliseDisplayConfig({projectorPowerFallback: "false"}).projectorPowerFallback, false);
  assert.throws(() => normaliseDisplayConfig({projectorPowerFallback: "maybe"}), /projector power fallback must be on or off/);
});

test("discovery basics: the room checks a publishing area and uses its discovery prefix", async (t) => {
  const room = runtime(registerRoom).Constructor;
  const targets = "[{\"id\":\"main\"}]";
  for (const settings of [{publishState: true, discovery: false}, {publishState: false, discovery: true}]) {
    const node = new room({targets, area: "!!!", ...settings});
    assert.deepEqual(node.errors.map(String), ["invalid configuration: area must contain a letter or digit"], JSON.stringify(settings));
  }
  const contract = new (runtime(registerTheatreStateContract).Constructor)({area: "!!!", activities: "[\"off\"]"});
  assert.deepEqual(contract.errors.map(String), ["invalid configuration: area must contain a letter or digit"]);
  const emptiedPrefix = new room({targets, area: "hall", discoveryPrefix: " "});
  assert.deepEqual(emptiedPrefix.errors.map(String), ["invalid configuration: discovery prefix is required"]);

  // A room that publishes nothing may use any label.
  const quiet = new room({targets, area: "Living Room", publishState: false, discovery: false});
  t.after(() => close(quiet));
  assert.deepEqual(quiet.errors, []);

  const prefixed = new room({targets, area: "hall", discoveryPrefix: "ha", publishState: true, discovery: true});
  t.after(() => close(prefixed));
  const startup = await receive<Array<Array<{topic?: string; payload?: Record<string, unknown>} | null>>>(prefixed, {lighting: {kind: "startup"}});
  const entry = startup.flat(2).find((message) => message?.topic === "ha/sensor/hall_main_control/config");
  assert.equal((entry?.payload?.origin as {name?: string} | undefined)?.name, "@avantics/node-red-home-automation");
});

test("availability: publishing nodes send a retained offline as they stop", async () => {
  const targets = "[{\"id\":\"main\"}]";
  const sentOnClose = async (node: RuntimeNode) => {
    const before = node.sent.length;
    await close(node);
    return node.sent.slice(before);
  };
  const room = runtime(registerRoom).Constructor;
  assert.deepEqual(await sentOnClose(new room({targets, area: "hall", publishState: true, discovery: true})),
    [[[{topic: "home/hall/lighting/availability", payload: "offline", retain: true}], null, null]]);
  assert.deepEqual(await sentOnClose(new room({targets, area: "hall", publishState: false, discovery: false})), [],
    "a room that publishes nothing sends nothing");

  const contract = runtime(registerTheatreStateContract).Constructor;
  assert.deepEqual(await sentOnClose(new contract({area: "den", activities: "[\"off\"]", discovery: false})),
    [[null, [{topic: "home/den/theatre/availability", payload: "offline", retain: true}]]]);
});

test("availability: a node redeployed on its own is available again without a startup message", async (t) => {
  const availability = (node: RuntimeNode) => JSON.stringify(node.sent).match(/"topic":"[^"]*\/availability","payload":"(online|offline)"/g) ?? [];
  const targets = "[{\"id\":\"main\"}]";
  const roomRuntime = runtime(registerRoom);
  const roomConfig = {targets, area: "hall", publishState: true, discovery: true};
  const before = new roomRuntime.Constructor(roomConfig);
  await receive(before, {lighting: {kind: "startup"}});
  await close(before);
  assert.match(String(availability(before).at(-1)), /offline/);
  // Node-RED reconstructs the node, then announces the flows started.
  const after = new roomRuntime.Constructor(roomConfig);
  t.after(() => close(after));
  roomRuntime.events.emit("flows:started");
  assert.equal(after.sent.length, 1);
  assert.deepEqual(availability(after), ['"topic":"home/hall/lighting/availability","payload":"online"']);
  roomRuntime.events.emit("flows:started");
  assert.equal(after.sent.length, 1, "once per construction");

  // A different node, so its own context.
  const quiet = new roomRuntime.Constructor({id: "quiet", targets, area: "hall", publishState: false, discovery: false});
  t.after(() => close(quiet));
  const quietRuntime = roomRuntime;
  quietRuntime.events.emit("flows:started");
  assert.deepEqual(quiet.sent, [], "a room that publishes nothing announces nothing");

  const contractRuntime = runtime(registerTheatreStateContract);
  const contract = new contractRuntime.Constructor({area: "lounge", activities: "[\"off\"]"});
  await close(contract);
  const again = new contractRuntime.Constructor({area: "lounge", activities: "[\"off\"]"});
  t.after(() => close(again));
  contractRuntime.events.emit("flows:started");
  assert.equal(again.sent.length, 1);
  const againSent = (again.sent[0] as Array<Array<{topic: string; payload: unknown; retain: boolean}> | null>)[1] ?? [];
  assert.deepEqual(againSent.at(-1), {topic: "home/lounge/theatre/availability", payload: "online", retain: true});
  // A node closed before the flows start announces nothing.
  const closedEarly = new contractRuntime.Constructor({area: "den", activities: "[\"off\"]"});
  await close(closedEarly);
  const sentBefore = closedEarly.sent.length;
  contractRuntime.events.emit("flows:started");
  assert.equal(closedEarly.sent.length, sentBefore);
});

test("ID schemes: a saved node keeps its area-named entities; a new node names them after itself", async (t) => {
  const targets = "[{\"id\":\"main\"}]";
  const room = runtime(registerRoom).Constructor;
  const discoveryOf = async (settings: Record<string, unknown>) => {
    const node = new room({targets, area: "hall", publishState: true, discovery: true, ...settings});
    t.after(() => close(node));
    assert.deepEqual(node.errors, []);
    const startup = await receive<SendEnvelope>(node, {lighting: {kind: "startup"}});
    // The first entry it announces (its old circadian entries come first, cleared).
    const entry = startup.flat(2).find((message) => String(message?.topic).endsWith("/config") && message?.payload !== "");
    const payload = entry?.payload as {unique_id: string; default_entity_id: string; device: {identifiers: string[]}};
    return [entry?.topic, payload.unique_id, payload.default_entity_id, payload.device.identifiers[0]];
  };
  const entityId = ["sensor", "hall_main_control"].join(".");
  assert.deepEqual(await discoveryOf({id: "saved1"}),
    ["homeassistant/sensor/hall_main_control/config", "hall_main_control", entityId, "nodered_hall_lighting"],
    "no idScheme: as every room published before");
  assert.deepEqual(await discoveryOf({id: "saved2", idScheme: null}),
    ["homeassistant/sensor/hall_main_control/config", "hall_main_control", entityId, "nodered_hall_lighting"]);
  assert.deepEqual(await discoveryOf({id: "new1", idScheme: "node"}),
    ["homeassistant/sensor/nrha_new1_main_control/config", "nrha_new1_main_control", entityId, "nrha_new1"],
    "a new node: named after the node, with the same entity ID");
  const junk = new room({targets, area: "hall", idScheme: "random"});
  assert.deepEqual(junk.errors.map(String), ["invalid configuration: ID scheme must be area or node"]);

  const contract = runtime(registerTheatreStateContract).Constructor;
  const theatre = new contract({id: "c9", idScheme: "node", area: "lounge", activities: "[\"off\"]"});
  t.after(() => close(theatre));
  const startup = await receive<SendEnvelope>(theatre, {theatreStateContract: {kind: "startup"}});
  const topics = startup.flat(2).map((message) => String(message?.topic));
  assert.ok(topics.includes("homeassistant/select/nrha_c9_theatre_activity/config"), topics.join());
});

test("ID schemes: after an area change, a node clears the retained topics it no longer publishes", async (t) => {
  const targets = "[{\"id\":\"main\"}]";
  const topicsCleared = async (idScheme: string | null) => {
    const room = runtime(registerRoom, {}, STORE).Constructor;
    const settings = {id: "r1", targets, publishState: true, discovery: true, idScheme};
    const first = new room({...settings, area: "hall"});
    await receive(first, {lighting: {kind: "startup"}});
    await close(first);
    const unchanged = new room({...settings, area: "hall"});
    assert.equal((await receive<SendEnvelope>(unchanged, {lighting: {kind: "startup"}})).length, 1, "nothing changed: no clears");
    await close(unchanged);
    const renamed = new room({...settings, area: "den"});
    t.after(() => close(renamed));
    const startup = await receive<SendEnvelope>(renamed, {lighting: {kind: "startup"}});
    return (startup[0]?.[0] ?? []).map((message) => [message.topic, message.payload]);
  };
  // A new node keeps its discovery topic, which now points at home/den.
  assert.deepEqual(await topicsCleared("node"), [
    ["home/hall/lighting/availability", ""],
    ["home/hall/lighting/main/control", ""]
  ]);
  // A saved node's discovery topic is named after the area, so it moves too
  // and the old entry is cleared, rather than left behind as before.
  assert.deepEqual(await topicsCleared(null), [
    ["homeassistant/sensor/hall_main_control/config", ""],
    ["home/hall/lighting/availability", ""],
    ["home/hall/lighting/main/control", ""]
  ]);
});

test("discovery: a room announces its Home Assistant entries when the flows start, without a startup message, and again after a modified deploy", async (t) => {
  const targets = "[{\"id\":\"main\"}]";
  const roomRuntime = runtime(registerRoom);
  const entries = (sent: unknown[]) => (sent as Array<Array<Array<{topic: string; payload: unknown}>>>)
    .flatMap((envelope) => envelope[0] ?? [])
    .filter(({topic, payload}) => topic.endsWith("/config") && typeof payload === "object" && payload !== null)
    .map(({topic}) => topic);
  // Its control sensor; its circadian entities are the circadian lighting policy's since 6.0.
  const announced = ["homeassistant/sensor/hall_main_control/config"];
  const settings = {targets, area: "hall", publishState: true, discovery: true};
  const first = new roomRuntime.Constructor(settings);
  roomRuntime.events.emit("flows:started");
  const started = first.sent.slice();
  // A modified deploy reconstructs the node, which announces again.
  await close(first);
  assert.deepEqual(entries(started), announced);
  const sent = (started[0] as Array<Array<{topic: string}>>)[0]!.map(({topic}) => topic);
  assert.equal(sent.at(-1), "home/hall/lighting/availability", "the entries come before the room shows as available");

  const modified = new roomRuntime.Constructor({...settings, targets: targets.replace("main", "lamp")});
  t.after(() => close(modified));
  roomRuntime.events.emit("flows:started");
  assert.deepEqual(entries(modified.sent), ["homeassistant/sensor/hall_lamp_control/config"]);

  // The startup message still announces them, as before.
  assert.deepEqual(entries(await receive(modified, {lighting: {kind: "startup"}})),
    ["homeassistant/sensor/hall_lamp_control/config"]);

  // Discovery off: no entries announced.
  const off = new roomRuntime.Constructor({id: "off", ...settings, discovery: false});
  t.after(() => close(off));
  roomRuntime.events.emit("flows:started");
  assert.deepEqual(entries(off.sent), []);
});

test("discovery: a theatre state contract announces its Home Assistant entries when the flows start, without a startup message, and again after a modified deploy", async (t) => {
  const contractRuntime = runtime(registerTheatreStateContract);
  type Publication = {topic: string; payload: unknown};
  const published = (sent: unknown[]) => sent.flatMap((envelope) => (envelope as Array<Publication[] | null>)[1] ?? []);
  const entries = (sent: unknown[]) => published(sent)
    .filter(({topic, payload}) => topic.endsWith("/config") && payload !== "").map(({topic}) => topic);
  const settings = {id: "t1", idScheme: "node", area: "lounge", activities: "[\"off\",\"tv\"]", discovery: true};
  const first = new contractRuntime.Constructor(settings);
  contractRuntime.events.emit("flows:started");
  const started = first.sent.slice();
  // A modified deploy reconstructs the node, which announces again.
  await close(first);
  const announced = entries(started);
  assert.ok(announced.includes("homeassistant/select/nrha_t1_theatre_activity/config"), announced.join());
  assert.equal(published(started).at(-1)?.topic, "home/lounge/theatre/availability", "the entries come before it shows as available");

  const modified = new contractRuntime.Constructor({...settings, activities: "[\"off\",\"tv\",\"projector\"]"});
  t.after(() => close(modified));
  contractRuntime.events.emit("flows:started");
  assert.deepEqual(entries(modified.sent), announced);
  const select = published(modified.sent).find(({topic}) => topic === "homeassistant/select/nrha_t1_theatre_activity/config");
  assert.deepEqual(JSON.parse(String(select?.payload)).options, ["off", "tv", "projector"], "with the new settings");

  // The startup message still announces the same entries, as before.
  assert.deepEqual(entries(await receive(modified, {theatreStateContract: {kind: "startup"}})), announced);

  // Discovery off: no entries announced.
  const off = new contractRuntime.Constructor({...settings, id: "t2", discovery: false});
  t.after(() => close(off));
  contractRuntime.events.emit("flows:started");
  assert.deepEqual(entries(off.sent), []);
});

test("ID schemes: after a redeploy that changes the area, the old topics are cleared once the flows start", async (t) => {
  const targets = "[{\"id\":\"main\"}]";
  const roomRuntime = runtime(registerRoom, {}, STORE);
  const settings = {id: "r5", idScheme: "node", targets, publishState: true, discovery: true};
  const first = new roomRuntime.Constructor({...settings, area: "hall"});
  roomRuntime.events.emit("flows:started");
  await close(first);
  const renamed = new roomRuntime.Constructor({...settings, area: "den"});
  t.after(() => close(renamed));
  // No startup message: the flows starting is enough.
  roomRuntime.events.emit("flows:started");
  const started = renamed.sent as Array<Array<Array<{topic: string; payload: unknown}>>>;
  assert.deepEqual(started[0]?.[0]?.map(({topic, payload}) => [topic, payload]), [
    ["home/hall/lighting/availability", ""],
    ["home/hall/lighting/main/control", ""],
    // The circadian entries it published before 6.0, cleared at every start.
    ["homeassistant/switch/nrha_r5_circadian_lighting/config", ""],
    ["homeassistant/switch/nrha_r5_sleep/config", ""],
    ["homeassistant/time/nrha_r5_wake_time/config", ""],
    ["homeassistant/time/nrha_r5_bed_time/config", ""],
    ["homeassistant/sensor/nrha_r5_main_control/config", "entry"],
    ["home/den/lighting/availability", "online"]
  ].map(([topic, payload]) => [topic, payload === "entry" ? started[0]?.[0]?.find((output) => output.topic === topic)?.payload : payload]));
  assert.equal(typeof started[0]?.[0]?.find(({topic}) => topic === "homeassistant/sensor/nrha_r5_main_control/config")?.payload, "object",
    "the den's entry is announced, not cleared");
  // The broker may not have been connected yet, so the startup message
  // clears them again, and from then on nothing.
  const startup = await receive<SendEnvelope>(renamed, {lighting: {kind: "startup"}});
  assert.deepEqual((startup[0]?.[0] ?? []).map(({topic}) => topic),
    ["home/hall/lighting/availability", "home/hall/lighting/main/control"]);
  const again = await receive<SendEnvelope>(renamed, {lighting: {kind: "startup"}});
  assert.equal(again.length, 1, "settled: no clears");

  const contractRuntime = runtime(registerTheatreStateContract, {}, STORE);
  const before = new contractRuntime.Constructor({id: "c5", area: "lounge", activities: "[\"off\"]"});
  contractRuntime.events.emit("flows:started");
  await close(before);
  const moved = new contractRuntime.Constructor({id: "c5", area: "lounge", baseTopic: "media/theatre", activities: "[\"off\"]"});
  t.after(() => close(moved));
  contractRuntime.events.emit("flows:started");
  const topics = ((moved.sent[0] as SendEnvelope)[1] ?? []).map((message) => [String(message.topic), message.payload]);
  assert.ok(topics.some(([topic, payload]) => topic === "home/lounge/theatre/current" && payload === ""), JSON.stringify(topics));
  assert.deepEqual(topics.at(-1), ["media/theatre/availability", "online"]);
});

test("entity cleanup: a deleted node clears what it published; a disabled or redeployed one doesn't", async () => {
  const stop = (node: RuntimeNode, removed: boolean) => new Promise<unknown[]>((resolve) => {
    const before = node.sent.length;
    node.emit("close", removed, () => resolve(node.sent.slice(before)));
  });
  const targets = "[{\"id\":\"main\"}]";
  const roomRuntime = runtime(registerRoom);
  const roomConfig = {id: "r1", idScheme: "node", targets, area: "hall", publishState: true, discovery: true};
  const offline = [[[{topic: "home/hall/lighting/availability", payload: "offline", retain: true}], null, null]];

  const redeployed = new roomRuntime.Constructor(roomConfig);
  await receive(redeployed, {lighting: {kind: "startup"}});
  assert.deepEqual(await stop(redeployed, false), offline, "redeployed: only offline");
  // Disabled: Node-RED says removed, but the node is still in the flows.
  const disabled = new roomRuntime.Constructor(roomConfig);
  assert.deepEqual(await stop(disabled, true), offline, "disabled: entities kept");
  // Deleted: removed, and gone from the flows.
  const deleted = new roomRuntime.Constructor(roomConfig);
  roomRuntime.flowNodeIds.delete("r1");
  const cleared = await stop(deleted, true) as Array<Array<Array<{topic: string; payload: unknown; retain: boolean}>>>;
  assert.deepEqual(cleared[0]?.[0]?.map(({topic, payload, retain}) => [topic, payload, retain]), [
    ["homeassistant/sensor/nrha_r1_main_control/config", "", true],
    ["home/hall/lighting/availability", "", true],
    ["home/hall/lighting/main/control", "", true]
  ]);
  // A room whose record was saved before 6.0 lists the circadian state topics as its own. The circadian lighting
  // policy publishes them now, so deleting the room never clears them.
  const upgraded = new roomRuntime.Constructor({...roomConfig, id: "r1b"});
  upgraded.context().set("retainedTopics", ["home/hall/circadian/state", "home/hall/sleep/state", "home/hall/wake-time/state", "home/hall/bed-time/state"]);
  const rebuilt = new roomRuntime.Constructor({...roomConfig, id: "r1b"});
  roomRuntime.flowNodeIds.delete("r1b");
  const upgradedCleared = (await stop(rebuilt, true) as Array<Array<Array<{topic: string}>>>)[0]?.[0]?.map(({topic}) => topic) ?? [];
  assert.deepEqual(upgradedCleared.filter((topic) => /\/(circadian|sleep|wake-time|bed-time)\/state$/.test(topic)), []);

  const contractRuntime = runtime(registerTheatreStateContract);
  const contract = new contractRuntime.Constructor({id: "c1", idScheme: "node", area: "lounge", activities: "[\"off\"]"});
  assert.deepEqual(await stop(contract, true), [[null, [{topic: "home/lounge/theatre/availability", payload: "offline", retain: true}]]], "disabled");
  const gone = new contractRuntime.Constructor({id: "c1", idScheme: "node", area: "lounge", activities: "[\"off\"]"});
  contractRuntime.flowNodeIds.delete("c1");
  const goneSent = await stop(gone, true) as Array<Array<Array<{topic: string; payload: unknown}> | null>>;
  const goneTopics = (goneSent[0]?.[1] ?? []).map(({topic, payload}) => (payload === "" ? topic : "not cleared"));
  assert.ok(goneTopics.includes("homeassistant/select/nrha_c1_theatre_activity/config"), goneTopics.join());
  assert.ok(goneTopics.includes("home/lounge/theatre/current") && !goneTopics.includes("not cleared"), goneTopics.join());
});

test("entity cleanup: switching Publish state off clears the room's state topics at its next start", async (t) => {
  const targets = "[{\"id\":\"main\"}]";
  const room = runtime(registerRoom, {}, STORE).Constructor;
  const publishing = new room({id: "r2", targets, area: "hall", publishState: true, discovery: false});
  await receive(publishing, {lighting: {kind: "startup"}});
  await close(publishing);
  const quiet = new room({id: "r2", targets, area: "hall", publishState: false, discovery: false});
  t.after(() => close(quiet));
  const startup = await receive<SendEnvelope>(quiet, {lighting: {kind: "startup"}});
  assert.deepEqual((startup[0]?.[0] ?? []).map(({topic, payload}) => [topic, payload]), [
    ["home/hall/lighting/availability", ""],
    ["home/hall/lighting/main/control", ""]
  ]);
});

test("occupancy publishing: off unless switched on; then its state, availability and binary sensor", async (t) => {
  const occupancyRuntime = runtime(registerOccupancy, {}, STORE);
  const quiet = new occupancyRuntime.Constructor({id: "o1", area: "Den"});
  t.after(() => close(quiet));
  occupancyRuntime.events.emit("flows:started");
  const quietMotion = await receive<SendEnvelope>(quiet, {source: "motion", payload: {motion: true}});
  assert.equal(quietMotion.length, 1, "only the occupancy event");
  assert.deepEqual(quiet.sent, [], "nothing at start either");

  const noArea = new occupancyRuntime.Constructor({id: "o2", publishState: true});
  assert.deepEqual(noArea.errors.map(String), ["invalid configuration: area is required"]);

  const node = new occupancyRuntime.Constructor({id: "o3", area: "Den", publishState: true, discovery: true});
  t.after(() => close(node));
  occupancyRuntime.events.emit("flows:started");
  const started = (node.sent[0] as SendEnvelope)[1] ?? [];
  assert.deepEqual(started.map(({topic}) => topic), [
    "homeassistant/binary_sensor/nrha_o3_occupancy/config",
    "home/den/occupancy/availability",
    "home/den/occupancy/state"
  ], "a node without a scheme set is named after the node");
  const entry = JSON.parse(String(started[0]?.payload)) as Record<string, unknown>;
  assert.deepEqual([entry.device_class, entry.state_topic, entry.availability_topic, entry.default_entity_id],
    ["occupancy", "home/den/occupancy/state", "home/den/occupancy/availability", ["binary_sensor", "den_occupancy"].join(".")]);
  assert.deepEqual([entry.name, (entry.device as {name: string}).name], ["Occupancy", "Den Occupancy"], "the device carries the area");
  assert.deepEqual(started.slice(1).map(({payload}) => payload), ["online", "OFF"]);

  const occupied = await receive<SendEnvelope>(node, {source: "motion", payload: {motion: true}});
  assert.equal((occupied[0]?.[0] as WireMessage | undefined)?.source, "occupancy");
  assert.deepEqual(occupied[1], [null, [{topic: "home/den/occupancy/state", payload: "ON", retain: true}]]);
  // A startup message announces the node again, with the current state.
  const startup = await receive<SendEnvelope>(node, {source: "startup"});
  assert.deepEqual((startup[0]?.[1] ?? []).map(({payload}) => typeof payload === "string" && payload.startsWith("{") ? "entry" : payload),
    ["entry", "online", "ON"]);

  // Discovery switched off and redeployed: the entry is cleared at the next start.
  await close(node);
  const stateOnly = new occupancyRuntime.Constructor({id: "o3", area: "Den", publishState: true, discovery: false});
  t.after(() => close(stateOnly));
  const stateOnlyStartup = await receive<SendEnvelope>(stateOnly, {source: "startup"});
  assert.deepEqual((stateOnlyStartup[0]?.[1] ?? [])[0], {topic: "homeassistant/binary_sensor/nrha_o3_occupancy/config", payload: "", retain: true});
});

test("occupancy publishing: deleting the node clears its entity; disabling it only goes offline", async () => {
  const occupancyRuntime = runtime(registerOccupancy);
  const settings = {id: "o9", area: "den", publishState: true, discovery: true};
  const stop = (node: RuntimeNode, removed: boolean) => new Promise<unknown[]>((resolve) => {
    const before = node.sent.length;
    node.emit("close", removed, () => resolve(node.sent.slice(before)));
  });
  const disabled = new occupancyRuntime.Constructor(settings);
  assert.deepEqual(await stop(disabled, true), [[null, [{topic: "home/den/occupancy/availability", payload: "offline", retain: true}]]]);
  const deleted = new occupancyRuntime.Constructor(settings);
  occupancyRuntime.flowNodeIds.delete("o9");
  assert.deepEqual(await stop(deleted, true), [[null, [
    {topic: "homeassistant/binary_sensor/nrha_o9_occupancy/config", payload: "", retain: true},
    {topic: "home/den/occupancy/availability", payload: "", retain: true},
    {topic: "home/den/occupancy/state", payload: "", retain: true}
  ]]]);
});

test("a publishing node clears the discovery entries it no longer publishes, with no record of them", async (t) => {
  // No record, as after a redeploy or restart without a context store: the
  // node publishes state with discovery switched off.
  const motionRuntime = runtime(registerMotion);
  const node = new motionRuntime.Constructor({id: "m9", area: "den", onTargets: "[\"main\"]", publishState: true, discovery: false});
  t.after(() => close(node));
  assert.equal(node.context().get("retainedTopics"), undefined);
  motionRuntime.events.emit("flows:started");
  const started = (node.sent[0] as SendEnvelope)[1] ?? [];
  assert.deepEqual(started.filter(({payload}) => payload === "").map(({topic}) => topic), [
    "homeassistant/switch/nrha_m9_motion_lighting/config",
    "homeassistant/number/nrha_m9_vacancy_delay/config"
  ]);
  assert.ok(started.some(({topic, payload}) => topic === "home/den/motion/enabled/state" && payload === "ON"), "and still publishes its state");
});

test("clearing without a record never touches another node's entities: none under the area scheme", async (t) => {
  // Two motion nodes in the same area, named after the area: A publishes
  // discovery; B publishes state with discovery off.
  const motionRuntime = runtime(registerMotion);
  const a = new motionRuntime.Constructor({id: "ma", area: "den", onTargets: "[\"main\"]", publishState: true, discovery: true, idScheme: "area"});
  t.after(() => close(a));
  motionRuntime.events.emit("flows:started");
  const entriesOfA = ((a.sent[0] as SendEnvelope)[1] ?? []).map(({topic}) => String(topic)).filter((topic) => topic.endsWith("/config"));
  assert.equal(entriesOfA.length, 2);

  const b = new motionRuntime.Constructor({id: "mb", area: "den", onTargets: "[\"main\"]", publishState: true, discovery: false, idScheme: "area"});
  motionRuntime.events.emit("flows:started");
  const cleared = (sent: unknown[]) => sent.flatMap((envelope) => (envelope as SendEnvelope)[1] ?? [])
    .filter(({payload}) => payload === "").map(({topic}) => String(topic));
  assert.deepEqual(cleared(b.sent).filter((topic) => entriesOfA.includes(topic)), [], "B's start");
  assert.deepEqual(cleared(await receive<SendEnvelope>(b, {source: "startup"})).filter((topic) => entriesOfA.includes(topic)), [], "B's startup message");
  motionRuntime.flowNodeIds.delete("mb");
  const deleted = await new Promise<unknown[]>((resolve) => {
    const before = b.sent.length;
    b.emit("close", true, () => resolve(b.sent.slice(before)));
  });
  assert.deepEqual(cleared(deleted).filter((topic) => entriesOfA.includes(topic)), [], "B's delete");
});

test("motion publishing: an enable switch and a vacancy delay, set from MQTT; off unless switched on", async (t) => {
  const motionRuntime = runtime(registerMotion);
  const quiet = new motionRuntime.Constructor({id: "m0", area: "den", onTargets: "[\"main\"]"});
  t.after(() => close(quiet));
  motionRuntime.events.emit("flows:started");
  assert.deepEqual(quiet.sent, [], "nothing published");

  const node = new motionRuntime.Constructor({id: "m1", area: "den", onTargets: "[\"main\"]", defaultDelaySeconds: 120, publishState: true, discovery: true});
  t.after(() => close(node));
  motionRuntime.events.emit("flows:started");
  const started = (node.sent[0] as SendEnvelope)[1] ?? [];
  assert.deepEqual(started.map(({topic, payload}) => [topic, String(payload).startsWith("{") ? "entry" : payload]), [
    ["homeassistant/switch/nrha_m1_motion_lighting/config", "entry"],
    ["homeassistant/number/nrha_m1_vacancy_delay/config", "entry"],
    ["home/den/motion/availability", "online"],
    ["home/den/motion/enabled/state", "ON"],
    ["home/den/motion/delay/state", "120"]
  ]);
  const number = JSON.parse(String(started[1]?.payload)) as Record<string, unknown>;
  assert.deepEqual(started.slice(0, 2).map(({payload}) => (JSON.parse(String(payload)) as {name: string}).name), ["Motion lighting", "Vacancy delay"]);
  assert.deepEqual([number.min, number.max, number.step, number.unit_of_measurement, number.device_class, number.entity_category, number.command_topic],
    [0, 86400, 1, "s", "duration", "config", "home/den/motion/delay/set"]);

  const disabled = await receive<SendEnvelope>(node, {topic: "home/den/motion/enabled/set", payload: "off"});
  assert.deepEqual(disabled.at(-1)?.[1]?.map(({topic, payload}) => [topic, payload]),
    [["home/den/motion/enabled/state", "OFF"], ["home/den/motion/delay/state", "120"]]);
  const delayed = await receive<SendEnvelope>(node, {topic: "home/den/motion/delay/set", payload: "300.0"});
  assert.deepEqual(delayed.at(-1)?.[1]?.map(({payload}) => payload), ["OFF", "300"]);
  for (const [payload, extra, reason] of [["-5", {}, "not-a-delay"], ["99999", {}, "not-a-delay"], ["60", {retain: true}, "retained-message"]] as const) {
    const ignored = await receive<SendEnvelope>(node, {topic: "home/den/motion/delay/set", payload, ...extra});
    assert.deepEqual(ignored, [], reason);
    assert.equal(traces(node).at(-1)?.reason, reason);
  }
  await receive<SendEnvelope>(node, {topic: "home/den/motion/enabled/set", payload: "maybe"});
  assert.equal(traces(node).at(-1)?.reason, "not-on-or-off");
  assert.equal((node.context().get("state") as {areaEnabled: boolean}).areaEnabled, false, "junk doesn't change it");

  // Deleted: everything it published is cleared.
  const deleted = new motionRuntime.Constructor({id: "m2", area: "den", onTargets: "[\"main\"]", publishState: true, discovery: true});
  motionRuntime.flowNodeIds.delete("m2");
  const cleared = await new Promise<unknown[]>((resolve) => {
    deleted.emit("close", true, () => resolve(deleted.sent));
  });
  assert.deepEqual(((cleared[0] as SendEnvelope)[1] ?? []).map(({payload}) => payload), ["", "", "", "", ""]);
});

test("motion publishing: after a redeploy with a new vacancy setting, the delay in use is published", async (t) => {
  const motionRuntime = runtime(registerMotion, {}, STORE);
  const base = {id: "m5", area: "hall", onTargets: "[\"main\"]", publishState: true, discovery: true};
  const delays = (sent: unknown[]) => JSON.stringify(sent).match(/"topic":"home\/hall\/motion\/delay\/state","payload":"(\d+)"/g)?.map((m) => m.match(/"(\d+)"$/)![1]) ?? [];
  const first = new motionRuntime.Constructor({...base, defaultDelaySeconds: 120});
  motionRuntime.events.emit("flows:started");
  assert.deepEqual(delays(first.sent), ["120"]);
  assert.deepEqual(delays(await receive(first, {topic: "home/hall/motion/delay/set", payload: "300"})), ["300"]);
  await close(first);

  // Same setting: Home Assistant's 300 still stands.
  const same = new motionRuntime.Constructor({...base, defaultDelaySeconds: 120});
  motionRuntime.events.emit("flows:started");
  assert.deepEqual(delays(same.sent), ["300"]);
  await close(same);

  // A new setting replaces it, and that is what is published.
  const changed = new motionRuntime.Constructor({...base, defaultDelaySeconds: 600});
  t.after(() => close(changed));
  motionRuntime.events.emit("flows:started");
  assert.deepEqual(delays(changed.sent), ["600"]);
  // Nothing more to publish when nothing changes.
  assert.deepEqual(await receive(changed, {source: "illuminance", payload: 5}), []);
});

test("a new theatre contract with discovery needs only a base topic and a display name", async (t) => {
  const contract = runtime(registerTheatreStateContract).Constructor;
  const node = new contract({id: "c8", idScheme: "node", displayName: "Media Room", baseTopic: "media/theatre", activities: "[\"off\"]", discovery: true});
  t.after(() => close(node));
  assert.deepEqual(node.errors, []);
  const saved = new contract({id: "c9", displayName: "Media Room", baseTopic: "media/theatre", activities: "[\"off\"]", discovery: true});
  assert.deepEqual(saved.errors.map(String), ["invalid configuration: area is required"], "a contract saved before node IDs still needs one");
});

test("receiver publishing: off unless switched on; then power, source and volume as they change", async (t) => {
  const avrRuntime = runtime(registerAvr);
  const sources = JSON.stringify({shield: "SAT/CBL", playstation: "GAME"});
  const quiet = new avrRuntime.Constructor({id: "a0", area: "den", sources});
  t.after(() => close(quiet));
  avrRuntime.events.emit("flows:started");
  assert.deepEqual(quiet.sent, []);
  const quietReading = await receive<SendEnvelope>(quiet, {avr: {kind: "observed", line: "PWON\rZMON\rSISAT/CBL\rMV31\r"}});
  assert.ok(quietReading.every((envelope) => !envelope[2]), "nothing on output 3");

  const node = new avrRuntime.Constructor({id: "a1", area: "den", sources, publishState: true, discovery: true});
  t.after(() => close(node));
  avrRuntime.events.emit("flows:started");
  const started = (node.sent[0] as SendEnvelope)[2] ?? [];
  assert.deepEqual(started.map(({topic}) => topic), [
    "homeassistant/binary_sensor/nrha_a1_receiver_power/config",
    "homeassistant/sensor/nrha_a1_receiver_source/config",
    "homeassistant/number/nrha_a1_receiver_volume/config",
    "home/den/receiver/availability"
  ], "nothing known yet, so no state");
  const first = await receive<SendEnvelope>(node, {avr: {kind: "observed", line: "PWON\rZMON\rSISAT/CBL\rMV31\r"}});
  assert.deepEqual(first.flatMap((envelope) => envelope[2] ?? []).map(({topic, payload}) => [topic, payload]), [
    ["home/den/receiver/power/state", "ON"],
    ["home/den/receiver/source/state", "shield"],
    ["home/den/receiver/volume/state", "-49"]
  ], "in dB");
  const louder = await receive<SendEnvelope>(node, {avr: {kind: "observed", line: "MV315\r"}});
  assert.deepEqual(louder.flatMap((envelope) => envelope[2] ?? []).map(({topic, payload}) => [topic, payload]),
    [["home/den/receiver/volume/state", "-48.5"]], "only what changed");
  const same = await receive<SendEnvelope>(node, {avr: {kind: "observed", line: "MV315\r"}});
  assert.deepEqual(same.flatMap((envelope) => envelope[2] ?? []), []);
  const entry = JSON.parse(String(started[0]?.payload)) as Record<string, unknown>;
  assert.deepEqual([entry.name, entry.device_class, (entry.device as {name: string}).name], ["Power", "power", "den Receiver"]);
});

test("receiver volume number: a set from Home Assistant takes the receiver's own bounded, confirmed volume path", async (t) => {
  const avrRuntime = runtime(registerAvr);
  const sources = JSON.stringify({shield: "SAT/CBL"});
  const node = new avrRuntime.Constructor({id: "a2", area: "den", sources, minVolumeDb: -70, maxVolumeDb: -30, publishState: true, discovery: true});
  t.after(() => close(node));
  avrRuntime.events.emit("flows:started");
  const number = ((node.sent[0] as SendEnvelope)[2] ?? []).find(({topic}) => topic === "homeassistant/number/nrha_a2_receiver_volume/config");
  const entry = JSON.parse(String(number?.payload)) as Record<string, unknown>;
  assert.deepEqual([entry.command_topic, entry.state_topic, entry.min, entry.max, entry.step, entry.unit_of_measurement],
    ["home/den/receiver/volume/set", "home/den/receiver/volume/state", -70, -30, 0.5, "dB"]);

  await receive(node, {avr: {kind: "observed", line: "PWON\rZMON\rSISAT/CBL\rMV31\r"}});
  const settled = () => new Promise((resolve) => setTimeout(resolve, 350));
  let sentBefore = node.sent.length;
  assert.deepEqual(await receive(node, {topic: "home/den/receiver/volume/set", payload: "-45.0"}), [], "held while newer sets may come");
  await settled();
  const commands = (node.sent.slice(sentBefore) as SendEnvelope[]).flatMap((envelope) => envelope[0] ?? []).map(({payload}) => String(payload));
  assert.deepEqual(commands, ["MV35\r"], "sent to the receiver as any volume request is");
  const confirmed = await receive<SendEnvelope>(node, {avr: {kind: "observed", line: "MV35\r"}});
  const results = confirmed.flatMap((envelope) => envelope[1] ?? []).map((message) => (message as {avr?: {kind: string}}).avr?.kind);
  assert.ok(results.includes("volume_ready"), JSON.stringify(results));
  assert.deepEqual(confirmed.flatMap((envelope) => envelope[2] ?? []).map(({topic, payload}) => [topic, payload]),
    [["home/den/receiver/volume/state", "-45"]], "Home Assistant sees the confirmed volume");

  for (const [msg, reason] of [
    [{topic: "home/den/receiver/volume/set", payload: "loud"}, "not-a-number"],
    [{topic: "home/den/receiver/volume/set", payload: "-60", retain: true}, "retained-message"]
  ] as const) {
    assert.deepEqual(await receive(node, msg), [], reason);
    assert.equal(traces(node).at(-1)?.reason, reason);
  }

  // With the receiver off, the request is rejected the usual way.
  await receive(node, {avr: {kind: "observed", line: "PWSTANDBY\r"}});
  sentBefore = node.sent.length;
  await receive(node, {topic: "home/den/receiver/volume/set", payload: "-60"});
  await settled();
  const rejected = (node.sent.slice(sentBefore) as SendEnvelope[]).flatMap((envelope) => envelope[1] ?? []).map((message) => (message as {avr?: {kind: string; reason?: string}}).avr);
  assert.ok(rejected.some((avr) => avr?.kind === "volume_rejected" && avr.reason === "receiver-not-ready"), JSON.stringify(rejected));
});

test("receiver node: 0-98 bounds and requests (removed in 6.0) are refused visibly, never read", async (t) => {
  const avrRuntime = runtime(registerAvr);
  // Bounds only in the receiver's own 0-98, as a flow saved before 5.0 has them: invalid, not the default bounds.
  const old = new avrRuntime.Constructor({id: "a4", area: "den", sources: JSON.stringify({shield: "SAT/CBL"}), minVolume: 10, maxVolume: 50});
  assert.equal((old.statuses.at(-1) as {text?: string}).text, "invalid configuration");
  assert.match(String(old.errors[0]), /0-98 were removed in 6\.0: set Minimum volume \(dB\)/);
  // A request with value: rejected, with one warning however often.
  const node = new avrRuntime.Constructor({id: "a6", area: "den", sources: JSON.stringify({shield: "SAT/CBL"})});
  t.after(() => close(node));
  await receive(node, {avr: {kind: "observed", line: "PWON\rZMON\rSISAT/CBL\rMV31\r"}});
  const send = async (requestId: string) => (await receive<SendEnvelope>(node, {avr: {kind: "volume", requestId, mode: "absolute", value: 40}}));
  const first = await send("old-1");
  assert.deepEqual(first.flatMap((envelope) => envelope[0] ?? []), [], "nothing sent to the receiver");
  assert.ok(first.flatMap((envelope) => envelope[1] ?? []).some((message) => (message as {avr?: {kind?: string; reason?: string}}).avr?.reason === "removed-volume-value"));
  await send("old-2");
  assert.equal(node.warnings.length, 1, "once per deploy");
  assert.match(String(node.warnings[0]), /removed in 6\.0.*valueDb/);
});

test("receiver node: a volume saved before 5.0 by a context store is published in dB as it starts", async (t) => {
  const avrRuntime = runtime(registerAvr, {}, STORE);
  const config = {id: "a5", area: "den", sources: JSON.stringify({shield: "SAT/CBL"}), publishState: true};
  const before = new avrRuntime.Constructor(config);
  // As 4.x saved it: the receiver's own 31, no units marker.
  before.context().set("state", {observed: {power: "on", mainZone: "on", source: "shield", sourceCode: "SAT/CBL", volume: 31, at: null}});
  await close(before);
  const node = new avrRuntime.Constructor(config);
  t.after(() => close(node));
  avrRuntime.events.emit("flows:started");
  const started = (node.sent.at(-1) as SendEnvelope)[2] ?? [];
  assert.deepEqual(started.filter(({topic}) => String(topic).endsWith("volume/state")).map(({payload}) => payload), ["-49"]);
});

test("receiver volume number: a burst of sets becomes one request for the last value", async (t) => {
  const avrRuntime = runtime(registerAvr);
  const node = new avrRuntime.Constructor({id: "a3", area: "den", sources: JSON.stringify({shield: "SAT/CBL"}), publishState: true, discovery: true});
  t.after(() => close(node));
  await receive(node, {avr: {kind: "observed", line: "PWON\rZMON\rSISAT/CBL\rMV31\r"}});
  const before = node.sent.length;
  for (let step = 0; step < 10; step += 1) {
    await receive(node, {topic: "home/den/receiver/volume/set", payload: String(-48 + step)});
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  await new Promise((resolve) => setTimeout(resolve, 350));
  const sent = node.sent.slice(before) as SendEnvelope[];
  assert.deepEqual(sent.flatMap((envelope) => envelope[0] ?? []).map(({payload}) => String(payload)), ["MV41\r"], "one command, for the last value");
  // No superseded step was ever sent, so the receiver's reading of the last
  // value confirms it.
  const confirmed = await receive<SendEnvelope>(node, {avr: {kind: "observed", line: "MV41\r"}});
  const results = confirmed.flatMap((envelope) => envelope[1] ?? []).map((message) => (message as {avr?: {kind: string}}).avr?.kind);
  assert.ok(results.includes("volume_ready"), JSON.stringify(results));
  assert.ok(!results.includes("volume_manual_override"));
});

test("house schedule: a redeploy without a context store goes back to its settings; with one, keeps a runtime change", () => {
  for (const [store, wakeTime] of [[{}, "07:00"], [STORE, "06:15"]] as const) {
    const houseRuntime = runtime(registerHouse, {}, store);
    const config = {id: "house-redeploy", name: "house", wakeTime: "07:00", bedTime: "23:00"};
    const before = new houseRuntime.Constructor(config) as RuntimeNode & SharedSchedule;
    before.change({kind: "schedule", wakeTime: "06:15"});
    assert.equal(before.schedule().wakeTime, "06:15");
    // Redeployed: closed (Node-RED then deletes its context unless a store
    // is configured) and built again with the same settings.
    before.emit("close", false, () => {});
    before.closeContext?.();
    const after = new houseRuntime.Constructor(config) as RuntimeNode & SharedSchedule;
    assert.equal(after.schedule().wakeTime, wakeTime, store === STORE ? "with a store" : "without a store");
  }
});

test("house schedule: circadian lighting policies using it follow it, at the flow start and at every change, and stop when they close", async (t) => {
  const house = new (runtime(registerHouse).Constructor)({id: "house1", name: "house", wakeTime: "07:00", bedTime: "23:00"}) as RuntimeNode & SharedSchedule;
  assert.deepEqual(house.errors, []);
  // With a context store, as reading a closed node's state and redeploying
  // it with its saved state need one.
  const policies = runtime(registerCircadian, {}, STORE);
  const policy = (id: string) => {
    const node = new policies.Constructor({id, area: id, publishState: true, discovery: true, wakeTime: "08:00", bedTime: "22:00", houseSchedule: "house1"});
    t.after(() => close(node));
    return node;
  };
  const [hall, study] = [policy("hall"), policy("study")];
  const schedule = (node: RuntimeNode) => (node.context().get("state") as {schedule?: unknown} | undefined)?.schedule;
  policies.events.emit("flows:started");
  assert.deepEqual([schedule(hall), schedule(study)], [{wakeTime: "07:00", bedTime: "23:00"}, {wakeTime: "07:00", bedTime: "23:00"}],
    "the house's times, not their own");

  house.change({kind: "schedule", bedTime: "22:30"});
  assert.deepEqual([schedule(hall), schedule(study)], [{wakeTime: "07:00", bedTime: "22:30"}, {wakeTime: "07:00", bedTime: "22:30"}]);
  // Following the house, it has no time entities and reads no time set topics of its own.
  const startup = await receive<SendEnvelope>(hall, {lighting: {kind: "startup"}});
  const published = startup.flatMap((envelope) => (envelope as unknown as Array<Array<{topic: string; payload: unknown}> | null>)[1] ?? [])
    .filter(({payload}) => payload !== "").map(({topic}) => topic);
  assert.ok(!published.some((topic) => /wake|bed/.test(topic)), published.join());
  await receive(hall, {topic: "home/hall/wake-time/set", payload: "05:00:00"});
  assert.deepEqual(schedule(hall), {wakeTime: "07:00", bedTime: "22:30"});

  await close(study);
  house.change({kind: "schedule", wakeTime: "06:00"});
  assert.deepEqual([schedule(hall), schedule(study)], [{wakeTime: "06:00", bedTime: "22:30"}, {wakeTime: "07:00", bedTime: "22:30"}],
    "a closed policy no longer listens");

  // Redeployed with no schedule (or its schedule deleted): its own times, not the house's last ones, even where
  // its own time matches the house's.
  const own = new policies.Constructor({id: "study", area: "study", publishState: true, discovery: true, wakeTime: "08:00", bedTime: "23:00", houseSchedule: ""});
  t.after(() => close(own));
  const startup2 = await receive<SendEnvelope>(own, {lighting: {kind: "startup"}});
  assert.deepEqual(schedule(own), {wakeTime: "08:00", bedTime: "23:00"});
  assert.ok(startup2.flatMap((envelope) => (envelope as unknown as Array<Array<{topic: string; payload: unknown}> | null>)[1] ?? [])
    .some(({topic, payload}) => topic === "home/study/wake-time/state" && payload === "08:00:00"));
});

test("house schedule: a circadian lighting policy whose schedule is missing keeps its own times and says so", async (t) => {
  const policies = runtime(registerCircadian);
  const node = new policies.Constructor({id: "orphan", area: "orphan", publishState: true, discovery: true, wakeTime: "08:00", bedTime: "22:00", houseSchedule: "deleted-schedule"});
  t.after(() => close(node));
  assert.deepEqual(node.errors, []);
  assert.match(String((node.statuses.at(-1) as {text: string}).text), /schedule missing: own times$/);
  // Its own time set topics, as it publishes.
  await receive(node, {topic: "home/orphan/wake-time/set", payload: "05:00:00"});
  assert.equal((node.context().get("state") as {schedule: {wakeTime: string}}).schedule.wakeTime, "05:00");
});

test("house schedule MQTT node: publishes the schedule for Home Assistant and changes it from its set topics", async (t) => {
  const house = new (runtime(registerHouse).Constructor)({id: "house2", name: "hall", wakeTime: "07:00", bedTime: "23:00"}) as RuntimeNode & SharedSchedule;
  const mqttRuntime = runtime(registerHouseMqtt);
  const node = new mqttRuntime.Constructor({id: "house-mqtt", schedule: "house2", discovery: true, idScheme: "node"});
  t.after(() => close(node));
  assert.deepEqual(node.errors, []);
  mqttRuntime.events.emit("flows:started");
  const announced = (node.sent as SendEnvelope[]).flatMap((envelope) => envelope[0] ?? []).map(({topic}) => topic);
  assert.ok(announced.includes("homeassistant/time/nrha_house2_wake_time/config"), "named after the schedule: " + announced.join());
  assert.ok(announced.includes("home/hall/schedule/wake-time/state"), announced.join());

  node.sent.length = 0;
  house.change({kind: "schedule", bedTime: "22:30"});
  assert.deepEqual((node.sent as SendEnvelope[]).flatMap((envelope) => envelope[0] ?? []).map(({topic, payload}) => [topic, payload]),
    [["home/hall/schedule/wake-time/state", "07:00:00"], ["home/hall/schedule/bed-time/state", "22:30:00"]]);
  await receive(node, {topic: "home/hall/schedule/wake-time/set", payload: "06:15:00"});
  assert.equal(house.schedule().wakeTime, "06:15");
  await receive(node, {lighting: {kind: "schedule", wakeTime: "06:45"}});
  assert.equal(house.schedule().wakeTime, "06:45");
  await receive(node, {topic: "home/hall/schedule/wake-time/set", payload: "soon"});
  assert.equal(traces(node).at(-1)?.reason, "not-a-time");

  const orphan = new mqttRuntime.Constructor({id: "house-mqtt2", schedule: "deleted-schedule"});
  assert.deepEqual(orphan.errors.map(String), ["invalid configuration: the house schedule is missing"]);
});

test("one flows:started listener however many nodes wait: no MaxListenersExceededWarning past ten", async () => {
  const warnings: Error[] = [];
  const onWarning = (warning: Error) => warnings.push(warning);
  process.on("warning", onWarning);
  try {
    const motionRuntime = runtime(registerMotion);
    const nodes = Array.from({length: 12}, (_, i) => new motionRuntime.Constructor({
      id: `many${i}`, area: `room${i}`, onTargets: "[\"main\"]", publishState: true, discovery: true
    }));
    assert.equal(motionRuntime.events.listenerCount("flows:started"), 1);
    motionRuntime.events.emit("flows:started");
    // Each node's start-up publishing ran once.
    assert.deepEqual(nodes.map((node) => node.sent.length), Array(12).fill(1));
    // Once: a second start doesn't run them again.
    motionRuntime.events.emit("flows:started");
    assert.deepEqual(nodes.map((node) => node.sent.length), Array(12).fill(1));
    await Promise.all(nodes.map((node) => close(node)));
    // Warnings are emitted on the next tick.
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(warnings.filter(({name}) => name === "MaxListenersExceededWarning"), []);

    // A node that closes before the flows start never runs.
    const early = new motionRuntime.Constructor({id: "early", area: "hall", onTargets: "[\"main\"]", publishState: true});
    await close(early);
    const before = early.sent.length;
    motionRuntime.events.emit("flows:started");
    assert.equal(early.sent.length, before, "a closed node's callback is gone");
  } finally {
    process.off("warning", onWarning);
  }
});

test("cover node: simple requests, presets, and a moving signal on output 3", async (t) => {
  const node = new (runtime(registerCover).Constructor)({presets: "{\"partial\":60}"});
  t.after(() => close(node));
  assert.deepEqual(node.errors, []);
  const opened = await receive<SendEnvelope>(node, {payload: "partial"});
  const command = (opened[0]?.[0]?.[0] as {cover_command?: {operation: string; position: number}} | undefined)?.cover_command;
  assert.deepEqual([command?.operation, command?.position], ["set_position", 60]);
  assert.deepEqual(opened[0]?.[2], {topic: "moving", payload: true}, "moving while the move is unconfirmed");
  const reported = await receive<SendEnvelope>(node, {cover: {kind: "observed", position: 60, motion: "stopped", observedAt: new Date().toISOString(), battery: 90}});
  assert.deepEqual(reported[0]?.[2], {topic: "moving", payload: false});
  const theatre = (reported[0]?.[1]?.[0] as {theatre?: {status: string; details: {position: number}}} | undefined)?.theatre;
  assert.deepEqual([theatre?.status, theatre?.details.position], ["ready", 60]);
  assert.match(String((node.statuses.at(-1) as {text: string}).text), /battery 90%/);
  assert.deepEqual(await receive(node, {payload: "half"}), [], "unknown requests are ignored");
  assert.equal(traces(node).at(-1)?.reason, "unknown-request");
  // Already there: nothing to send.
  assert.deepEqual((await receive<SendEnvelope>(node, {payload: 60}))[0]?.[0], null);

  const bad = new (runtime(registerCover).Constructor)({presets: "{\"open\":10}"});
  assert.match(String(bad.errors[0]), /invalid configuration: preset name open/);
});

test("cover node: a button stops a moving cover, and an offline cover rejects requests", async (t) => {
  const node = new (runtime(registerCover).Constructor)({});
  t.after(() => close(node));
  await receive(node, {cover: {kind: "observed", position: 20, motion: "opening", observedAt: new Date().toISOString()}});
  const stopped = await receive<SendEnvelope>(node, {payload: "open", stopIfMoving: true});
  assert.equal((stopped[0]?.[0]?.[0] as {cover_command?: {operation: string}} | undefined)?.cover_command?.operation, "stop");
  await receive(node, {cover: {kind: "observed", position: 30, motion: "stopped", observedAt: new Date().toISOString()}});
  const opened = await receive<SendEnvelope>(node, {payload: "open", stopIfMoving: true});
  assert.equal((opened[0]?.[0]?.[0] as {cover_command?: {operation: string; position: number}} | undefined)?.cover_command?.position, 100);

  await receive(node, {cover: {kind: "availability", online: false}});
  assert.match(String((node.statuses.at(-1) as {text: string}).text), /unavailable/);
  const offline = await receive<SendEnvelope>(node, {payload: "close"});
  assert.equal(offline[0]?.[0], null, "nothing sent");
  assert.ok((offline[0]?.[1] ?? []).some((message) => (message as {theatre?: {status: string}}).theatre?.status === "unavailable"));
  const back = await receive<SendEnvelope>(node, {cover: {kind: "availability", online: true}});
  assert.equal((back[0]?.[0]?.[0] as {cover_command?: {operation: string}} | undefined)?.cover_command?.operation, "observe");
});

test("cover node: an open/close-only cover takes open, close and stop, not positions", async (t) => {
  const node = new (runtime(registerCover).Constructor)({coverType: "open-close", travelMs: 20000});
  t.after(() => close(node));
  assert.deepEqual(node.errors, []);
  const opened = await receive<SendEnvelope>(node, {payload: "open"});
  assert.equal((opened[0]?.[0]?.[0] as {cover_command?: {operation: string}} | undefined)?.cover_command?.operation, "open");
  assert.deepEqual(opened[0]?.[2], {topic: "moving", payload: true});
  assert.deepEqual(await receive(node, {payload: 40}), []);
  assert.equal(traces(node).at(-1)?.reason, "position-not-supported");
  const ended = await receive<SendEnvelope>(node, {cover: {kind: "observed", state: "open", motion: "stopped", observedAt: new Date().toISOString()}});
  const theatre = (ended[0]?.[1]?.[0] as {theatre?: {status: string; details: {state: string; evidence: string}}} | undefined)?.theatre;
  assert.deepEqual([theatre?.status, theatre?.details.state, theatre?.details.evidence], ["ready", "open", "reported"]);
  assert.deepEqual(ended[0]?.[2], {topic: "moving", payload: false});
  const bad = new (runtime(registerCover).Constructor)({coverType: "curtain"});
  assert.deepEqual(bad.errors.map(String), ["invalid configuration: cover type must be position or open-close"]);
});

test("motion node: a pause names its owner and shows as paused", async (t) => {
  const node = new (runtime(registerMotion).Constructor)({onTargets: "[\"main\"]"});
  t.after(() => close(node));
  await receive(node, {source: "pause", payload: true, owner: "blind"});
  assert.deepEqual((node.context().get("state") as {pausedBy: Array<{owner: string}>}).pausedBy.map(({owner}) => owner), ["blind"]);
  assert.match(String((node.statuses.at(-1) as {text: string}).text), /^paused/);
  await receive(node, {source: "pause", payload: false, owner: "blind"});
  assert.match(String((node.statuses.at(-1) as {text: string}).text), /^enabled/);
});

test("cover node: closing while the cover moves says it is no longer moving", async () => {
  const node = new (runtime(registerCover).Constructor)({id: "c-close"});
  await receive(node, {cover: {kind: "observed", position: 20, motion: "opening", observedAt: new Date().toISOString()}});
  const before = node.sent.length;
  await close(node);
  assert.deepEqual(node.sent.slice(before), [[null, null, {topic: "moving", payload: false}]]);
  const still = new (runtime(registerCover).Constructor)({id: "c-still"});
  await receive(still, {cover: {kind: "observed", position: 20, motion: "stopped", observedAt: new Date().toISOString()}});
  const stillBefore = still.sent.length;
  await close(still);
  assert.deepEqual(still.sent.slice(stillBefore), [], "nothing to say when it was still");
});

test("cover group node: one request moves both members, and their results come back together", async (t) => {
  const group = new (runtime(registerCoverGroup).Constructor)({members: "[\"left\",\"right\"]"});
  const coverRuntime = runtime(registerCover);
  const left = new coverRuntime.Constructor({id: "left"});
  const right = new coverRuntime.Constructor({id: "right"});
  t.after(() => close(left));
  t.after(() => close(right));
  // The result on output 1, then one output per member, in Members order.
  const sent = (await receive<SendEnvelope>(group, {payload: 40}))[0] ?? [];
  assert.equal(sent.length, 3);
  assert.equal((sent[0]?.[0] as {theatre?: {target: string}} | undefined)?.theatre?.target, "cover", "the group's own state first");
  const requests = [sent[1]?.[0], sent[2]?.[0]];
  assert.deepEqual(requests.map((message) => message?.topic), ["left", "right"]);
  const forward = async (member: RuntimeNode, request: unknown) => {
    await receive(member, request as Record<string, unknown>);
    const result = await receive<SendEnvelope>(member, {cover: {kind: "observed", position: 40, motion: "stopped", observedAt: new Date().toISOString()}});
    return (result[0]?.[1] ?? [])[0];
  };
  const leftResult = await forward(left, requests[0]);
  const rightResult = await forward(right, requests[1]);
  await receive(group, leftResult as Record<string, unknown>);
  const done = await receive<SendEnvelope>(group, rightResult as Record<string, unknown>);
  assert.equal((done[0]?.[0]?.[0] as {theatre?: {status: string}} | undefined)?.theatre?.status, "ready");
  assert.equal(String((group.statuses.at(-1) as {text: string}).text), "2/2 confirmed");
});

test("cover node: a group's request it declines is answered with why, and only coverRequestId is read", async (t) => {
  const node = new (runtime(registerCover).Constructor)({id: "c-answer", coverType: "open-close"});
  t.after(() => close(node));
  const declined = await receive<SendEnvelope>(node, {payload: 40, coverRequestId: "group-1:left"});
  const theatre = (declined[0]?.[1] as {theatre?: {requestId: string; status: string; failure: {reason: string}}} | undefined)?.theatre;
  assert.deepEqual([theatre?.requestId, theatre?.status, theatre?.failure.reason], ["group-1:left", "failed", "position-not-supported"]);
  // Not answered without a caller's ID.
  assert.deepEqual(await receive(node, {payload: "half"}), []);
  // msg.requestId from elsewhere is not taken as the caller's.
  const opened = await receive<SendEnvelope>(node, {payload: "open", requestId: "someone-else"});
  const answer = ((opened[0]?.[1] ?? []) as Array<{theatre?: {requestId: string}}>)[0]?.theatre?.requestId;
  assert.notEqual(answer, "someone-else");
  assert.match(String(answer), /^cover-/);
  // A badly formed coverRequestId is not used either.
  const bad = await receive<SendEnvelope>(node, {payload: "close", coverRequestId: "has spaces"});
  assert.match(String(((bad[0]?.[1] ?? []) as Array<{theatre?: {requestId: string}}>)[0]?.theatre?.requestId), /^cover-/);
});

test("cover reducers answer a request a person's move holds back", async () => {
  const position = new (runtime(registerCover).Constructor)({id: "c-hold"});
  await receive(position, {payload: 40});
  await receive(position, {cover: {kind: "observed", position: 40, motion: "stopped", observedAt: new Date().toISOString()}});
  await receive(position, {cover: {kind: "observed", position: 80, motion: "stopped", observedAt: new Date(Date.now() + 1000).toISOString()}});
  const held = await receive<SendEnvelope>(position, {payload: 20, respectManual: true, coverRequestId: "group-2:left"});
  const answers = ((held[0]?.[1] ?? []) as Array<{theatre?: {requestId: string; status: string; failure?: {reason: string}}}>).map(({theatre}) => theatre);
  assert.ok(answers.some((answer) => answer?.requestId === "group-2:left" && answer.status === "failed" && answer.failure?.reason === "manual-hold"), JSON.stringify(answers));
  await close(position);
});

test("cover group node: a cover's other state and its moving signal are not requests", async (t) => {
  const group = new (runtime(registerCoverGroup).Constructor)({members: "[\"left\",\"right\"]"});
  t.after(() => close(group));
  assert.deepEqual(await receive(group, {topic: "moving", payload: true}), []);
  assert.deepEqual(await receive(group, {theatre: {kind: "state", requestId: "x"}}), []);
  assert.equal(traces(group).at(-1)?.reason, "not-a-member-answer");
  const sent = (await receive<SendEnvelope>(group, {payload: "open"}))[0] ?? [];
  assert.deepEqual(sent.slice(1).map((output) => (output?.[0] as {coverRequestId?: string} | undefined)?.coverRequestId?.endsWith(":left")), [true, false]);
});

test("cover group node: a request still open after a redeploy settles at its deadline", async (t) => {
  const groupRuntime = runtime(registerCoverGroup, {}, STORE);
  const config = {id: "g-redeploy", members: "[\"left\",\"right\"]", deadlineSeconds: 1};
  const before = new groupRuntime.Constructor(config);
  await receive(before, {payload: "open"});
  await close(before);
  // Redeployed: no input at all, yet the deadline still comes.
  const after = new groupRuntime.Constructor(config);
  t.after(() => close(after));
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const answer = (after.sent as SendEnvelope[]).flatMap((envelope) => envelope[0] ?? [])
    .map((message) => (message as {theatre?: {status: string; failure?: {reason: string}; details: {members: Record<string, {reason: string}>}}}).theatre);
  assert.equal(answer.at(-1)?.status, "failed");
  assert.deepEqual([answer.at(-1)?.failure?.reason, answer.at(-1)?.details.members.left?.reason], ["none-confirmed", "no-answer"]);
});

test("cover node: its name in topics has no default, and is needed only while it publishes", (t) => {
  const coverRuntime = runtime(registerCover);
  const unnamed = new coverRuntime.Constructor({id: "cover-unnamed", area: "bedroom", publishState: true});
  assert.deepEqual(unnamed.errors.map(String), ["invalid configuration: name in topics is required"],
    "two covers in a room can't share topics by leaving it alone");
  const quiet = new coverRuntime.Constructor({id: "cover-not-publishing", area: "bedroom"});
  t.after(() => close(quiet));
  assert.deepEqual(quiet.errors, [], "a cover that doesn't publish has no topics to name");
});

test("cover node publishing: a Home Assistant cover entity, its state as it changes, and its commands as requests", async (t) => {
  const coverRuntime = runtime(registerCover);
  const quiet = new coverRuntime.Constructor({id: "cover-quiet"});
  t.after(() => close(quiet));
  const node = new coverRuntime.Constructor({id: "cover-ha", area: "bedroom", topicName: "left", publishState: true, discovery: true, idScheme: "node"});
  t.after(() => close(node));
  assert.deepEqual(node.errors, []);
  coverRuntime.events.emit("flows:started");
  assert.equal(quiet.sent.length, 0, "off unless switched on");
  const started = (node.sent as SendEnvelope[]).flatMap((envelope) => envelope[3] ?? []).map(({topic}) => topic);
  assert.deepEqual(started, ["homeassistant/cover/nrha_cover-ha_cover_left/config", "home/bedroom/cover/left/availability"]);

  // The cover reports: its state and position go to Home Assistant.
  const reported = await receive<SendEnvelope>(node, {cover: {kind: "observed", position: 0, motion: "stopped", observedAt: new Date().toISOString()}});
  assert.deepEqual(reported.flatMap((envelope) => envelope[3] ?? []).map(({topic, payload}) => [topic, payload]),
    [["home/bedroom/cover/left/state", "closed"], ["home/bedroom/cover/left/position", "0"]]);

  // Home Assistant's OPEN is a request like any other: a device command on output 1.
  const opened = await receive<SendEnvelope>(node, {topic: "home/bedroom/cover/left/set", payload: "OPEN"});
  const commands = opened.flatMap((envelope) => envelope[0] ?? []).map((message) => (message as {cover_command?: {operation: string; position?: number}}).cover_command);
  assert.deepEqual(commands.map((command) => [command?.operation, command?.position]), [["set_position", 100]]);
  // And a position from Home Assistant.
  const moved = await receive<SendEnvelope>(node, {topic: "home/bedroom/cover/left/position/set", payload: "40"});
  assert.ok(moved.flatMap((envelope) => envelope[0] ?? []).some((message) => (message as {cover_command?: {position?: number}}).cover_command?.position === 40));
  // Anything else on its set topics is ignored, with a trace.
  assert.deepEqual(await receive(node, {topic: "home/bedroom/cover/left/set", payload: "SIDEWAYS"}), []);
  assert.equal(traces(node).at(-1)?.reason, "not-open-close-or-stop");

  // Its own published topics, back through a wildcard subscription (#198): ignored, never requests.
  for (const [topic, payload] of [["home/bedroom/cover/left/state", "open"], ["home/bedroom/cover/left/position", "42"], ["home/bedroom/cover/left/availability", "online"]]) {
    assert.deepEqual(await receive(node, {topic, payload}), [], topic);
    assert.equal(traces(node).at(-1)?.reason, "not-a-set-topic", topic);
  }
  // Another cover's, through the same wildcard: ignored too.
  for (const [topic, payload] of [["home/bedroom/cover/curtain/state", "open"], ["home/bedroom/cover/curtain/position", "42"]]) {
    assert.deepEqual(await receive(node, {topic, payload}), [], topic);
    assert.equal(traces(node).at(-1)?.reason, "another-covers-topic", topic);
  }
  // A flow's request, with no topic, still works, and a cover group's, named by its member.
  const fromFlow = await receive<SendEnvelope>(node, {payload: 10});
  assert.ok(fromFlow.flatMap((envelope) => envelope[0] ?? []).some((message) => (message as {cover_command?: {position?: number}}).cover_command?.position === 10));
  const fromGroup = await receive<SendEnvelope>(node, {topic: "left", payload: 30});
  assert.ok(fromGroup.flatMap((envelope) => envelope[0] ?? []).some((message) => (message as {cover_command?: {position?: number}}).cover_command?.position === 30));
});

// The adapter has no timers, so nothing to close.
test("shelly cover node: device messages become cover readings, and cover commands MQTT publications", async () => {
  const node = new (runtime(registerShellyCover).Constructor)({id: "s1", topicPrefix: "shellyplus2pm-test", channel: "0"});
  assert.deepEqual(node.errors, []);
  const status = await receive<SendEnvelope>(node, {topic: "shellyplus2pm-test/status/cover:0", payload: {id: 0, state: "stopped", current_pos: 30, pos_control: true}});
  const reading = status[0]?.[1] as Array<{cover?: {kind: string; position: number; motion: string}}> | undefined;
  assert.deepEqual([status[0]?.[0], reading?.map(({cover}) => [cover?.kind, cover?.position, cover?.motion])], [null, [["observed", 30, "stopped"]]]);
  assert.equal((node.statuses.at(-1) as {text?: string}).text, "stopped · 30%");
  const observe = await receive<SendEnvelope>(node, {cover_command: {operation: "observe", requestId: "r", generation: 1, attempt: 1}});
  assert.deepEqual((observe[0]?.[0] as Array<{topic: string; payload: string}>).map(({topic, payload}) => [topic, payload]),
    [["shellyplus2pm-test/command/cover:0", "status_update"]]);
  // An unrelated message, such as its own command echoed back, sends nothing.
  assert.deepEqual(await receive(node, {topic: "shellyplus2pm-test/command/cover:0", payload: "stop"}), []);
  // No device prefix: invalid configuration, not a guess.
  const unset = new (runtime(registerShellyCover).Constructor)({id: "s2"});
  assert.equal((unset.statuses.at(-1) as {text?: string}).text, "invalid configuration");
});

test("room node: lighting values in Zigbee2MQTT's units (removed in 6.0) are left out, with one warning", async (t) => {
  const targets = "[{\"id\":\"main\"}]";
  const node = new (runtime(registerRoom).Constructor)({id: "removed-units", targets, area: "", publishState: false, discovery: false});
  t.after(() => close(node));
  // The neutral command on output 2, for the light's adapter.
  const send = async (values: Record<string, unknown>) => (((await receive<SendEnvelope>(node, {lighting: {kind: "intent", state: "ON", manual: true, values}}))[0] as unknown as
    Array<Array<{light: Record<string, unknown>}> | null>)[1] ?? []).map(({light}) => {
    const {kind: _kind, target: _target, source: _source, id: _id, ...rest} = light;
    return rest;
  });
  // The package's own units, as they are: the light's adapter converts them.
  assert.deepEqual(await send({brightnessPct: 50, colorTempKelvin: 2500}), [{state: "ON", brightnessPct: 50, colorTempKelvin: 2500, transitionSeconds: 1}]);
  assert.deepEqual(node.warnings, []);
  // Zigbee2MQTT's own units never reach the light, and one warning however often.
  assert.deepEqual(await send({brightness: 64, color_temp: 400}), [{state: "ON", transitionSeconds: 1}]);
  await send({brightness: 64});
  assert.equal(node.warnings.length, 1);
  assert.match(String(node.warnings[0]), /removed in 6\.0.*brightnessPct .* colorTempKelvin/);
  // Beside the new fields: the new ones apply, the old ones are left out.
  assert.deepEqual(await send({brightness: 10, brightnessPct: 50}), [{state: "ON", brightnessPct: 50, transitionSeconds: 1}]);
  // An unusable new value is left out with its own warning.
  await send({colorTempKelvin: 0});
  assert.equal(node.warnings.length, 2);
  assert.match(String(node.warnings[1]), /left out/);
});

// The adapter has no timers, so nothing to close.
test("zigbee2mqtt cover node: state reports become cover readings, and cover commands set and get messages", async () => {
  const node = new (runtime(registerZ2mCover).Constructor)({id: "z1", baseTopic: "z2m", friendlyName: "test-cover"});
  assert.deepEqual(node.errors, []);
  const reported = await receive<SendEnvelope>(node, {topic: "z2m/test-cover", payload: {position: 30, state: "OPEN", motor_state: "closing"}});
  const reading = reported[0]?.[1] as Array<{cover?: {kind: string; position: number; motion: string}}> | undefined;
  assert.deepEqual([reported[0]?.[0], reading?.map(({cover}) => [cover?.kind, cover?.position, cover?.motion])], [null, [["observed", 30, "closing"]]]);
  assert.equal((node.statuses.at(-1) as {text?: string}).text, "closing · 30%");
  const observe = await receive<SendEnvelope>(node, {cover_command: {operation: "observe", requestId: "r", generation: 1, attempt: 1}});
  assert.deepEqual((observe[0]?.[0] as Array<{topic: string; payload: string}>).map(({topic, payload}) => [topic, payload]),
    [["z2m/test-cover/get", "{\"position\":\"\"}"]]);
  await receive(node, {topic: "z2m/test-cover/availability", payload: "{\"state\":\"offline\"}"});
  assert.equal((node.statuses.at(-1) as {text?: string}).text, "offline");
  // Its own set echoed back sends nothing.
  assert.deepEqual(await receive(node, {topic: "z2m/test-cover/set", payload: {position: 3}}), []);
  // No friendly name: invalid configuration, not a guess.
  const unset = new (runtime(registerZ2mCover).Constructor)({id: "z2"});
  assert.equal((unset.statuses.at(-1) as {text?: string}).text, "invalid configuration");
});

test("shelly switch node: reads the device's configuration once the flows start, then passes a detached switch's flips to the switch policy", async (t) => {
  const switchRuntime = runtime(registerShellySwitch);
  const node = new switchRuntime.Constructor({id: "w1", topicPrefix: "shellyplus1-test", channel: "0"});
  t.after(() => close(node));
  assert.deepEqual(node.errors, []);
  switchRuntime.events.emit("flows:started");
  const asked = ((node.sent[0] as SendEnvelope)[0] ?? []) as Array<{topic: string; payload: string}>;
  assert.deepEqual(asked.map(({topic}) => topic), ["shellyplus1-test/rpc", "shellyplus1-test/command"]);
  const request = JSON.parse(asked[0]!.payload) as {id: number; src: string};
  await receive(node, {topic: `${request.src}/rpc`, payload: {id: request.id, result: {"switch:0": {in_mode: "detached"}, "input:0": {type: "switch"}}}});
  assert.equal((node.statuses.at(-1) as {text?: string}).text, "detached, switch input");
  const flipped = await receive<SendEnvelope>(node, {topic: "shellyplus1-test/events/rpc", payload: {method: "NotifyStatus", params: {"input:0": {id: 0, state: true}}}});
  const toPolicy = flipped[0]?.[1] as Array<{source?: string; payload?: {state: boolean}}> | undefined;
  assert.deepEqual(toPolicy?.map(({source, payload}) => [source, payload?.state]), [["switch", true]]);
  // Detached: a relay command is never sent.
  assert.deepEqual(await receive(node, {switchCommand: {power: "off"}}), []);
  // No device prefix: invalid configuration, not a guess.
  // (It never started, so there is nothing to close.)
  const unset = new (runtime(registerShellySwitch).Constructor)({id: "w2"});
  assert.equal((unset.statuses.at(-1) as {text?: string}).text, "invalid configuration");
});

test("circadian node: a style once the flows start and every interval, with its discovery after the old room entries are cleared, in one batch", async (t) => {
  t.mock.timers.enable({apis: ["setTimeout", "setInterval", "Date"], now: new Date("2026-06-21T12:00:00").getTime()});
  type Out = Array<{lighting?: Record<string, unknown>} | Array<{topic: string; payload: string}> | null>;
  // Two rooms in the flows: one with this area (saved before 6.0, so still invalid), one elsewhere.
  const circadianRuntime = runtime(registerCircadian, {}, {flows: [
    {id: "room-den", type: "home-room-lighting-controller", area: "Den", idScheme: "node", wakeTime: "07:00"},
    {id: "room-hall", type: "home-room-lighting-controller", area: "hall", idScheme: "node"}
  ]});
  const node = new circadianRuntime.Constructor({id: "c1", area: "den", publishState: true, discovery: true, refreshSeconds: 60});
  t.after(() => close(node));
  assert.deepEqual(node.errors, []);
  const styles = () => (node.sent as Out[]).map((out) => (out[0] as {lighting?: Record<string, unknown>} | null)?.lighting).filter(Boolean) as Array<Record<string, unknown>>;
  const published = () => (node.sent as Out[]).flatMap((out) => (out[1] as Array<{topic: string; payload: string}> | null) ?? []);

  circadianRuntime.events.emit("flows:started");
  assert.equal(styles().length, 1);
  assert.deepEqual(Object.keys(styles()[0]!.values as object), ["brightnessPct", "colorTempKelvin"]);
  assert.ok(published().some(({topic, payload}) => topic === "home/den/circadian/availability" && payload === "online"));
  // No delay: the old entries are cleared in the same batch, before its own.
  const config = published().filter(({topic}) => topic.endsWith("/config"));
  assert.deepEqual(config.slice(0, 8).map(({topic, payload}) => [topic, payload]), [
    ["homeassistant/switch/den_circadian_lighting/config", ""],
    ["homeassistant/switch/den_sleep/config", ""],
    ["homeassistant/time/den_wake_time/config", ""],
    ["homeassistant/time/den_bed_time/config", ""],
    ["homeassistant/switch/nrha_room-den_circadian_lighting/config", ""],
    ["homeassistant/switch/nrha_room-den_sleep/config", ""],
    ["homeassistant/time/nrha_room-den_wake_time/config", ""],
    ["homeassistant/time/nrha_room-den_bed_time/config", ""]
  ], "the room in this area, migrated or not; not the hall's");
  assert.equal(config.slice(8).length, 4);
  assert.ok(config.slice(8).every(({topic, payload}) => topic.includes("nrha_c1_") && payload !== ""));
  t.mock.timers.tick(60_000);
  assert.equal(styles().length, 2, "one per interval");

  // The startup message announces at once.
  const startup = await receive<Out>(node, {lighting: {kind: "startup"}});
  assert.ok(startup.some((out) => Array.isArray(out[1]) && out[1].some(({topic}) => topic === "homeassistant/switch/nrha_c1_circadian_lighting/config")));
  assert.ok(startup.some((out) => (out[0] as {lighting?: {kind: string}} | null)?.lighting?.kind === "style"));

  // Home Assistant switches it off: rooms are told at once, and the state is published.
  const off = await receive<Out>(node, {topic: "home/den/circadian/set", payload: "OFF"});
  assert.deepEqual(off.map((out) => (out[0] as {lighting?: {values: unknown}} | null)?.lighting?.values).filter((v) => v !== undefined), [null]);
  assert.ok(off.some((out) => Array.isArray(out[1]) && out[1].some(({topic, payload}) => topic === "home/den/circadian/state" && payload === "OFF")));
  assert.deepEqual(node.statuses.at(-1), {fill: "grey", shape: "dot", text: "off"});

  // A flow's "on" is refused, visibly.
  await receive(node, {lighting: {kind: "circadian", enabled: "on"}});
  assert.match(String(node.warnings.at(-1)), /circadian's enabled takes only true or false: "on" was refused/);
  assert.deepEqual(node.statuses.at(-1), {fill: "yellow", shape: "ring", text: "refused circadian \"on\": send true or false"});

  // On again: rooms take back what a person set.
  const on = await receive<Out>(node, {lighting: {kind: "circadian", enabled: true}});
  assert.equal((on[0]![0] as {lighting: {takeBack?: boolean}}).lighting.takeBack, true);
});

test("circadian node: deleted, it tells rooms to stop styling at once; following a house, it takes the house's times", async (t) => {
  const circadianRuntime = runtime(registerCircadian);
  const gone = new circadianRuntime.Constructor({id: "c2"});
  circadianRuntime.flowNodeIds.delete("c2");
  // Node-RED waits for every close handler, so everything sent as it closes counts.
  const before = gone.sent.length;
  gone.emit("close", true, () => {});
  const sent = gone.sent.slice(before) as Array<Array<{lighting?: {kind: string; values: unknown}} | null>>;
  assert.deepEqual(sent.filter((out) => out[0]).map((out) => [out[0]?.lighting?.kind, out[0]?.lighting?.values]), [["style", null]]);

  const house = new (runtime(registerHouse).Constructor)({id: "house9", name: "house", wakeTime: "07:00", bedTime: "23:00"}) as RuntimeNode & SharedSchedule;
  const housesRuntime = runtime(registerCircadian);
  const follower = new housesRuntime.Constructor({id: "c3", houseSchedule: "house9", wakeTime: "05:00", bedTime: "20:00"});
  t.after(() => close(follower));
  housesRuntime.events.emit("flows:started");
  assert.deepEqual((follower.context().get("state") as {schedule: unknown}).schedule, {wakeTime: "07:00", bedTime: "23:00"});
  house.change({kind: "schedule", bedTime: "22:15"});
  assert.deepEqual((follower.context().get("state") as {schedule: unknown}).schedule, {wakeTime: "07:00", bedTime: "22:15"});
});

test("activity lighting warns once per deploy when a profile gives values to a light that reports none", async (t) => {
  const node = new (runtime(registerActivityLighting).Constructor)({area: "lounge", owner: "activity",
    profiles: JSON.stringify({off: {targets: [], values: {}}, tv: {targets: ["wall", "lamp"], values: {brightnessPct: 25}}}), confirmationTimeoutMs: 15000, maxAttempts: 2});
  t.after(() => close(node));
  assert.deepEqual([node.errors, node.warnings], [[], []]);
  for (const at of [1, 2]) {
    await receive(node, {activityLighting: {kind: "intent", requestId: `tv-${at}`, generation: at, profile: "tv"}});
    // The wall reports the profile's level; the lamp only that it is on.
    await receive(node, {activityLighting: {kind: "observed", generation: at, target: "wall", on: true, fields: ["brightness"], showsLast: true, observedAt: new Date().toISOString()}});
    await receive(node, {activityLighting: {kind: "observed", generation: at, target: "lamp", on: true, fields: [], showsLast: false, observedAt: new Date().toISOString()}});
  }
  assert.equal(node.warnings.length, 1, "once per deploy");
  assert.match(String(node.warnings[0]), /^lamp reports no brightness or colour, so the activity confirms it by its being on/);
});

test("a room and a zigbee2mqtt light node, wired as in the examples: commands, readings, availability shown, readings passed on", async (t) => {
  type Envelope = Array<Array<Record<string, unknown>> | Record<string, unknown> | null>;
  const room = new (runtime(registerRoom).Constructor)({id: "room-l", targets: "[{\"id\":\"main\"}]", area: "hall", publishState: true, discovery: false});
  const light = new (runtime(registerZ2mLight).Constructor)({id: "light-l", target: "main", baseTopic: "z2m", friendlyName: "hall-main"});
  t.after(() => close(room));
  assert.deepEqual([room.errors, light.errors], [[], []]);
  const port = (sent: unknown[], index: number) => sent.flatMap((envelope) => {
    const out = (envelope as Envelope)[index];
    return out === null || out === undefined ? [] : Array.isArray(out) ? out : [out];
  });

  const startup = await receive<Envelope>(room, {lighting: {kind: "startup"}});
  const get = await receive<Envelope>(light, port(startup, 1)[0]!);
  assert.deepEqual(port(get, 0), [{topic: "z2m/hall-main/get", payload: {state: ""}, retain: false}], "asked to report");

  const on = await receive<Envelope>(room, {lighting: {kind: "intent", targets: ["main"], state: "ON", source: "wall", manual: true, values: {brightnessPct: 25}}});
  const published = await receive<Envelope>(light, port(on, 1)[0]!);
  assert.deepEqual(port(published, 0), [{topic: "z2m/hall-main/set", payload: {state: "ON", brightness: 64, transition: 1}, retain: false}]);

  // The light reports: the room gets the reading, and passes it on, with the light's control state, for activity lighting.
  const report = await receive<Envelope>(light, {topic: "z2m/hall-main", payload: {state: "ON", brightness: 64}});
  const roomAnswer = await receive<Envelope>(room, port(report, 1)[0]!);
  const passed = port(roomAnswer, 2)[0] as {light: Record<string, unknown>};
  assert.deepEqual([passed.light.kind, passed.light.target, passed.light.on, passed.light.showsLast, passed.light.control, passed.light.manual],
    ["observed", "main", true, true, "manual", true]);

  // Offline: shown on the control state and the status; nothing else changes.
  const offline = await receive<Envelope>(light, {topic: "z2m/hall-main/availability", payload: {state: "offline"}});
  const shown = await receive<Envelope>(room, port(offline, 1)[0]!);
  assert.deepEqual(port(shown, 0), [{topic: "home/hall/lighting/main/control", payload: {state: "manual", owner: null, available: false}, retain: true}]);
  assert.deepEqual(port(shown, 1), [], "no command");
  assert.match(String((room.statuses.at(-1) as {text: string}).text), /· 1 offline$/);
  assert.equal((room.context().get("state") as {control: Record<string, {state: string}>}).control.main?.state, "manual");
});

test("two zigbee2mqtt light nodes fed one room's light output: each acts on its own light and ignores the other's silently", async (t) => {
  type Envelope = Array<Array<Record<string, unknown>> | Record<string, unknown> | null>;
  const room = new (runtime(registerRoom).Constructor)({id: "room-2", targets: "[{\"id\":\"main\"},{\"id\":\"side\"}]", area: "hall", publishState: false, discovery: false});
  const main = new (runtime(registerZ2mLight).Constructor)({id: "light-main", target: "main", baseTopic: "z2m", friendlyName: "hall-main"});
  const side = new (runtime(registerZ2mLight).Constructor)({id: "light-side", target: "side", baseTopic: "z2m", friendlyName: "hall-side"});
  t.after(() => close(room));
  const port = (sent: unknown[], index: number) => sent.flatMap((envelope) => {
    const out = (envelope as Envelope)[index];
    return out === null || out === undefined ? [] : Array.isArray(out) ? out : [out];
  });

  const on = await receive<Envelope>(room, {lighting: {kind: "intent", targets: ["main"], state: "ON", source: "wall", manual: true, values: {brightnessPct: 25}}});
  const command = port(on, 1)[0]!;
  assert.deepEqual(await receive<Envelope>(side, command), [], "nothing from the other light");
  const published = await receive<Envelope>(main, command);
  assert.deepEqual(port(published, 0), [{topic: "z2m/hall-main/set", payload: {state: "ON", brightness: 64, transition: 1}, retain: false}]);
  assert.deepEqual([main.errors, side.errors], [[], []]);
  // The other light still works afterwards.
  const report = await receive<Envelope>(side, {topic: "z2m/hall-side", payload: {state: "OFF"}});
  assert.deepEqual(port(report, 1).map((entry) => (entry.light as {kind: string}).kind), ["observed"]);
});

// Each node that announces itself as the flows start, with publishing on, and
// its own startup message.
const ANNOUNCING: Array<[string, NodeInitializer, Record<string, unknown>, Record<string, unknown>]> = [
  ["room lighting controller", registerRoom, {targets: "[{\"id\":\"main\"}]"}, {lighting: {kind: "startup"}}],
  ["circadian lighting policy", registerCircadian, {}, {lighting: {kind: "startup"}}],
  ["house schedule MQTT", registerHouseMqtt, {schedule: "announcing-house"}, {lighting: {kind: "startup"}}],
  ["motion policy", registerMotion, {}, {source: "startup"}],
  ["occupancy fusion", registerOccupancy, {}, {source: "startup"}],
  ["cover controller", registerCover, {topicName: "left"}, {cover: {kind: "startup"}}],
  ["AVR controller", registerAvr, {}, {avr: {kind: "startup"}}],
  ["theatre state contract", registerTheatreStateContract, {activities: "[\"off\",\"tv\"]"}, {theatreStateContract: {kind: "startup"}}],
  ["scene", registerScene, {name: "Exercise mode", lights: "[{\"area\":\"test\",\"target\":\"main\",\"state\":\"OFF\"}]"}, {scene: {kind: "startup"}}],
  // It publishes no retained state, but asks the device for its configuration as the flows start.
  ["shelly switch", registerShellySwitch, {topicPrefix: "shellyplus1-test", channel: "0"}, {shellySwitch: {kind: "startup"}}]
];
const mqttStatus = (type: string, fill: string, text: string) =>
  ({status: {fill, shape: fill === "green" ? "dot" : "ring", text, source: {id: "out-1", type, name: ""}}});

test("each node that announces itself as the flows start announces again when MQTT out says it has connected", async (t) => {
  new (runtime(registerHouse).Constructor)({id: "announcing-house", name: "test", wakeTime: "07:00", bedTime: "23:00"});
  // The two runs are a moment apart: times aside, the same messages.
  const timeless = (sent: unknown) => JSON.parse(JSON.stringify(sent).replace(/\d{4}-\d\d-\d\dT[\d:.]+Z/g, "<time>"));
  for (const [label, register, settings, startup] of ANNOUNCING) {
    const config = {area: "test", name: "", publishState: true, discovery: true, ...settings};
    const viaStartup = new (runtime(register).Constructor)({id: "n-" + label, ...config});
    const viaStatus = new (runtime(register).Constructor)({id: "n-" + label, ...config});
    t.after(() => close(viaStartup));
    t.after(() => close(viaStatus));
    assert.deepEqual([viaStartup.errors, viaStatus.errors], [[], []], label);
    const expected = await receive(viaStartup, startup);
    assert.ok(JSON.stringify(expected).length > 10, `${label}: its startup message sends something`);
    assert.deepEqual(await receive(viaStatus, mqttStatus("mqtt out", "yellow", "node-red:common.status.connecting")), [], `${label}: connecting`);
    assert.deepEqual(await receive(viaStatus, mqttStatus("mqtt in", "green", "node-red:common.status.connected")), [], `${label}: another node type`);
    assert.deepEqual(timeless(await receive(viaStatus, mqttStatus("mqtt out", "green", "node-red:common.status.connected"))),
      timeless(expected), `${label}: connected`);
    assert.deepEqual([viaStartup.errors, viaStatus.errors], [[], []], label);
  }
});

test("scene node: on and off from a flow and from Home Assistant, its switch, its status, and a deleted scene lets go", async (t) => {
  type Envelope = Array<Array<Record<string, unknown>> | Record<string, unknown> | null>;
  const sceneRuntime = runtime(registerScene, {}, STORE);
  const config = {id: "scene-ex", name: "Exercise mode", area: "lounge", safetyHours: 4, publishState: true, discovery: true, idScheme: "node",
    lights: JSON.stringify([{area: "lounge", target: "main", state: "OFF"}, {area: "lounge", target: "tv", state: "ON"}])};
  const node = new sceneRuntime.Constructor(config);
  t.after(() => close(node));
  assert.deepEqual(node.errors, []);
  const port = (sent: unknown[], index: number) => sent.flatMap((envelope) => {
    const out = (envelope as Envelope)[index];
    return out === null || out === undefined ? [] : Array.isArray(out) ? out : [out];
  });

  sceneRuntime.events.emit("flows:started");
  const announced = port(node.sent, 2).map(({topic, payload}) => [topic, typeof payload === "string" && payload.startsWith("{") ? "config" : payload]);
  assert.deepEqual(announced, [
    ["homeassistant/switch/nrha_scene-ex_scene_exercise_mode/config", "config"],
    ["home/lounge/scene/exercise_mode/availability", "online"],
    ["home/lounge/scene/exercise_mode/state", "OFF"]
  ]);

  const on = await receive<Envelope>(node, {topic: "home/lounge/scene/exercise_mode/set", payload: "ON"});
  assert.deepEqual(port(on, 0).map(({lighting}) => lighting), [
    {kind: "intent", area: "lounge", targets: ["main"], state: "OFF", owner: "scene:Exercise mode", source: "scene"},
    {kind: "intent", area: "lounge", targets: ["tv"], state: "ON", owner: "scene:Exercise mode", source: "scene"}
  ]);
  assert.deepEqual(port(on, 1), [{source: "pause", payload: true, owner: "scene:Exercise mode"}]);
  assert.deepEqual(port(on, 2), [{topic: "home/lounge/scene/exercise_mode/state", payload: "ON", retain: true}]);
  assert.equal((node.statuses.at(-1) as {text: string}).text, "on · 4h 0m left");

  // A redeploy with a context store: still on, its pause renewed, its lights not asked again.
  await close(node);
  const after = new sceneRuntime.Constructor(config);
  sceneRuntime.events.emit("flows:started");
  assert.deepEqual(port(after.sent, 0), []);
  assert.deepEqual(port(after.sent, 1), [{source: "pause", payload: true, owner: "scene:Exercise mode"}]);
  assert.ok(port(after.sent, 2).some(({topic, payload}) => topic === "home/lounge/scene/exercise_mode/state" && payload === "ON"));

  // Deleted while on: it lets go.
  const before = after.sent.length;
  sceneRuntime.flowNodeIds.delete("scene-ex");
  await new Promise<void>((resolve) => after.emit("close", true, resolve));
  const gone = after.sent.slice(before);
  assert.deepEqual(port(gone, 0).map(({lighting}) => lighting), [{kind: "release", area: "lounge", owner: "scene:Exercise mode", targets: ["main", "tv"], source: "scene"}]);
  assert.deepEqual(port(gone, 1), [{source: "pause", payload: false, owner: "scene:Exercise mode"}]);
});

test("scene node: an end trigger from the flow names what ended it; anything else is ignored with a trace", async (t) => {
  const node = new (runtime(registerScene).Constructor)({id: "scene-bath", name: "Bath", safetyHours: 0, lights: "[{\"area\":\"bathroom\",\"target\":\"main\",\"state\":\"ON\",\"brightnessPct\":30}]"});
  t.after(() => close(node));
  await receive(node, {scene: {kind: "start"}});
  assert.equal((node.statuses.at(-1) as {text: string}).text, "on");
  assert.deepEqual(await receive(node, {payload: "ON"}), [], "not a scene message");
  assert.equal(traces(node).at(-1)?.reason, "not-a-scene-message");
  await receive(node, {scene: {kind: "end", by: "lights switched off"}});
  assert.equal((node.statuses.at(-1) as {text: string}).text, "off · ended by lights switched off");
});

test("scene node: settings it can't use are an invalid configuration naming them", () => {
  const Scene = runtime(registerScene).Constructor;
  for (const [settings, message] of [
    [{name: ""}, /name is required/],
    [{name: "Bath", lights: "[{\"area\":\"bathroom\",\"target\":\"main\"}]"}, /state must be ON or OFF/],
    [{name: "Bath", lights: "[{\"target\":\"main\",\"state\":\"ON\"}]"}, /needs an area/],
    [{name: "Bath", safetyHours: -2}, /safety timer/],
    [{name: "Bath", publishState: true}, /area/]
  ] as const) {
    const node = new Scene({id: "bad-scene", ...settings});
    assert.match(String(node.errors[0]), message, JSON.stringify(settings));
  }
});

test("room with a broker: publishes itself, announcing on every connect; output 1 quiet; a Status node left wired changes nothing", async (t) => {
  type Envelope = Array<Array<Record<string, unknown>> | Record<string, unknown> | null>;
  const broker = fakeBroker();
  builtNodes.set("broker-room", broker);
  const roomRuntime = runtime(registerRoom);
  const node = new roomRuntime.Constructor({id: "room-broker", targets: "[{\"id\":\"main\"}]", area: "hall", idScheme: "node",
    homeAssistant: "discovery", broker: "broker-room"});
  t.after(() => close(node));
  assert.deepEqual(node.errors, []);
  roomRuntime.events.emit("flows:started");
  assert.deepEqual(node.sent, [], "nothing on output 1 as the flows start");
  broker.connect();
  // As at the startup message: the circadian entities it published before 6.0 cleared, its own, then every control state.
  assert.deepEqual(broker.published.map(({topic, payload}) => [topic, payload === "" ? "" : "set"]), [
    ["homeassistant/switch/nrha_room-broker_circadian_lighting/config", ""],
    ["homeassistant/switch/nrha_room-broker_sleep/config", ""],
    ["homeassistant/time/nrha_room-broker_wake_time/config", ""],
    ["homeassistant/time/nrha_room-broker_bed_time/config", ""],
    ["homeassistant/sensor/nrha_room-broker_main_control/config", "set"],
    ["home/hall/lighting/availability", "set"],
    ["home/hall/lighting/main/control", "set"]
  ]);
  assert.ok(!node.statuses.some((status) => String((status as {text?: string}).text).includes("connected")), "the broker never sets the room's status");
  assert.deepEqual([...broker.subscriptions.keys()], ["homeassistant/status"]);

  // A person's change: the control state goes to the broker, not output 1.
  broker.published.length = 0;
  const changed = await receive<Envelope>(node, {lighting: {kind: "intent", targets: ["main"], state: "ON", source: "wall", manual: true, values: {brightnessPct: 30}}});
  assert.deepEqual(changed.map((envelope) => (envelope as Envelope)[0]), [null]);
  assert.deepEqual(broker.published.map(({topic, payload}) => [topic, payload]),
    [["home/hall/lighting/main/control", "{\"state\":\"manual\",\"owner\":null}"]]);

  // Home Assistant restarted: everything again, with the current state.
  broker.published.length = 0;
  broker.deliver("homeassistant/status", "online");
  assert.deepEqual(broker.published.at(-1)?.payload, "{\"state\":\"manual\",\"owner\":null}");

  // A Status node from before, still wired: ignored, with a trace.
  assert.deepEqual(await receive(node, {status: {fill: "green", shape: "dot", text: "node-red:common.status.connected", source: {id: "o", type: "mqtt out", name: ""}}}), []);
  assert.equal(traces(node).at(-1)?.reason, "has-broker");

  // Stopping: offline, then the link deregisters.
  broker.published.length = 0;
  await new Promise<void>((resolve) => node.emit("close", false, resolve));
  assert.deepEqual(broker.published.map(({topic, payload}) => [topic, payload]), [["home/hall/lighting/availability", "offline"]]);
  assert.deepEqual(broker.deregistered.map(({id}) => id), ["room-broker-home-automation"]);
});

test("room: a broker that isn't in the flows is an invalid configuration; with Publish set to Don't publish, no broker is needed", () => {
  const room = runtime(registerRoom).Constructor;
  const missing = new room({id: "room-nobroker", targets: "[{\"id\":\"main\"}]", area: "hall", homeAssistant: "state", broker: "gone"});
  assert.match(String(missing.errors[0]), /MQTT broker node isn't in the flows/);
  const off = new room({id: "room-off", targets: "[{\"id\":\"main\"}]", homeAssistant: "off", broker: ""});
  assert.deepEqual(off.errors, []);
});

// Step 2's nodes, with a broker: their publication output and where it is.
const WITH_BROKER: Array<[string, number]> = [
  ["circadian lighting policy", 1], ["house schedule MQTT", 0], ["motion policy", 1], ["occupancy fusion", 1],
  ["cover controller", 3], ["AVR controller", 2], ["theatre state contract", 1], ["scene", 2]
];

test("each publishing node with a broker publishes itself: announced on connect, set topics read from the broker only, output quiet, offline on close", async (t) => {
  new (runtime(registerHouse).Constructor)({id: "announcing-house", name: "test", wakeTime: "07:00", bedTime: "23:00"});
  for (const [label, publicationOutput] of WITH_BROKER) {
    const [, register, settings] = ANNOUNCING.find(([name]) => name === label)!;
    const broker = fakeBroker();
    const brokerId = "broker-" + label.replace(/\W+/g, "-");
    builtNodes.set(brokerId, broker);
    const nodeRuntime = runtime(register);
    const node = new nodeRuntime.Constructor({id: "b-" + brokerId, area: "test", name: "", ...settings, homeAssistant: "discovery", broker: brokerId});
    t.after(() => close(node));
    assert.deepEqual(node.errors, [], label);
    nodeRuntime.events.emit("flows:started");
    const published = (sent: unknown[]) => sent.some((envelope) => {
      const out = (envelope as unknown[])[publicationOutput];
      return out !== null && out !== undefined && (!Array.isArray(out) || out.length > 0);
    });
    assert.equal(published(node.sent), false, `${label}: nothing on its publication output`);
    broker.connect();
    assert.ok(broker.published.some(({payload, retain}) => payload === "online" && retain), `${label}: announced on connect`);
    // Home Assistant's status, and exactly its own set topics.
    const topics = [...broker.subscriptions.keys()];
    assert.ok(topics.includes("homeassistant/status"), label);
    assert.ok(topics.every((topic) => topic === "homeassistant/status" || /\/(set|request)$/.test(topic)), `${label}: ${topics.join(", ")}`);
    // An MQTT in still wired on a set topic, or a Status node: ignored, with a trace.
    const setTopic = topics.find((topic) => topic !== "homeassistant/status");
    const before = node.sent.length;
    if (setTopic) {
      assert.deepEqual(await receive(node, {topic: setTopic, payload: "ON"}), [], `${label}: wired ${setTopic}`);
      assert.equal(traces(node).at(-1)?.reason, "has-broker", label);
    }
    assert.deepEqual(await receive(node, mqttStatus("mqtt out", "green", "node-red:common.status.connected")), [], label);
    assert.equal(traces(node).at(-1)?.reason, "has-broker", label);
    assert.equal(node.sent.length, before, label);
    // Offline as it stops.
    broker.published.length = 0;
    await new Promise<void>((resolve) => node.emit("close", false, resolve));
    assert.ok(broker.published.some(({payload}) => payload === "offline"), `${label}: offline on close`);
  }
});

test("set topics from the broker are the node's own requests: a scene started and a cover opened from Home Assistant", async (t) => {
  const broker = fakeBroker();
  builtNodes.set("broker-requests", broker);
  const scene = new (runtime(registerScene).Constructor)({id: "scene-ha", name: "Bath", area: "test", homeAssistant: "state", broker: "broker-requests",
    lights: "[{\"area\":\"test\",\"target\":\"main\",\"state\":\"ON\"}]"});
  t.after(() => close(scene));
  broker.connect();
  broker.deliver("home/test/scene/bath/set", "ON");
  assert.equal((scene.statuses.at(-1) as {text?: string}).text, "on · 4h 0m left");
  assert.ok(broker.published.some(({topic, payload}) => topic === "home/test/scene/bath/state" && payload === "ON"));
  // A retained set message, which the broker replays on every reconnect, is never a request.
  broker.deliver("home/test/scene/bath/set", "OFF", true);
  assert.equal((scene.statuses.at(-1) as {text?: string}).text, "on · 4h 0m left");

  const cover = new (runtime(registerCover).Constructor)({id: "cover-ha2", area: "test", topicName: "left", homeAssistant: "discovery", broker: "broker-requests"});
  t.after(() => close(cover));
  const before = cover.sent.length;
  broker.deliver("home/test/cover/left/set", "OPEN");
  const commands = (cover.sent.slice(before) as SendEnvelope[]).flatMap((envelope) => envelope[0] ?? [])
    .map((message) => (message as {cover_command?: {operation: string; position?: number}}).cover_command);
  assert.deepEqual(commands.map((command) => [command?.operation, command?.position]), [["set_position", 100]]);
});

test("with a broker, each connect runs a node's own startup, not just its announcement (#202)", async (t) => {
  type Envelope = Array<Array<Record<string, unknown>> | Record<string, unknown> | null>;
  const port = (sent: unknown[], index: number) => sent.flatMap((envelope) => {
    const out = (envelope as Envelope)[index];
    return out === null || out === undefined ? [] : Array.isArray(out) ? out : [out];
  });
  const broker = fakeBroker();
  builtNodes.set("broker-startup", broker);
  const settings = {area: "test", homeAssistant: "discovery", broker: "broker-startup", idScheme: "node"};
  const room = new (runtime(registerRoom).Constructor)({id: "room-startup", targets: "[{\"id\":\"main\"}]", ...settings});
  const cover = new (runtime(registerCover).Constructor)({id: "cover-startup", topicName: "left", ...settings});
  const circadian = new (runtime(registerCircadian).Constructor)({id: "circadian-startup", ...settings});
  const contract = new (runtime(registerTheatreStateContract).Constructor)({id: "contract-startup", activities: "[\"off\",\"tv\"]", ...settings});
  for (const node of [room, cover, circadian, contract]) t.after(() => close(node));
  assert.deepEqual([room.errors, cover.errors, circadian.errors, contract.errors], [[], [], [], []]);
  // A cover it has a target for, to read again (one with none stays idle).
  await receive(cover, {payload: 40});
  cover.sent.length = 0;
  broker.connect();
  // The room asks each light for a reading.
  assert.deepEqual(port(room.sent, 1).map(({light}) => light), [{kind: "observe", target: "main"}]);
  // The cover controller reads its cover.
  assert.ok(port(cover.sent, 0).some((message) => (message.cover_command as {operation?: string} | undefined)?.operation === "observe"),
    JSON.stringify(cover.sent));
  // The circadian policy styles its rooms.
  assert.ok(port(circadian.sent, 0).some((message) => (message.lighting as {kind?: string} | undefined)?.kind === "style"), JSON.stringify(circadian.sent));
  // The theatre contract's startup republishes its entities and availability, through the broker (its state topics
  // are retained and published with each snapshot, as before).
  assert.ok(broker.published.some(({topic}) => topic === "homeassistant/select/nrha_contract-startup_theatre_activity/config"));
  assert.ok(broker.published.some(({topic, payload}) => topic === "home/test/theatre/availability" && payload === "online"));
  assert.equal(traces(contract).some(({event, outcome}) => event === "startup" && outcome === "discovery"), true, "its startup ran");
  // And everything announced, as before.
  assert.ok(broker.published.some(({topic, payload}) => topic === "home/test/lighting/availability" && payload === "online"));
});

test("device adapters with a broker: their device's topics from the broker, commands to it, output 1 quiet, echoes still their own", async (t) => {
  type Envelope = Array<Array<Record<string, unknown>> | Record<string, unknown> | null>;
  const port = (sent: unknown[], index: number) => sent.flatMap((envelope) => {
    const out = (envelope as Envelope)[index];
    return out === null || out === undefined ? [] : Array.isArray(out) ? out : [out];
  });
  const broker = fakeBroker();
  builtNodes.set("broker-adapters", broker);
  const light = new (runtime(registerZ2mLight).Constructor)({id: "light-broker", target: "main", baseTopic: "z2m", friendlyName: "hall-main", broker: "broker-adapters"});
  const z2mCover = new (runtime(registerZ2mCover).Constructor)({id: "z2mcover-broker", baseTopic: "z2m", friendlyName: "blind", broker: "broker-adapters"});
  const shellyCover = new (runtime(registerShellyCover).Constructor)({id: "shellycover-broker", topicPrefix: "shellyplus2pm-test", channel: "0", broker: "broker-adapters"});
  const switchRuntime = runtime(registerShellySwitch);
  const shellySwitch = new switchRuntime.Constructor({id: "switch-broker", topicPrefix: "shellyplus1-test", channel: "0", mode: "detached", target: "hall", broker: "broker-adapters"});
  for (const node of [light, z2mCover, shellyCover, shellySwitch]) t.after(() => close(node));
  assert.deepEqual([light.errors, z2mCover.errors, shellyCover.errors, shellySwitch.errors], [[], [], [], []]);
  // A Shelly prefix is one device: all of it. A Zigbee2MQTT friendly name can contain "/": exactly its own topics.
  assert.deepEqual([...broker.subscriptions.keys()].sort(), ["shellyplus1-test/#", "shellyplus2pm-test/#", "z2m/blind", "z2m/blind/availability",
    "z2m/hall-main", "z2m/hall-main/availability", "z2m/hall-main/set"]);
  // Each reads its device once connected, not before: the light and covers through their observe (nothing
  // reported them while Node-RED was away), the Shelly switch its configuration.
  switchRuntime.events.emit("flows:started");
  assert.equal(broker.published.length, 0);
  broker.connect();
  assert.deepEqual(broker.published.map(({topic, payload}) => [topic, payload]).slice(0, 3), [
    ["z2m/hall-main/get", "{\"state\":\"\"}"], ["z2m/blind/get", "{\"position\":\"\"}"], ["shellyplus2pm-test/command/cover:0", "status_update"]]);
  assert.deepEqual(broker.published.slice(3).map(({topic}) => topic), ["shellyplus1-test/rpc", "shellyplus1-test/command"]);
  // Its own read answers no command of the controller's.
  assert.equal(port(shellyCover.sent, 1).length, 0);
  broker.published.length = 0;

  // The room's command: published on the light's /set, nothing on output 1.
  const sent = await receive<Envelope>(light, {light: {kind: "command", target: "main", state: "ON", brightnessPct: 25, transitionSeconds: 1, source: "wall", id: "1"}});
  assert.deepEqual(port(sent, 0), []);
  assert.deepEqual(broker.published, [{topic: "z2m/hall-main/set", payload: "{\"state\":\"ON\",\"brightness\":64,\"transition\":1}", retain: false}]);
  // Its own command back through its subscription is its own; someone else's is external; the report is a reading.
  light.sent.length = 0;
  broker.deliver("z2m/hall-main/set", "{\"state\":\"ON\",\"brightness\":64,\"transition\":1}");
  assert.deepEqual(port(light.sent, 1), [], "its own echo");
  broker.deliver("z2m/hall-main/set", "{\"state\":\"OFF\"}");
  assert.deepEqual(port(light.sent, 1).map(({light: reading}) => (reading as {kind: string}).kind), ["external"]);
  light.sent.length = 0;
  broker.deliver("z2m/hall-main", "{\"state\":\"OFF\",\"brightness\":64}");
  assert.deepEqual(port(light.sent, 1).map(({light: reading}) => (reading as {kind: string; on: boolean}).kind), ["observed"]);
  // Another device named under it ("hall-main/spots") never reaches it.
  const traced = traces(light).length;
  broker.deliver("z2m/hall-main/spots", "{\"state\":\"ON\"}");
  assert.equal(traces(light).length, traced);
  // An MQTT in still wired in: ignored, with a trace.
  assert.deepEqual(await receive(light, {topic: "z2m/hall-main", payload: {state: "ON"}}), []);
  assert.equal(traces(light).at(-1)?.reason, "has-broker");

  // The covers: their device's reports from the broker become readings.
  z2mCover.sent.length = 0;
  broker.deliver("z2m/blind", "{\"position\":40,\"state\":\"STOP\"}");
  assert.ok(port(z2mCover.sent, 1).length > 0, "a zigbee2mqtt cover reading");
  shellyCover.sent.length = 0;
  broker.deliver("shellyplus2pm-test/status/cover:0", "{\"id\":0,\"state\":\"stopped\",\"current_pos\":30,\"pos_control\":true}");
  assert.deepEqual(port(shellyCover.sent, 1).map(({cover}) => [(cover as {position: number}).position]), [[30]]);
  // A cover command: to the broker.
  broker.published.length = 0;
  const observe = await receive<Envelope>(shellyCover, {cover_command: {operation: "observe", requestId: "r", generation: 1, attempt: 1}});
  assert.deepEqual(port(observe, 0), []);
  assert.deepEqual(broker.published, [{topic: "shellyplus2pm-test/command/cover:0", payload: "status_update", retain: false}]);
});

test("activity lighting takes a light's reading as the room passes it on", async (t) => {
  const node = new (runtime(registerActivityLighting).Constructor)({area: "lounge", owner: "activity",
    profiles: JSON.stringify({off: {targets: [], values: {}}, tv: {targets: ["wall"], values: {brightnessPct: 25}}}), confirmationTimeoutMs: 15000, maxAttempts: 2});
  t.after(() => close(node));
  // Before any request: nothing to confirm, so it's dropped.
  assert.deepEqual(await receive(node, {light: {kind: "observed", target: "wall", on: true, fields: ["brightness"], showsLast: true, observedAt: new Date().toISOString(), control: "overridden", manual: false}}), []);
  await receive(node, {activityLighting: {kind: "intent", requestId: "tv-1", generation: 1, profile: "tv"}});
  const ready = await receive<Array<unknown>>(node, {light: {kind: "observed", target: "wall", on: true, fields: ["brightness"], showsLast: true,
    observedAt: new Date(Date.now() + 1000).toISOString(), control: "overridden", manual: false}});
  assert.equal((node.context().get("state") as {phase: string}).phase, "ready");
  assert.ok(ready.length > 0);
});


test("shelly switch node with a Target: the room's commands switch its relay, readings go back on output 3, other lights' commands are ignored silently", async (t) => {
  type Envelope = Array<Array<Record<string, unknown>> | Record<string, unknown> | null>;
  const node = new (runtime(registerShellySwitch).Constructor)({id: "w-light", topicPrefix: "shellyplus1-test", channel: "0", mode: "detached", target: "hall"});
  t.after(() => close(node));
  assert.deepEqual(node.errors, []);
  const port = (sent: unknown[], index: number) => sent.flatMap((envelope) => {
    const out = (envelope as Envelope)[index];
    return out === null || out === undefined ? [] : Array.isArray(out) ? out : [out];
  });
  assert.deepEqual(await receive(node, {light: {kind: "command", target: "lamp", state: "ON", source: "wall", id: "1"}}), [], "another light's");
  const on = await receive<Envelope>(node, {light: {kind: "command", target: "hall", state: "ON", source: "wall", id: "2"}});
  assert.deepEqual(port(on, 0), [{topic: "shellyplus1-test/command/switch:0", payload: "on"}]);
  const report = await receive<Envelope>(node, {topic: "shellyplus1-test/status/switch:0", payload: {id: 0, output: true, source: "MQTT"}});
  assert.deepEqual(port(report, 2).map(({light}) => [(light as {kind: string}).kind, (light as {on: boolean}).on]), [["observed", true]]);
  assert.deepEqual(port(report, 1), [], "nothing for the switch policy");
  assert.deepEqual(node.errors, []);
});

