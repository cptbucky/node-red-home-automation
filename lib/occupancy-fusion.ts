"use strict";

import type {TraceEntry} from "./bounded-trace";

export type OccupancySource = "motion" | "presence";

export interface OccupancyState {
  motionKnown: boolean;
  motionActive: boolean;
  presenceKnown: boolean;
  presenceActive: boolean;
  occupied: boolean;
}

export interface OccupancyInput {
  source: string;
  payload: unknown;
  // A sensor's state as Node-RED starts (msg.baseline = true), such as a
  // device's retained state while it is online: the room as it is, not a
  // new detection. Occupied, it switches nothing on; empty, the room's
  // vacancy starts as if it began now.
  baseline?: boolean;
}

export interface OccupancyConfig {
  presenceMode?: "hold" | "ignore";
}

export interface OccupancyOutput {
  source: "occupancy";
  payload: {
    kind: "occupancy";
    occupied: boolean;
    trigger: OccupancySource | null;
    reason: string;
    sources: {motion: boolean | null; presence: boolean | null};
  };
}

export type OccupancyTrace = TraceEntry<{
  active: boolean | null;
  occupied: boolean;
  sources: {motion: boolean | null; presence: boolean | null};
}>;

export function booleanState(value: unknown, source: OccupancySource): boolean | null {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = source === "presence"
      ? ["presence", "occupancy", "active"]
      : ["motion", "occupancy", "active"];
    for (const key of keys) {
      if (Object.hasOwn(record, key)) return booleanState(record[key], source);
    }
    return null;
  }
  if (value === true || value === false) return value;
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["on", "true", "occupied", "active", "detected"].includes(normalized)) return true;
  if (["off", "false", "clear", "inactive", "not_detected"].includes(normalized)) return false;
  return null;
}

export function createOccupancyState(saved: Partial<OccupancyState> = {}): OccupancyState {
  return {
    motionKnown: saved.motionKnown === true,
    motionActive: saved.motionActive === true,
    presenceKnown: saved.presenceKnown === true,
    presenceActive: saved.presenceActive === true,
    occupied: saved.occupied === true
  };
}

export function transitionOccupancy(
  saved: Partial<OccupancyState> | undefined,
  input: OccupancyInput,
  config: OccupancyConfig
) {
  const state = createOccupancyState(saved);
  const outputs: OccupancyOutput[] = [];
  const traces: OccupancyTrace[] = [];
  const source = input.source;
  const usesPresence = config.presenceMode === "hold";
  const active = source === "motion" || source === "presence"
    ? booleanState(input.payload, source)
    : null;

  function sources() {
    return {
      motion: state.motionKnown ? state.motionActive : null,
      presence: usesPresence && state.presenceKnown ? state.presenceActive : null
    };
  }

  function trace(event: string, outcome: string, reason: string | null = null) {
    traces.push({event, outcome, reason, details: {active, occupied: state.occupied, sources: sources()}});
  }

  function emit(occupied: boolean, reason: string, trigger: OccupancySource | null = null) {
    state.occupied = occupied;
    outputs.push({
      source: "occupancy",
      payload: {
        kind: "occupancy",
        occupied,
        trigger,
        reason,
        sources: sources()
      }
    });
  }

  if (source !== "motion" && source !== "presence") {
    trace("input", "ignored", "unsupported-source");
  } else if (source === "presence" && !usesPresence) {
    trace("presence", "ignored", "presence-disabled");
  } else if (active === null) {
    trace(source, "ignored", "unknown-state");
  } else if (source === "motion") {
    const wasKnown = state.motionKnown;
    const wasActive = state.motionActive;
    state.motionKnown = true;
    state.motionActive = active;

    if (active && input.baseline === true) {
      // Someone is there as Node-RED starts: occupied, but nothing is sent,
      // so no light is switched on. Motion acts from its next change.
      state.occupied = true;
      trace("motion", "baseline", "occupied-at-start");
    } else if (active) {
      state.occupied = true;
      if (!wasKnown || !wasActive) {
        emit(true, "motion-active", "motion");
        trace("motion", "triggered");
      } else {
        trace("motion", "unchanged");
      }
    } else if (usesPresence && state.presenceKnown && state.presenceActive) {
      // Presence only holds occupancy that motion established; it never
      // establishes it, so the state (and what was last emitted) is unchanged.
      trace("motion", state.occupied ? "held" : "unchanged", state.occupied ? "presence-active" : "motion-required");
    } else if (!wasKnown || wasActive || state.occupied) {
      emit(false, "all-sources-inactive");
      trace("motion", "vacant");
    } else {
      trace("motion", "unchanged");
    }
  } else {
    const wasKnown = state.presenceKnown;
    const wasActive = state.presenceActive;
    state.presenceKnown = true;
    state.presenceActive = active;

    if (active && input.baseline === true) {
      // Presence as Node-RED starts is someone there: it holds the room as
      // occupied, sending nothing, though live presence alone never starts
      // occupancy.
      state.occupied = true;
      trace("presence", "baseline", "occupied-at-start");
    } else if (active) {
      trace("presence", state.occupied ? "held" : "standby", state.occupied ? "presence-active" : "motion-required");
    } else if (!state.motionActive && (!wasKnown || wasActive || state.occupied)) {
      emit(false, "all-sources-inactive");
      trace("presence", "vacant");
    } else {
      trace("presence", state.motionActive ? "held" : "unchanged", state.motionActive ? "motion-active" : null);
    }
  }

  return {
    state,
    outputs,
    traces,
    status: {
      occupied: state.occupied,
      motion: state.motionKnown ? state.motionActive : null,
      presence: usesPresence && state.presenceKnown ? state.presenceActive : null
    }
  };
}
