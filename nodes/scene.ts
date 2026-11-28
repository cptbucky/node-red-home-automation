"use strict";

import type {Node, NodeDef, NodeInitializer} from "node-red";
import {ID_SCHEMES, discoveryPrefixSetting} from "../lib/ha-discovery";
import {publishesState} from "../lib/publishing-node";
import {normaliseSceneConfig, sceneTickAt, transitionScene, type SceneConfig, type SceneEvent, type SceneState} from "../lib/scene";
import {
  sceneCommandTopic,
  sceneInbound,
  sceneRetainedTopics,
  sceneStartingOutputs,
  sceneStateOutputs,
  sceneStoppingOutputs,
  type ScenePublishingConfig
} from "../lib/scene-publishing";
import {optionalChoiceSetting, textSetting} from "../lib/settings";
import {areaId, publishingArea} from "../lib/topic-names";
import {guarded, invalidConfig, objectField, onInput, optionalArea, runReducer, wasDeleted, whenFlowsStarted, type InputMessage, type Send} from "./adapter";
import {brokerSetting, publishingSide} from "./publishing-side";
import type {BrokerNode} from "./mqtt-broker-link";
import {publishingChoice} from "../lib/home-assistant-setting";

interface SceneNodeConfig extends NodeDef {
  lights?: string;
  safetyHours?: number | string;
  // Its power end: msg.power below this many watts, for endBelowSeconds.
  endBelowWatts?: number | string;
  endBelowSeconds?: number | string;
  area?: string;
  // Publish: off, state or discovery; not set: from publishState and
  // discovery, which it replaced.
  homeAssistant?: string | null;
  // Node-RED's mqtt-broker node, to publish and read its set topic itself.
  broker?: string;
  publishState?: boolean | string | null;
  discovery?: boolean | string | null;
  discoveryPrefix?: string;
  idScheme?: string | null;
}

const registerScene: NodeInitializer = (RED) => {
  function HomeScene(this: Node, config: SceneNodeConfig) {
    RED.nodes.createNode(this, config);
    const node = this;
    const context = node.context();
    let timer: ReturnType<typeof setTimeout> | undefined;

    let scene: SceneConfig;
    let publishing: ScenePublishingConfig;
    let area: string;
    let broker: BrokerNode | null;
    try {
      // No default: it names the scene to its rooms, motion policies and
      // Home Assistant.
      const name = textSetting(config.name, "name");
      if (!areaId(name)) throw new Error("name must contain a letter or digit");
      scene = normaliseSceneConfig({owner: "scene:" + name, lights: config.lights, safetyHours: config.safetyHours,
        endBelowWatts: config.endBelowWatts, endBelowSeconds: config.endBelowSeconds});
      area = optionalArea(config);
      const publish = publishingChoice(config, {publishState: false, discovery: false});
      if (publish.needsArea) publishingArea(area, true);
      broker = brokerSetting(RED, config.broker, publish.publishState);
      publishing = {
        area,
        name,
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
    const trace = {area, component: "scene"};
    const saved = () => context.get("state") as Partial<SceneState> | undefined;
    const active = () => saved()?.active === true;

    // Its switch, available and clear of what it no longer publishes once
    // it can be (with a broker, on each connect; without one, on output 3
    // once the flows have started), offline as it stops, nothing left
    // behind when deleted.
    const lifecycle = publishingSide(RED, node, broker, {
      retainedTopics: () => sceneRetainedTopics(publishing),
      possible: {owner: publishing, topics: () => publishesState(publishing) ? sceneRetainedTopics({...publishing, discovery: true}) : []},
      starting: () => sceneStartingOutputs(publishing, active()),
      stopping: () => sceneStoppingOutputs(publishing),
      output: 2,
      outputs: 3,
      startupMessage: {scene: {kind: "startup"}},
      statusTopic: publishing.discovery ? publishing.discoveryPrefix + "/status" : null,
      setTopics: publishesState(publishing) ? [sceneCommandTopic(publishing)] : []
    }, trace, (msg, send) => handle(msg, send));

    function process(event: SceneEvent, send: Send) {
      const wasActive = active();
      const result = runReducer(node, trace, (state: Partial<SceneState> | undefined, now) => transitionScene(state, {scene: event}, scene, now));
      // Owner intents and releases for room controllers on output 1, owner
      // pauses for motion policies on output 2.
      if (result.lighting.length || result.motion.length) {
        send([result.lighting.length ? result.lighting : null, result.motion.length ? result.motion : null, null] as Parameters<Send>[0]);
      }
      if (result.state.active !== wasActive) lifecycle.publish(send, sceneStateOutputs(publishing, result.state.active));
      node.status(result.status as Parameters<Node["status"]>[0]);
      clearTimeout(timer);
      const at = sceneTickAt(result.state, Date.now(), scene);
      timer = at === null ? undefined : setTimeout(guarded(node, () => process({kind: "tick"}, node.send.bind(node))), Math.max(0, at - Date.now()));
    }

    // A scene on when the flows stopped is still on: renew its pause and its
    // timer, or end it if its time ran out meanwhile.
    whenFlowsStarted(RED, node, () => process({kind: "startup"}, node.send.bind(node)));

    function handle(msg: InputMessage, send: Send) {
      // A power meter's reading, for its End below.
      const power = objectField<{kind?: unknown; watts?: unknown}>(msg, "power");
      if (power?.kind === "observed" && !objectField(msg, "scene")) {
        process({kind: "power", watts: power.watts}, send);
        return;
      }
      const event = objectField<SceneEvent>(msg, "scene");
      if (event) {
        if (event.kind === "startup") lifecycle.startup(send, sceneStartingOutputs(publishing, active()));
        process(event, send);
        return;
      }
      // Home Assistant's switch, on the scene's set topic.
      const inbound = sceneInbound(msg, publishing);
      if (inbound?.kind) {
        process(inbound.kind === "end" ? {kind: "end", by: "home-assistant"} : {kind: "start"}, send);
      } else if (inbound) {
        runReducer(node, trace, (state: unknown) => ({state, traces: inbound.traces}));
      } else {
        runReducer(node, trace, (state: unknown) => ({state, traces: [{event: "input", outcome: "ignored", reason: "not-a-scene-message", details: {}}]}));
      }
    }
    onInput(node, (msg, send) => {
      // With a broker, its set topic comes from the broker: an MQTT in or a
      // Status node still wired in changes nothing.
      if (!lifecycle.fromBroker(msg)) handle(msg, send);
    }, lifecycle.startupOption({scene: {kind: "startup"}}));

    node.on("close", (removed: boolean, done: () => void) => {
      clearTimeout(timer);
      // Deleted while on: let its lights and motion go. Best effort: it
      // reaches nodes still running, as in a deploy of modified nodes.
      if (wasDeleted(RED, node, removed) && active()) process({kind: "end", by: "deleted"}, node.send.bind(node));
      done();
    });
  }

  RED.nodes.registerType("home-scene", HomeScene);
};

export = registerScene;
