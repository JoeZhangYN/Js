import { beforeEach, describe, expect, it, vi } from "vitest";
import { runBattleActionDelayAutomation } from "./battle-action-delay.js";

const mocks = vi.hoisted(() => ({
  runOptionAutomation: vi.fn(),
}));

vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));

function makeDeps() {
  return {
    schedule: vi.fn(),
    cancel: vi.fn(),
    triggerAlarm: vi.fn(),
    scheduleReload: vi.fn(),
  };
}

beforeEach(() => {
  mocks.runOptionAutomation.mockReset();
  window.sessionStorage.clear();
});

describe("runBattleActionDelayAutomation event rejection", () => {
  it("rejects unknown events without reading delay options", () => {
    const deps = makeDeps();

    expect(runBattleActionDelayAutomation({ type: "unknown" }, deps)).toBe(false);

    expect(mocks.runOptionAutomation).not.toHaveBeenCalled();
    expect(deps.schedule).not.toHaveBeenCalled();
    expect(deps.scheduleReload).not.toHaveBeenCalled();
    expect(deps.cancel).not.toHaveBeenCalled();
    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleActionDelay"))).toMatchObject({
      decision: "rejected",
      reason: "unknownActionDelayEvent",
      eventType: "unknown",
    });
  });

  it("rejects null events without reading delay options or touching timers", () => {
    const deps = makeDeps();

    expect(runBattleActionDelayAutomation(null, deps)).toBe(false);

    expect(mocks.runOptionAutomation).not.toHaveBeenCalled();
    expect(deps.schedule).not.toHaveBeenCalled();
    expect(deps.scheduleReload).not.toHaveBeenCalled();
    expect(deps.cancel).not.toHaveBeenCalled();
    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleActionDelay"))).toMatchObject({
      decision: "rejected",
      reason: "unknownActionDelayEvent",
      eventType: null,
    });
  });
});
