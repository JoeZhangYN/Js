import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleActionDelayEvent, runBattleActionDelayAutomation } from "./battle-action-delay.js";

const mocks = vi.hoisted(() => ({
  runOptionAutomation: vi.fn(),
}));

vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({ READ: "read" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));

beforeEach(() => {
  mocks.runOptionAutomation.mockReset();
  runBattleActionDelayAutomation(
    { type: BattleActionDelayEvent.ACTION_ENDED },
    {
      schedule: vi.fn(),
      cancel: vi.fn(),
      triggerAlarm: vi.fn(),
      scheduleReload: vi.fn(),
    }
  );
});

describe("runBattleActionDelayAutomation", () => {
  it("starts alert and reload timers from battle action delay options", () => {
    const deps = {
      schedule: vi.fn(() => "alert-timer"),
      cancel: vi.fn(),
      triggerAlarm: vi.fn(),
      scheduleReload: vi.fn(() => "reload-timer"),
    };
    mocks.runOptionAutomation.mockReturnValue({
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
    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({ type: "read" });
  });

  it("cancels only enabled action delay timers at action end", () => {
    const deps = {
      schedule: vi.fn(() => "alert-timer"),
      cancel: vi.fn(),
      triggerAlarm: vi.fn(),
      scheduleReload: vi.fn(() => "reload-timer"),
    };
    mocks.runOptionAutomation.mockReturnValue({
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

  it("cancels timers that were started even when options changed before action end", () => {
    const deps = {
      schedule: vi.fn(() => "alert-timer"),
      cancel: vi.fn(),
      triggerAlarm: vi.fn(),
      scheduleReload: vi.fn(() => "reload-timer"),
    };
    mocks.runOptionAutomation
      .mockReturnValueOnce({
        delayAlert: true,
        delayAlertTime: 1,
        delayReload: true,
        delayReloadTime: 2,
      })
      .mockReturnValueOnce({
        delayAlert: false,
        delayAlertTime: 1,
        delayReload: false,
        delayReloadTime: 2,
      });

    runBattleActionDelayAutomation({ type: BattleActionDelayEvent.ACTION_STARTED }, deps);
    runBattleActionDelayAutomation({ type: BattleActionDelayEvent.ACTION_ENDED }, deps);

    expect(deps.cancel).toHaveBeenCalledWith("alert-timer");
    expect(deps.cancel).toHaveBeenCalledWith("reload-timer");
    expect(deps.cancel).toHaveBeenCalledTimes(2);
  });

  it("clears a previous action delay before starting a new one", () => {
    const deps = {
      schedule: vi.fn().mockReturnValueOnce("first-alert").mockReturnValueOnce("second-alert"),
      cancel: vi.fn(),
      triggerAlarm: vi.fn(),
      scheduleReload: vi
        .fn()
        .mockReturnValueOnce("first-reload")
        .mockReturnValueOnce("second-reload"),
    };
    mocks.runOptionAutomation.mockReturnValue({
      delayAlert: true,
      delayAlertTime: 1,
      delayReload: true,
      delayReloadTime: 2,
    });

    runBattleActionDelayAutomation({ type: BattleActionDelayEvent.ACTION_STARTED }, deps);
    runBattleActionDelayAutomation({ type: BattleActionDelayEvent.ACTION_STARTED }, deps);

    expect(deps.cancel).toHaveBeenCalledWith("first-alert");
    expect(deps.cancel).toHaveBeenCalledWith("first-reload");
    expect(deps.schedule).toHaveBeenCalledTimes(2);
    expect(deps.scheduleReload).toHaveBeenCalledTimes(2);
  });
});
