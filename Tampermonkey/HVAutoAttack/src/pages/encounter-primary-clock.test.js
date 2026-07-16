import { describe, expect, it } from "vitest";
import {
  anchorEncounterPrimaryClock,
  circuitResponsePrimaryClock,
  EncounterAnchorReason,
} from "./encounter-primary-clock.js";

describe("encounter primary-clock identity", () => {
  it("anchors battle terminal time without owning battle or invalid-cycle counts", () => {
    const nowMs = Date.UTC(2026, 5, 27, 12);
    const clock = anchorEncounterPrimaryClock(nowMs, EncounterAnchorReason.BATTLE_TERMINAL);

    expect(clock).toEqual({
      date: nowMs,
      cycleReadyAt: nowMs + 30 * 60 * 1000 + 5000,
      anchorReason: "encounterCompleted",
    });
    expect(clock).not.toHaveProperty("count");
    expect(clock).not.toHaveProperty("invalidCycleCount");
    expect(clock).not.toHaveProperty("generationFailureCount");
  });

  it("applies the terminal circuit response as 30 minutes plus 0-29 seconds", () => {
    const nowMs = Date.UTC(2026, 5, 27, 12);

    expect(circuitResponsePrimaryClock(nowMs, () => 0.999)).toEqual({
      date: nowMs,
      cycleReadyAt: nowMs + 30 * 60 * 1000 + 29 * 1000,
      anchorReason: "circuitResponse",
    });
  });
});
