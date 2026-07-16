import { describe, expect, it } from "vitest";
import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";

const policy = (type, state, fields = {}) => runEncounterPolicy({ type, state, ...fields });

describe("encounter entry policy", () => {
  it("plans entry only for an available encounter key", () => {
    expect(
      policy(
        EncounterPolicyEvent.PLAN_ACTIVATION,
        { date: 1000, key: "abc", count: 1, clear: false },
        { nowMs: 2000 }
      )
    ).toMatchObject({ action: "enter", href: "?s=Battle&ss=ba&encounter=abc" });

    expect(
      policy(
        EncounterPolicyEvent.PLAN_ACTIVATION,
        { date: 1000, key: "abc", count: 1, clear: true },
        { nowMs: 2000 }
      )
    ).toMatchObject({ action: "load" });
  });

  it("generates a new key after the attempted key cooldown expires", () => {
    expect(
      policy(
        EncounterPolicyEvent.PLAN_ACTIVATION,
        { date: 1000, key: "abc", count: 1, clear: true },
        { nowMs: 1000 + 31 * 60 * 1000 }
      )
    ).toMatchObject({
      action: "generate",
      request: { method: "GET", url: "https://e-hentai.org/news.php" },
    });
  });

  it("rejects the attempted key but accepts a different key", () => {
    const attempted = { date: 1000, key: "abc", count: 1, clear: true };
    expect(
      policy(EncounterPolicyEvent.MARK_KEY_AVAILABLE, attempted, { key: "abc", nowMs: 2000 })
    ).toMatchObject({
      entry: { phase: "navigationAttempted", key: "abc", sessionId: null },
    });
    expect(
      policy(EncounterPolicyEvent.MARK_KEY_AVAILABLE, attempted, { key: "def", nowMs: 3000 })
    ).toMatchObject({ entry: { phase: "keyAvailable", key: "def", sessionId: null } });
  });
});
