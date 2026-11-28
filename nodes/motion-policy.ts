"use strict";

import type {Node, NodeDef, NodeInitializer} from "node-red";
import {
  createMotionState,
  normaliseMotionConfig,
  transitionMotion,
  type MotionConfig,
  type MotionInput,
  type MotionState
} from "../lib/motion-policy";
import {
  motionDelayTopic,
  motionEnabledTopic,
  motionInbound,
  motionRetainedTopics,
  motionStartingOutputs,
  motionStateOutputs,
  motionStoppingOutputs,
  type MotionPublishingConfig
} from "../lib/motion-publishing";
import {ID_SCHEMES, discoveryPrefixSetting} from "../lib/ha-discovery";
import {optionalBooleanSetting, optionalChoiceSetting} from "../lib/settings";
import {publishingArea} from "../lib/topic-names";
import {guarded, invalidConfig, onInput, optionalArea, runReducer, type Send, type InputMessage} from "./adapter";
import {publishesState} from "../lib/publishing-node";
import {brokerSetting, publishingSide} from "./publishing-side";
import type {BrokerNode} from "./mqtt-broker-link";
import {publishingChoice} from "../lib/home-assistant-setting";
import {refusedEnables} from "./refused-enable";

interface MotionPolicyConfig extends NodeDef {
  area?: string;
  onTargets?: string;
  offTargets?: string;
  defaultDelaySeconds?: number | string;
  defaultIlluminanceCutoff?: number | string;
  // Publish: off, state or discovery; not set: from publishState and
  // discovery, which it replaced.
  homeAssistant?: string | null;
  // Node-RED's mqtt-broker node, to publish and read its set topics itself.
  broker?: string;
  publishState?: boolean | string | null;
  discovery?: boolean | string | null;
  discoveryPrefix?: string;
  idScheme?: string | null;
  maxPauseSeconds?: number | string;
}

interface MotionPolicyNode extends Node {}

type MotionStatus = ReturnType<typeof transitionMotion>["status"];


// The longest wait setTimeout takes: anything longer fires at once.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

const registerMotionPolicy: NodeInitializer = (RED) => {
  function HomeMotionLightingPolicy(this: MotionPolicyNode, config: MotionPolicyConfig) {
    RED.nodes.createNode(this, config);
    const node = this;
    const context = node.context();
    const globalContext = context.global;
    let offTimer: ReturnType<typeof setTimeout> | undefined;
    let pauseTimer: ReturnType<typeof setTimeout> | undefined;

    let policyConfig: MotionConfig & {area: string};
    let publishing: MotionPublishingConfig;
    let broker: BrokerNode | null;
    try {
      const area = optionalArea(config);
      policyConfig = {area, ...normaliseMotionConfig(config)};
      // Off unless switched on, as motion published nothing before; there are
      // no older entities to keep, so not set names them after the node.
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

    // global-enabled, the house-wide enable every motion policy obeys, is
    // deprecated (removed in 7.0): told once per deploy, and on the status
    // from then on. It still works until then.
    let usedGlobalEnabled = false;

    function updateStatus(status: MotionStatus) {
      node.status({
        fill: status.enabled ? "green" : "grey",
        shape: "dot",
        text: (status.enabled ? "enabled" : status.paused ? "paused" : "disabled") + " · " +
          (status.illuminance === null ? "lux ?" : status.illuminance + " lux") + " · " +
          status.delaySeconds + "s" + (usedGlobalEnabled ? " · global-enabled is deprecated" : "")
      });
    }

    function armOffTimer(delayMs: number, generation: number) {
      clearTimeout(offTimer);
      offTimer = setTimeout(guarded(node, () => {
        offTimer = undefined;
        process({source: "off-timer", generation}, node.send.bind(node));
      }), delayMs);
    }

    // Wakes the policy when the first pause runs out, so motion resumes then
    // (and acts on a vacancy meanwhile) rather than at the next message. A
    // wait longer than setTimeout takes (about 24.8 days) is split: it wakes
    // at the longest and arms again.
    function armPauseTimer(state: Partial<MotionState> | undefined) {
      clearTimeout(pauseTimer);
      pauseTimer = undefined;
      const ends = (state?.pausedBy ?? []).map(({until}) => until).filter(Number.isFinite);
      if (!ends.length) return;
      pauseTimer = setTimeout(guarded(node, () => {
        pauseTimer = undefined;
        process({source: "pause-check"}, node.send.bind(node));
      }), Math.min(MAX_TIMEOUT_MS, Math.max(0, Math.min(...ends) - Date.now()) + 1));
    }

    // The enable state and delay in use, by the reducer's own rule: a saved
    // delay stands only while the setting it was based on is unchanged.
    function savedPolicyState(): MotionState {
      return createMotionState(policyConfig, context.get("state") as Partial<MotionState> | undefined);
    }

    // MQTT publications go on the second output, away from the lighting
    // intents the room controller reads on the first. Available, and clear
    // of what it no longer publishes, as soon as it runs; offline as it
    // stops; nothing left behind when deleted.
    const trace = {area: policyConfig.area, component: "motion-policy"};
    const lifecycle = publishingSide(RED, node, broker, {
      retainedTopics: () => motionRetainedTopics(publishing),
      possible: {owner: publishing, topics: () => publishesState(publishing) ? motionRetainedTopics({...publishing, publishState: true, discovery: true}) : []},
      starting: () => motionStartingOutputs(publishing, savedPolicyState()),
      stopping: () => motionStoppingOutputs(publishing),
      output: 1,
      outputs: 2,
      startupMessage: {source: "startup"},
      statusTopic: publishing.discovery ? publishing.discoveryPrefix + "/status" : null,
      setTopics: publishesState(publishing) ? [motionEnabledTopic(publishing.area, "set"), motionDelayTopic(publishing.area, "set")] : []
    }, trace, (msg, send) => handle(msg, send));

    function process(input: MotionInput, send: Send, inboundTraces: ReturnType<typeof motionInbound> = null) {
      const globalEnabled = globalContext.get("MOTION_ENABLED_STATE") !== false;
      const before = savedPolicyState();
      const result = runReducer(node, {area: policyConfig.area, component: "motion-policy"},
        (saved: Partial<MotionState> | undefined, now) => {
          const decided = transitionMotion(saved, input, policyConfig, globalEnabled, now.getTime());
          return {...decided, traces: [...(inboundTraces?.traces ?? []), ...decided.traces]};
        });
      if (input.source === "global-enabled") {
        globalContext.set("MOTION_ENABLED_STATE", result.globalEnabled);
        if (!usedGlobalEnabled) {
          usedGlobalEnabled = true;
          node.warn("global-enabled is deprecated and will be removed in 7.0: send area-enabled (true or false) to each " +
            "motion lighting policy instead");
        }
      }

      for (const effect of result.effects) {
        if (effect.kind === "cancel-off-timer") {
          clearTimeout(offTimer);
          offTimer = undefined;
        } else if (effect.kind === "schedule-off-timer") {
          armOffTimer(effect.delayMs, effect.generation);
        } else if (effect.kind === "send") {
          send([{payload: undefined, ...effect.message}, null]);
        }
      }
      // Published whenever either changes, and in answer to a set, so Home
      // Assistant shows what is in use.
      if (before.areaEnabled !== result.state.areaEnabled || before.delaySeconds !== result.state.delaySeconds ||
        input.source === "area-enabled" || input.source === "delay") {
        lifecycle.publish(send, motionStateOutputs(publishing, result.state));
      }
      updateStatus(result.status);
      showRefused(result.traces);
      armPauseTimer(result.state);
      return result;
    }
    const showRefused = refusedEnables(node);

    // With a configured context store (see the README) the node's state
    // survives a redeploy or restart, but timers never do: a pending
    // off-timer is re-armed. Without one, it starts with nothing saved, and
    // vacancy starts now.
    const savedState = context.get("state") as Partial<MotionState> | undefined;
    armPauseTimer(savedState);
    if (typeof savedState?.offTimerDueAt === "number") {
      armOffTimer(Math.max(0, savedState.offTimerDueAt - Date.now()), Number(savedState.offTimerGeneration) || 0);
    } else if (savedState === undefined) {
      process({source: "cold-start"}, node.send.bind(node));
    }
    function handle(msg: InputMessage, send: Send) {
      if (msg.source === "startup") {
        lifecycle.startup(send, motionStartingOutputs(publishing, savedPolicyState()));
        return;
      }
      // Home Assistant's set topics become the node's own inputs; anything
      // else is an input as sent, with a pause's owner.
      const inbound = motionInbound(msg, publishing);
      process(inbound?.input ?? {source: String(msg.source ?? ""), payload: msg.payload, owner: typeof msg.owner === "string" ? msg.owner : undefined}, send, inbound);
    }
    onInput(node, (msg, send) => {
      // With a broker, its set topics come from the broker: an MQTT in or a
      // Status node still wired in changes nothing.
      if (!lifecycle.fromBroker(msg)) handle(msg, send);
    }, lifecycle.startupOption({source: "startup"}));

    node.on("close", (_removed: boolean, done: () => void) => {
      clearTimeout(offTimer);
      clearTimeout(pauseTimer);
      done();
    });
  }

  RED.nodes.registerType("home-motion-lighting-policy", HomeMotionLightingPolicy);
};

export = registerMotionPolicy;
