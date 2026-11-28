"use strict";

import type {Node, NodeDef, NodeInitializer} from "node-red";
import {
  transitionOccupancy,
  type OccupancyConfig,
  type OccupancyInput,
  type OccupancyState
} from "../lib/occupancy-fusion";
import {
  occupancyRetainedTopics,
  occupancyStartingOutputs,
  occupancyStateOutputs,
  occupancyStoppingOutputs,
  type OccupancyPublishingConfig
} from "../lib/occupancy-publishing";
import {ID_SCHEMES, discoveryPrefixSetting} from "../lib/ha-discovery";
import {optionalBooleanSetting, optionalChoiceSetting, textSetting} from "../lib/settings";
import {publishingArea} from "../lib/topic-names";
import {invalidConfig, onInput, optionalArea, runReducer, type InputMessage, type Send} from "./adapter";
import {publishesState} from "../lib/publishing-node";
import {brokerSetting, publishingSide} from "./publishing-side";
import type {BrokerNode} from "./mqtt-broker-link";
import {publishingChoice} from "../lib/home-assistant-setting";

interface OccupancyFusionConfig extends NodeDef {
  area?: string;
  presenceMode?: "hold" | "none";
  // Publish: off, state or discovery; not set: from publishState and
  // discovery, which it replaced.
  homeAssistant?: string | null;
  // Node-RED's mqtt-broker node, to publish itself.
  broker?: string;
  publishState?: boolean | string | null;
  discovery?: boolean | string | null;
  discoveryPrefix?: string;
  idScheme?: string | null;
}

type OccupancyStatus = ReturnType<typeof transitionOccupancy>["status"];

interface OccupancyFusionNode extends Node {}

const registerOccupancyFusion: NodeInitializer = (RED) => {
  function HomeOccupancyFusion(this: OccupancyFusionNode, config: OccupancyFusionConfig) {
    RED.nodes.createNode(this, config);
    const node = this;
    let fusionConfig: OccupancyConfig & {area: string};
    let publishing: OccupancyPublishingConfig;
    let broker: BrokerNode | null;
    try {
      // The editor offers "none" (PIR only) and "hold" (PIR plus presence).
      const presence = textSetting(config.presenceMode, "presence sensor", "none");
      if (presence !== "none" && presence !== "hold") throw new Error("presence sensor must be none or hold");
      const area = optionalArea(config);
      fusionConfig = {area, presenceMode: presence === "hold" ? "hold" : "ignore"};
      // Off unless switched on, as occupancy published nothing before; there
      // are no older entities to keep, so not set names them after the node.
      const publish = publishingChoice(config, {publishState: false, discovery: false});
      if (publish.needsArea) publishingArea(area, true);
      broker = brokerSetting(RED, config.broker, publish.publishState);
      publishing = {
        area,
        publishState: publish.publishState,
        discovery: publish.discovery,
        discoveryPrefix: discoveryPrefixSetting(config.discoveryPrefix),
        nodeId: node.id,
        idScheme: optionalChoiceSetting(config.idScheme, "ID scheme", ID_SCHEMES) ?? "node"
      };
    } catch (error) {
      invalidConfig(node, error);
      return;
    }

    function updateStatus(status: OccupancyStatus) {
      const details = [status.occupied ? "occupied" : "vacant"];
      if (status.motion !== null) details.push("pir " + (status.motion ? "on" : "off"));
      if (status.presence !== null) details.push("presence " + (status.presence ? "on" : "off"));
      node.status({
        fill: status.occupied ? "green" : "grey",
        shape: "dot",
        text: details.join(" · ")
      });
    }

    function occupied(): boolean {
      return (node.context().get("state") as Partial<OccupancyState> | undefined)?.occupied === true;
    }

    // MQTT publications go on the second output, away from the occupancy
    // events the motion policy reads on the first. Available, and clear of
    // what it no longer publishes, as soon as it runs; offline as it stops;
    // nothing left behind when deleted.
    const trace = {area: fusionConfig.area, component: "occupancy-fusion"};
    // No set topics: it only publishes.
    const lifecycle = publishingSide(RED, node, broker, {
      retainedTopics: () => occupancyRetainedTopics(publishing),
      possible: {owner: publishing, topics: () => publishesState(publishing) ? occupancyRetainedTopics({...publishing, publishState: true, discovery: true}) : []},
      starting: () => occupancyStartingOutputs(publishing, occupied()),
      stopping: () => occupancyStoppingOutputs(publishing),
      output: 1,
      outputs: 2,
      startupMessage: {source: "startup"},
      statusTopic: publishing.discovery ? publishing.discoveryPrefix + "/status" : null,
      setTopics: []
    }, trace, (msg, send) => handle(msg, send));

    function handle(msg: InputMessage, send: Send) {
      if (msg.source === "startup") {
        lifecycle.startup(send, occupancyStartingOutputs(publishing, occupied()));
        return;
      }
      const input: OccupancyInput = {
        source: String(msg.source ?? ""),
        payload: msg.payload,
        baseline: msg.baseline === true
      };
      const result = runReducer(node, {area: fusionConfig.area, component: "occupancy-fusion"},
        (saved: Partial<OccupancyState> | undefined) => transitionOccupancy(saved, input, fusionConfig));
      for (const output of result.outputs) {
        send([{...output, payload: output.payload}, null]);
        lifecycle.publish(send, occupancyStateOutputs(publishing, output.payload.occupied));
      }
      updateStatus(result.status);
    }
    onInput(node, (msg, send) => {
      // With a broker, a Status node still wired in changes nothing.
      if (!lifecycle.fromBroker(msg)) handle(msg, send);
    }, lifecycle.startupOption({source: "startup"}));

  }

  RED.nodes.registerType("home-occupancy-fusion", HomeOccupancyFusion);
};

export = registerOccupancyFusion;
