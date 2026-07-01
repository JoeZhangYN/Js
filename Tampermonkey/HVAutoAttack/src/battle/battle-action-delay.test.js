import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleActionDelayEvent, runBattleActionDelayAutomation } from "./battle-action-delay.js";

const mocks = vi.hoisted(() => ({
  runOptionAutomation: vi.fn(),
}));

vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));
function makeDeps(schedule = () => "alert-timer", scheduleReload = () => "reload-timer") {
  return {
    schedule: vi.fn(schedule),
    cancel: vi.fn(),
    triggerAlarm: vi.fn(),
    scheduleReload: vi.fn(scheduleReload),
  };
}

function setDelayOption(option) {
  mocks.runOptionAutomation.mockImplementation((event) => option[event.key] ?? event.fallback);
}

function start(deps) {
  return runBattleActionDelayAutomation({ type: BattleActionDelayEvent.ACTION_STARTED }, deps);
}

beforeEach(() => {
  mocks.runOptionAutomation.mockReset();
  runBattleActionDelayAutomation({ type: BattleActionDelayEvent.ACTION_ENDED }, makeDeps());
});

describe("runBattleActionDelayAutomation", () => {
  it("starts alert and reload timers from battle action delay options", () => {
    const deps = makeDeps();
    setDelayOption({
      delayAlert: true,
      delayAlertTime: 7,
      delayReload: true,
      delayReloadTime: 11,
    });

    expect(start(deps)).toBe(true);

    expect(deps.schedule).toHaveBeenCalledWith(expect.any(Function), 7000);
    expect(deps.scheduleReload).toHaveBeenCalledWith(11);
    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "delayAlert",
      fallback: false,
    });
    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "delayAlertTime",
      fallback: 0,
    });
    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "delayReload",
      fallback: false,
    });
    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "delayReloadTime",
      fallback: 0,
    });
  });

  it("cancels only enabled action delay timers at action end", () => {
    const deps = makeDeps();
    setDelayOption({
      delayAlert: true,
      delayAlertTime: 1,
      delayReload: false,
      delayReloadTime: 2,
    });

    start(deps);
    runBattleActionDelayAutomation({ type: BattleActionDelayEvent.ACTION_ENDED }, deps);

    expect(deps.cancel).toHaveBeenCalledWith("alert-timer");
    expect(deps.cancel).toHaveBeenCalledTimes(1);
  });

  it("cancels timers that were started even when options changed before action end", () => {
    const deps = makeDeps();
    let currentOption = {
      delayAlert: true,
      delayAlertTime: 1,
      delayReload: true,
      delayReloadTime: 2,
    };
    setDelayOption(currentOption);

    start(deps);
    currentOption = {
      delayAlert: false,
      delayAlertTime: 1,
      delayReload: false,
      delayReloadTime: 2,
    };
    runBattleActionDelayAutomation({ type: BattleActionDelayEvent.ACTION_ENDED }, deps);

    expect(deps.cancel).toHaveBeenCalledWith("alert-timer");
    expect(deps.cancel).toHaveBeenCalledWith("reload-timer");
    expect(deps.cancel).toHaveBeenCalledTimes(2);
  });

  it("clears a previous action delay before starting a new one", () => {
    const deps = makeDeps(
      vi.fn().mockReturnValueOnce("first-alert").mockReturnValueOnce("second-alert"),
      vi.fn().mockReturnValueOnce("first-reload").mockReturnValueOnce("second-reload")
    );
    setDelayOption({
      delayAlert: true,
      delayAlertTime: 1,
      delayReload: true,
      delayReloadTime: 2,
    });

    start(deps);
    start(deps);

    expect(deps.cancel).toHaveBeenCalledWith("first-alert");
    expect(deps.cancel).toHaveBeenCalledWith("first-reload");
    expect(deps.schedule).toHaveBeenCalledTimes(2);
    expect(deps.scheduleReload).toHaveBeenCalledTimes(2);
  });

  it("does not cancel stale handles after the active delay registry is cleared", () => {
    const deps = makeDeps();
    setDelayOption({
      delayAlert: true,
      delayAlertTime: 1,
      delayReload: true,
      delayReloadTime: 2,
    });

    start(deps);
    runBattleActionDelayAutomation({ type: BattleActionDelayEvent.ACTION_ENDED }, deps);
    runBattleActionDelayAutomation({ type: BattleActionDelayEvent.ACTION_ENDED }, deps);

    expect(deps.cancel).toHaveBeenCalledTimes(2);
  });

  it("does not track missing timer handles", () => {
    const deps = makeDeps(
      () => undefined,
      () => null
    );
    setDelayOption({
      delayAlert: true,
      delayAlertTime: 1,
      delayReload: true,
      delayReloadTime: 2,
    });

    start(deps);
    runBattleActionDelayAutomation({ type: BattleActionDelayEvent.ACTION_ENDED }, deps);

    expect(deps.cancel).not.toHaveBeenCalled();
  });

});
