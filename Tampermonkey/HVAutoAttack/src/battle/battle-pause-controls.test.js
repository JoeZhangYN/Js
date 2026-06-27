import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattlePauseControlsEvent,
  runBattlePauseControlsAutomation,
} from "./battle-pause-controls.js";

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
      readOption: vi.fn(() => option),
      runPauseToggle: vi.fn(),
      resume: vi.fn(),
    },
  };
}

beforeEach(() => {
  document.body.innerHTML = "";
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
});
