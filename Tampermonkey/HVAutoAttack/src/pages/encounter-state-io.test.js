import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  StorageIoMetricsEvent,
  runStorageIoMetricsAutomation,
} from "../state/storage-io-metrics.js";
import { StorageIdentity, StorageWriteOutcome } from "../state/storage-io-policy.js";
import { ENCOUNTER_COOLDOWN_MS } from "./encounter-day-state.js";
import { EncounterStateEvent, runEncounterStateAutomation } from "./encounter-state.js";

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.setSystemTime(new Date("2026-06-27T12:00:00.000Z"));
  runStorageIoMetricsAutomation({ type: StorageIoMetricsEvent.RESET });
});

describe("encounter state IO", () => {
  it("does not physically rewrite unchanged GM encounter state during repeated reads", () => {
    const stored = {
      date: Date.now() - 1000,
      cycleReadyAt: Date.now() - 1000 + ENCOUNTER_COOLDOWN_MS,
      entry: { phase: "idle", key: "", sessionId: null },
      lastSettledSessionId: null,
      count: 1,
      schemaVersion: 5,
      generationRouteRevision: 1,
      utcDay: "2026-06-27",
      dayPhase: "active",
      anchorReason: "encounterCompleted",
      invalidCycleCount: 0,
    };
    vi.stubGlobal(
      "GM_getValue",
      vi.fn(() => stored)
    );
    const gmSetValue = vi.fn();
    vi.stubGlobal("GM_setValue", gmSetValue);

    expect(runEncounterStateAutomation({ type: EncounterStateEvent.READ_CURRENT })).toEqual(stored);
    expect(runEncounterStateAutomation({ type: EncounterStateEvent.READ_CURRENT })).toEqual(stored);

    expect(gmSetValue).not.toHaveBeenCalled();
    expect(
      runStorageIoMetricsAutomation({ type: StorageIoMetricsEvent.SNAPSHOT })[
        StorageIdentity.ENCOUNTER_STATE
      ]
    ).toMatchObject({
      attemptedWrites: 2,
      physicalWrites: 0,
      skippedWrites: 2,
      lastOutcome: StorageWriteOutcome.SKIPPED_UNCHANGED,
      lastSourceIdentity: "hvut_re",
    });
  });
});
