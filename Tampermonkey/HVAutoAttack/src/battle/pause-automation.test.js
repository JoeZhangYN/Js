import { beforeEach, describe, expect, it, vi } from "vitest";
import { getValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { BattlePauseEvent, runBattlePauseAutomation } from "./pause-automation.js";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  document.body.innerHTML = '<button class="pauseChange"></button>';
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

  it("does not report pause success when disabled persistence fails", () => {
    vi.stubGlobal("GM_setValue", () => {
      throw new Error("disabled write blocked");
    });

    expect(
      runBattlePauseAutomation({
        type: BattlePauseEvent.PAUSE,
        reason: "criticalBuff",
        detail: { name: "Spark of Life" },
      })
    ).toBe(false);

    expect(document.querySelector(".pauseChange").innerHTML).toBe("");
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattlePause"))).toMatchObject({
      state: "failed",
      reason: "pausePersistenceFailed",
      detail: {
        requestedReason: "criticalBuff",
        ok: false,
        error: "disabled write blocked",
      },
    });
  });

  it("does not report toggle pause success when disabled persistence fails", () => {
    vi.stubGlobal("GM_setValue", () => {
      throw new Error("disabled write blocked");
    });

    expect(runBattlePauseAutomation({ type: BattlePauseEvent.TOGGLE })).toBe(false);

    expect(document.querySelector(".pauseChange").innerHTML).toBe("");
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattlePause"))).toMatchObject({
      state: "failed",
      reason: "pausePersistenceFailed",
      detail: { ok: false, error: "disabled write blocked" },
    });
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
