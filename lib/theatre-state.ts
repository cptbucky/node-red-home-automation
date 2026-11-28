"use strict";

// The theatre activity controller's state: what was asked for, what each
// target last reported, its metrics, and the snapshot it publishes.

import type {TargetStatus} from "./target-state";
import {TARGETS, type ActivityProfiles, type TheatreTarget} from "./theatre-profiles";

export type {TargetStatus};

export type TargetClassification = "drift" | "manual_override";

export type TheatreAvailability = "unknown" | "available" | "degraded" | "unavailable";

export const TARGET_CLASSIFICATIONS: Record<TargetClassification, true> = {
  drift: true,
  manual_override: true
};

const AVAILABILITIES: Record<TheatreAvailability, true> = {
  unknown: true,
  available: true,
  degraded: true,
  unavailable: true
};

export interface TheatreDesired {
  requestId: string;
  generation: number;
  activity: string;
  requestedAt: string;
}

export interface TargetFailure {
  operation?: string | null;
  reason?: string;
  occurredAt?: string;
}

export interface TargetState {
  status: TargetStatus;
  observedAt: string;
  classification: TargetClassification | null;
  failure: TargetFailure | null;
  details: Record<string, unknown> | null;
}

export interface TheatreFailure {
  target: TheatreTarget;
  operation: string | null;
  reason: string;
  occurredAt: string;
}

export interface TheatreTargetMetrics {
  attempts: number;
  retries: number;
  failures: number;
  manualOverrides: number;
  fallbackUses: number;
  fallbackUsed: boolean;
  lastConfirmationMs: number | null;
  observationAgeMs: number | null;
  availability: TheatreAvailability;
}

export interface TheatreMetrics {
  requests: number;
  ready: number;
  failed: number;
  superseded: number;
  manualOverrides: number;
  driftEvents: number;
  recoveriesAdopted: number;
  recoveriesUnknown: number;
  lastTransitionMs: number | null;
  maxTransitionMs: number | null;
  lastOutcome: string | null;
  targets: Record<TheatreTarget, TheatreTargetMetrics>;
}

export interface RecoveryObservation {
  observedAt: string;
  values: Record<string, unknown>;
}

export type RecoveryObservations = Partial<Record<TheatreTarget, RecoveryObservation>>;

// A refresh sent to a target owner and not yet answered.
export interface RefreshPending {
  sentAt: number;
  attempts: number;
  exhausted: boolean;
}

export interface TheatreState {
  desired: TheatreDesired | null;
  currentActivity: string;
  generation: number;
  // The highest generation proposed by a request from outside (not
  // recovery). A new request proposing more than that is never lost to a
  // generation the controller used meanwhile; it gets the next free one.
  lastProposedGeneration: number;
  phase: string;
  targets: Record<TheatreTarget, TargetState | null>;
  refreshPending: Record<TheatreTarget, RefreshPending | null>;
  failure: TheatreFailure | null;
  blockedGeneration: number | null;
  degraded: Array<{target: TheatreTarget; reason: string}>;
  availability: TheatreAvailability;
  transitionStartedAt: string | null;
  transitionCompletedAt: string | null;
  metrics: TheatreMetrics;
  // While recovering after a start with nothing saved: what each target
  // owner reported its device shows, in answer to the probe.
  recoveryObservations: RecoveryObservations;
  // Targets an activity was recovered without, as they didn't answer (a
  // WLED backlight, which can't be asked; a quiet source): unconfirmed until
  // they report, the activity held ready meanwhile.
  unobserved: TheatreTarget[];
}

export function emptyTargets(
  saved: Partial<Record<TheatreTarget, TargetState | null>> = {}
): Record<TheatreTarget, TargetState | null> {
  return Object.fromEntries(TARGETS.map((target) => [
    target,
    saved[target] && typeof saved[target] === "object" ? {...saved[target]} : null
  ])) as Record<TheatreTarget, TargetState | null>;
}

// A refresh is re-sent at this many attempts at most before the target is
// reported as not responding.
export const REFRESH_ATTEMPTS = 3;

export function emptyRefreshPending(
  saved: Partial<Record<TheatreTarget, RefreshPending | boolean | null>> = {}
): Record<TheatreTarget, RefreshPending | null> {
  return Object.fromEntries(TARGETS.map((target) => {
    const entry = saved[target];
    // Saved before retries existed: pending with no send time, so it retries.
    if (entry === true) return [target, {sentAt: 0, attempts: 1, exhausted: false}];
    if (entry && typeof entry === "object" && Number.isFinite(entry.sentAt) && Number.isInteger(entry.attempts)) {
      return [target, {sentAt: entry.sentAt, attempts: entry.attempts, exhausted: entry.exhausted === true}];
    }
    return [target, null];
  })) as Record<TheatreTarget, RefreshPending | null>;
}

export function count(value: unknown): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function nullableDuration(value: unknown): number | null {
  // Not a duration yet: null, as saved. Number(null) would make it 0.
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function targetMetrics(
  saved: Partial<Record<TheatreTarget, Partial<TheatreTargetMetrics>>> = {}
): Record<TheatreTarget, TheatreTargetMetrics> {
  return Object.fromEntries(TARGETS.map((target) => {
    const metric = saved[target] || {};
    const availability = typeof metric.availability === "string" &&
      Object.hasOwn(AVAILABILITIES, metric.availability)
      ? metric.availability as TheatreAvailability
      : "unknown";
    return [target, {
      attempts: count(metric.attempts),
      retries: count(metric.retries),
      failures: count(metric.failures),
      manualOverrides: count(metric.manualOverrides),
      fallbackUses: count(metric.fallbackUses),
      fallbackUsed: metric.fallbackUsed === true,
      lastConfirmationMs: nullableDuration(metric.lastConfirmationMs),
      observationAgeMs: nullableDuration(metric.observationAgeMs),
      availability
    }];
  })) as Record<TheatreTarget, TheatreTargetMetrics>;
}

function createMetrics(saved: Partial<TheatreMetrics> = {}): TheatreMetrics {
  return {
    requests: count(saved.requests),
    ready: count(saved.ready),
    failed: count(saved.failed),
    superseded: count(saved.superseded),
    manualOverrides: count(saved.manualOverrides),
    driftEvents: count(saved.driftEvents),
    recoveriesAdopted: count(saved.recoveriesAdopted),
    recoveriesUnknown: count(saved.recoveriesUnknown),
    lastTransitionMs: nullableDuration(saved.lastTransitionMs),
    maxTransitionMs: nullableDuration(saved.maxTransitionMs),
    lastOutcome: typeof saved.lastOutcome === "string" ? saved.lastOutcome : null,
    targets: targetMetrics(saved.targets)
  };
}

export function createTheatreState(
  saved: Partial<TheatreState> = {},
  activityProfiles: ActivityProfiles = {}
): TheatreState {
  const savedDesired = saved.desired && typeof saved.desired === "object" ? saved.desired : null;
  const desired = savedDesired && Object.hasOwn(activityProfiles, savedDesired.activity)
    ? {...savedDesired}
    : null;
  return {
    desired,
    currentActivity: typeof saved.currentActivity === "string" &&
      Object.hasOwn(activityProfiles, saved.currentActivity)
      ? saved.currentActivity
      : "unknown",
    generation: Number.isInteger(saved.generation) && (saved.generation ?? -1) >= 0 ? saved.generation! : 0,
    lastProposedGeneration: Number.isInteger(saved.lastProposedGeneration)
      ? saved.lastProposedGeneration!
      : savedDesired && !savedDesired.requestId.startsWith("recovery-") && Number.isInteger(savedDesired.generation)
        ? savedDesired.generation
        : 0,
    phase: typeof saved.phase === "string" ? saved.phase : "idle",
    targets: emptyTargets(saved.targets),
    refreshPending: emptyRefreshPending(saved.refreshPending),
    failure: saved.failure && typeof saved.failure === "object" ? {...saved.failure} : null,
    blockedGeneration: Number.isInteger(saved.blockedGeneration) ? saved.blockedGeneration! : null,
    degraded: Array.isArray(saved.degraded) ? saved.degraded.map((entry) => ({...entry})) : [],
    availability: saved.availability && Object.hasOwn(AVAILABILITIES, saved.availability)
      ? saved.availability
      : "unknown",
    transitionStartedAt: typeof saved.transitionStartedAt === "string"
      ? saved.transitionStartedAt
      : null,
    transitionCompletedAt: typeof saved.transitionCompletedAt === "string"
      ? saved.transitionCompletedAt
      : null,
    metrics: createMetrics(saved.metrics),
    recoveryObservations: saved.recoveryObservations && typeof saved.recoveryObservations === "object" &&
      !Array.isArray(saved.recoveryObservations)
      ? Object.fromEntries(Object.entries(saved.recoveryObservations)
        .filter(([target, entry]) => (TARGETS as readonly string[]).includes(target) && entry && typeof entry === "object")
        .map(([target, entry]) => [target, {...entry}]))
      : {},
    unobserved: Array.isArray(saved.unobserved)
      ? saved.unobserved.filter((target): target is TheatreTarget => (TARGETS as readonly string[]).includes(target))
      : []
  };
}

// The complete state the activity controller publishes, which the state
// contract turns into retained MQTT state.
export interface TheatreSnapshot {
  kind: "state";
  area: string;
  requestId: string | null;
  generation: number;
  desiredActivity: string | null;
  requestedAt: string | null;
  currentActivity: string;
  phase: string;
  availability: TheatreAvailability;
  transitionStartedAt: string | null;
  transitionCompletedAt: string | null;
  targets: Record<TheatreTarget, TargetState | null>;
  failure: TheatreFailure | null;
  degraded: Array<{target: TheatreTarget; reason: string}>;
  metrics: TheatreMetrics;
}

export function theatreSnapshot(state: TheatreState, area: string): TheatreSnapshot {
  return {
    kind: "state",
    area,
    requestId: state.desired?.requestId || null,
    generation: state.generation,
    desiredActivity: state.desired?.activity || null,
    requestedAt: state.desired?.requestedAt || null,
    currentActivity: state.currentActivity,
    phase: state.phase,
    availability: state.availability,
    transitionStartedAt: state.transitionStartedAt,
    transitionCompletedAt: state.transitionCompletedAt,
    targets: emptyTargets(state.targets),
    failure: state.failure ? {...state.failure} : null,
    degraded: state.degraded.map((entry) => ({...entry})),
    metrics: createMetrics(state.metrics)
  };
}
