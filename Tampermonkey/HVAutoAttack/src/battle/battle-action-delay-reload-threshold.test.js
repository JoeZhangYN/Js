import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleActionDelayEvent, runBattleActionDelayAutomation } from "./battle-action-delay.js";

const mocks = vi.hoisted(() => ({ runOptionAutomation: vi.fn() }));

vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));

function deps() {
  return {
    schedule: vi.fn(),
    cancel: vi.fn(),
    triggerAlarm: vi.fn(),
    scheduleReload: vi.fn(),
  };
}

beforeEach(() => {
  mocks.runOptionAutomation.mockReset();
});

describe("battle action delay reload threshold", () => {
  it("does not schedule destructive delay effects with non-positive thresholds", () => {
    const d = deps();
    mocks.runOptionAutomation.mockImplementation((event) => {
      const option = { delayAlert: true, delayAlertTime: 0, delayReload: true, delayReloadTime: 0 };
      return option[event.key] ?? event.fallback;
    });

    runBattleActionDelayAutomation({ type: BattleActionDelayEvent.ACTION_STARTED }, d);

    expect(d.schedule).not.toHaveBeenCalled();
    expect(d.scheduleReload).not.toHaveBeenCalled();
  });
});
