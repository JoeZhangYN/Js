import { beforeEach, describe, expect, it, vi } from "vitest";
import { getValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { BattlePauseEvent, runBattlePauseAutomation } from "./pause-automation.js";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  document.body.innerHTML = '<button class="pauseChange"></button>';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("battle pause automation", () => {
  it("pauses and renders pause state through the entry", () => {
    expect(runBattlePauseAutomation({ type: BattlePauseEvent.PAUSE })).toBe(true);
    expect(getValue(STORAGE_KEYS.DISABLED)).toBe("true");
    expect(document.querySelector(".pauseChange").innerHTML).toContain("Continue");
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattlePause"))).toMatchObject({
      state: "paused",
      reason: "pause",
    });

    expect(runBattlePauseAutomation({ type: BattlePauseEvent.RENDER_IF_PAUSED })).toBe(true);
    expect(document.querySelector(".pauseChange").innerHTML).toContain("Continue");
  });

  it("rejects unknown events without touching pause state", () => {
    expect(runBattlePauseAutomation({ type: "unknown" })).toBe(false);

    expect(getValue(STORAGE_KEYS.DISABLED)).toBeNull();
    expect(document.querySelector(".pauseChange").innerHTML).toBe("");
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattlePause"))).toMatchObject({
      state: "rejected",
      reason: "unknownPauseEvent",
      detail: { eventType: "unknown" },
    });
  });

  it("rejects null events with pause evidence instead of throwing", () => {
    expect(runBattlePauseAutomation(null)).toBe(false);

    expect(getValue(STORAGE_KEYS.DISABLED)).toBeNull();
    expect(document.querySelector(".pauseChange").innerHTML).toBe("");
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattlePause"))).toMatchObject({
      state: "rejected",
      reason: "unknownPauseEvent",
      detail: { eventType: null },
    });
  });

  it("records explicit pause reason and detail", () => {
    expect(
      runBattlePauseAutomation({
        type: BattlePauseEvent.PAUSE,
        reason: "staminaLoss",
        detail: { lostStamina: 7 },
      })
    ).toBe(true);

    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattlePause"))).toMatchObject({
      state: "paused",
      reason: "staminaLoss",
      detail: { lostStamina: 7 },
    });
  });

  it("establishes an emergency tab pause when disabled persistence fails", () => {
    vi.stubGlobal("GM_setValue", () => {
      throw new Error("disabled write blocked");
    });

    expect(
      runBattlePauseAutomation({
        type: BattlePauseEvent.PAUSE,
        reason: "criticalBuff",
        detail: { name: "Spark of Life" },
      })
    ).toBe(true);

    expect(document.querySelector(".pauseChange").innerHTML).toContain("Continue");
    expect(sessionStorage.getItem("HVAA:emergencyBattlePause")).not.toBeNull();
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattlePause"))).toMatchObject({
      state: "paused",
      reason: "criticalBuff",
      detail: {
        name: "Spark of Life",
        persistence: {
          degraded: true,
          primaryError: "disabled write blocked",
          emergency: { scope: "tabSession" },
        },
      },
    });
    expect(runBattlePauseAutomation({ type: BattlePauseEvent.RENDER_IF_PAUSED })).toBe(true);
  });

  it("toggles an emergency tab pause and resumes it through the same entry", () => {
    vi.stubGlobal("GM_setValue", () => {
      throw new Error("disabled write blocked");
    });

    expect(runBattlePauseAutomation({ type: BattlePauseEvent.TOGGLE })).toBe(true);

    expect(document.querySelector(".pauseChange").innerHTML).toContain("Continue");
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattlePause"))).toMatchObject({
      state: "paused",
      reason: "toggle",
      detail: { persistence: { degraded: true, primaryError: "disabled write blocked" } },
    });

    expect(runBattlePauseAutomation({ type: BattlePauseEvent.TOGGLE })).toBe(true);
    expect(sessionStorage.getItem("HVAA:emergencyBattlePause")).toBeNull();
    expect(document.querySelector(".pauseChange").innerHTML).toContain("Pause");
  });

  it("keeps the runtime emergency pause active when session storage is unavailable", () => {
    const originalSetItem = sessionStorage.setItem.bind(sessionStorage);
    vi.spyOn(sessionStorage, "setItem").mockImplementation((key, value) => {
      if (key === "HVAA:emergencyBattlePause") {
        throw new Error("session blocked");
      }
      return originalSetItem(key, value);
    });
    vi.stubGlobal("GM_setValue", () => {
      throw new Error("disabled write blocked");
    });

    expect(runBattlePauseAutomation({ type: BattlePauseEvent.PAUSE })).toBe(true);
    expect(sessionStorage.getItem("HVAA:emergencyBattlePause")).toBeNull();
    expect(runBattlePauseAutomation({ type: BattlePauseEvent.RENDER_IF_PAUSED })).toBe(true);
    expect(document.querySelector(".pauseChange").innerHTML).toContain("Continue");
    expect(runBattlePauseAutomation({ type: BattlePauseEvent.TOGGLE })).toBe(true);
  });

  it("records toggle resume evidence", () => {
    const resume = vi.fn();
    runBattlePauseAutomation({ type: BattlePauseEvent.PAUSE });

    expect(runBattlePauseAutomation({ type: BattlePauseEvent.TOGGLE }, { resume })).toBe(true);

    expect(resume).toHaveBeenCalledTimes(1);
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattlePause"))).toMatchObject({
      state: "resumed",
      reason: "toggle",
    });
  });
});
