import { describe, expect, it, vi } from "vitest";
import { BattleCompletionEvent, runBattleCompletionAutomation } from "./battle-completion.js";

function deps(context) {
  return {
    readCompletionContext: vi.fn(() => context),
    recordCompletion: vi.fn(),
    triggerAlarm: vi.fn(),
    clearSession: vi.fn(),
    isCompletionReached: vi.fn(() => true),
    recordCompletionEvidence: vi.fn(),
    scheduleReload: vi.fn(),
  };
}

describe("battle completion monitor recording result", () => {
  it("records failed completion monitor results as failed evidence", () => {
    const d = deps({ monsterAlive: 0, roundNow: 1, roundAll: 2 });
    const result = {
      kind: "failed",
      drop: { kind: "failed", reason: "dropArchiveFailed" },
      usage: { kind: "skipped", reason: "recordUsageDisabled" },
    };
    d.recordCompletion.mockReturnValue(result);

    runBattleCompletionAutomation({ type: BattleCompletionEvent.COMPLETION_REACHED }, d);

    expect(d.recordCompletionEvidence).toHaveBeenCalledWith({
      outcome: "nextRound",
      context: { monsterAlive: 0, roundNow: 1, roundAll: 2 },
      effects: { recordCompletion: false, recordCompletionResult: result },
    });
  });
});
