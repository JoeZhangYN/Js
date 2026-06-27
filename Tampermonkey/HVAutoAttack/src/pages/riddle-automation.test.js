import { beforeEach, describe, expect, it, vi } from "vitest";
import { RiddleEvent, runRiddleAutomation } from "./riddle-automation.js";

const mocks = vi.hoisted(() => ({
  g: vi.fn(),
  runNavigationAutomation: vi.fn(),
  runRiddleAnsweringSession: vi.fn(),
}));

vi.mock("../state/store.js", () => ({ g: mocks.g }));
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
  mocks.g.mockImplementation((key) => (key === "option" ? {} : undefined));
});

describe("runRiddleAutomation", () => {
  it("opens the configured riddle popup through navigation", () => {
    mocks.g.mockImplementation((key) => (key === "option" ? { riddlePopup: true } : undefined));

    expect(runRiddleAutomation({ type: RiddleEvent.RIDDLE_PAGE })).toBe(true);

    expect(mocks.runNavigationAutomation).toHaveBeenCalledWith({
      type: "openWindow",
      url: window.location.href,
      name: "riddleWindow",
      features: "resizable,scrollbars,width=1241,height=707",
    });
    expect(mocks.runRiddleAnsweringSession).not.toHaveBeenCalled();
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
