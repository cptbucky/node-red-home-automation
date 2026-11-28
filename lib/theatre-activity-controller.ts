"use strict";

import type {TraceEntry} from "./bounded-trace";
import {numberSetting} from "./settings";

import {boundObservedAt, isFresh as isFreshAt, isOutOfOrder, parseObservedAt} from "./observation-time";
import {isTargetStatus} from "./target-state";
import {
  OPTIONAL_TARGETS,
  REQUIRED_TARGETS,
  TARGETS,
  matchesExpected,
  normaliseActivityProfiles,
  type ActivityProfile,
  type ActivityProfiles,
  type TheatreTarget
} from "./theatre-profiles";
import {
  REFRESH_ATTEMPTS,
  TARGET_CLASSIFICATIONS,
  createTheatreState,
  emptyRefreshPending,
  emptyTargets,
  theatreSnapshot,
  type RecoveryObservations,
  type TargetClassification,
  type TargetFailure,
  type TargetState,
  type TargetStatus,
  type TheatreDesired,
  type TheatreState
} from "./theatre-state";
import {recordOutcome, recordTargetReport, resetTransitionMetrics} from "./theatre-metrics";
import {planRefreshes} from "./theatre-refresh";

// Names other modules have imported from here.
export {
  TARGETS,
  normaliseActivityProfiles,
  type ActivityBacklightingProfile,
  type ActivityLightingProfile,
  type ActivityProfile,
  type ActivityProfiles,
  type ActivitySourceProfile,
  type TheatreTarget
} from "./theatre-profiles";
export {
  createTheatreState,
  type RecoveryObservation,
  type RecoveryObservations,
  type RefreshPending,
  type TargetClassification,
  type TargetFailure,
  type TargetState,
  type TargetStatus,
  type TheatreAvailability,
  type TheatreDesired,
  type TheatreFailure,
  type TheatreMetrics,
  type TheatreSnapshot,
  type TheatreState,
  type TheatreTargetMetrics
} from "./theatre-state";

export interface TheatreConfig {
  area: string;
  freshnessMs: number;
  activityProfiles: ActivityProfiles;
}

export type TheatreInputEvent =
  | {
    kind: "intent";
    requestId: string;
    generation: number;
    activity: string;
    requestedAt?: string;
  }
  | {
    kind: "target_state";
    target: TheatreTarget;
    generation: number;
    status: TargetStatus;
    observedAt: string;
    classification?: TargetClassification;
    failure?: TargetFailure;
    details?: Record<string, unknown>;
  }
  | {kind: "startup" | "refresh"}
  // A target owner's answer to the recovery probe: what its device shows,
  // in the activity profiles' terms (display {mode}, avr {power, source},
  // source {action, sourceId}, backlighting {power}).
  | {kind: "target_observation"; target: TheatreTarget; observedAt: string; values: Record<string, unknown>}
  | {kind: "tick"; generation?: number}
  | {kind: "recover"; reason: "startup" | "manual_override"; observations: RecoveryObservations};

export interface TheatreOutput {
  theatre: Record<string, unknown>;
}

export interface TheatreMessage {
  theatre?: TheatreInputEvent;
}

export interface TargetCommand extends Record<string, unknown> {
  target: TheatreTarget;
  kind: string;
  requestId: string | null;
  generation: number;
}

export function normaliseConfig(
  config: Partial<TheatreConfig> & {activityProfiles?: unknown} = {}
): TheatreConfig {
  const activityProfiles = normaliseActivityProfiles(config.activityProfiles);
  return {
    // Optional: an empty area means none.
    area: typeof config.area === "string" ? config.area.trim() : "",
    freshnessMs: Math.max(1000, numberSetting(config.freshnessMs, "freshness", 30000)),
    activityProfiles
  };
}

function targetCommand(
  target: TheatreTarget,
  kind: string,
  desired: TheatreDesired | null,
  values: Record<string, unknown> = {}
): TargetCommand {
  return {
    target,
    kind,
    requestId: desired?.requestId || null,
    generation: desired?.generation || 0,
    ...values
  };
}

function targetIntentCommands(
  desired: TheatreDesired,
  config: TheatreConfig,
  previousDesired: TheatreDesired | null
): TargetCommand[] {
  const profile = config.activityProfiles[desired.activity];
  if (!profile) throw new Error("desired activity profile is missing");
  const previousSource = previousDesired
    ? config.activityProfiles[previousDesired.activity]?.source
    : null;
  return TARGETS.map((target) => {
    let values = profile[target];
    if (target === "source" && values.action === "deactivate" && !values.sourceId) {
      values = {...values, sourceId: previousSource?.sourceId || null};
    }
    return targetCommand(target, "intent", desired, values);
  });
}

// A refresh carries the activity's wanted values for the target, as its
// intent did, so a target node that has nothing desired (it started with
// nothing saved) can adopt them and observe, instead of staying idle.
function targetRefreshCommand(target: TheatreTarget, desired: TheatreDesired | null, config: TheatreConfig): TargetCommand {
  const values = desired ? config.activityProfiles[desired.activity]?.[target] ?? {} : {};
  return targetCommand(target, "refresh", desired, values);
}

function targetRefreshCommands(desired: TheatreDesired, config: TheatreConfig): TargetCommand[] {
  return TARGETS.map((target) => targetRefreshCommand(target, desired, config));
}

function targetProbeCommands(): TargetCommand[] {
  return TARGETS.map((target) => targetCommand(target, "refresh", null));
}

function observationTime(targetState: {observedAt?: string} | null | undefined): number | null {
  return typeof targetState?.observedAt === "string" ? parseObservedAt(targetState.observedAt) : null;
}

function isFresh(targetState: {observedAt: string}, nowMs: number, freshnessMs: number): boolean {
  return isFreshAt(observationTime(targetState), nowMs, freshnessMs);
}

function stateEvent(state: TheatreState, area: string): TheatreOutput {
  return {theatre: {...theatreSnapshot(state, area)}};
}

function statusFor(state: TheatreState) {
  const activity = state.desired?.activity || "none";
  if (state.phase === "failed") {
    return {phase: "failed", text: `${activity}: ${state.failure?.reason || "failed"}`};
  }
  return {phase: state.phase, text: `${activity}: ${state.phase}`};
}

const RECOVERY_TARGETS: readonly TheatreTarget[] = ["display", "avr", "source", "backlighting"];

// What tells activities apart, and can always be read: after a start with
// nothing saved, an activity is recovered only once both have answered.
const IDENTIFYING_TARGETS: readonly TheatreTarget[] = ["display", "avr"];

// The recovery targets with a fresh observation.
function answered(observations: RecoveryObservations, nowMs: number, freshnessMs: number): TheatreTarget[] {
  return RECOVERY_TARGETS.filter((target) => {
    const observation = observations[target];
    return Boolean(observation && isFresh(observation, nowMs, freshnessMs));
  });
}

// Whether a profile is what the observations show: every recovery target,
// or after a start with nothing saved (partial), every one that answered,
// the display and the AVR among them.
function recoveryMatches(
  profile: ActivityProfile,
  observations: RecoveryObservations,
  nowMs: number,
  freshnessMs: number,
  partial = false
): boolean {
  const fresh = answered(observations, nowMs, freshnessMs);
  if (partial && !IDENTIFYING_TARGETS.every((target) => fresh.includes(target))) return false;
  return RECOVERY_TARGETS.every((target) => {
    const observation = observations[target];
    if (partial && !fresh.includes(target)) return true;
    if (!observation || !isFresh(observation, nowMs, freshnessMs)) return false;
    const expected = {...profile[target]};
    if (target === "source") delete expected.readiness;
    return matchesExpected(expected, observation.values);
  });
}

export function transitionTheatre(
  saved: Partial<TheatreState> | undefined,
  msg: TheatreMessage,
  suppliedConfig: Partial<TheatreConfig> & {activityProfiles?: unknown} = {},
  nowValue: Date | string | number = new Date()
) {
  const config = normaliseConfig(suppliedConfig);
  const now = nowValue instanceof Date ? nowValue : new Date(nowValue);
  const nowMs = now.getTime();
  if (!Number.isFinite(nowMs)) throw new Error("now must be a valid date");

  const state = createTheatreState(saved, config.activityProfiles);
  const event = msg?.theatre;
  const commands: TargetCommand[] = [];
  const events: TheatreOutput[] = [];
  const traces: TraceEntry[] = [];

  if (!event || typeof event.kind !== "string") throw new Error("msg.theatre.kind is required");

  function trace(name: string, outcome: string, reason: string | null = null, details: Record<string, unknown> = {}) {
    traces.push({event: name, outcome, reason, details});
  }

  function emit(kind: string, details: Record<string, unknown> = {}) {
    events.push({
      theatre: {
        kind,
        area: config.area,
        requestId: state.desired?.requestId || null,
        generation: state.generation,
        activity: state.desired?.activity || null,
        ...details
      }
    });
  }

  // Records an outcome. Only the transition's first ready or failed ends it
  // and is timed: a later override or failure is not part of the transition.
  function completeTransition(outcome: "ready" | "failed" | "manual_override") {
    const startedAt = Date.parse(state.transitionStartedAt || "");
    let transitionMs: number | null = null;
    if (outcome !== "manual_override" && state.transitionCompletedAt === null) {
      state.transitionCompletedAt = now.toISOString();
      if (Number.isFinite(startedAt)) transitionMs = Math.max(0, nowMs - startedAt);
    }
    recordOutcome(state.metrics, outcome, transitionMs);
  }

  function updateTargetMetrics(target: TheatreTarget, targetState: TargetState, previous: TargetState | null) {
    recordTargetReport(state.metrics.targets[target], targetState, previous, observationTime(targetState),
      state.transitionStartedAt, nowMs);
  }

  function fail(target: TheatreTarget, targetState: TargetState) {
    const firstFailure = state.phase !== "failed";
    const failure = targetState.failure && typeof targetState.failure === "object"
      ? targetState.failure
      : {};
    state.failure = {
      target,
      operation: failure.operation || null,
      reason: failure.reason || (targetState.status === "unavailable" ? "unavailable" : "target-failed"),
      occurredAt: failure.occurredAt || targetState.observedAt || now.toISOString()
    };
    state.blockedGeneration = state.generation;
    state.currentActivity = "unknown";
    state.phase = "failed";
    state.availability = "unavailable";
    if (firstFailure) completeTransition("failed");
  }

  function reconcile() {
    const previousPhase = state.phase;
    const previousCurrent = state.currentActivity;
    state.degraded = [];

    if (!state.desired) {
      if (state.phase !== "recovering") state.phase = "idle";
      state.currentActivity = "unknown";
      state.availability = "unknown";
      return;
    }
    if (state.blockedGeneration === state.generation) {
      state.phase = "failed";
      state.currentActivity = "unknown";
      state.availability = "unavailable";
      return;
    }

    const profile = config.activityProfiles[state.desired.activity];
    if (!profile) throw new Error("desired activity profile is missing");
    const sourceProfile = profile.source;
    for (const target of TARGETS) {
      const optional = (OPTIONAL_TARGETS as readonly TheatreTarget[]).includes(target) ||
        (target === "source" && sourceProfile.readiness === "optional");
      if (!optional) continue;
      const targetState = state.targets[target];
      if (!targetState) {
        state.degraded.push({target, reason: state.unobserved.includes(target) ? "unobserved" : "unconfirmed"});
      } else if (!isFresh(targetState, nowMs, config.freshnessMs)) {
        state.degraded.push({target, reason: "stale"});
      } else if (targetState.status !== "ready") {
        state.degraded.push({target, reason: targetState.failure?.reason || targetState.status});
      } else if (Array.isArray(targetState.details?.unobserved) && targetState.details.unobserved.length) {
        // Ready without lights that never reported (activity lighting).
        state.degraded.push({target, reason: "unobserved"});
      }
    }

    const manualTarget = TARGETS.find((target) => {
      const targetState = state.targets[target];
      return targetState?.classification === "manual_override" &&
        isFresh(targetState, nowMs, config.freshnessMs);
    });
    if (manualTarget) {
      state.phase = "manual_override";
      state.currentActivity = "unknown";
      state.availability = "degraded";
      if (previousPhase !== "manual_override") {
        completeTransition("manual_override");
        emit("manual_override", {target: manualTarget});
        trace("activity", "manual_override", null, {target: manualTarget});
      }
      return;
    }

    for (const target of REQUIRED_TARGETS) {
      const targetState = state.targets[target];
      if (targetState && isFresh(targetState, nowMs, config.freshnessMs) &&
        (targetState.status === "failed" || targetState.status === "unavailable")) {
        fail(target, targetState);
        break;
      }
    }
    if (state.phase === "failed") {
      const failure = state.failure;
      if (!failure) throw new Error("failed theatre state is missing failure details");
      if (previousPhase !== "failed") {
        emit("failed", {failure});
        trace("activity", "failed", failure.reason, {target: failure.target});
      }
      return;
    }

    // Once this activity is ready, a confirmed target that is only due for
    // re-confirmation keeps it ready; the staleness shows in degraded.
    const holdReady = previousPhase === "ready" && previousCurrent === state.desired.activity;
    const unverified = (target: TheatreTarget) => {
      state.degraded.push({target, reason: state.refreshPending[target]?.exhausted ? "no-response" : "stale"});
    };

    for (const target of REQUIRED_TARGETS) {
      const targetState = state.targets[target];
      if (!targetState && holdReady && state.unobserved.includes(target)) {
        // Recovered without it: the activity stays ready until it reports.
        state.degraded.push({target, reason: "unobserved"});
        continue;
      }
      if (targetState && holdReady && targetState.status === "ready" &&
        !isFresh(targetState, nowMs, config.freshnessMs)) {
        unverified(target);
        continue;
      }
      if (!targetState || !isFresh(targetState, nowMs, config.freshnessMs)) {
        state.phase = "confirming";
        state.currentActivity = "unknown";
        state.availability = "unknown";
        return;
      }
      if (targetState.status !== "ready") {
        state.phase = targetState.status === "discovering" || targetState.status === "confirming"
          ? "confirming"
          : "transitioning";
        state.currentActivity = "unknown";
        state.availability = state.degraded.length ? "degraded" : "available";
        return;
      }
    }

    if (sourceProfile.readiness === "required") {
      const source = state.targets.source;
      const staleButHeld = source && holdReady && source.status === "ready" &&
        !isFresh(source, nowMs, config.freshnessMs);
      if (!source && holdReady && state.unobserved.includes("source")) state.degraded.push({target: "source", reason: "unobserved"});
      else if (staleButHeld) unverified("source");
      else if (!source || !isFresh(source, nowMs, config.freshnessMs) || source.status !== "ready") {
        state.phase = "waiting_for_source";
        state.currentActivity = "unknown";
        state.availability = "degraded";
        if (previousPhase !== "waiting_for_source") {
          emit("waiting_for_source", {
            sourceId: sourceProfile.sourceId,
            reason: source?.failure?.reason || source?.status || "unconfirmed"
          });
          trace("activity", "waiting", "source-unconfirmed");
        }
        return;
      }
    }

    state.failure = null;
    state.phase = "ready";
    state.currentActivity = state.desired.activity;
    state.availability = state.degraded.length ? "degraded" : "available";
    if (previousPhase !== "ready" || previousCurrent !== state.currentActivity) {
      // Only the first ready of a generation completes its transition.
      if (state.transitionCompletedAt === null) {
        completeTransition("ready");
      }
      emit("ready");
      trace("activity", "ready", null, {activity: state.currentActivity});
    }
  }

  // Send the refreshes planned for this moment (see theatre-refresh).
  function tickRefreshes() {
    const plan = planRefreshes(state.refreshPending, (target) => observationTime(state.targets[target]),
      state.desired !== null, config.freshnessMs, nowMs);
    state.refreshPending = plan.pending;
    for (const action of plan.actions) {
      if (action.kind === "give-up") {
        noResponse(action.target);
        continue;
      }
      commands.push(targetRefreshCommand(action.target, state.desired, config));
      if (action.kind === "retry") trace("refresh", "retried", null, {target: action.target, attempt: action.attempt});
      if (action.kind === "re-ask") trace("refresh", "retried", "no-response", {target: action.target});
    }
  }

  function noResponse(target: TheatreTarget) {
    state.metrics.targets[target].availability = "unavailable";
    trace("refresh", "no-response", null, {target, attempts: REFRESH_ATTEMPTS});
    // Before the activity first completes, an owner that never answers is
    // unavailable; afterwards it shows as degraded and does not undo ready.
    if (state.desired && state.transitionCompletedAt === null) {
      state.targets[target] = {
        status: "unavailable",
        observedAt: now.toISOString(),
        classification: null,
        failure: {operation: "refresh", reason: "no-response", occurredAt: now.toISOString()},
        details: null
      };
    }
  }

  function acceptIntent(event: Extract<TheatreInputEvent, {kind: "intent"}>) {
    if (typeof event.requestId !== "string" || !event.requestId) {
      throw new Error("theatre requestId is required");
    }
    if (!Number.isInteger(event.generation) || event.generation < 1) {
      throw new Error("theatre generation must be a positive integer");
    }
    if (!Object.hasOwn(config.activityProfiles, event.activity)) {
      throw new Error("unknown theatre activity");
    }
    if (event.requestedAt && observationTime({observedAt: event.requestedAt}) === null) {
      throw new Error("theatre requestedAt must be an ISO timestamp");
    }


    // The controller owns generations: a new request whose proposed number is
    // already taken (for example by a recovery) gets the next free one.
    let generation = event.generation;
    const taken = generation < state.generation || (generation === state.generation && state.desired !== null);
    if (taken && state.desired?.requestId !== event.requestId &&
      event.generation > state.lastProposedGeneration) {
      generation = state.generation + 1;
      trace("intent", "reassigned", "generation-taken", {requestId: event.requestId, proposed: event.generation, assigned: generation});
    } else if (event.generation < state.generation) {
      emit("rejected", {reason: "stale-generation", rejectedRequestId: event.requestId});
      trace("intent", "rejected", "stale-generation");
      return;
    }
    if (generation === state.generation && state.desired) {
      const duplicate = state.desired.requestId === event.requestId &&
        state.desired.activity === event.activity;
      if (duplicate) {
        trace("intent", "duplicate", null, {requestId: event.requestId});
        reconcile();
        return;
      }
      emit("rejected", {
        reason: state.desired.requestId === event.requestId ? "request-conflict" : "generation-conflict",
        rejectedRequestId: event.requestId
      });
      trace("intent", "rejected", "generation-conflict");
      return;
    }

    const previousDesired = state.desired;
    if (state.desired) {
      emit("superseded", {
        supersededRequestId: state.desired.requestId,
        supersededGeneration: state.desired.generation,
        supersededBy: event.requestId
      });
      state.metrics.superseded += 1;
    }
    const requestedAt = event.requestedAt || now.toISOString();
    state.desired = {
      requestId: event.requestId,
      generation,
      activity: event.activity,
      requestedAt
    };
    state.generation = generation;
    state.lastProposedGeneration = Math.max(state.lastProposedGeneration, event.generation);
    state.phase = "preparing";
    state.currentActivity = "unknown";
    state.targets = emptyTargets();
    state.unobserved = [];
    state.refreshPending = emptyRefreshPending();
    state.failure = null;
    state.blockedGeneration = null;
    state.availability = "unknown";
    state.transitionStartedAt = requestedAt;
    state.transitionCompletedAt = null;
    state.metrics.requests += 1;
    resetTransitionMetrics(state.metrics);
    commands.push(...targetIntentCommands(state.desired, config, previousDesired));
    trace("intent", "accepted", null, {activity: event.activity, generation});
  }

  function acceptTargetState(event: Extract<TheatreInputEvent, {kind: "target_state"}>) {
    if (!TARGETS.includes(event.target)) throw new Error("unknown theatre target");
    if (!Number.isInteger(event.generation) || event.generation < 1) {
      throw new Error("target generation must be a positive integer");
    }
    if (!isTargetStatus(event.status)) throw new Error("unknown theatre target status");
    if (observationTime(event) === null) throw new Error("target observedAt must be an ISO timestamp");
    if (event.classification && !Object.hasOwn(TARGET_CLASSIFICATIONS, event.classification)) {
      throw new Error("unknown theatre target classification");
    }
    if (!state.desired || event.generation !== state.generation) {
      trace("target-state", "ignored", "stale-generation", {
        target: event.target,
        generation: event.generation
      });
      return;
    }

    const previous = state.targets[event.target];
    // A target the activity was recovered without has reported.
    if (state.unobserved.includes(event.target)) state.unobserved = state.unobserved.filter((target) => target !== event.target);
    const bounded = boundObservedAt(event.observedAt, observationTime(event)!, nowMs);
    if (bounded.skewed) {
      trace("target-state", "adjusted", "clock-skew", {target: event.target, reported: event.observedAt, usedAt: bounded.observedAt});
    }
    if (previous && isOutOfOrder(bounded.ms, previous.observedAt, nowMs)) {
      trace("target-state", "ignored", "out-of-order", {target: event.target});
      return;
    }
    const drifted = state.phase === "ready" &&
      event.status !== "ready" && event.status !== "failed" && event.status !== "unavailable";
    const classification = event.classification || (drifted ? "drift" : null);
    state.targets[event.target] = {
      status: event.status,
      observedAt: bounded.observedAt,
      classification,
      failure: event.failure && typeof event.failure === "object" ? {...event.failure} : null,
      details: event.details && typeof event.details === "object" ? {...event.details} : null
    };
    updateTargetMetrics(event.target, state.targets[event.target]!, previous);
    if (classification === "manual_override" && previous?.classification !== classification) {
      state.metrics.manualOverrides += 1;
      state.metrics.targets[event.target].manualOverrides += 1;
    } else if (classification === "drift" && previous?.classification !== classification) {
      state.metrics.driftEvents += 1;
    }
    state.refreshPending[event.target] = null;
    if (classification) {
      emit(classification, {target: event.target});
      trace("target-state", "classified", classification, {target: event.target});
    } else {
      trace("target-state", "accepted", null, {target: event.target, status: event.status});
    }
    reconcile();
  }

  function acceptTargetObservation(event: Extract<TheatreInputEvent, {kind: "target_observation"}>) {
    if (!TARGETS.includes(event.target)) throw new Error("unknown theatre target");
    if (!event.values || typeof event.values !== "object" || Array.isArray(event.values)) {
      throw new Error("target observation values must be an object");
    }
    const observedMs = observationTime(event);
    if (observedMs === null) throw new Error("target observedAt must be an ISO timestamp");
    if (state.desired || state.phase !== "recovering") {
      trace("target-observation", "ignored", "not-recovering", {target: event.target});
      return;
    }
    const bounded = boundObservedAt(event.observedAt, observedMs, nowMs);
    state.recoveryObservations[event.target] = {observedAt: bounded.observedAt, values: {...event.values}};
    state.refreshPending[event.target] = null;
    trace("target-observation", "accepted", null, {target: event.target, values: event.values});
    // Every target recovery reads has answered: recover now, rather than
    // waiting for lighting's probe, which nobody answers, to run out.
    if (RECOVERY_TARGETS.every((target) => state.recoveryObservations[target])) {
      acceptRecovery({kind: "recover", reason: "startup", observations: state.recoveryObservations});
    }
  }

  // asOfMs: when the observations are judged fresh, now unless given. The
  // answers to one probe count together, as of the latest of them: the
  // probes run out only after the freshness window.
  function acceptRecovery(event: Extract<TheatreInputEvent, {kind: "recover"}>, asOfMs = nowMs) {
    if (!event.observations || typeof event.observations !== "object" ||
      Array.isArray(event.observations)) {
      throw new Error("recovery observations must be an object");
    }
    if (event.reason === "startup" && state.desired) {
      trace("recovery", "ignored", "active-desired-state");
      return;
    }
    if (event.reason === "manual_override" && state.phase !== "manual_override") {
      trace("recovery", "ignored", "manual-override-cleared");
      return;
    }

    state.recoveryObservations = {};
    const matches = Object.entries(config.activityProfiles)
      .filter(([, profile]) => recoveryMatches(profile, event.observations, asOfMs, config.freshnessMs, event.reason === "startup"))
      .map(([activity]) => activity);
    if (matches.length === 1) {
      const activity = matches[0]!;
      const generation = state.generation + 1;
      const requestedAt = now.toISOString();
      state.desired = {
        requestId: `recovery-${event.reason}-${nowMs}`,
        generation,
        activity,
        requestedAt
      };
      state.generation = generation;
      state.targets = emptyTargets();
      state.refreshPending = emptyRefreshPending();
      state.failure = null;
      state.blockedGeneration = null;
      state.degraded = [];
      state.transitionStartedAt = requestedAt;
      state.transitionCompletedAt = requestedAt;
      resetTransitionMetrics(state.metrics);
      const fresh = answered(event.observations, asOfMs, config.freshnessMs);
      state.unobserved = RECOVERY_TARGETS.filter((target) => !fresh.includes(target));
      for (const target of TARGETS) {
        const observation = event.observations[target];
        if (state.unobserved.includes(target)) {
          // Not answered: unconfirmed until it reports.
          state.targets[target] = null;
          continue;
        }
        state.targets[target] = {
          status: "ready",
          observedAt: observation?.observedAt || requestedAt,
          classification: null,
          failure: null,
          details: {
            recovery: observation?.values || {},
            ownership: target === "lighting" && !observation ? "preserved" : "observed"
          }
        };
        updateTargetMetrics(target, state.targets[target]!, null);
      }
      state.phase = "ready";
      state.currentActivity = activity;
      state.degraded = state.unobserved.map((target) => ({target, reason: "unobserved"}));
      state.availability = state.unobserved.length ? "degraded" : "available";
      state.metrics.recoveriesAdopted += 1;
      completeTransition("ready");
      state.metrics.lastOutcome = "recovery_adopted";
      emit("recovery_adopted", {reason: event.reason, matchedActivity: activity, unobserved: state.unobserved});
      trace("recovery", "adopted", null, {reason: event.reason, activity, unobserved: state.unobserved});
      return;
    }

    if (event.reason === "startup") {
      // No evidence, or more than one match: the activity is unknown, and
      // nothing is commanded until the next request. Starting with nothing
      // saved happens on a redeploy without a context store, so it must never
      // switch a running activity off.
      state.refreshPending = emptyRefreshPending();
      state.phase = "idle";
      state.currentActivity = "unknown";
      state.availability = "unknown";
      state.metrics.recoveriesUnknown += 1;
      state.metrics.lastOutcome = "recovery_unknown";
      emit("recovery_unknown", {
        matchCount: matches.length,
        matchedActivities: matches
      });
      trace("recovery", "unknown", matches.length ? "ambiguous" : "no-clean-match", {
        matchedActivities: matches
      });
      return;
    }

    state.phase = "manual_override";
    state.currentActivity = "unknown";
    state.availability = "degraded";
    state.metrics.lastOutcome = "manual_override";
    emit("recovery_ambiguous", {
      matchCount: matches.length,
      matchedActivities: matches
    });
    trace("recovery", "held", matches.length ? "ambiguous" : "no-clean-match", {
      matchedActivities: matches
    });
  }

  if (event.kind === "intent") {
    acceptIntent(event);
  } else if (event.kind === "target_state") {
    acceptTargetState(event);
  } else if (event.kind === "recover") {
    acceptRecovery(event);
  } else if (event.kind === "target_observation") {
    acceptTargetObservation(event);
  } else if (event.kind === "startup" || event.kind === "refresh") {
    state.targets = emptyTargets();
    state.unobserved = [];
    state.refreshPending = emptyRefreshPending();
    if (state.desired) {
      commands.push(...targetRefreshCommands(state.desired, config));
      for (const target of TARGETS) state.refreshPending[target] = {sentAt: nowMs, attempts: 1, exhausted: false};
      state.phase = state.blockedGeneration === state.generation ? "failed" : "confirming";
      state.currentActivity = "unknown";
      state.availability = state.blockedGeneration === state.generation
        ? "unavailable"
        : "unknown";
      if (state.blockedGeneration !== state.generation) {
        state.transitionStartedAt = now.toISOString();
        state.transitionCompletedAt = null;
        // Re-confirming is a transition of its own: each target's
        // confirmation is timed again from now.
        for (const target of TARGETS) state.metrics.targets[target].lastConfirmationMs = null;
      }
    } else {
      commands.push(...targetProbeCommands());
      for (const target of TARGETS) state.refreshPending[target] = {sentAt: nowMs, attempts: 1, exhausted: false};
      state.recoveryObservations = {};
      state.phase = "recovering";
      state.availability = "unknown";
      emit("recovery_required", {reason: "startup"});
    }
    trace(event.kind, state.desired ? "refreshing" : "recovering");
  } else if (event.kind === "tick") {
    if (Number.isInteger(event.generation) && state.desired && event.generation !== state.generation) {
      trace("tick", "ignored", "stale-generation", {generation: event.generation});
    } else {
      tickRefreshes();
      if (!state.desired && state.phase === "recovering" &&
        TARGETS.every((target) => state.refreshPending[target] === null || state.refreshPending[target]?.exhausted === true)) {
        // The probes ran out: recover from what answered, the display and the
        // AVR among them; a target that didn't is unobserved.
        trace("recovery", "timed-out", Object.keys(state.recoveryObservations).length ? "partial-observations" : "no-observations",
          {answered: Object.keys(state.recoveryObservations)});
        const latest = Math.max(...Object.values(state.recoveryObservations).map((entry) => Date.parse(entry!.observedAt)));
        acceptRecovery({kind: "recover", reason: "startup", observations: state.recoveryObservations},
          Number.isFinite(latest) ? Math.min(latest, nowMs) : nowMs);
      } else {
        reconcile();
      }
    }
  } else {
    throw new Error("unknown theatre event kind");
  }

  events.unshift(stateEvent(state, config.area));
  return {state, commands, events, traces, status: statusFor(state)};
}
