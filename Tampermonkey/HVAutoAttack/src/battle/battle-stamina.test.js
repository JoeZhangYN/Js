import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleStaminaEvent, runBattleStaminaAutomation } from "./battle-stamina.js";
import { StaminaLossLogEvent, runStaminaLossLogAutomation } from "../state/stamina-loss-log.js";

const mocks = vi.hoisted(() => ({
  runOptionAutomation: vi.fn(),
}));

vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));

beforeEach(() => {
  localStorage.clear();
  mocks.runOptionAutomation.mockReset();
  mocks.runOptionAutomation.mockReturnValue(5);
});

function deps(confirm = () => true) {
  return {
    triggerAlarm: vi.fn(),
    confirm: vi.fn(confirm),
    pause: vi.fn(),
  };
}

describe("runBattleStaminaAutomation", () => {
  it("ignores logs without stamina loss", async () => {
    const d = deps();

    expect(
      runBattleStaminaAutomation(
        { type: BattleStaminaEvent.ROUND_LOG_READY, text: "Initializing arena challenge" },
        d
      )
    ).toEqual({ lostStamina: 0, paused: false });
    expect(await runStaminaLossLogAutomation({ type: StaminaLossLogEvent.READ })).toEqual({});
    expect(d.triggerAlarm).not.toHaveBeenCalled();
  });

  it("records stamina loss below the pause threshold", async () => {
    const d = deps();

    const result = runBattleStaminaAutomation(
      { type: BattleStaminaEvent.ROUND_LOG_READY, text: "You lose 3 Stamina" },
      d
    );

    expect(result).toEqual({ lostStamina: 3, paused: false });
    await vi.waitFor(async () => {
      expect(
        Object.values(await runStaminaLossLogAutomation({ type: StaminaLossLogEvent.READ }))
      ).toEqual([3]);
    });
    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "staminaLose",
      fallback: Number.POSITIVE_INFINITY,
    });
    expect(d.triggerAlarm).not.toHaveBeenCalled();
  });

  it("alerts and pauses when stamina loss exceeds threshold and user declines", async () => {
    const d = deps(() => false);

    const result = runBattleStaminaAutomation(
      { type: BattleStaminaEvent.ROUND_LOG_READY, text: "You lose 7 Stamina" },
      d
    );

    expect(result).toEqual({ lostStamina: 7, paused: true });
    expect(d.triggerAlarm).toHaveBeenCalledWith("Error");
    expect(d.confirm).toHaveBeenCalledWith({
      type: "confirm",
      copy: {
        l0: "当前Stamina过低\n或Stamina损失过多\n是否继续？",
        l1: "當前Stamina過低\n或Stamina損失過多\n是否繼續？",
        l2: "Continue?\nYou either have too little Stamina or have lost too much",
      },
    });
    expect(d.pause).toHaveBeenCalledWith({ lostStamina: 7 });
    await vi.waitFor(async () => {
      expect(
        Object.values(await runStaminaLossLogAutomation({ type: StaminaLossLogEvent.READ }))
      ).toEqual([7]);
    });
  });

  it("keeps missing or invalid thresholds from pausing by default", async () => {
    mocks.runOptionAutomation.mockReturnValue(undefined);
    const d = deps(() => false);

    const result = runBattleStaminaAutomation(
      { type: BattleStaminaEvent.ROUND_LOG_READY, text: "You lose 99 Stamina" },
      d
    );

    expect(result).toEqual({ lostStamina: 99, paused: false });
    expect(d.triggerAlarm).not.toHaveBeenCalled();
    await vi.waitFor(async () => {
      expect(
        Object.values(await runStaminaLossLogAutomation({ type: StaminaLossLogEvent.READ }))
      ).toEqual([99]);
    });
  });

  it("rejects invalid battle stamina events without side effects", async () => {
    const d = deps(() => false);

    expect(runBattleStaminaAutomation({ type: "unknown", text: "You lose 7 Stamina" }, d)).toEqual({
      lostStamina: 0,
      paused: false,
    });
    expect(runBattleStaminaAutomation(null, d)).toEqual({ lostStamina: 0, paused: false });

    expect(await runStaminaLossLogAutomation({ type: StaminaLossLogEvent.READ })).toEqual({});
    expect(mocks.runOptionAutomation).not.toHaveBeenCalled();
    expect(d.triggerAlarm).not.toHaveBeenCalled();
    expect(d.confirm).not.toHaveBeenCalled();
    expect(d.pause).not.toHaveBeenCalled();
  });
});
