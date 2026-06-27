import { beforeEach, describe, expect, it, vi } from "vitest";
import { RiddleEvent, runRiddleAutomation } from "./riddle-automation.js";

const mocks = vi.hoisted(() => ({
  runOptionAutomation: vi.fn(),
  runNavigationAutomation: vi.fn(),
  runRiddleAnsweringSession: vi.fn(),
}));

vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({
    READ_FIELD: "readField",
  }),
  runOptionAutomation: mocks.runOptionAutomation,
}));
vi.mock("../core/navigate.js", () => ({
  NavigationEvent: Object.freeze({
    OPEN_WINDOW: "openWindow",
    RELOAD_NOW: "reloadNow",
  }),
  runNavigationAutomation: mocks.runNavigationAutomation,
}));
vi.mock("./riddle.js", () => ({
  runRiddleAnsweringSession: mocks.runRiddleAnsweringSession,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockClear();
  mocks.runOptionAutomation.mockReturnValue(false);
});

describe("runRiddleAutomation", () => {
  it("opens the configured riddle popup through navigation", () => {
    mocks.runOptionAutomation.mockReturnValue(true);

    expect(runRiddleAutomation({ type: RiddleEvent.RIDDLE_PAGE })).toBe(true);

    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "riddlePopup",
      fallback: false,
    });
    expect(mocks.runNavigationAutomation).toHaveBeenCalledWith({
      type: "openWindow",
      url: window.location.href,
      name: "riddleWindow",
      features: "resizable,scrollbars,width=1241,height=707",
    });
    expect(mocks.runRiddleAnsweringSession).not.toHaveBeenCalled();
  });

  it("answers the current riddle page when popup option is disabled", () => {
    expect(runRiddleAutomation({ type: RiddleEvent.RIDDLE_PAGE })).toBe(true);

    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "riddlePopup",
      fallback: false,
    });
    expect(mocks.runRiddleAnsweringSession).toHaveBeenCalledTimes(1);
    expect(mocks.runNavigationAutomation).not.toHaveBeenCalled();
  });

  it("owns the settings popup pretreat workflow", () => {
    const close = vi.fn();
    const schedule = vi.fn((callback) => callback());
    mocks.runNavigationAutomation.mockReturnValue({ close });

    expect(
      runRiddleAutomation({
        type: RiddleEvent.TEST_POPUP_PRETREAT,
        deps: { schedule },
      })
    ).toBe(true);

    expect(schedule).toHaveBeenNthCalledWith(1, expect.any(Function), 3000);
    expect(mocks.runNavigationAutomation).toHaveBeenCalledWith({
      type: "openWindow",
      url: window.location.href,
      name: "riddleWindow",
      features: "resizable,scrollbars,width=1241,height=707",
    });
    expect(schedule).toHaveBeenNthCalledWith(2, expect.any(Function), 200);
    expect(close).toHaveBeenCalled();
  });
});
