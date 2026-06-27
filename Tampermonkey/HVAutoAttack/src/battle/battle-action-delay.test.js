import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleActionDelayEvent, runBattleActionDelayAutomation } from "./battle-action-delay.js";

const mocks = vi.hoisted(() => ({
  g: vi.fn(),
}));

vi.mock("../state/store.js", () => ({ g: mocks.g }));

beforeEach(() => {
  mocks.g.mockReset();
});

describe("runBattleActionDelayAutomation", () => {
  it("starts alert and reload timers from battle action delay options", () => {
    const deps = {
      schedule: vi.fn(() => "alert-timer"),
      cancel: vi.fn(),
      triggerAlarm: vi.fn(),
      scheduleReload: vi.fn(() => "reload-timer"),
    };
    mocks.g.mockReturnValue({
      delayAlert: true,
      delayAlertTime: 7,
      delayReload: true,
      delayReloadTime: 11,
    });

    expect(
      runBattleActionDelayAutomation({ type: BattleActionDelayEvent.ACTION_STARTED }, deps)
    ).toBe(true);

    expect(deps.schedule).toHaveBeenCalledWith(expect.any(Function), 7000);
    expect(deps.scheduleReload).toHaveBeenCalledWith(11);
  });

  it("cancels only enabled action delay timers at action end", () => {
    const deps = {
      schedule: vi.fn(() => "alert-timer"),
      cancel: vi.fn(),
      triggerAlarm: vi.fn(),
      scheduleReload: vi.fn(() => "reload-timer"),
    };
    mocks.g.mockReturnValue({
      delayAlert: true,
      delayAlertTime: 1,
      delayReload: false,
      delayReloadTime: 2,
    });

    runBattleActionDelayAutomation({ type: BattleActionDelayEvent.ACTION_STARTED }, deps);
    runBattleActionDelayAutomation({ type: BattleActionDelayEvent.ACTION_ENDED }, deps);

    expect(deps.cancel).toHaveBeenCalledWith("alert-timer");
    expect(deps.cancel).toHaveBeenCalledTimes(1);
  });
});
