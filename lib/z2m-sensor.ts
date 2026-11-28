"use strict";

// A Zigbee2MQTT motion, presence or light sensor as the room's input: its
// reports become the neutral messages occupancy fusion and the motion
// lighting policy already take. No broker connection here: device messages
// arrive from the node's broker subscription.
//
// From Zigbee2MQTT's documentation (MQTT topics and messages, device
// availability, and its occupancy and illuminance sensor pages):
// - a device publishes its whole state as JSON on <base>/<name>: a PIR
//   motion sensor's "occupancy" (true or false), an mmWave sensor's
//   "presence" (true or false; some report it as "occupancy"), and the
//   light level as "illuminance" in lux, or on older devices as
//   "illuminance_lux" beside a raw "illuminance";
// - device state isn't retained unless retain is set for the device;
// - availability is {"state": "online" | "offline"} on
//   <base>/<name>/availability, retained.

import type {TraceEntry} from "./bounded-trace";
import {isObject, parsedPayload} from "./mqtt-message";

export type OccupancyKind = "motion" | "presence";

export interface Z2mSensorConfig {
  // Zigbee2MQTT's base topic: zigbee2mqtt unless changed in its settings.
  baseTopic: string;
  // The device's friendly name in Zigbee2MQTT.
  friendlyName: string;
  // What the device's "occupancy" field is: PIR motion (most sensors) or,
  // on some mmWave sensors, presence.
  occupancyIs: OccupancyKind;
}

export interface Z2mSensorState {
  // The values last passed on, so only a change is sent again.
  motion: boolean | null;
  presence: boolean | null;
  illuminance: number | null;
  online: boolean | null;
}

export interface Z2mSensorMessage {
  topic?: unknown;
  payload?: unknown;
  retain?: unknown;
}

// For occupancy fusion (output 1) and the motion lighting policy (output 2).
export interface SensorReading {
  source: "motion" | "presence" | "illuminance";
  payload: boolean | number;
}

export function normaliseZ2mSensorConfig(config: {baseTopic?: unknown; friendlyName?: unknown; occupancyIs?: unknown}): Z2mSensorConfig {
  const baseTopic = String(config.baseTopic ?? "").trim().replace(/^\/+|\/+$/g, "") || "zigbee2mqtt";
  // The user's own device's: no default.
  const friendlyName = String(config.friendlyName ?? "").trim().replace(/^\/+|\/+$/g, "");
  if (!friendlyName) throw new Error("the device's friendly name is required");
  if (/[+#]/.test(baseTopic) || /[+#]/.test(friendlyName)) throw new Error("the base topic and friendly name can't contain + or #");
  const occupancyIs = config.occupancyIs === undefined || config.occupancyIs === null || config.occupancyIs === "" ? "motion" : config.occupancyIs;
  if (occupancyIs !== "motion" && occupancyIs !== "presence") throw new Error("occupancy is must be motion or presence");
  return {baseTopic, friendlyName, occupancyIs};
}

export function z2mSensorTopics(config: Z2mSensorConfig) {
  const device = `${config.baseTopic}/${config.friendlyName}`;
  return {device, availability: `${device}/availability`};
}

export function transitionZ2mSensor(
  saved: Partial<Z2mSensorState> | undefined,
  msg: Z2mSensorMessage,
  config: Z2mSensorConfig
) {
  const state: Z2mSensorState = {
    motion: typeof saved?.motion === "boolean" ? saved.motion : null,
    presence: typeof saved?.presence === "boolean" ? saved.presence : null,
    illuminance: typeof saved?.illuminance === "number" ? saved.illuminance : null,
    online: typeof saved?.online === "boolean" ? saved.online : null
  };
  const topics = z2mSensorTopics(config);
  const occupancy: SensorReading[] = [];
  const light: SensorReading[] = [];
  const traces: TraceEntry[] = [];
  const trace = (event: string, outcome: string, reason: string | null = null, details: Record<string, unknown> = {}) => {
    traces.push({event, outcome, reason, details});
  };

  if (msg.topic === topics.device) {
    const report = parsedPayload(msg.payload);
    if (!isObject(report)) throw new Error(`${topics.device} must carry the device's state object`);
    const retained = msg.retain === true;
    // Each occupancy field, as the room's source for it.
    const fields: Array<[OccupancyKind, unknown]> = [];
    if (Object.hasOwn(report, "occupancy")) fields.push([config.occupancyIs, report.occupancy]);
    if (Object.hasOwn(report, "presence")) fields.push(["presence", report.presence]);
    for (const [source, value] of fields) {
      if (typeof value !== "boolean") continue;
      if (retained) {
        // A retained state is an old one: never acted on, and not kept
        // either, so the next live report is passed on whatever it says.
        trace(source, "ignored", "retained", {value});
        continue;
      }
      if (state[source] === value) continue;
      state[source] = value;
      occupancy.push({source, payload: value});
      trace(source, "changed", null, {value});
    }
    // Lux: illuminance_lux where a device sends it beside a raw illuminance.
    const lux = typeof report.illuminance_lux === "number" ? report.illuminance_lux
      : typeof report.illuminance === "number" ? report.illuminance : null;
    if (lux !== null && Number.isFinite(lux) && lux !== state.illuminance) {
      state.illuminance = lux;
      light.push({source: "illuminance", payload: lux});
      trace("illuminance", "changed", null, {lux});
    }
    state.online = true;
  } else if (msg.topic === topics.availability) {
    // {"state": "online"}, or the plain "online" of older setups.
    const received = parsedPayload(msg.payload);
    const value = isObject(received) ? received.state : received;
    if (value !== "online" && value !== "offline") throw new Error(`${topics.availability} must say online or offline`);
    state.online = value === "online";
    trace("availability", value);
  } else {
    trace("message", "ignored", "other-topic", {topic: typeof msg.topic === "string" ? msg.topic : null});
  }
  return {state, occupancy, light, traces};
}
