"use strict";

// An ESPHome presence sensor as the room's input: the entities its model
// uses for motion, presence and light level become the messages occupancy
// fusion and the motion lighting policy take. Models are named, with their
// entities fixed here: a new ESPHome device is a new model.
//
// From ESPHome's MQTT documentation: each entity's state is published on
// <topic prefix>/<component>/<name>/state, the topic prefix being the
// device's name unless set; states are retained by default; the device
// announces itself with "online" (and its last will "offline") on
// <topic prefix>/status. Binary sensors publish ON or OFF and sensors a
// number as text (seen on both models).
//
// While the device is online, a retained state is its current state, so as
// Node-RED starts the room learns it as a baseline (msg.baseline = true):
// occupied switches nothing on; empty starts the room's vacancy. A retained
// state from a device that isn't online is ignored.

import type {TraceEntry} from "./bounded-trace";

export type SensorRole = "motion" | "presence" | "illuminance";

export interface EsphomeModel {
  label: string;
  // Each role's entity names; several in one role count as one: on when
  // any that has reported is on, off when every one that has reported is
  // off. One firmware may publish only some of them (an entity renamed in
  // a later firmware), so one that never reports doesn't hold a role.
  motion: readonly string[];
  presence: readonly string[];
  illuminance: readonly string[];
}

export const ESPHOME_MODELS: Readonly<Record<string, EsphomeModel>> = {
  "everything-presence-one": {
    label: "Everything Presence One",
    // Its PIR and mmWave radar as they are: occupancy fusion combines them
    // (not the device's own "occupancy").
    motion: ["pir"],
    presence: ["mmwave"],
    illuminance: ["illuminance"]
  },
  "apollo-r-pro-1": {
    label: "Apollo R PRO-1",
    // Its two radars, LD2450 and LD2412: a moving target is motion. Its
    // firmware has named the LD2450's entities both without a prefix
    // (presence, moving_target) and, currently, with ld2450_.
    motion: ["moving_target", "ld2450_moving_target", "ld2412_moving_target"],
    presence: ["presence", "ld2450_presence", "ld2412_presence"],
    illuminance: ["ltr390_light"]
  }
};

export interface EsphomeSensorConfig {
  // The device's topic prefix: its ESPHome name unless set otherwise.
  device: string;
  model: string;
}

export interface EsphomeSensorState {
  // Each binary entity's last state, and the roles as last sent.
  entities: Record<string, boolean>;
  motion: boolean | null;
  presence: boolean | null;
  illuminance: number | null;
  online: boolean | null;
  // Retained states held until the device's status says it is online.
  awaitingStatus: boolean;
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

export function normaliseEsphomeSensorConfig(config: {device?: unknown; model?: unknown}): EsphomeSensorConfig {
  const device = String(config.device ?? "").trim().replace(/^\/+|\/+$/g, "");
  // The user's own device's: no default.
  if (!device) throw new Error("the device's topic prefix is required");
  if (/[+#]/.test(device)) throw new Error("the device's topic prefix can't contain + or #");
  const model = String(config.model ?? "");
  if (!Object.hasOwn(ESPHOME_MODELS, model)) throw new Error(`unknown model: choose ${Object.keys(ESPHOME_MODELS).join(" or ")}`);
  return {device, model};
}

export function esphomeSensorTopics(config: EsphomeSensorConfig) {
  const model = ESPHOME_MODELS[config.model]!;
  const binary = (name: string) => `${config.device}/binary_sensor/${name}/state`;
  return {
    status: `${config.device}/status`,
    binary: [...model.presence, ...model.motion].map(binary),
    illuminance: model.illuminance.map((name) => `${config.device}/sensor/${name}/state`)
  };
}

function text(payload: unknown): string {
  return (Buffer.isBuffer(payload) ? payload.toString("utf8") : String(payload ?? "")).trim();
}

export function transitionEsphomeSensor(
  saved: Partial<EsphomeSensorState> | undefined,
  msg: EsphomeSensorMessage,
  config: EsphomeSensorConfig
) {
  const model = ESPHOME_MODELS[config.model]!;
  const state: EsphomeSensorState = {
    entities: saved?.entities && typeof saved.entities === "object" ? {...saved.entities} : {},
    motion: typeof saved?.motion === "boolean" ? saved.motion : null,
    presence: typeof saved?.presence === "boolean" ? saved.presence : null,
    illuminance: typeof saved?.illuminance === "number" ? saved.illuminance : null,
    online: typeof saved?.online === "boolean" ? saved.online : null,
    awaitingStatus: saved?.awaitingStatus === true
  };
  const topics = esphomeSensorTopics(config);
  const occupancy: OccupancyMessage[] = [];
  const light: LightMessage[] = [];
  const traces: TraceEntry[] = [];
  const trace = (event: string, outcome: string, reason: string | null = null, details: Record<string, unknown> = {}) => {
    traces.push({event, outcome, reason, details});
  };

  // A role's value from the entities that have reported: on when any is
  // on, off when all are off, not known while none has reported.
  function roleValue(role: "motion" | "presence"): boolean | null {
    const reported = model[role].map((name) => state.entities[name]).filter((value) => value !== undefined);
    if (!reported.length) return null;
    return reported.some((value) => value === true);
  }

  // Each occupancy role that changed, presence first: at a start, presence
  // holds the room before motion's "off" could empty it.
  function sendRoles(baseline: boolean) {
    for (const role of ["presence", "motion"] as const) {
      const value = roleValue(role);
      if (value === null || value === state[role]) continue;
      state[role] = value;
      occupancy.push(baseline ? {source: role, payload: value, baseline: true} : {source: role, payload: value});
      trace(role, baseline ? "baseline" : "changed", null, {value});
    }
  }

  const retained = msg.retain === true;
  if (msg.topic === topics.status) {
    const status = text(msg.payload).toLowerCase();
    if (status !== "online" && status !== "offline") {
      trace("availability", "ignored", "not-online-or-offline", {status});
    } else {
      state.online = status === "online";
      trace("availability", status);
      if (state.online && state.awaitingStatus) {
        // The retained states held for this: the room as it is at start.
        state.awaitingStatus = false;
        sendRoles(true);
      } else if (!state.online) {
        // A device that isn't online: what it last retained isn't current.
        state.awaitingStatus = false;
        if (retained) state.entities = {};
      }
    }
  } else if (typeof msg.topic === "string" && topics.binary.includes(msg.topic)) {
    const name = msg.topic.split("/").at(-2)!;
    const value = text(msg.payload).toUpperCase();
    if (value !== "ON" && value !== "OFF") {
      // A fixed contract: only ON and OFF pass.
      trace("state", "ignored", "not-on-or-off", {entity: name, value});
    } else if (retained && state.online === false) {
      trace("state", "ignored", "retained-while-offline", {entity: name});
    } else {
      state.entities[name] = value === "ON";
      if (retained && state.online !== true) {
        state.awaitingStatus = true;
        trace("state", "held", "awaiting-status", {entity: name});
      } else {
        sendRoles(retained);
      }
    }
  } else if (typeof msg.topic === "string" && topics.illuminance.includes(msg.topic)) {
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
    trace("message", "ignored", "other-topic", {topic: typeof msg.topic === "string" ? msg.topic : null});
  }
  return {state, occupancy, light, traces};
}
