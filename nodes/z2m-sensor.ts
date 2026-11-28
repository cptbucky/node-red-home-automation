"use strict";

import type {Node, NodeDef, NodeInitializer} from "node-red";
import {normaliseZ2mSensorConfig, transitionZ2mSensor, z2mSensorTopics, type Z2mSensorConfig, type Z2mSensorState} from "../lib/z2m-sensor";
import {invalidConfig, onInput, runReducer, type InputMessage, type Send} from "./adapter";
import {deviceBroker, deviceSide} from "./device-side";
import type {BrokerNode} from "./mqtt-broker-link";

interface Z2mSensorNodeConfig extends NodeDef {
  baseTopic?: string;
  friendlyName?: string;
  occupancyIs?: string;
  // Node-RED's mqtt-broker node, to subscribe itself.
  broker?: string;
}

const registerZ2mSensor: NodeInitializer = (RED) => {
  function HomeZ2mSensor(this: Node, config: Z2mSensorNodeConfig) {
    RED.nodes.createNode(this, config);
    const node = this;
    let device: Z2mSensorConfig;
    let broker: BrokerNode | null;
    try {
      device = normaliseZ2mSensorConfig(config);
      // Newer than the MQTT in and out way of wiring adapters: it needs its
      // broker.
      broker = deviceBroker(RED, config.broker);
      if (!broker) throw new Error("choose its MQTT broker");
    } catch (error) {
      invalidConfig(node, error);
      return;
    }
    const trace = {area: "", component: "z2m-sensor"};
    node.status({fill: "grey", shape: "ring", text: "waiting for the device"});

    // Exactly its own topics: a friendly name can contain "/". Battery
    // sensors can't be asked for a reading, so there is nothing to read on
    // connect: the room learns the sensor's state on its next change.
    const topics = z2mSensorTopics(device);
    const side = deviceSide(node, broker, topics.device, [topics.device, topics.availability], trace, (msg, send) => handle(msg, send));

    function handle(msg: InputMessage, send: Send) {
      const result = runReducer(node, trace, (saved: Partial<Z2mSensorState> | undefined) => transitionZ2mSensor(saved, msg, device));
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
        const parts = [known ? (occupied ? "occupied" : "clear") : "", state.illuminance !== null ? `${state.illuminance} lx` : ""].filter(Boolean);
        if (parts.length) node.status({fill: occupied ? "green" : "grey", shape: "dot", text: parts.join(" · ")});
      }
    }
    onInput(node, (msg, send) => {
      // Its device's messages come from the broker: an MQTT in node wired in
      // changes nothing.
      if (!side.fromBroker(msg)) handle(msg, send);
    });
  }

  RED.nodes.registerType("home-z2m-sensor", HomeZ2mSensor);
};

export = registerZ2mSensor;
