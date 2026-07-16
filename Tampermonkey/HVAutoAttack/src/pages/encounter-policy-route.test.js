import { describe, expect, it } from "vitest";
import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";

describe("runEncounterPolicy route contract", () => {
  it("parses and builds the encounter route in one place", () => {
    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.PARSE_SEARCH_KEY,
        search: "?s=Battle&ss=ba&encounter=abc123=",
      })
    ).toBe("abc123=");
    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.PARSE_EVENTPANE_KEY,
        eventpane: '<a href="?s=Battle&amp;ss=ba&amp;encounter=xyz=">RE</a>',
      })
    ).toBe("xyz=");
    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.PLAN_ACTIVATION,
        state: { date: 1000, key: "abc123=", count: 1, clear: false },
        nowMs: 2000,
      }).href
    ).toBe("?s=Battle&ss=ba&encounter=abc123=");
  });

  it("marks available keys without starting cooldown or counting an encounter", () => {
    const available = runEncounterPolicy({
      type: EncounterPolicyEvent.MARK_KEY_AVAILABLE,
      state: { date: 0, key: "", count: 0, clear: true },
      key: "abc",
      nowMs: 1000,
    });

    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.READ_CLOCK,
        state: available,
        nowMs: 1000,
      }).canEnter
    ).toBe(true);
    expect(available).toMatchObject({
      date: 0,
      count: 0,
      entry: { phase: "keyAvailable", key: "abc", sessionId: null },
    });

    const started = runEncounterPolicy({
      type: EncounterPolicyEvent.MARK_ENTRY_STARTED,
      state: available,
      session: { sessionId: "session-1", phase: "active", identity: { roundType: "ba" } },
      nowMs: 2000,
    });
    expect(started).toMatchObject({
      date: 0,
      count: 0,
      entry: { phase: "battleActive", key: "abc", sessionId: "session-1" },
    });
  });

  it("recognizes entry evidence without starting the completion-owned cooldown", () => {
    const state = { date: 0, key: "", count: 0, clear: true };

    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.MARK_ENTRY_STARTED,
        state,
        session: null,
        nowMs: 2000,
      })
    ).toMatchObject({
      date: 0,
      count: 0,
      entry: { phase: "idle", key: "", sessionId: null },
    });

    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.MARK_ENTRY_STARTED,
        state,
        session: { sessionId: "session-2", phase: "active", identity: { roundType: "ba" } },
        nowMs: 2000,
      })
    ).toMatchObject({
      date: 0,
      count: 0,
      entry: { phase: "battleActive", key: "", sessionId: "session-2" },
    });
  });

  it("marks attempted entry as cleared without starting cooldown or counting an encounter", () => {
    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.MARK_ATTEMPTED,
        state: { date: 1000, key: "abc", count: 1, clear: false },
        key: "abc",
        nowMs: 2000,
      })
    ).toMatchObject({
      date: 1000,
      count: 1,
      entry: { phase: "navigationAttempted", key: "abc", sessionId: null },
    });
  });

  it("ignores unknown policy events", () => {
    expect(runEncounterPolicy({ type: "unknown" })).toBeUndefined();
  });
});
