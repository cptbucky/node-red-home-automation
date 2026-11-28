"use strict";

import assert from "node:assert/strict";
import test from "node:test";
import {evaluateTheatreSlo, type TheatreSloState} from "../lib/theatre-slo";
import {transitionAvr, type AvrState} from "../lib/avr-controller";
import {transitionBacklighting, type BacklightingState} from "../lib/backlighting-controller";
import {
  normaliseActivityProfiles,
  transitionTheatre,
  type ActivityProfiles,
  type TargetClassification,
  type TargetFailure,
  type TargetStatus,
  type TheatreConfig,
  type TheatreInputEvent,
  type TheatreState,
  type TheatreTarget
} from "../lib/theatre-activity-controller";

const activityProfiles: ActivityProfiles = normaliseActivityProfiles({
  off: {
    display: {mode: "off"},
    avr: {power: "standby"},
    source: {action: "deactivate", readiness: "optional"},
    lighting: {profile: "off"},
    backlighting: {power: "off"}
  },
  tv_shield: {
    display: {mode: "tv"},
    avr: {power: "on", source: "shield"},
    source: {action: "activate", sourceId: "shield", readiness: "required"},
    lighting: {profile: "tv"},
    backlighting: {power: "on"}
  },
  tv_ps5: {
    display: {mode: "tv"},
    avr: {power: "on", source: "playstation"},
    source: {action: "activate", sourceId: "playstation", readiness: "required"},
    lighting: {profile: "tv"},
    backlighting: {power: "on"}
  },
  projector_shield: {
    display: {mode: "projector"},
    avr: {power: "on", source: "shield"},
    source: {action: "activate", sourceId: "shield", readiness: "required"},
    lighting: {profile: "projector"},
    backlighting: {power: "off"}
  },
  projector_ps5: {
    display: {mode: "projector"},
    avr: {power: "on", source: "playstation"},
    source: {action: "activate", sourceId: "playstation", readiness: "required"},
    lighting: {profile: "projector"},
    backlighting: {power: "off"}
  }
});
const activities = Object.keys(activityProfiles);
const config: TheatreConfig = {area: "lounge", freshnessMs: 10000, activityProfiles};
const at = (seconds: number): Date =>
  new Date(Date.parse("2026-11-21T14:00:00Z") + seconds * 1000);

function apply(
  state: Partial<TheatreState> | undefined,
  theatre: TheatreInputEvent,
  seconds = 0
) {
  return transitionTheatre(state, {theatre}, config, at(seconds));
}

function request(
  state: Partial<TheatreState> | undefined,
  activity: string,
  generation = 1,
  seconds = 0,
  requestId = `${activity}-${generation}`
) {
  return apply(state, {kind: "intent", requestId, generation, activity}, seconds);
}

interface TargetValues {
  classification?: TargetClassification;
  failure?: TargetFailure;
  details?: Record<string, unknown>;
}

function target(
  state: Partial<TheatreState> | undefined,
  name: TheatreTarget,
  status: TargetStatus,
  generation: number,
  seconds: number,
  values: TargetValues = {}
) {
  return apply(state, {
    kind: "target_state",
    target: name,
    status,
    generation,
    observedAt: at(seconds).toISOString(),
    ...values
  }, seconds);
}

function confirmCore(state: Partial<TheatreState>, generation: number, seconds = 1) {
  let result = target(state, "display", "ready", generation, seconds);
  result = target(result.state, "avr", "ready", generation, seconds + 0.1);
  result = target(result.state, "backlighting", "ready", generation, seconds + 0.2);
  return result;
}

function confirmActivity(activity: string, generation = 1) {
  let result = request(undefined, activity, generation);
  result = confirmCore(result.state, generation);
  const profile = activityProfiles[activity];
  assert.ok(profile);
  if (profile.source.readiness === "required") {
    result = target(result.state, "source", "ready", generation, 1.2);
  }
  return result;
}

test("activity and source names are configuration-owned", () => {
  const customProfiles = normaliseActivityProfiles({
    movie_night: {
      display: {mode: "projection"},
      avr: {power: "on", input: "disc"},
      source: {action: "activate", sourceId: "disc_player", readiness: "required"},
      lighting: {profile: "dim"},
      backlighting: {power: "off"}
    }
  });
  const result = transitionTheatre(undefined, {
    theatre: {
      kind: "intent",
      requestId: "movie-night-1",
      generation: 1,
      activity: "movie_night"
    }
  }, {activityProfiles: customProfiles}, at(0));

  assert.equal(result.commands.find(({target}) => target === "source")?.sourceId, "disc_player");
  assert.throws(
    () => normaliseActivityProfiles({
      broken: {...customProfiles.movie_night, source: {action: "activate", sourceId: "disc_player"}}
    }),
    /source readiness/
  );
  assert.throws(
    () => normaliseActivityProfiles({
      broken: {...customProfiles.movie_night, lighting: {profile: "not valid"}}
    }),
    /invalid lighting profile/
  );
  assert.throws(
    () => normaliseActivityProfiles({
      broken: {...customProfiles.movie_night, backlighting: {power: "toggle"}}
    }),
    /invalid backlighting power/
  );
});


test("uses configured activity profiles as semantic target states", () => {
  const expected = {
    off: ["off", "standby", null, "off", "off"],
    tv_shield: ["tv", "on", "shield", "tv", "on"],
    tv_ps5: ["tv", "on", "playstation", "tv", "on"],
    projector_shield: ["projector", "on", "shield", "projector", "off"],
    projector_ps5: ["projector", "on", "playstation", "projector", "off"]
  };

  assert.deepEqual(activities, Object.keys(expected));
  for (const [activity, values] of Object.entries(expected)) {
    const result = request(undefined, activity);
    assert.equal(result.commands.length, 5);
    assert.deepEqual(result.commands.map((command) => command.target), [
      "display", "avr", "source", "lighting", "backlighting"
    ]);
    assert.deepEqual([
      result.commands[0]?.mode,
      result.commands[1]?.power,
      result.commands[2]?.sourceId,
      result.commands[3]?.profile,
      result.commands[4]?.power
    ], values);
    assert.equal(result.commands.every((command) => command.kind === "intent"), true);
    assert.equal(result.commands.every((command) => command.generation === 1), true);
    assert.deepEqual(activityProfiles[activity]?.display, {mode: values[0]});
  }
});

test("every activity becomes ready only from fresh mandatory confirmations", () => {
  for (const activity of activities) {
    const result = confirmActivity(activity);
    assert.equal(result.state.phase, "ready", activity);
    assert.equal(result.state.currentActivity, activity);
    assert.equal(result.events.some((entry) => entry.theatre.kind === "ready"), true);
  }
});

test("source readiness is explicit and PS5 never pretends it was powered on", () => {
  let result = request(undefined, "projector_ps5", 3);
  const sourceCommand = result.commands.find((command) => command.target === "source");
  assert.deepEqual(sourceCommand, {
    target: "source",
    kind: "intent",
    requestId: "projector_ps5-3",
    generation: 3,
    action: "activate",
    sourceId: "playstation",
    readiness: "required"
  });

  result = confirmCore(result.state, 3);
  assert.equal(result.state.phase, "waiting_for_source");
  assert.equal(result.state.currentActivity, "unknown");

  result = target(result.state, "source", "unavailable", 3, 1.2, {
    failure: {reason: "no-supported-control"}
  });
  assert.equal(result.state.phase, "waiting_for_source");
  assert.equal(result.state.failure, null);

  result = target(result.state, "source", "ready", 3, 1.3);
  assert.equal(result.state.phase, "ready");
  assert.equal(result.state.currentActivity, "projector_ps5");
});

test("new requests supersede unfinished work and stale target state is inert", () => {
  let result = request(undefined, "projector_shield", 1);
  result = target(result.state, "display", "transitioning", 1, 0.1);
  result = request(result.state, "tv_ps5", 2, 0.2);

  assert.equal(result.events.some((entry) => entry.theatre.kind === "superseded"), true);
  assert.equal(result.commands.length, 5);
  assert.equal(result.state.desired?.activity, "tv_ps5");

  result = target(result.state, "display", "ready", 1, 0.3);
  assert.equal(result.state.targets.display, null);
  assert.equal(result.commands.length, 0);
  assert.equal(result.traces.some((entry) => entry.reason === "stale-generation"), true);
});

test("new requests supersede every unfinished activity boundary", () => {
  const preparing = request(undefined, "projector_shield", 1);
  const confirming = target(preparing.state, "display", "ready", 1, 0.1);
  const transitioning = target(preparing.state, "display", "transitioning", 1, 0.1);
  const waiting = confirmCore(request(undefined, "projector_ps5", 1).state, 1);
  const boundaries = [
    ["preparing", preparing.state],
    ["confirming", confirming.state],
    ["transitioning", transitioning.state],
    ["waiting_for_source", waiting.state]
  ] as const;

  for (const [phase, state] of boundaries) {
    assert.equal(state.phase, phase);
    let result = request(state, "tv_shield", 2, 2, `supersede-${phase}`);
    assert.equal(result.events.some((entry) => entry.theatre.kind === "superseded"), true);
    assert.equal(result.commands.length, 5);
    assert.equal(result.state.desired?.activity, "tv_shield");

    result = target(result.state, "display", "ready", 1, 2.1);
    assert.equal(result.state.targets.display, null);
    assert.equal(result.commands.length, 0);
    assert.equal(result.traces.some((entry) => entry.reason === "stale-generation"), true);
  }
});

test("startup from every active phase refreshes observations without replaying intents", () => {
  const preparing = request(undefined, "projector_shield", 1);
  const confirming = target(preparing.state, "display", "ready", 1, 0.1);
  const transitioning = target(preparing.state, "display", "transitioning", 1, 0.1);
  const waiting = confirmCore(request(undefined, "projector_ps5", 1).state, 1);
  const ready = confirmActivity("tv_shield");

  for (const state of [
    preparing.state,
    confirming.state,
    transitioning.state,
    waiting.state,
    ready.state
  ]) {
    const result = apply(state, {kind: "startup"}, 3);
    assert.equal(result.state.phase, "confirming");
    assert.equal(result.state.currentActivity, "unknown");
    assert.equal(result.commands.length, 5);
    assert.equal(result.commands.every((command) => command.kind === "refresh"), true);
    assert.equal(result.traces.some((entry) =>
      entry.event === "startup" && entry.outcome === "refreshing"), true);
  }
});

test("same-generation conflicts are rejected while exact duplicates are idempotent", () => {
  let result = request(undefined, "tv_shield", 4, 0, "request-4");
  result = request(result.state, "tv_shield", 4, 0.1, "request-4");
  assert.equal(result.commands.length, 0);
  assert.equal(result.traces.some((entry) => entry.outcome === "duplicate"), true);

  result = request(result.state, "tv_ps5", 4, 0.2, "request-4");
  assert.equal(result.commands.length, 0);
  assert.equal(result.state.desired?.activity, "tv_shield");
  assert.equal(result.events.some((entry) => entry.theatre.reason === "request-conflict"), true);
});

test("mandatory target failure blocks its generation across refresh and fails closed", () => {
  let result = request(undefined, "tv_shield", 5);
  result = target(result.state, "display", "failed", 5, 1, {
    failure: {operation: "tv_on", reason: "confirmation-timeout", occurredAt: at(1).toISOString()}
  });

  assert.equal(result.state.phase, "failed");
  assert.equal(result.state.blockedGeneration, 5);
  assert.deepEqual(result.state.failure, {
    target: "display",
    operation: "tv_on",
    reason: "confirmation-timeout",
    occurredAt: at(1).toISOString()
  });
  assert.equal(result.commands.length, 0);

  result = target(result.state, "display", "ready", 5, 1.1);
  assert.equal(result.state.phase, "failed");
  assert.equal(result.commands.length, 0);

  result = apply(result.state, {kind: "startup"}, 2);
  assert.equal(result.state.phase, "failed");
  assert.equal(result.commands.length, 5);
  assert.equal(result.commands.every((command) => command.kind === "refresh"), true);
});

test("a newer request clears a blocked generation and can recover", () => {
  let result = request(undefined, "projector_shield", 6);
  result = target(result.state, "avr", "unavailable", 6, 0.5, {
    failure: {reason: "connection-refused"}
  });
  assert.equal(result.state.phase, "failed");

  result = request(result.state, "off", 7, 1);
  assert.equal(result.state.failure, null);
  assert.equal(result.state.blockedGeneration, null);
  result = confirmCore(result.state, 7, 1.1);
  assert.equal(result.state.phase, "ready");
  assert.equal(result.state.currentActivity, "off");
});

test("optional lighting failures are visible degradation but do not lie about core readiness", () => {
  let result = request(undefined, "tv_shield", 8);
  result = target(result.state, "lighting", "failed", 8, 0.5, {
    failure: {reason: "zigbee-unavailable"}
  });
  result = target(result.state, "backlighting", "ready", 8, 0.6);
  result = confirmCore(result.state, 8, 0.7);
  result = target(result.state, "source", "ready", 8, 0.9);

  assert.equal(result.state.phase, "ready");
  assert.deepEqual(result.state.degraded, [{target: "lighting", reason: "zigbee-unavailable"}]);
  assert.equal(result.state.availability, "degraded");
  assert.equal(result.state.transitionStartedAt, at(0).toISOString());
  assert.equal(result.state.transitionCompletedAt, at(0.9).toISOString());
  const eventDegraded = result.events[0]?.theatre.degraded as
    | Array<{target: TheatreTarget; reason: string}>
    | undefined;
  assert.equal(eventDegraded?.[0]?.target, "lighting");
});

test("backlighting confirmation is mandatory and failure blocks the generation", () => {
  let result = request(undefined, "tv_shield", 14);
  result = target(result.state, "display", "ready", 14, 0.2);
  result = target(result.state, "avr", "ready", 14, 0.3);
  result = target(result.state, "source", "ready", 14, 0.4);
  assert.equal(result.state.phase, "confirming");
  assert.equal(result.state.currentActivity, "unknown");

  result = target(result.state, "backlighting", "failed", 14, 0.5, {
    failure: {operation: "set_power", reason: "confirmation-timeout"}
  });
  assert.equal(result.state.phase, "failed");
  assert.equal(result.state.failure?.target, "backlighting");
  assert.equal(result.state.blockedGeneration, 14);
});

test("fresh target drift removes ready state without creating a new activity", () => {
  let result = confirmActivity("tv_shield", 9);
  result = target(result.state, "display", "transitioning", 9, 2, {
    details: {reason: "physical-remote-drift"}
  });

  assert.equal(result.state.phase, "transitioning");
  assert.equal(result.state.currentActivity, "unknown");
  assert.equal(result.state.desired?.activity, "tv_shield");
  assert.equal(result.commands.length, 0);
  assert.equal(result.state.targets.display?.classification, "drift");
  assert.equal(result.events.some((entry) => entry.theatre.kind === "drift"), true);
  assert.equal(result.state.availability, "degraded");
});

test("explicit manual override classification remains evidence, not a new request", () => {
  let result = confirmActivity("projector_shield", 12);
  result = target(result.state, "display", "transitioning", 12, 2, {
    classification: "manual_override",
    details: {reason: "physical-remote"}
  });

  assert.equal(result.state.targets.display?.classification, "manual_override");
  assert.equal(result.events.some((entry) => entry.theatre.kind === "manual_override"), true);
  assert.equal(result.state.desired?.activity, "projector_shield");
  assert.equal(result.state.generation, 12);
  assert.equal(result.state.phase, "manual_override");
  assert.equal(result.commands.length, 0);
  assert.equal(result.state.metrics.manualOverrides, 1);
});

test("adapter failure after ready is failure evidence, not physical drift", () => {
  let result = confirmActivity("tv_shield", 13);
  result = target(result.state, "display", "failed", 13, 2, {
    failure: {reason: "transport-timeout"}
  });

  assert.equal(result.state.phase, "failed");
  assert.equal(result.events.some((entry) => entry.theatre.kind === "failed"), true);
  assert.equal(result.events.some((entry) => entry.theatre.kind === "drift"), false);
  assert.equal(result.state.targets.display?.classification, null);
});

test("a stale target while ready is refreshed without leaving ready", () => {
  let result = confirmActivity("projector_shield", 10);
  result = apply(result.state, {kind: "tick", generation: 10}, 12);

  assert.equal(result.state.phase, "ready");
  assert.equal(result.state.currentActivity, "projector_shield");
  assert.deepEqual(result.commands.map((command) => command.target).sort(), [
    "avr", "backlighting", "display", "source"
  ]);
  assert.deepEqual(result.state.degraded.filter(({reason}) => reason === "stale").map(({target}) => target).sort(), [
    "avr", "backlighting", "display", "source"
  ]);

  // Within the retry interval nothing is re-sent.
  result = apply(result.state, {kind: "tick", generation: 10}, 13);
  assert.equal(result.commands.length, 0);
});

test("older same-generation observations cannot overwrite newer target state", () => {
  let result = request(undefined, "off", 11);
  result = target(result.state, "display", "ready", 11, 2);
  result = target(result.state, "display", "failed", 11, 1, {
    failure: {reason: "late-failure"}
  });

  assert.equal(result.state.targets.display?.status, "ready");
  assert.equal(result.state.phase, "confirming");
  assert.equal(result.traces.some((entry) => entry.reason === "out-of-order"), true);
});

test("startup without persisted intent probes before recovering physical state", () => {
  const result = apply(undefined, {kind: "startup"});
  assert.equal(result.state.phase, "recovering");
  assert.deepEqual(result.commands.map(({target, kind}) => ({target, kind})), [
    {target: "display", kind: "refresh"},
    {target: "avr", kind: "refresh"},
    {target: "source", kind: "refresh"},
    {target: "lighting", kind: "refresh"},
    {target: "backlighting", kind: "refresh"}
  ]);
  assert.equal(result.events.some(({theatre}) => theatre.kind === "recovery_required"), true);
});

test("recovery adopts one clean physical profile without issuing commands", () => {
  const startup = apply(undefined, {kind: "startup"});
  const observedAt = at(1).toISOString();
  const result = apply(startup.state, {
    kind: "recover",
    reason: "startup",
    observations: {
      display: {observedAt, values: {mode: "tv"}},
      avr: {observedAt, values: {power: "on", source: "shield"}},
      source: {observedAt, values: {action: "activate", sourceId: "shield"}},
      backlighting: {observedAt, values: {power: "on"}}
    }
  }, 1);

  assert.equal(result.commands.length, 0);
  assert.equal(result.state.desired?.activity, "tv_shield");
  assert.equal(result.state.currentActivity, "tv_shield");
  assert.equal(result.state.phase, "ready");
  assert.equal(result.state.generation, 1);
  assert.equal(result.state.metrics.recoveriesAdopted, 1);
  assert.equal(result.state.metrics.lastOutcome, "recovery_adopted");
});

test("ambiguous startup recovery leaves the activity unknown and commands nothing", () => {
  const observedAt = at(1).toISOString();
  const result = apply(undefined, {
    kind: "recover",
    reason: "startup",
    observations: {
      display: {observedAt, values: {mode: "tv"}},
      avr: {observedAt, values: {power: "standby"}},
      source: {observedAt, values: {action: "deactivate"}},
      backlighting: {observedAt, values: {power: "on"}}
    }
  }, 1);

  assert.equal(result.state.desired, null);
  assert.equal(result.state.phase, "idle");
  assert.equal(result.state.currentActivity, "unknown");
  assert.deepEqual(result.commands, [], "a running activity is never switched off");
  assert.equal(result.state.metrics.recoveriesUnknown, 1);
  assert.equal(result.state.metrics.lastOutcome, "recovery_unknown");
  assert.equal(result.events.some(({theatre}) => theatre.kind === "recovery_unknown"), true);

  // The next request is handled as usual.
  const next = apply(result.state, {kind: "intent", requestId: "after-recovery", generation: 1, activity: "tv_shield"}, 2);
  assert.equal(next.state.desired?.activity, "tv_shield");
  assert.equal(next.commands.filter(({kind}) => kind === "intent").length, 5);
});

test("ambiguous manual recovery holds ownership without issuing commands", () => {
  let result = confirmActivity("tv_shield", 16);
  result = target(result.state, "avr", "transitioning", 16, 2, {
    classification: "manual_override"
  });
  const observedAt = at(2.1).toISOString();
  result = apply(result.state, {
    kind: "recover",
    reason: "manual_override",
    observations: {
      display: {observedAt, values: {mode: "tv"}},
      avr: {observedAt, values: {power: "on", source: "unknown"}},
      source: {observedAt, values: {action: "deactivate"}},
      backlighting: {observedAt, values: {power: "on"}}
    }
  }, 2.1);

  assert.equal(result.state.phase, "manual_override");
  assert.equal(result.commands.length, 0);
  assert.equal(result.events.some(({theatre}) => theatre.kind === "recovery_ambiguous"), true);
});

test("metrics retain transition latency, retries, fallback use and target availability", () => {
  let result = request(undefined, "tv_shield", 17);
  result = target(result.state, "display", "transitioning", 17, 1, {
    details: {metrics: {attempts: 2, fallbackUsed: true}}
  });
  result = target(result.state, "display", "ready", 17, 2, {
    details: {metrics: {attempts: 2, fallbackUsed: true}}
  });
  result = target(result.state, "avr", "ready", 17, 2.1);
  result = target(result.state, "backlighting", "ready", 17, 2.2);
  result = target(result.state, "source", "ready", 17, 2.3);

  assert.equal(result.state.metrics.requests, 1);
  assert.equal(result.state.metrics.ready, 1);
  assert.equal(result.state.metrics.lastTransitionMs, 2300);
  assert.equal(result.state.metrics.maxTransitionMs, 2300);
  assert.equal(result.state.metrics.targets.display.retries, 1);
  assert.equal(result.state.metrics.targets.display.fallbackUses, 1);
  assert.equal(result.state.metrics.targets.display.lastConfirmationMs, 2000);
  assert.equal(result.state.metrics.targets.display.availability, "available");
});

test("a target's confirmation time is how long it took to confirm, refreshes aside, and a restart times it again", () => {
  let result = confirmActivity("tv_shield", 1);
  const confirmed = result.state.metrics.targets.display.lastConfirmationMs;
  assert.ok(confirmed !== null && confirmed < 2000);
  // Refreshed and re-confirmed for a few minutes: unchanged.
  for (let seconds = 60; seconds <= 180; seconds += 60) result = target(result.state, "display", "ready", 1, seconds);
  assert.equal(result.state.metrics.targets.display.lastConfirmationMs, confirmed);
  // After a restart it confirms again: timed from then.
  result = apply(result.state, {kind: "startup"}, 300);
  assert.equal(result.state.metrics.targets.display.lastConfirmationMs, null);
  result = target(result.state, "display", "ready", 1, 303);
  assert.equal(result.state.metrics.targets.display.lastConfirmationMs, 3000);
});

test("unobserved lights leave the activity ready and the theatre degraded, naming them", () => {
  let result = confirmActivity("tv_shield", 1);
  result = target(result.state, "lighting", "ready", 1, 2, {details: {profile: "tv", unobserved: ["lamp"]}});
  assert.equal(result.state.phase, "ready");
  assert.equal(result.state.availability, "degraded");
  assert.deepEqual(result.state.degraded, [{target: "lighting", reason: "unobserved"}]);
  // The lamp reports: no longer degraded.
  result = target(result.state, "lighting", "ready", 1, 3, {details: {profile: "tv"}});
  assert.deepEqual([result.state.availability, result.state.degraded], ["available", []]);
});

function sloSnapshot(state: TheatreState) {
  return {
    generation: state.generation,
    desiredActivity: state.desired?.activity ?? null,
    phase: state.phase,
    transitionStartedAt: state.transitionStartedAt,
    transitionCompletedAt: state.transitionCompletedAt,
    metrics: state.metrics
  };
}

test("a settled activity stays ready through refresh cycles without false transitions", () => {
  // dev-review repro: everything ready at about 1 s, then ticks past several
  // freshness windows (10 s here) with owners answering each refresh.
  let result = confirmActivity("tv_shield", 1);
  const firstTransitionMs = result.state.metrics.lastTransitionMs;
  assert.equal(result.state.metrics.ready, 1);
  let slo: TheatreSloState | undefined;
  for (let seconds = 5; seconds <= 200; seconds += 5) {
    result = apply(result.state, {kind: "tick", generation: 1}, seconds);
    for (const command of result.commands) {
      result = target(result.state, command.target as TheatreTarget, "ready", 1, seconds + 0.1);
    }
    assert.equal(result.state.phase, "ready", `phase at ${seconds} s`);
    const assessment = evaluateTheatreSlo(slo, sloSnapshot(result.state), {}, at(seconds + 0.1));
    slo = assessment.state;
    assert.notEqual(assessment.assessment.status, "breached", `SLO at ${seconds} s: ${assessment.assessment.reason}`);
  }
  assert.equal(result.state.metrics.ready, 1);
  assert.equal(result.state.metrics.lastTransitionMs, firstTransitionMs);
  assert.equal(result.state.metrics.requests, 1);
});

test("an unanswered refresh is retried a bounded number of times, then reported", () => {
  let result = confirmActivity("tv_shield", 1);
  const sent: number[] = [];
  const reported: number[] = [];
  for (const seconds of [7, 12, 17, 22, 27, 32]) {
    result = apply(result.state, {kind: "tick", generation: 1}, seconds);
    sent.push(result.commands.length);
    reported.push(result.traces.filter((entry) => entry.event === "refresh" && entry.outcome === "no-response").length);
  }
  // First refresh, two retries, then each target is reported once and asked
  // again a freshness window later.
  assert.deepEqual(sent, [4, 4, 4, 0, 0, 4]);
  assert.deepEqual(reported, [0, 0, 0, 4, 0, 0]);
  assert.equal(result.state.phase, "ready");
  assert.deepEqual(Object.fromEntries(result.state.degraded.map(({target: name, reason}) => [name, reason])), {
    lighting: "unconfirmed", display: "no-response", avr: "no-response", backlighting: "no-response", source: "no-response"
  });
  assert.equal(result.state.metrics.targets.avr.availability, "unavailable");
  const assessment = evaluateTheatreSlo(undefined, sloSnapshot(result.state), {}, at(32));
  assert.notEqual(assessment.assessment.reason, "transition_timeout");

  // A late answer restores it.
  result = target(result.state, "avr", "ready", 1, 33);
  assert.equal(result.state.degraded.some(({target: name}) => name === "avr"), false);
});

test("a refresh lost after a restart ends as unavailable, not stuck confirming", () => {
  let result = confirmActivity("tv_shield", 1);
  result = apply(result.state, {kind: "startup"}, 50);
  assert.equal(result.state.phase, "confirming");
  for (const seconds of [55, 60, 65]) result = apply(result.state, {kind: "tick", generation: 1}, seconds);
  assert.equal(result.state.phase, "failed");
  assert.equal(result.state.failure?.reason, "no-response");
  result = apply(result.state, {kind: "tick", generation: 1}, 3650);
  assert.equal(result.state.phase, "failed");
});

test("recovery with no observations times out to an unknown activity, commanding nothing", () => {
  let result = apply(undefined, {kind: "startup"}, 0);
  assert.equal(result.state.phase, "recovering");
  const kinds: string[] = [];
  for (const seconds of [5, 10, 15]) {
    result = apply(result.state, {kind: "tick", generation: 0}, seconds);
    kinds.push(...result.commands.map((command) => command.kind));
  }
  assert.equal(result.state.desired, null);
  assert.equal(result.state.currentActivity, "unknown");
  assert.equal(result.traces.some((entry) => entry.event === "recovery" && entry.outcome === "timed-out"), true);
  assert.equal(result.events.some(({theatre}) => theatre.kind === "recovery_unknown"), true);
  assert.equal(kinds.filter((kind) => kind === "intent").length, 0, "no Off activity");
  // Idle: no more ticks are needed and none probe again.
  assert.equal(result.state.phase, "idle");
  assert.deepEqual(apply(result.state, {kind: "tick", generation: 0}, 20).commands, []);
});

test("a request is never lost to a generation the controller used for recovery", () => {
  // dev-review repro: recovery bumps the controller to generation 1 while the
  // contract, not yet told, numbers the user's request 1 as well. Adopting
  // the one matching activity takes a generation.
  let result = apply(undefined, {kind: "startup"}, 0);
  const observedAt = at(1).toISOString();
  result = apply(result.state, {kind: "recover", reason: "startup", observations: {
    display: {observedAt, values: {mode: "tv"}},
    avr: {observedAt, values: {power: "on", source: "shield"}},
    source: {observedAt, values: {action: "activate", sourceId: "shield"}},
    backlighting: {observedAt, values: {power: "on"}}
  }}, 1);
  assert.equal(result.state.desired?.activity, "tv_shield");
  assert.equal(result.state.generation, 1);

  result = request(result.state, "tv_shield", 1, 2, "user-request-1");
  assert.equal(result.events.some(({theatre}) => theatre.kind === "rejected"), false);
  assert.equal(result.state.desired?.requestId, "user-request-1");
  assert.equal(result.state.generation, 2);
  assert.equal(result.traces.some((entry) => entry.outcome === "reassigned"), true);
  assert.equal(result.commands.every((command) => command.generation === 2), true);

  // Back-to-back requests before any snapshot syncs the contract: it proposes
  // 2 for the next one, which is now taken too, and must not be lost.
  const quick = request(result.state, "off", 2, 2.1, "user-request-quick");
  assert.equal(quick.events.some(({theatre}) => theatre.kind === "rejected"), false);
  assert.equal(quick.state.desired?.requestId, "user-request-quick");
  assert.equal(quick.state.generation, 3);

  // The contract learns 2 from the snapshot and proposes 3 next: used as given.
  result = request(result.state, "off", 3, 3, "user-request-2");
  assert.equal(result.state.generation, 3);
  // A request the controller already moved past is still rejected.
  result = request(result.state, "tv_shield", 2, 4, "late-request");
  assert.equal(result.events.find(({theatre}) => theatre.kind === "rejected")?.theatre.reason, "stale-generation");
  // And a different request reusing the current generation still conflicts.
  result = request(result.state, "tv_shield", 3, 5, "other-request");
  assert.equal(result.events.find(({theatre}) => theatre.kind === "rejected")?.theatre.reason, "generation-conflict");
});

test("transition time covers only the transition, not later overrides or failures", () => {
  const settled = confirmActivity("tv_shield", 1);
  const transitionMs = settled.state.metrics.lastTransitionMs;
  assert.equal(transitionMs, 1200);

  // A person takes over the receiver an hour later.
  const manual = target(settled.state, "avr", "transitioning", 1, 3600, {classification: "manual_override"});
  assert.equal(manual.state.phase, "manual_override");
  assert.equal(manual.state.metrics.lastTransitionMs, transitionMs);
  assert.equal(manual.state.metrics.maxTransitionMs, transitionMs);

  // A target fails an hour later: the activity fails, but the transition
  // it completed is not retimed.
  const failed = target(settled.state, "display", "failed", 1, 3600, {
    failure: {operation: "query", reason: "timeout", occurredAt: at(3600).toISOString()}
  });
  assert.equal(failed.state.phase, "failed");
  assert.equal(failed.state.metrics.lastTransitionMs, transitionMs);
  assert.equal(failed.state.transitionCompletedAt, settled.state.transitionCompletedAt);
});

test("a target that stopped answering is still refreshed on later cycles", () => {
  let result = confirmActivity("tv_shield", 1);
  const asked: number[] = [];
  for (let seconds = 5; seconds <= 120; seconds += 5) {
    result = apply(result.state, {kind: "tick", generation: 1}, seconds);
    // Everyone answers except the receiver.
    for (const command of result.commands) {
      if (command.target === "avr") asked.push(seconds);
      else result = target(result.state, command.target as TheatreTarget, "ready", 1, seconds + 0.1);
    }
  }
  // Long after it was reported, the receiver is still asked, once per
  // freshness window, and still shown as not responding.
  assert.ok(asked.some((seconds) => seconds > 60), JSON.stringify(asked));
  assert.ok(asked.filter((seconds) => seconds > 60).length <= 6, JSON.stringify(asked));
  assert.deepEqual(result.state.degraded.filter(({target: name}) => name === "avr"), [{target: "avr", reason: "no-response"}]);

  // When it answers again, it is no longer reported.
  result = target(result.state, "avr", "ready", 1, 121);
  assert.equal(result.state.degraded.some(({target: name}) => name === "avr"), false);
});

test("a refresh carries the activity's wanted values, so a target node with nothing saved can adopt them", () => {
  let result = confirmActivity("tv_shield", 21);
  // Past freshness, the controller refreshes its targets.
  result = apply(result.state, {kind: "tick", generation: 21}, 15);
  const refreshes = Object.fromEntries(result.commands.filter(({kind}) => kind === "refresh").map((command) => [command.target, command]));
  // Each target refreshed carries its part of the profile, as its intent did.
  const wanted: Record<string, Record<string, unknown>> = {
    display: {mode: "tv"}, avr: {power: "on", source: "shield"}, source: {action: "activate", sourceId: "shield"},
    lighting: {profile: "tv"}, backlighting: {power: "on"}
  };
  assert.ok(Object.keys(refreshes).length >= 3, Object.keys(refreshes).join());
  for (const [target, command] of Object.entries(refreshes)) {
    for (const [key, value] of Object.entries(wanted[target]!)) assert.equal((command as Record<string, unknown>)[key], value, `${target}.${key}`);
  }
  assert.equal(refreshes.display?.requestId, result.state.desired?.requestId);
  // A probe with nothing desired carries none.
  const probe = apply(undefined, {kind: "startup"}, 0).commands.find(({target}) => target === "display");
  assert.equal(probe?.mode, undefined);
});

// The activity off and ready, ticked every 15 s; each backlighting refresh
// goes through the backlighting controller itself, and what it reports goes
// back to the theatre. The device answers each observe unless `silent` says
// it doesn't at that time. Returns what was seen at each tick.
// `repeatIntent`: the node also gets its request again after each refresh,
// as a repeated intent would, with nothing new read.
function backlightingRefreshRounds(until: number, silent: (seconds: number) => boolean = () => false, repeatIntent = false) {
  let theatre = confirmActivity("off", 1);
  const backlightingConfig = {pollMs: 1000, confirmationTimeoutMs: 5000, maxAttempts: 2};
  const backlighting = (state: Partial<BacklightingState> | undefined, event: Record<string, unknown>, seconds: number) =>
    transitionBacklighting(state, {backlighting: event as never}, backlightingConfig, at(seconds));
  // The backlighting node, settled off under the same request.
  let lights = backlighting(undefined, {kind: "intent", requestId: "off-1", generation: 1, power: "off", requestedAt: at(0).toISOString()}, 0);
  lights = backlighting(lights.state, {kind: "command_result", generation: 1, ok: true}, 0.1);
  lights = backlighting(lights.state, {kind: "observed", generation: 1, power: "off", observedAt: at(0.5).toISOString()}, 0.5);
  assert.equal(lights.state.phase, "ready");
  const driftBefore = theatre.state.metrics.driftEvents;
  const rounds: Array<{seconds: number; phase: string; status: string | undefined; pending: unknown; degraded: string | null}> = [];
  for (let seconds = 15; seconds <= until; seconds += 15) {
    theatre = apply(theatre.state, {kind: "tick", generation: 1}, seconds);
    for (const command of theatre.commands) {
      if (command.target !== "backlighting") {
        theatre = target(theatre.state, command.target as TheatreTarget, "ready", 1, seconds + 0.1);
        continue;
      }
      lights = backlighting(lights.state, {...command}, seconds);
      const answers = [...lights.events];
      if (lights.commands.some(({operation}) => operation === "observe") && !silent(seconds)) {
        lights = backlighting(lights.state, {kind: "observed", generation: 1, power: "off", observedAt: at(seconds + 0.04).toISOString()}, seconds + 0.04);
        answers.push(...lights.events);
      }
      if (repeatIntent) {
        lights = backlighting(lights.state, {kind: "intent", requestId: "off-1", generation: 1, power: "off", requestedAt: at(0).toISOString()}, seconds + 0.02);
        answers.push(...lights.events);
      }
      for (const {theatre: event} of answers) {
        theatre = apply(theatre.state, event as unknown as TheatreInputEvent, seconds + 0.05);
        assert.equal(theatre.state.phase, "ready", `phase at ${seconds} s`);
      }
    }
    rounds.push({
      seconds,
      phase: theatre.state.phase,
      status: theatre.state.targets.backlighting?.status,
      pending: theatre.state.refreshPending.backlighting,
      degraded: theatre.state.degraded.find(({target: name}) => name === "backlighting")?.reason ?? null
    });
  }
  return {rounds, drift: theatre.state.metrics.driftEvents - driftBefore};
}

test("off and ready: a backlighting refresh round trip through its own controller is no drift and no phase change", () => {
  const {rounds, drift} = backlightingRefreshRounds(120);
  assert.ok(rounds.length >= 8);
  for (const round of rounds) {
    // Each refresh is answered: nothing left pending, and nothing degraded.
    assert.deepEqual(round, {seconds: round.seconds, phase: "ready", status: "ready", pending: null, degraded: null});
  }
  assert.equal(drift, 0, "no drift events");
});

test("off and ready: unanswered backlighting refreshes end as no-response with the activity still ready, then recover", () => {
  const {rounds, drift} = backlightingRefreshRounds(400, (seconds) => seconds >= 60 && seconds < 300);
  assert.ok(rounds.every(({phase}) => phase === "ready"), "the activity is held ready throughout");
  assert.ok(rounds.some(({seconds, degraded}) => seconds < 300 && degraded === "no-response"), JSON.stringify(rounds));
  const last = rounds.at(-1)!;
  assert.deepEqual([last.status, last.pending, last.degraded], ["ready", null, null], "recovers once the device answers");
  assert.equal(drift, 0);
});

// tv_shield running, then the receiver switched to the PlayStation by hand:
// a manual override, and the recovery flow adopts tv_ps5 from what the devices
// show. The receiver and backlighting are their real controllers; the display
// and source answer each command ready for the theatre's generation. After
// recovery the backlighting reports `afterRecovery`. Refresh cycles follow.
function recoveryRoundTrip(afterRecovery: "on" | "off") {
  const avrConfig = {area: "lounge", sources: {shield: "SAT/CBL", playstation: "GAME"}, retryMs: 1000, maxAttempts: 3, minVolumeDb: -80, maxVolumeDb: -20};
  const backlightingConfig = {pollMs: 1000, confirmationTimeoutMs: 5000, maxAttempts: 2};
  let theatre: ReturnType<typeof transitionTheatre> | undefined;
  let avr: ReturnType<typeof transitionAvr> | undefined;
  let lights: ReturnType<typeof transitionBacklighting> | undefined;
  let receiverSource = "SAT/CBL";
  let lightsPower: "on" | "off" = "on";
  const sent: Array<[number, string, string]> = [];
  const reports: Array<[number, string, number, string, string | null]> = [];
  const queue: Array<{to: string; event: Record<string, unknown>}> = [];
  const run = (seconds: number) => {
    while (queue.length) {
      const {to, event} = queue.shift()!;
      if (to === "theatre") {
        theatre = transitionTheatre(theatre?.state, {theatre: event as TheatreInputEvent}, config, at(seconds));
        for (const {target: name, ...command} of theatre.commands) {
          if (name === "avr" || name === "backlighting") queue.push({to: name, event: command});
          else if (name !== "lighting") {
            queue.push({to: "theatre", event: {kind: "target_state", target: name, status: "ready", generation: command.generation, observedAt: at(seconds).toISOString()}});
          }
        }
      } else if (to === "avr") {
        avr = transitionAvr(avr?.state as Partial<AvrState> | undefined, {avr: event as never}, avrConfig, at(seconds));
        for (const {avrCommand, payload} of avr.commands) {
          sent.push([seconds, "avr", avrCommand.operation]);
          if (avrCommand.operation === "query") queue.push({to: "avr", event: {kind: "observed", line: `PWON\rZMON\rSI${receiverSource}\rMV30\r`}});
          else if (payload.startsWith("SI")) receiverSource = payload.slice(2).trim();
        }
        for (const {theatre: state} of avr.targetStates) {
          reports.push([seconds, "avr", state.generation, state.status, state.classification ?? null]);
          queue.push({to: "theatre", event: state as unknown as Record<string, unknown>});
        }
      } else {
        lights = transitionBacklighting(lights?.state as Partial<BacklightingState> | undefined, {backlighting: event as never}, backlightingConfig, at(seconds));
        for (const command of lights.commands) {
          sent.push([seconds, "backlighting", command.operation]);
          if (command.operation === "set_power") {
            lightsPower = command.power as "on" | "off";
            queue.push({to: "backlighting", event: {kind: "command_result", generation: command.generation, ok: true}});
          }
          queue.push({to: "backlighting", event: {kind: "observed", generation: command.generation, power: lightsPower, observedAt: at(seconds).toISOString()}});
        }
        for (const {theatre: state} of lights.events) {
          reports.push([seconds, "backlighting", state.generation, state.status, state.classification ?? null]);
          queue.push({to: "theatre", event: state as unknown as Record<string, unknown>});
        }
      }
    }
  };
  queue.push({to: "theatre", event: {kind: "intent", requestId: "tv_shield-1", generation: 1, activity: "tv_shield"}});
  run(0);
  queue.push({to: "theatre", event: {kind: "target_state", target: "source", status: "ready", generation: 1, observedAt: at(0.5).toISOString()}});
  run(0.5);
  assert.equal(theatre!.state.phase, "ready");
  // By hand: the receiver to the PlayStation.
  receiverSource = "GAME";
  queue.push({to: "avr", event: {kind: "observed", line: "SIGAME"}});
  run(5);
  assert.equal(theatre!.state.phase, "manual_override");
  const fresh = at(6).toISOString();
  queue.push({to: "theatre", event: {kind: "recover", reason: "manual_override", observations: {
    display: {values: {mode: "tv"}, observedAt: fresh},
    avr: {values: {power: "on", source: "playstation"}, observedAt: fresh},
    source: {values: {action: "activate", sourceId: "playstation"}, observedAt: fresh},
    backlighting: {values: {power: "on"}, observedAt: fresh}
  }}});
  run(6);
  assert.deepEqual([theatre!.state.phase, theatre!.state.generation, theatre!.state.currentActivity], ["ready", 2, "tv_ps5"]);
  const overridesAtRecovery = theatre!.state.metrics.manualOverrides;
  const driftAtRecovery = theatre!.state.metrics.driftEvents;
  const sentBefore = sent.length;
  lightsPower = afterRecovery;
  const phases: string[] = [];
  for (let seconds = 15; seconds <= 120; seconds += 15) {
    queue.push({to: "theatre", event: {kind: "tick", generation: theatre!.state.generation}});
    run(seconds);
    phases.push(theatre!.state.phase);
  }
  return {
    theatre: theatre!.state,
    phases,
    overridesSinceRecovery: theatre!.state.metrics.manualOverrides - overridesAtRecovery,
    driftSinceRecovery: theatre!.state.metrics.driftEvents - driftAtRecovery,
    actuated: sent.slice(sentBefore).filter(([, , operation]) => operation !== "query" && operation !== "observe"),
    reports: reports.filter(([seconds]) => seconds > 6)
  };
}

test("after a recovery, unchanged devices take the new request: refreshes stay ready, with no second override and nothing commanded", () => {
  const outcome = recoveryRoundTrip("on");
  assert.ok(outcome.phases.every((phase) => phase === "ready"), outcome.phases.join(","));
  assert.equal(outcome.overridesSinceRecovery, 0);
  assert.equal(outcome.driftSinceRecovery, 0, "no drift while the devices catch up");
  assert.equal(outcome.theatre.metrics.recoveriesAdopted, 1, "no second recovery");
  assert.deepEqual(outcome.actuated, [], "nothing sent to devices that already match");
  // Both answer under the recovered request, ready.
  for (const name of ["avr", "backlighting"]) {
    const theirs = outcome.reports.filter(([, target]) => target === name);
    assert.ok(theirs.length > 0, name);
    assert.ok(theirs.every(([, , generation, status, classification]) => generation === 2 && status === "ready" && classification === null), `${name}: ${JSON.stringify(theirs)}`);
    assert.ok(!outcome.theatre.degraded.some(({target}) => target === name), name);
  }
});

test("after a recovery, a device that really differs is a manual override once, and is never commanded", () => {
  const outcome = recoveryRoundTrip("off");
  assert.equal(outcome.overridesSinceRecovery, 1, "once, however many refreshes follow");
  assert.equal(outcome.theatre.targets.backlighting?.classification, "manual_override");
  assert.equal(outcome.theatre.phase, "manual_override");
  assert.deepEqual(outcome.actuated, []);
});

test("a silent backlighting device is still reported when its node gets its request again with nothing new read", () => {
  const {rounds} = backlightingRefreshRounds(400, (seconds) => seconds >= 60 && seconds < 300, true);
  assert.ok(rounds.every(({phase}) => phase === "ready"), "the activity is held ready");
  assert.ok(rounds.some(({seconds, degraded}) => seconds < 300 && degraded !== null), JSON.stringify(rounds));
  const last = rounds.at(-1)!;
  assert.deepEqual([last.status, last.degraded], ["ready", null], "recovers once the device answers");
});

test("after a start with nothing saved, the targets' answers to the probe recover the one activity they show, commanding nothing", () => {
  const observation = (target: TheatreTarget, values: Record<string, unknown>, seconds: number) =>
    ({kind: "target_observation", target, observedAt: at(seconds).toISOString(), values}) as TheatreInputEvent;
  const shows = {
    display: {mode: "tv"}, avr: {power: "on", source: "shield", mainZone: "on"},
    source: {action: "activate", sourceId: "shield"}, backlighting: {power: "on"}
  } as const;
  let result = apply(undefined, {kind: "startup"}, 0);
  assert.equal(result.state.phase, "recovering");
  assert.ok(result.commands.every((command) => command.kind === "refresh" && command.requestId === null && command.generation === 0));
  for (const [index, target] of (["display", "avr", "source"] as const).entries()) {
    result = apply(result.state, observation(target, shows[target], 1 + index * 0.1), 1 + index * 0.1);
    assert.equal(result.state.phase, "recovering", `still waiting after ${target}`);
  }
  result = apply(result.state, observation("backlighting", shows.backlighting, 1.3), 1.3);
  assert.deepEqual([result.state.phase, result.state.currentActivity], ["ready", "tv_shield"]);
  assert.equal(result.state.metrics.recoveriesAdopted, 1);
  assert.deepEqual(result.commands, []);

  // Answers that fit no activity (the receiver on, its input unknown): unknown once the probes run out,
  // still commanding nothing.
  result = apply(undefined, {kind: "startup"}, 0);
  result = apply(result.state, observation("display", {mode: "tv"}, 1), 1);
  result = apply(result.state, observation("avr", {power: "on", source: null}, 1), 1);
  for (let seconds = 5; seconds <= 60; seconds += 5) {
    result = apply(result.state, {kind: "tick"}, seconds);
    assert.ok(result.commands.every((command) => command.kind === "refresh"), `at ${seconds} s`);
  }
  assert.deepEqual([result.state.phase, result.state.currentActivity], ["idle", "unknown"]);
  assert.equal(result.state.metrics.recoveriesUnknown, 1);

  // An answer outside recovery is ignored.
  result = confirmActivity("tv_shield", 1);
  result = apply(result.state, observation("display", {mode: "off"}, 3), 3);
  assert.equal(result.traces.at(-1)?.reason, "not-recovering");
  assert.equal(result.state.currentActivity, "tv_shield");
});

test("after a start with nothing saved, the display and the AVR are enough: a silent backlight stays unobserved until it reports; a lone source isn't", () => {
  const observation = (target: TheatreTarget, values: Record<string, unknown>, seconds: number) =>
    ({kind: "target_observation", target, observedAt: at(seconds).toISOString(), values}) as TheatreInputEvent;
  const runOut = (result: ReturnType<typeof apply>) => {
    for (let seconds = 5; seconds <= 120 && result.state.phase === "recovering"; seconds += 5) {
      result = apply(result.state, {kind: "tick"}, seconds);
      assert.ok(result.commands.every((command) => command.kind === "refresh"), `nothing but probes at ${seconds} s`);
    }
    return result;
  };
  // A WLED backlight can't be asked: display, AVR and source answer, the backlight doesn't.
  let result = apply(undefined, {kind: "startup"}, 0);
  result = apply(result.state, observation("display", {mode: "tv"}, 1), 1);
  result = apply(result.state, observation("avr", {power: "on", source: "shield"}, 1.1), 1.1);
  result = apply(result.state, observation("source", {action: "activate", sourceId: "shield"}, 1.2), 1.2);
  assert.equal(result.state.phase, "recovering", "it waits for the backlight until the probes run out");
  result = runOut(result);
  assert.deepEqual([result.state.phase, result.state.currentActivity, result.state.unobserved], ["ready", "tv_shield", ["backlighting"]]);
  assert.deepEqual(result.state.degraded, [{target: "backlighting", reason: "unobserved"}]);
  assert.equal(result.state.availability, "degraded");
  // Still ready on the next ticks; the backlight's first report confirms it.
  result = apply(result.state, {kind: "tick", generation: result.state.generation}, 130);
  assert.equal(result.state.phase, "ready");
  assert.ok(result.state.degraded.some((entry) => entry.target === "backlighting" && entry.reason === "unobserved"));
  result = target(result.state, "backlighting", "ready", result.state.generation, 131);
  assert.deepEqual(result.state.unobserved, []);
  assert.ok(!result.state.degraded.some((entry) => entry.target === "backlighting"));

  // Only the source answers: it can't tell activities apart, so unknown.
  result = apply(undefined, {kind: "startup"}, 0);
  result = apply(result.state, observation("source", {action: "activate", sourceId: "shield"}, 1), 1);
  result = runOut(result);
  assert.deepEqual([result.state.phase, result.state.currentActivity], ["idle", "unknown"]);
  // The display and the AVR without a match among what answered: unknown.
  result = apply(undefined, {kind: "startup"}, 0);
  result = apply(result.state, observation("display", {mode: "tv"}, 1), 1);
  result = apply(result.state, observation("avr", {power: "standby"}, 1), 1);
  result = runOut(result);
  assert.deepEqual([result.state.phase, result.state.currentActivity], ["idle", "unknown"]);
});

test("after a start with nothing saved, two activities that differ only in the silent backlight stay unknown", () => {
  const profiles = normaliseActivityProfiles({
    tv_bright: {display: {mode: "tv"}, avr: {power: "on", source: "shield"}, source: {action: "activate", sourceId: "shield", readiness: "required"},
      lighting: {profile: "tv"}, backlighting: {power: "on"}},
    tv_dim: {display: {mode: "tv"}, avr: {power: "on", source: "shield"}, source: {action: "activate", sourceId: "shield", readiness: "required"},
      lighting: {profile: "tv"}, backlighting: {power: "off"}}
  });
  const run = (state: Partial<TheatreState> | undefined, theatre: TheatreInputEvent, seconds: number) =>
    transitionTheatre(state, {theatre}, {...config, activityProfiles: profiles}, at(seconds));
  const observation = (target: TheatreTarget, values: Record<string, unknown>, seconds: number) =>
    ({kind: "target_observation", target, observedAt: at(seconds).toISOString(), values}) as TheatreInputEvent;
  let result = run(undefined, {kind: "startup"}, 0);
  result = run(result.state, observation("display", {mode: "tv"}, 1), 1);
  result = run(result.state, observation("avr", {power: "on", source: "shield"}, 1), 1);
  result = run(result.state, observation("source", {action: "activate", sourceId: "shield"}, 1), 1);
  for (let seconds = 5; seconds <= 120 && result.state.phase === "recovering"; seconds += 5) result = run(result.state, {kind: "tick"}, seconds);
  assert.deepEqual([result.state.phase, result.state.currentActivity], ["idle", "unknown"]);
  assert.equal(result.traces.find((entry) => entry.event === "recovery" && entry.outcome === "unknown")?.reason, "ambiguous");
});
