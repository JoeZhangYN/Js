import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleActionDelayEvent, runBattleActionDelayAutomation } from "./battle-action-delay.js";

const mocks = vi.hoisted(() => ({
  runOptionAutomation: vi.fn(),
  runNavigationAutomation: vi.fn(),
}));

vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));

vi.mock("../core/navigate.js", () => ({
  NavigationEvent: Object.freeze({ SCHEDULE_RELOAD: "scheduleReload" }),
  NavigationReloadReason: Object.freeze({ ACTION_WATCHDOG: "actionWatchdog" }),
  runNavigationAutomation: mocks.runNavigationAutomation,
}));

beforeEach(() => {
  mocks.runOptionAutomation.mockReset();
  mocks.runNavigationAutomation.mockReset();
});

describe("battle action watchdog navigation detail", () => {
  it("passes action watchdog evidence into the navigation reload event", () => {
    mocks.runNavigationAutomation.mockReturnValue("reload-timer");
    mocks.runOptionAutomation.mockImplementation((event) => {
      const option = {
        delayAlert: false,
        delayAlertTime: 0,
        delayReload: true,
        delayReloadTime: 11,
      };
      return option[event.key] ?? event.fallback;
    });

    expect(runBattleActionDelayAutomation({ type: BattleActionDelayEvent.ACTION_STARTED })).toBe(
      true
    );
    expect(mocks.runNavigationAutomation).toHaveBeenCalledWith({
      type: "scheduleReload",
      reason: "actionWatchdog",
      seconds: 11,
      detail: {
        source: "battleActionDelay",
        seconds: 11,
        option: {
          delayAlert: false,
          delayAlertTime: 0,
          delayReload: true,
          delayReloadTime: 11,
        },
      },
    });
  });
});
