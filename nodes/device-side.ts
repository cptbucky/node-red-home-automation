"use strict";

// A device adapter's MQTT side, either way it is set up:
// - with a Broker (Node-RED's mqtt-broker node), it subscribes to its
//   device's topics and publishes on them itself (mqtt-broker-link.ts): its
//   device output is quiet, and a device message arriving on its input (an
//   MQTT in still wired in) or a Status node's message is ignored with a
//   trace, so nothing is doubled. Its own commands come back through its
//   subscription, as through an MQTT in node before, so its echo handling
//   is unchanged.
// - without one, as before 6.2: device messages from an MQTT in node, and
//   its publications on output 1 for an MQTT out node.

import type {Node} from "node-red";
import {appendTrace, type TraceMetadata} from "../lib/bounded-trace";
import {objectField, type InputMessage, type Send} from "./adapter";
import {brokerLink, type BrokerNode} from "./mqtt-broker-link";

export interface DevicePublication {
  topic: string;
  payload: unknown;
  retain?: boolean;
}

export interface DeviceSide {
  broker: boolean;
  // Its publications: to the broker, with null for output 1; without a
  // broker, the messages for output 1 (null when none).
  publish(publications: readonly DevicePublication[]): Array<Record<string, unknown>> | null;
  // Whether a message is one it now gets from the broker itself, ignored
  // with a trace; always false without a broker.
  fromBroker(msg: InputMessage): boolean;
  // Subscribes to one more topic, as one learned after start (an ESPHome
  // device's discovered state topics); nothing without a broker.
  subscribe(topic: string): void;
}

// MQTT payloads as text: an object as JSON, as the broker node would.
function text(payload: unknown): string {
  if (payload === null || payload === undefined) return "";
  if (typeof payload === "string") return payload;
  if (typeof payload === "object") return JSON.stringify(payload);
  return String(payload);
}

export function deviceSide(
  node: Node,
  broker: BrokerNode | null,
  // Every topic of its device lies under this prefix (or is it): a message
  // on its input there is one it now gets from the broker.
  prefix: string,
  // What it subscribes to: its device's topics.
  subscriptions: string[],
  trace: TraceMetadata,
  // The node's own input handling, for a device message from the broker.
  handle: (msg: InputMessage, send: Send) => void,
  // On each connect, reconnects included: whatever it does at startup.
  onConnected?: () => void
): DeviceSide {
  if (!broker) {
    return {
      broker: false,
      publish: (publications) => publications.length ? publications.map((publication) => ({...publication})) : null,
      fromBroker: () => false,
      subscribe: () => {}
    };
  }
  const link = brokerLink(broker, node.id, (error) => node.error(error));
  const subscribe = (topic: string) => {
    link.subscribe(topic, (message) => handle({topic: message.topic, payload: message.payload, retain: message.retain} as InputMessage, node.send.bind(node)));
  };
  for (const topic of subscriptions) subscribe(topic);
  if (onConnected) link.onConnected(onConnected);
  node.on("close", (removed: boolean, done: () => void) => link.close(removed, done));
  return {
    broker: true,
    subscribe,
    publish(publications) {
      for (const {topic, payload, retain} of publications) link.publish(topic, text(payload), {retain: retain === true});
      return null;
    },
    fromBroker(msg) {
      const status = objectField<{source?: unknown; text?: unknown}>(msg, "status");
      const statusNode = Boolean(status && status.source && typeof status.source === "object");
      const device = typeof msg.topic === "string" && (msg.topic === prefix || msg.topic.startsWith(prefix + "/"));
      if (!statusNode && !device) return false;
      appendTrace(node.context(), trace, [{event: "input", outcome: "ignored", reason: "has-broker",
        details: statusNode ? {status: String(status!.text ?? "")} : {topic: msg.topic}}]);
      return true;
    }
  };
}

// The Broker setting of an adapter: the mqtt-broker node, or null without
// one (as before 6.2, through MQTT in and out nodes).
export function deviceBroker(RED: {nodes: {getNode(id: string): unknown}}, value: unknown): BrokerNode | null {
  const id = typeof value === "string" ? value.trim() : "";
  if (!id) return null;
  const broker = RED.nodes.getNode(id) as BrokerNode | null;
  if (!broker) throw new Error("its MQTT broker node isn't in the flows: choose one, or none to use MQTT in and out nodes");
  return broker;
}
