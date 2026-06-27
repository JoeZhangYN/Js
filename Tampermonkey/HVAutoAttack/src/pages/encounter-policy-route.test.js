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

  it("marks available and started states without double-counting the same key", () => {
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
    expect(available.count).toBe(1);

    const started = runEncounterPolicy({
      type: EncounterPolicyEvent.MARK_STARTED,
      state: available,
      search: "?s=Battle&ss=ba&encounter=abc",
      nowMs: 2000,
    });
    expect(started).toEqual({ date: 1000, key: "abc", count: 1, clear: true });
  });

  it("plans manual and automatic entry from the same activation rule", () => {
    const available = { date: 1000, key: "abc", count: 1, clear: false };
    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.PLAN_ACTIVATION,
        state: available,
        nowMs: 2000,
      })
    ).toMatchObject({
      action: "enter",
      href: "?s=Battle&ss=ba&encounter=abc",
    });

    const cleared = { date: 1000, key: "abc", count: 1, clear: true };
    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.PLAN_ACTIVATION,
        state: cleared,
        nowMs: 2000,
      })
    ).toMatchObject({
      action: "load",
    });
    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.PLAN_ACTIVATION,
        state: cleared,
        force: true,
        nowMs: 2000,
      })
    ).toMatchObject({
      action: "enter",
      href: "?s=Battle&ss=ba&encounter=abc",
    });
  });
});
