import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleStaminaEvent, runBattleStaminaAutomation } from "./battle-stamina.js";
import { readStaminaLossLog } from "../state/stamina-loss-log.js";
import { g } from "../state/store.js";

beforeEach(() => {
  localStorage.clear();
  g("option", { staminaLose: 5 });
});

function deps(confirm = () => true) {
  return {
    setAlarm: vi.fn(),
    confirm: vi.fn(confirm),
    pause: vi.fn(),
  };
}

describe("runBattleStaminaAutomation", () => {
  it("ignores logs without stamina loss", () => {
    const d = deps();

    expect(
      runBattleStaminaAutomation(
        { type: BattleStaminaEvent.ROUND_LOG_READY, text: "Initializing arena challenge" },
        d
      )
    ).toEqual({ lostStamina: 0, paused: false });
    expect(readStaminaLossLog()).toEqual({});
    expect(d.setAlarm).not.toHaveBeenCalled();
  });

  it("records stamina loss below the pause threshold", () => {
    const d = deps();

    const result = runBattleStaminaAutomation(
      { type: BattleStaminaEvent.ROUND_LOG_READY, text: "You lose 3 Stamina" },
      d
    );

    expect(result).toEqual({ lostStamina: 3, paused: false });
    expect(Object.values(readStaminaLossLog())).toEqual([3]);
    expect(d.setAlarm).not.toHaveBeenCalled();
  });

  it("alerts and pauses when stamina loss exceeds threshold and user declines", () => {
    const d = deps(() => false);

    const result = runBattleStaminaAutomation(
      { type: BattleStaminaEvent.ROUND_LOG_READY, text: "You lose 7 Stamina" },
      d
    );

    expect(result).toEqual({ lostStamina: 7, paused: true });
    expect(d.setAlarm).toHaveBeenCalledWith("Error");
    expect(d.confirm).toHaveBeenCalled();
    expect(d.pause).toHaveBeenCalled();
  });
});
