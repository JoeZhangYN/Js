import { beforeEach, describe, expect, it } from "vitest";
import { getValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { BattlePauseEvent, runBattlePauseAutomation } from "./pause-automation.js";

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '<button class="pauseChange"></button>';
});

describe("battle pause automation", () => {
  it("pauses and renders pause state through the entry", () => {
    expect(runBattlePauseAutomation({ type: BattlePauseEvent.PAUSE })).toBe(true);
    expect(getValue(STORAGE_KEYS.DISABLED)).toBe("true");
    expect(document.querySelector(".pauseChange").innerHTML).toContain("Continue");

    expect(runBattlePauseAutomation({ type: BattlePauseEvent.RENDER_IF_PAUSED })).toBe(true);
    expect(document.querySelector(".pauseChange").innerHTML).toContain("Continue");
  });

  it("rejects unknown events without touching pause state", () => {
    expect(runBattlePauseAutomation({ type: "unknown" })).toBe(false);

    expect(getValue(STORAGE_KEYS.DISABLED)).toBeNull();
    expect(document.querySelector(".pauseChange").innerHTML).toBe("");
  });
});
