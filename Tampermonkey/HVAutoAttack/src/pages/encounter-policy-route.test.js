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
    expect(started).toEqual({ date: 2000, key: "abc", count: 1, clear: true });
  });

  it("marks attempted entry as cleared and starts the next cooldown without counting a new encounter", () => {
    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.MARK_ATTEMPTED,
        state: { date: 1000, key: "abc", count: 1, clear: false },
        key: "abc",
        nowMs: 2000,
      })
    ).toEqual({ date: 2000, key: "abc", count: 1, clear: true });
  });

  it("plans entry only for an uncleared encounter key", () => {
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
      action: "load",
    });
  });

  it("does not reactivate the same key after it has been attempted", () => {
    const attempted = { date: 1000, key: "abc", count: 1, clear: true };

    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.MARK_KEY_AVAILABLE,
        state: attempted,
        key: "abc",
        nowMs: 2000,
      })
    ).toEqual(attempted);

    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.MARK_KEY_AVAILABLE,
        state: attempted,
        key: "def",
        nowMs: 3000,
      })
    ).toEqual({ date: 3000, key: "def", count: 2, clear: false });
  });

  it("ignores unknown policy events", () => {
    expect(runEncounterPolicy({ type: "unknown" })).toBeUndefined();
  });
});
