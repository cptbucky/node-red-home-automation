"use strict";

import type {Node, NodeDef, NodeInitializer} from "node-red";
import {normaliseZ2mPowerConfig, transitionZ2mPower, z2mPowerTopics, type Z2mPowerConfig, type Z2mPowerState} from "../lib/z2m-power";
import {invalidConfig, onInput, runReducer, type InputMessage, type Send} from "./adapter";
import {deviceBroker, deviceSide} from "./device-side";
import type {BrokerNode} from "./mqtt-broker-link";

interface Z2mPowerNodeConfig extends NodeDef {
  baseTopic?: string;
  friendlyName?: string;
  // Node-RED's mqtt-broker node, to subscribe itself.
  broker?: string;
}

const registerZ2mPower: NodeInitializer = (RED) => {
  function HomeZ2mPower(this: Node, config: Z2mPowerNodeConfig) {
    RED.nodes.createNode(this, config);
    const node = this;
    let device: Z2mPowerConfig;
    let broker: BrokerNode | null;
    try {
      device = normaliseZ2mPowerConfig(config);
      // Newer than the MQTT in and out way of wiring adapters: it needs its
      // broker.
      broker = deviceBroker(RED, config.broker);
      if (!broker) throw new Error("choose its MQTT broker");
    } catch (error) {
      invalidConfig(node, error);
      return;
    }
    const trace = {area: "", component: "z2m-power"};
    node.status({fill: "grey", shape: "ring", text: "waiting for the device"});

    // Exactly its own topics: a friendly name can contain "/". On each
    // connect it asks the plug for its power, which plugs that support
    // /get answer; the rest report on their next change.
    const topics = z2mPowerTopics(device);
    const side = deviceSide(node, broker, topics.device, [topics.device, topics.availability], trace, (msg, send) => handle(msg, send),
      () => handle({power: {kind: "read"}} as InputMessage, node.send.bind(node)));

    function handle(msg: InputMessage, send: Send) {
      const result = runReducer(node, trace, (saved: Partial<Z2mPowerState> | undefined, now) => transitionZ2mPower(saved, msg, device, now));
      // Its read requests to the plug through the broker; its readings, as
      // msg.power, on its output.
      side.publish(result.publications);
      if (result.readings.length) send([result.readings.map((reading) => ({payload: reading.power.watts, ...reading}))]);
      const state = result.state;
      if (state.online === false) node.status({fill: "grey", shape: "ring", text: "offline"});
      else if (state.watts !== null) node.status({fill: state.watts > 0 ? "green" : "grey", shape: "dot", text: `${state.watts} W`});
    }
    onInput(node, (msg, send) => {
      // Its device's messages come from the broker: an MQTT in node wired in
      // changes nothing.
      if (!side.fromBroker(msg)) handle(msg, send);
    });
  }

  RED.nodes.registerType("home-z2m-power", HomeZ2mPower);
};

export = registerZ2mPower;
