"use strict";

import type {
  Node,
  NodeDef,
  NodeInitializer,
  NodeStatusFill,
  NodeStatusShape
} from "node-red";
import {
  normaliseConfig,
  transitionDisplay,
  type DisplayCommand,
  type DisplayConfig,
  type DisplayMessage,
  type DisplayState
} from "../lib/display-mode-controller";
import {DisplayTransport} from "../lib/transports/display-transport";
import {guarded, invalidConfig, objectField, onInput, optionalArea, runReducer, type Send} from "./adapter";
import {numberSetting, textSetting} from "../lib/settings";

interface DisplayControllerConfig extends NodeDef {
  area?: string;
  tvHost?: string;
  screenHost?: string;
  projectorPowerMeterHost?: string;
  // The name before 5.0, removed in 6.0: present without the new one, an
  // invalid configuration rather than a quiet switch to no meter.
  projectorMeterHost?: string;
  transportTimeoutMs?: number | string;
  screenOpenPosition?: number | string;
  screenTolerance?: number | string;
  pollMs?: number | string;
  queryTimeoutMs?: number | string;
  tvTimeoutMs?: number | string;
  screenTimeoutMs?: number | string;
  projectorWarmupMs?: number | string;
  projectorMinimumWarmupMs?: number | string;
  projectorShutdownConfirmMs?: number | string;
  projectorCooldownMs?: number | string;
  maxAttempts?: number | string;
  projectorOnWatts?: number | string;
  projectorOffWatts?: number | string;
  projectorPowerFallback?: boolean;
}

interface DisplayCredentials {
  tvPsk: string;
}

interface DisplayControllerNode extends Node<DisplayCredentials> {}

type DisplayStatus = ReturnType<typeof transitionDisplay>["status"];

const registerDisplayModeController: NodeInitializer = (RED) => {
  function HomeDisplayModeController(this: DisplayControllerNode, config: DisplayControllerConfig) {
    RED.nodes.createNode(this, config);
    const node = this;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let closed = false;

    // Defaults and limits come from the reducer's own normalisation.
    let controllerConfig: DisplayConfig;

    let transport: DisplayTransport;
    let projectorPowerMeterHost: string;
    try {
      controllerConfig = normaliseConfig(config);
      // Optional: without a meter of its own, the node asks the flow for the
      // projector's power on its third output, and reads what comes back.
      projectorPowerMeterHost = String(config.projectorPowerMeterHost ?? "").trim();
      if (!projectorPowerMeterHost && String(config.projectorMeterHost ?? "").trim()) {
        throw new Error("projectorMeterHost was removed in 6.0: set Projector power meter host");
      }
      transport = new DisplayTransport({
        // No defaults: these name the user's own devices.
        tvHost: textSetting(config.tvHost, "TV host"),
        tvPsk: String(node.credentials?.tvPsk ?? ""),
        screenHost: textSetting(config.screenHost, "screen host"),
        projectorMeterHost: projectorPowerMeterHost,
        timeoutMs: numberSetting(config.transportTimeoutMs, "transport timeout", 5000)
      });
    } catch (error) {
      invalidConfig(node, error);
      return;
    }

    function updateStatus(status: DisplayStatus) {
      const appearances: Record<string, {fill: NodeStatusFill; shape: NodeStatusShape}> = {
        discovering: {fill: "grey", shape: "ring"},
        idle: {fill: "grey", shape: "dot"},
        transitioning: {fill: "blue", shape: "dot"},
        ready: {fill: "green", shape: "dot"},
        manual_override: {fill: "yellow", shape: "ring"},
        failed: {fill: "red", shape: "ring"}
      };
      const appearance = appearances[status.phase] ?? {fill: "grey", shape: "ring"};
      node.status({...appearance, text: status.text});
    }

    function schedule(state: DisplayState) {
      clearTimeout(timer);
      timer = undefined;
      // The pending step's next check or the discovery deadline, whichever is first.
      const due = [state.pending?.nextAt, state.discovery?.nextAt].filter((at): at is number => Number.isFinite(at));
      if (!due.length) return;
      const delay = Math.max(0, Math.min(...due) - Date.now());
      const generation = state.desired?.generation || state.generation;
      timer = setTimeout(guarded(node, () => {
        process({display: {kind: "tick", generation}}, node.send.bind(node));
      }), delay);
    }

    async function dispatch(command: DisplayCommand): Promise<void> {
      if (command.device === "projector" && command.operation === "power_toggle") {
        node.send([{
          payload: "power",
          display_command: command
        }, null, null]);
        return;
      }
      if (command.device === "projector" && command.operation === "query_power" && !projectorPowerMeterHost) {
        // power: {kind: "read"} too, so a power meter node (such as a
        // zigbee2mqtt power node) can be wired straight to it.
        node.send([null, null, {payload: "query", display_command: command, power: {kind: "read"}}]);
        return;
      }
      const result = await transport.execute(command);
      if (!closed && result) process(result, node.send.bind(node));
    }

    function process(msg: DisplayMessage, send: Send) {
      const result = runReducer(node, {area: optionalArea(config), component: "display-mode-controller"},
        (saved: Partial<DisplayState> | undefined, now) => transitionDisplay(saved, msg, controllerConfig, now));
      const outputs = [...result.events, ...result.targetStates, ...result.observations];
      if (outputs.length) {
        send([null, outputs.map((event) => ({payload: undefined, ...event})), null]);
      }
      updateStatus(result.status);
      schedule(result.state);
      for (const command of result.commands) {
        dispatch(command).catch((error) => node.error(error));
      }
      return result;
    }

    onInput(node, (msg, send) => {
      // A power meter node's reading (msg.power) is its projector's power.
      const power = objectField<{kind?: unknown; watts?: unknown; observedAt?: unknown}>(msg, "power");
      if (power?.kind === "observed" && !objectField(msg, "display")) {
        process({display: {kind: "observed", device: "projector", watts: power.watts,
          ...(typeof power.observedAt === "string" ? {observedAt: power.observedAt} : {})} as DisplayMessage["display"]}, send);
        return;
      }
      process({
        display: objectField<DisplayMessage["display"]>(msg, "display")
      }, send);
    });

    node.on("close", (_removed: boolean, done: () => void) => {
      closed = true;
      clearTimeout(timer);
      done();
    });
  }

  RED.nodes.registerType("home-display-mode-controller", HomeDisplayModeController, {
    credentials: {tvPsk: {type: "password"}}
  });
};

export = registerDisplayModeController;
