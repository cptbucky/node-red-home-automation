"use strict";

import type {Node, NodeDef, NodeInitializer} from "node-red";
import {esphomeSensorTopics, normaliseEsphomeSensorConfig, transitionEsphomeSensor, type EsphomeSensorConfig, type EsphomeSensorState} from "../lib/esphome-sensor";
import {invalidConfig, onInput, runReducer, type InputMessage, type Send} from "./adapter";
import {deviceBroker, deviceSide} from "./device-side";
import type {BrokerNode} from "./mqtt-broker-link";

interface EsphomeSensorNodeConfig extends NodeDef {
  device?: string;
  discoveryPrefix?: string;
  // Node-RED's mqtt-broker node, to subscribe itself.
  broker?: string;
}

// One node type per ESPHome device: its entity names belong to its
// product's firmware, so the model is the node's, not a setting. Each
// device's node registers this with its model (see ESPHOME_MODELS).
export function esphomeSensorNode(type: string, model: string): NodeInitializer {
  return (RED) => {
    function HomeEsphomeSensor(this: Node, config: EsphomeSensorNodeConfig) {
      RED.nodes.createNode(this, config);
      const node = this;
      let device: EsphomeSensorConfig;
      let broker: BrokerNode | null;
      try {
        device = normaliseEsphomeSensorConfig({device: config.device, model, discoveryPrefix: config.discoveryPrefix});
        // Newer than the MQTT in and out way of wiring adapters: it needs its
        // broker.
        broker = deviceBroker(RED, config.broker);
        if (!broker) throw new Error("choose its MQTT broker");
      } catch (error) {
        invalidConfig(node, error);
        return;
      }
      const trace = {area: "", component: "esphome-sensor"};
      node.status({fill: "grey", shape: "ring", text: "waiting for the device"});

      // Its discovery, its status and its preset's entities; then whatever its
      // discovery names. ESPHome retains them, so on connect the broker hands
      // over the device's description and current state, which passes as a
      // baseline while the device is online.
      const topics = esphomeSensorTopics(device);
      const subscribed = new Set(topics.initial);
      const side = deviceSide(node, broker, device.device, topics.initial, trace, (msg, send) => handle(msg, send));

      function handle(msg: InputMessage, send: Send) {
        const result = runReducer(node, trace, (saved: Partial<EsphomeSensorState> | undefined) => transitionEsphomeSensor(saved, msg, device));
        for (const topic of result.topics) {
          if (subscribed.has(topic)) continue;
          subscribed.add(topic);
          side.subscribe(topic);
        }
        // Output 1: motion and presence, for occupancy fusion. Output 2: the
        // light level, for the motion lighting policy.
        const outputs = [
          result.occupancy.length ? result.occupancy.map((reading) => ({...reading})) : null,
          result.light.length ? result.light.map((reading) => ({...reading})) : null
        ];
        if (outputs.some((output) => output !== null)) send(outputs);
        const state = result.state;
        if (state.online === false) {
          node.status({fill: "grey", shape: "ring", text: "offline"});
        } else {
          const occupied = state.motion === true || state.presence === true;
          const known = state.motion !== null || state.presence !== null;
          // And where its entities came from: its discovery, or its preset.
          const source = result.roles.source === "discovered" ? "discovered" : result.roles.source === "preset" ? "preset" : "preset: discovery is another model";
          const parts = [known ? (occupied ? "occupied" : "clear") : "", state.illuminance !== null ? `${state.illuminance} lx` : "", source].filter(Boolean);
          node.status({fill: occupied ? "green" : "grey", shape: known ? "dot" : "ring", text: parts.join(" · ")});
        }
      }
      onInput(node, (msg, send) => {
        // Its device's messages come from the broker: an MQTT in node wired in
        // changes nothing.
        if (!side.fromBroker(msg)) handle(msg, send);
      });
    }

    RED.nodes.registerType(type, HomeEsphomeSensor);
  };
}
