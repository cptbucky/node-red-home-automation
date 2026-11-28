"use strict";

// A Zigbee2MQTT plug or meter as a power reading: its "power" becomes
// msg.power, which the display controller (as its projector's reading) and
// a scene (its "end below" trigger) take. Each judges the watts its own
// way. No broker connection here: device messages arrive from the node's
// broker subscription.
//
// From Zigbee2MQTT's documentation (MQTT topics and messages, device
// availability, and its plugs' pages): a plug publishes its whole state as
// JSON on <base>/<name>, with "power" in watts on those that meter;
// <base>/<name>/get with {"power": ""} asks it to read power, where the
// device supports it; device state isn't retained unless retain is set for
// the device; availability is {"state": "online" | "offline"} on
// <base>/<name>/availability, retained.

import type {TraceEntry} from "./bounded-trace";
import {isObject, parsedPayload, type MqttPublication} from "./mqtt-message";

export interface Z2mPowerConfig {
  // Zigbee2MQTT's base topic: zigbee2mqtt unless changed in its settings.
  baseTopic: string;
  // The device's friendly name in Zigbee2MQTT.
  friendlyName: string;
}

export interface Z2mPowerState {
  // The watts last passed on, so only a change is sent again.
  watts: number | null;
  online: boolean | null;
}

export interface Z2mPowerMessage {
  topic?: unknown;
  payload?: unknown;
  power?: unknown;
}

// The fixed neutral reading: msg.power.
export interface PowerReading {
  kind: "observed";
  watts: number;
  observedAt: string;
}

export function normaliseZ2mPowerConfig(config: {baseTopic?: unknown; friendlyName?: unknown}): Z2mPowerConfig {
  const baseTopic = String(config.baseTopic ?? "").trim().replace(/^\/+|\/+$/g, "") || "zigbee2mqtt";
  // The user's own device's: no default.
  const friendlyName = String(config.friendlyName ?? "").trim().replace(/^\/+|\/+$/g, "");
  if (!friendlyName) throw new Error("the device's friendly name is required");
  if (/[+#]/.test(baseTopic) || /[+#]/.test(friendlyName)) throw new Error("the base topic and friendly name can't contain + or #");
  return {baseTopic, friendlyName};
}

export function z2mPowerTopics(config: Z2mPowerConfig) {
  const device = `${config.baseTopic}/${config.friendlyName}`;
  return {device, get: `${device}/get`, availability: `${device}/availability`};
}

export function transitionZ2mPower(
  saved: Partial<Z2mPowerState> | undefined,
  msg: Z2mPowerMessage,
  config: Z2mPowerConfig,
  now: Date
) {
  const state: Z2mPowerState = {
    watts: typeof saved?.watts === "number" ? saved.watts : null,
    online: typeof saved?.online === "boolean" ? saved.online : null
  };
  const topics = z2mPowerTopics(config);
  const publications: MqttPublication[] = [];
  const readings: Array<{power: PowerReading}> = [];
  const traces: TraceEntry[] = [];
  const trace = (event: string, outcome: string, reason: string | null = null, details: Record<string, unknown> = {}) => {
    traces.push({event, outcome, reason, details});
  };

  if (isObject(msg.power)) {
    if (msg.power.kind === "read") {
      // A fresh reading, where the device answers /get; otherwise its next
      // report.
      publications.push({topic: topics.get, payload: JSON.stringify({power: ""})});
      trace("read", "sent");
    } else {
      trace("message", "ignored", "not-a-read-request", {kind: String(msg.power.kind)});
    }
  } else if (msg.topic === topics.device) {
    const report = parsedPayload(msg.payload);
    if (!isObject(report)) throw new Error(`${topics.device} must carry the device's state object`);
    const watts = report.power;
    state.online = true;
    if (typeof watts !== "number" || !Number.isFinite(watts) || watts < 0) {
      // A fixed contract: only watts pass. A report without power (or
      // nothing new) sends nothing.
      if (watts !== undefined) trace("power", "ignored", "not-watts", {value: watts});
    } else if (watts !== state.watts) {
      state.watts = watts;
      readings.push({power: {kind: "observed", watts, observedAt: now.toISOString()}});
      trace("power", "changed", null, {watts});
    }
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
  return {state, publications, readings, traces};
}
