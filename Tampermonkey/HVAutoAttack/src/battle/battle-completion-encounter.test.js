import { describe, expect, it, vi } from "vitest";
import { BattleCompletionEvent, runBattleCompletionAutomation } from "./battle-completion.js";

function deps(context) {
  return {
    readCompletionContext: vi.fn(() => context),
    recordCompletion: vi.fn(),
    completeEncounter: vi.fn(),
    completeUtilityLearning: vi.fn(),
    triggerAlarm: vi.fn(),
    clearSession: vi.fn(),
    recordCompletionEvidence: vi.fn(),
    scheduleReload: vi.fn(),
  };
}

describe("battle completion encounter handoff", () => {
  it("records a random encounter terminal result before clearing its battle identity", () => {
    const context = { monsterAlive: 1, roundNow: 1, roundAll: 1, roundType: "ba" };
    const d = deps(context);
    runBattleCompletionAutomation({ type: BattleCompletionEvent.COMPLETION_REACHED }, d);

    expect(d.completeEncounter).toHaveBeenCalledWith("defeat", context);
    expect(d.completeEncounter.mock.invocationCallOrder[0]).toBeLessThan(
      d.clearSession.mock.invocationCallOrder[0]
    );
  });

  it("reads completion runtime fields once before classifying the outcome", () => {
    const d = deps({ monsterAlive: 0, roundNow: 2, roundAll: 2 });
    expect(
      runBattleCompletionAutomation({ type: BattleCompletionEvent.COMPLETION_REACHED }, d)
    ).toEqual({ outcome: "victory" });
    expect(d.readCompletionContext).toHaveBeenCalledTimes(1);
  });

  it("records completion before reading the completion ruling context", () => {
    const d = deps({ monsterAlive: 0, roundNow: 2, roundAll: 2 });
    runBattleCompletionAutomation({ type: BattleCompletionEvent.COMPLETION_REACHED }, d);
    expect(d.recordCompletion.mock.invocationCallOrder[0]).toBeLessThan(
      d.readCompletionContext.mock.invocationCallOrder[0]
    );
  });

  it("keeps terminal cleanup running while evidencing encounter persistence Unknown", () => {
    const d = deps({ monsterAlive: 1, roundNow: 1, roundAll: 1, roundType: "ba" });
    d.completeEncounter.mockReturnValue({ completed: false });

    runBattleCompletionAutomation({ type: BattleCompletionEvent.COMPLETION_REACHED }, d);

    expect(d.clearSession).toHaveBeenCalledOnce();
    expect(d.recordCompletionEvidence).toHaveBeenCalledWith(
      expect.objectContaining({ effects: expect.objectContaining({ encounterCompletion: false }) })
    );
  });
});
