import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattlePauseControlsEvent,
  runBattlePauseControlsAutomation,
} from "./battle-pause-controls.js";

const mocks = vi.hoisted(() => ({
  runOptionAutomation: vi.fn(),
}));

vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));

function makeDeps(option) {
  const root = document.createElement("div");
  root.id = "battle_main";
  document.body.appendChild(root);
  return {
    root,
    deps: {
      document,
      query: vi.fn(() => root),
      createElement: vi.fn((tag) => document.createElement(tag)),
      readOptionField: vi.fn((key, fallback) => option[key] ?? fallback),
      runPauseToggle: vi.fn(),
      resume: vi.fn(),
    },
  };
}

beforeEach(() => {
  document.body.innerHTML = "";
  mocks.runOptionAutomation.mockReset();
  mocks.runOptionAutomation.mockReturnValue({});
});

describe("runBattlePauseControlsAutomation", () => {
  it("installs pause button control through one entry", () => {
    const { root, deps } = makeDeps({ pauseButton: true, pauseHotkey: false });

    expect(runBattlePauseControlsAutomation({ type: BattlePauseControlsEvent.INSTALL }, deps)).toBe(
      true
    );

    const button = root.querySelector(".pauseChange");
    expect(button.innerHTML).toContain("Pause");
    button.click();
    expect(deps.runPauseToggle).toHaveBeenCalledWith({ resume: deps.resume });
  });

  it("installs pause hotkey without triggering while typing", () => {
    const { deps } = makeDeps({
      pauseButton: false,
      pauseHotkey: true,
      pauseHotkeyKey: "p",
    });
    runBattlePauseControlsAutomation({ type: BattlePauseControlsEvent.INSTALL }, deps);

    const input = document.createElement("input");
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "p", bubbles: true }));
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "p", bubbles: true }));

    expect(deps.runPauseToggle).toHaveBeenCalledTimes(1);
  });

  it("reads pause control options through the option entry on the default path", () => {
    const root = document.createElement("div");
    root.id = "battle_main";
    document.body.appendChild(root);
    mocks.runOptionAutomation.mockImplementation((event) => event.fallback);

    expect(runBattlePauseControlsAutomation({ type: BattlePauseControlsEvent.INSTALL })).toBe(true);

    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "pauseButton",
      fallback: false,
    });
    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "pauseHotkey",
      fallback: false,
    });
    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "pauseHotkeyKey",
      fallback: "p",
    });
  });

  it("rejects unknown events without touching pause controls", () => {
    const { root, deps } = makeDeps({ pauseButton: true, pauseHotkey: true });

    expect(runBattlePauseControlsAutomation({ type: "unknown" }, deps)).toBe(false);

    expect(root.children).toHaveLength(0);
    expect(deps.readOptionField).not.toHaveBeenCalled();
    expect(deps.runPauseToggle).not.toHaveBeenCalled();
  });
});
