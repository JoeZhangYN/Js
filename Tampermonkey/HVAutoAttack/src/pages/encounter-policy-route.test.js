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
    expect(available).toEqual({ date: 0, key: "abc", count: 0, clear: false });

    const started = runEncounterPolicy({
      type: EncounterPolicyEvent.MARK_STARTED,
      state: available,
      search: "?s=Battle&ss=ba&encounter=abc",
      nowMs: 2000,
    });
    expect(started).toEqual({ date: 2000, key: "abc", count: 1, clear: true });
  });

  it("requires an encounter key or battle-start evidence before starting cooldown", () => {
    const state = { date: 0, key: "", count: 0, clear: true };

    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.MARK_STARTED,
        state,
        search: "",
        nowMs: 2000,
      })
    ).toEqual(state);

    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.MARK_STARTED,
        state,
        source: "battleRoundStart",
        nowMs: 2000,
      })
    ).toEqual({ date: 2000, key: "", count: 1, clear: true });
  });

  it("marks attempted entry as cleared without starting cooldown or counting an encounter", () => {
    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.MARK_ATTEMPTED,
        state: { date: 1000, key: "abc", count: 1, clear: false },
        key: "abc",
        nowMs: 2000,
      })
    ).toEqual({ date: 1000, key: "abc", count: 1, clear: true });
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

  it("generates a new key after the attempted key cooldown expires", () => {
    expect(
      runEncounterPolicy({
        type: EncounterPolicyEvent.PLAN_ACTIVATION,
        state: { date: 1000, key: "abc", count: 1, clear: true },
        nowMs: 1000 + 31 * 60 * 1000,
      })
    ).toMatchObject({
      action: "generate",
      request: { method: "GET", url: "https://e-hentai.org/news.php?encounter" },
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
    ).toEqual({ date: 1000, key: "def", count: 1, clear: false });
  });

  it("ignores unknown policy events", () => {
    expect(runEncounterPolicy({ type: "unknown" })).toBeUndefined();
  });
});
