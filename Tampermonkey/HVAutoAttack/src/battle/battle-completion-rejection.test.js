import { describe, expect, it, vi } from "vitest";
import { BattleCompletionEvent, runBattleCompletionAutomation } from "./battle-completion.js";

function deps() {
  return {
    readCompletionContext: vi.fn(),
    recordCompletion: vi.fn(),
    completeEncounter: vi.fn(),
    completeUtilityLearning: vi.fn(),
    triggerAlarm: vi.fn(),
    clearSession: vi.fn(),
    isCompletionReached: vi.fn(() => true),
    recordCompletionEvidence: vi.fn(),
    scheduleReload: vi.fn(),
  };
}

function expectNoCompletionSideEffects(d) {
  expect(d.recordCompletion).not.toHaveBeenCalled();
  expect(d.readCompletionContext).not.toHaveBeenCalled();
  expect(d.triggerAlarm).not.toHaveBeenCalled();
  expect(d.completeEncounter).not.toHaveBeenCalled();
  expect(d.clearSession).not.toHaveBeenCalled();
  expect(d.isCompletionReached).not.toHaveBeenCalled();
  expect(d.scheduleReload).not.toHaveBeenCalled();
}

describe("runBattleCompletionAutomation entry rejection", () => {
  it("rejects unknown battle completion events without side effects", () => {
    const d = deps();

    expect(runBattleCompletionAutomation({ type: "unknown" }, d)).toEqual({ outcome: "ongoing" });
    expectNoCompletionSideEffects(d);
    expect(d.recordCompletionEvidence).toHaveBeenCalledWith({
      outcome: "ongoing",
      reason: "unknownCompletionEvent",
      eventType: "unknown",
    });
  });

  it("rejects null battle completion events without side effects", () => {
    const d = deps();

    expect(runBattleCompletionAutomation(null, d)).toEqual({ outcome: "ongoing" });
    expectNoCompletionSideEffects(d);
    expect(d.recordCompletionEvidence).toHaveBeenCalledWith({
      outcome: "ongoing",
      reason: "unknownCompletionEvent",
      eventType: null,
    });
  });

  it("reads completion panel reachability through the completion entry", () => {
    const d = deps();
    d.isCompletionReached.mockReturnValue(false);

    expect(runBattleCompletionAutomation({ type: BattleCompletionEvent.READ_REACHED }, d)).toBe(
      false
    );
    expect(d.isCompletionReached).toHaveBeenCalledTimes(1);
    expect(d.recordCompletion).not.toHaveBeenCalled();
    expect(d.readCompletionContext).not.toHaveBeenCalled();
  });
});
