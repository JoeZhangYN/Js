import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleCompletionEvent,
  BattleCompletionOutcome,
  runBattleCompletionAutomation,
} from "./battle-completion.js";
import { g } from "../state/store.js";

beforeEach(() => {
  g("monsterAlive", 0);
  g("roundNow", 1);
  g("roundAll", 1);
});

function deps() {
  return {
    g,
    triggerAlarm: vi.fn(),
    clearSession: vi.fn(),
    scheduleReload: vi.fn(),
  };
}

describe("runBattleCompletionAutomation", () => {
  it("handles defeat completion through the entry", () => {
    g("monsterAlive", 1);
    const d = deps();

    expect(
      runBattleCompletionAutomation({ type: BattleCompletionEvent.COMPLETION_REACHED }, d)
    ).toEqual({ outcome: BattleCompletionOutcome.DEFEAT });
    expect(d.triggerAlarm).toHaveBeenCalledWith("Defeat");
    expect(d.clearSession).toHaveBeenCalled();
    expect(d.scheduleReload).not.toHaveBeenCalled();
  });

  it("returns next round without terminal side effects", () => {
    g("monsterAlive", 0);
    g("roundNow", 1);
    g("roundAll", 2);
    const d = deps();

    expect(
      runBattleCompletionAutomation({ type: BattleCompletionEvent.COMPLETION_REACHED }, d)
    ).toEqual({ outcome: BattleCompletionOutcome.NEXT_ROUND });
    expect(d.triggerAlarm).not.toHaveBeenCalled();
    expect(d.clearSession).not.toHaveBeenCalled();
    expect(d.scheduleReload).not.toHaveBeenCalled();
  });

  it("handles victory completion through the entry", () => {
    g("monsterAlive", 0);
    g("roundNow", 2);
    g("roundAll", 2);
    const d = deps();

    expect(
      runBattleCompletionAutomation({ type: BattleCompletionEvent.COMPLETION_REACHED }, d)
    ).toEqual({ outcome: BattleCompletionOutcome.VICTORY });
    expect(d.triggerAlarm).toHaveBeenCalledWith("Victory");
    expect(d.clearSession).toHaveBeenCalled();
    expect(d.scheduleReload).toHaveBeenCalledWith(3);
  });

  it("reads completion runtime fields once before classifying the outcome", () => {
    const d = deps();
    d.g = vi.fn((key) => ({ monsterAlive: 0, roundNow: 2, roundAll: 2 })[key]);

    expect(
      runBattleCompletionAutomation({ type: BattleCompletionEvent.COMPLETION_REACHED }, d)
    ).toEqual({ outcome: BattleCompletionOutcome.VICTORY });

    expect(d.g).toHaveBeenCalledWith("monsterAlive");
    expect(d.g).toHaveBeenCalledWith("roundNow");
    expect(d.g).toHaveBeenCalledWith("roundAll");
    expect(d.g).toHaveBeenCalledTimes(3);
  });
});
