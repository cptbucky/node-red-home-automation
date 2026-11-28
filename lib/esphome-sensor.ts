"use strict";

// An ESPHome presence sensor as the room's input: its motion, presence and
// light-level entities become the messages occupancy fusion and the motion
// lighting policy take. Each device has its own node (entity names belong
// to each product's firmware); this module is what they share.
//
// Which entities: first from the device's own discovery description, so a
// firmware rename doesn't break it; otherwise from the device's preset.
//
// From ESPHome's MQTT documentation: each entity's state is published on
// <topic prefix>/<component>/<name>/state, the topic prefix being the
// device's name unless set; states are retained by default; the device
// announces itself with "online" (and its last will "offline") on
// <topic prefix>/status; with discovery on (ESPHome's default), it
// describes each entity, retained, on
// <discovery prefix>/<component>/<device name>/<object id>/config, with
// its state topic and device class, in Home Assistant's discovery format
// (keys often abbreviated: stat_t, dev_cla, avty_t, dev.mdl). Binary
// sensors publish ON or OFF and sensors a number as text (seen on both
// models).
//
// While the device is online, a retained state is its current state, so as
// Node-RED starts the room learns it as a baseline (msg.baseline = true):
// occupied switches nothing on; empty starts the room's vacancy. A retained
// state from a device that isn't online is ignored.

import type {TraceEntry} from "./bounded-trace";
import {isObject} from "./mqtt-message";

export type SensorRole = "motion" | "presence" | "illuminance";

export interface EsphomeModel {
  label: string;
  // Fragments of the model name its discovery gives (dev.mdl), compared
  // lower case with only letters and digits.
  modelNames: readonly string[];
  // Discovered entities (object ids) that aren't one of its raw sensors.
  exclude: readonly string[];
  // The preset: each role's entity names, used without discovery. Several
  // in one role count as one: on when any that has reported is on, off
  // when every one that has reported is off. One firmware may publish only
  // some of them, so one that never reports doesn't hold a role.
  motion: readonly string[];
  presence: readonly string[];
  illuminance: readonly string[];
}

export const ESPHOME_MODELS: Readonly<Record<string, EsphomeModel>> = {
  "everything-presence-one": {
    label: "Everything Presence One",
    modelNames: ["everythingpresenceone"],
    // Its own "Occupancy" combines the PIR and radar, with its own off
    // latency: occupancy fusion does that combining here.
    exclude: ["occupancy"],
    motion: ["pir"],
    presence: ["mmwave"],
    illuminance: ["illuminance"]
  },
  "apollo-r-pro-1": {
    label: "Apollo R PRO-1",
    modelNames: ["rpro1"],
    exclude: [],
    // Its two radars, LD2450 and LD2412: a moving target is motion. Its
    // firmware has named the LD2450's entities both without a prefix
    // (presence, moving_target) and, currently, with ld2450_.
    motion: ["moving_target", "ld2450_moving_target", "ld2412_moving_target"],
    presence: ["presence", "ld2450_presence", "ld2412_presence"],
    illuminance: ["ltr390_light"]
  }
};

export interface EsphomeSensorConfig {
  // The device's name: its topic prefix unless set otherwise, and the name
  // its discovery is under.
  device: string;
  model: string;
  discoveryPrefix: string;
}

// One discovered entity.
export interface DiscoveredEntity {
  component: string;
  object: string;
  stateTopic: string;
  deviceClass: string | null;
  model: string | null;
  availabilityTopic: string | null;
}

export interface EsphomeSensorState {
  // Each binary entity's last state, by state topic, and the roles as
  // last sent.
  entities: Record<string, boolean>;
  motion: boolean | null;
  presence: boolean | null;
  illuminance: number | null;
  online: boolean | null;
  // Retained states held until the device's status says it is online.
  awaitingStatus: boolean;
  // The device's discovery, by its config topic.
  discovered: Record<string, DiscoveredEntity>;
}

export interface EsphomeSensorMessage {
  topic?: unknown;
  payload?: unknown;
  retain?: unknown;
}

export interface OccupancyMessage {
  source: "motion" | "presence";
  payload: boolean;
  baseline?: true;
}

export interface LightMessage {
  source: "illuminance";
  payload: number;
}

// Where the roles come from: the device's discovery, or its preset (none
// found, or it describes another model).
export type RoleSource = "discovered" | "preset" | "preset-other-model";

export interface Roles {
  source: RoleSource;
  motion: string[];
  presence: string[];
  illuminance: string[];
  status: string[];
}

export function normaliseEsphomeSensorConfig(config: {device?: unknown; model?: unknown; discoveryPrefix?: unknown}): EsphomeSensorConfig {
  const device = String(config.device ?? "").trim().replace(/^\/+|\/+$/g, "");
  // The user's own device's: no default.
  if (!device) throw new Error("the device's name is required");
  if (/[+#]/.test(device)) throw new Error("the device's name can't contain + or #");
  const model = String(config.model ?? "");
  if (!Object.hasOwn(ESPHOME_MODELS, model)) throw new Error(`unknown model: ${model}`);
  const discoveryPrefix = String(config.discoveryPrefix ?? "").trim().replace(/^\/+|\/+$/g, "") || "homeassistant";
  if (/[+#]/.test(discoveryPrefix)) throw new Error("the discovery prefix can't contain + or #");
  return {device, model, discoveryPrefix};
}

// The topics a node subscribes to as it starts: the device's discovery,
// its status, and its preset's states (until discovery says otherwise).
export function esphomeSensorTopics(config: EsphomeSensorConfig) {
  const preset = presetRoles(config, "preset");
  return {
    discovery: `${config.discoveryPrefix}/+/${config.device}/+/config`,
    initial: [...new Set([`${config.discoveryPrefix}/+/${config.device}/+/config`, ...preset.status, ...preset.presence,
      ...preset.motion, ...preset.illuminance])]
  };
}

function presetRoles(config: EsphomeSensorConfig, source: RoleSource): Roles {
  const model = ESPHOME_MODELS[config.model]!;
  const binary = (name: string) => `${config.device}/binary_sensor/${name}/state`;
  return {
    source,
    motion: model.motion.map(binary),
    presence: model.presence.map(binary),
    illuminance: model.illuminance.map((name) => `${config.device}/sensor/${name}/state`),
    status: [`${config.device}/status`]
  };
}

const simplified = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

// The roles, from the device's discovery when it has one for this model.
export function esphomeRoles(state: Pick<EsphomeSensorState, "discovered">, config: EsphomeSensorConfig): Roles {
  const model = ESPHOME_MODELS[config.model]!;
  const entities = Object.values(state.discovered).filter((entity) => !model.exclude.includes(entity.object));
  if (!entities.length) return presetRoles(config, "preset");
  const models = entities.map((entity) => entity.model).filter((name): name is string => Boolean(name));
  if (models.some((name) => !model.modelNames.some((fragment) => simplified(name).includes(fragment)))) {
    return presetRoles(config, "preset-other-model");
  }
  const of = (component: string, classes: string[]) => entities
    .filter((entity) => entity.component === component && entity.deviceClass !== null && classes.includes(entity.deviceClass))
    .map((entity) => entity.stateTopic);
  const status = [...new Set([`${config.device}/status`, ...entities.map((entity) => entity.availabilityTopic)
    .filter((topic): topic is string => Boolean(topic))])];
  return {
    source: "discovered",
    motion: of("binary_sensor", ["motion"]),
    presence: of("binary_sensor", ["occupancy", "presence"]),
    illuminance: of("sensor", ["illuminance"]),
    status
  };
}

function text(payload: unknown): string {
  return (Buffer.isBuffer(payload) ? payload.toString("utf8") : String(payload ?? "")).trim();
}

// A discovery entry's fields, from Home Assistant's discovery format with
// or without its abbreviated keys. Its "~" base-topic shorthand isn't
// expanded: ESPHome gives full state and availability topics.
function discoveredEntity(component: string, object: string, payload: string): DiscoveredEntity | "disabled" | null {
  let entry: unknown;
  try {
    entry = JSON.parse(payload) as unknown;
  } catch {
    return null;
  }
  if (!isObject(entry)) return null;
  // Disabled by default on the device (ESPHome's disabled_by_default, "en":
  // false): its maker doesn't mean it as one of its sensors, such as the
  // Apollo's LD2412 light level, a radar reading rather than lux.
  if (entry.en === false || entry.enabled_by_default === false) return "disabled";
  const field = (short: string, long: string) => (typeof entry[short] === "string" ? entry[short] : typeof entry[long] === "string" ? entry[long] : null) as string | null;
  const stateTopic = field("stat_t", "state_topic");
  if (!stateTopic) return null;
  const device = isObject(entry.dev) ? entry.dev : isObject(entry.device) ? entry.device : {};
  const model = typeof device.mdl === "string" ? device.mdl : typeof device.model === "string" ? device.model : null;
  return {component, object, stateTopic, deviceClass: field("dev_cla", "device_class"), model, availabilityTopic: field("avty_t", "availability_topic")};
}

export function transitionEsphomeSensor(
  saved: Partial<EsphomeSensorState> | undefined,
  msg: EsphomeSensorMessage,
  config: EsphomeSensorConfig
) {
  const state: EsphomeSensorState = {
    entities: saved?.entities && typeof saved.entities === "object" ? {...saved.entities} : {},
    motion: typeof saved?.motion === "boolean" ? saved.motion : null,
    presence: typeof saved?.presence === "boolean" ? saved.presence : null,
    illuminance: typeof saved?.illuminance === "number" ? saved.illuminance : null,
    online: typeof saved?.online === "boolean" ? saved.online : null,
    awaitingStatus: saved?.awaitingStatus === true,
    discovered: saved?.discovered && typeof saved.discovered === "object" ? {...saved.discovered} : {}
  };
  const occupancy: OccupancyMessage[] = [];
  const light: LightMessage[] = [];
  const traces: TraceEntry[] = [];
  const trace = (event: string, outcome: string, reason: string | null = null, details: Record<string, unknown> = {}) => {
    traces.push({event, outcome, reason, details});
  };
  const before = esphomeRoles(state, config);

  // A role's value from the entities that have reported: on when any is
  // on, off when all are off, not known while none has reported.
  function roleValue(roles: Roles, role: "motion" | "presence"): boolean | null {
    const reported = roles[role].map((topic) => state.entities[topic]).filter((value) => value !== undefined);
    if (!reported.length) return null;
    return reported.some((value) => value === true);
  }

  // Each occupancy role that changed, presence first: at a start, presence
  // holds the room before motion's "off" could empty it.
  function sendRoles(roles: Roles, baseline: boolean) {
    for (const role of ["presence", "motion"] as const) {
      const value = roleValue(roles, role);
      if (value === null || value === state[role]) continue;
      state[role] = value;
      occupancy.push(baseline ? {source: role, payload: value, baseline: true} : {source: role, payload: value});
      trace(role, baseline ? "baseline" : "changed", null, {value});
    }
  }

  const retained = msg.retain === true;
  const topic = typeof msg.topic === "string" ? msg.topic : "";
  const discovery = topic.split("/");
  const prefixParts = config.discoveryPrefix.split("/").length;
  if (topic.startsWith(`${config.discoveryPrefix}/`) && discovery.length === prefixParts + 4 && discovery.at(-1) === "config" &&
    discovery[prefixParts + 1] === config.device) {
    const component = discovery[prefixParts]!;
    const object = discovery[prefixParts + 2]!;
    const payload = text(msg.payload);
    if (component !== "binary_sensor" && component !== "sensor") {
      trace("discovery", "ignored", "other-component", {component, object});
    } else if (payload === "") {
      // An entity removed from the device.
      delete state.discovered[topic];
      trace("discovery", "removed", null, {object});
    } else {
      const entity = discoveredEntity(component, object, payload);
      if (entity === "disabled") {
        delete state.discovered[topic];
        trace("discovery", "ignored", "disabled", {object});
      } else if (!entity) {
        trace("discovery", "ignored", "no-state-topic", {object});
      } else {
        state.discovered[topic] = entity;
      }
    }
    const after = esphomeRoles(state, config);
    if (JSON.stringify(after) !== JSON.stringify(before)) {
      const preset = presetRoles(config, "preset");
      // Discovery wins over the preset; where they differ, it's traced.
      const differs = after.source === "discovered" &&
        (["motion", "presence", "illuminance"] as const).some((role) => JSON.stringify([...after[role]].sort()) !== JSON.stringify([...preset[role]].sort()));
      trace("roles", after.source, differs ? "differs-from-preset" : null,
        {motion: after.motion, presence: after.presence, illuminance: after.illuminance});
    }
  } else if (before.status.includes(topic)) {
    const status = text(msg.payload).toLowerCase();
    if (status !== "online" && status !== "offline") {
      trace("availability", "ignored", "not-online-or-offline", {status});
    } else {
      state.online = status === "online";
      trace("availability", status);
      if (state.online && state.awaitingStatus) {
        // The retained states held for this: the room as it is at start.
        state.awaitingStatus = false;
        sendRoles(before, true);
      } else if (!state.online) {
        // A device that isn't online: what it last retained isn't current.
        state.awaitingStatus = false;
        if (retained) state.entities = {};
      }
    }
  } else if (before.motion.includes(topic) || before.presence.includes(topic)) {
    const value = text(msg.payload).toUpperCase();
    if (value !== "ON" && value !== "OFF") {
      // A fixed contract: only ON and OFF pass.
      trace("state", "ignored", "not-on-or-off", {topic, value});
    } else if (retained && state.online === false) {
      trace("state", "ignored", "retained-while-offline", {topic});
    } else {
      state.entities[topic] = value === "ON";
      if (retained && state.online !== true) {
        state.awaitingStatus = true;
        trace("state", "held", "awaiting-status", {topic});
      } else {
        sendRoles(before, retained);
      }
    }
  } else if (before.illuminance.includes(topic)) {
    const lux = Number(text(msg.payload));
    if (text(msg.payload) === "" || !Number.isFinite(lux)) {
      // A fixed contract: only a number passes ("nan" doesn't).
      trace("illuminance", "ignored", "not-a-number", {value: text(msg.payload)});
    } else if (retained && state.online === false) {
      trace("illuminance", "ignored", "retained-while-offline");
    } else if (lux !== state.illuminance) {
      state.illuminance = lux;
      light.push({source: "illuminance", payload: lux});
      trace("illuminance", "changed", null, {lux});
    }
  } else {
    trace("message", "ignored", "other-topic", {topic: topic || null});
  }
  const roles = esphomeRoles(state, config);
  // Every topic the node needs now: it subscribes to any it hasn't yet.
  const topics = [...new Set([esphomeSensorTopics(config).discovery, ...roles.status, ...roles.presence, ...roles.motion, ...roles.illuminance])];
  return {state, occupancy, light, traces, roles, topics};
}
