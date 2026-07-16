import { describe, expect, it } from "vitest";
import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";

const NOW = Date.UTC(2026, 6, 16, 8, 0, 0);

describe("encounter generation route state migration", () => {
  it("makes a retired-route circuit response immediately eligible for the canonical probe", () => {
    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.NORMALIZE,
        state: {
          schemaVersion: 4,
          date: NOW - 10_000,
          cycleReadyAt: NOW + 20 * 60 * 1000,
          anchorReason: "circuitResponse",
          key: "",
          clear: true,
          count: 0,
          utcDay: "2026-07-16",
          dayPhase: "active",
          invalidCycleCount: 0,
        },
        nowMs: NOW,
      })
    ).toMatchObject({
      date: 0,
      cycleReadyAt: 0,
      anchorReason: null,
      generationRouteRevision: 1,
      count: 0,
      dayPhase: "active",
    });
  });

  it("preserves a pending encounter key even when the retired route left failure evidence", () => {
    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.NORMALIZE,
        state: {
          schemaVersion: 4,
          date: NOW,
          cycleReadyAt: NOW + 1_800_000,
          anchorReason: "circuitResponse",
          key: "pending=",
          clear: false,
          count: 3,
          utcDay: "2026-07-16",
          dayPhase: "active",
          invalidCycleCount: 0,
          generationFailureReason: "generationResponseUnrecognized",
        },
        nowMs: NOW,
      })
    ).toMatchObject({
      date: NOW,
      entry: { phase: "keyAvailable", key: "pending=", sessionId: null },
      count: 3,
      generationRouteRevision: 1,
    });
  });

  it("preserves the primary clock anchored by a completed encounter battle", () => {
    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.NORMALIZE,
        state: {
          schemaVersion: 4,
          date: NOW,
          cycleReadyAt: NOW + 1_800_000,
          anchorReason: "encounterCompleted",
          key: "",
          clear: true,
          count: 3,
          utcDay: "2026-07-16",
          dayPhase: "active",
          invalidCycleCount: 0,
        },
        nowMs: NOW,
      })
    ).toMatchObject({
      date: NOW,
      cycleReadyAt: NOW + 1_800_000,
      anchorReason: "encounterCompleted",
      entry: { phase: "idle", key: "", sessionId: null },
      count: 3,
      generationRouteRevision: 1,
    });
  });
});
