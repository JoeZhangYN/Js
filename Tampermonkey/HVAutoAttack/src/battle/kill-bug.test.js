import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BattleKillBugRecoveryEvent, runBattleKillBugRecovery } from "./kill-bug.js";

const mocks = vi.hoisted(() => ({
  runNavigationAutomation: vi.fn(),
}));

vi.mock("../core/navigate.js", () => ({
  NavigationEvent: Object.freeze({ RELOAD_NOW: "reloadNow" }),
  NavigationReloadReason: Object.freeze({ KILL_BUG_RECOVERY: "killBugRecovery" }),
  runNavigationAutomation: mocks.runNavigationAutomation,
}));

beforeEach(() => {
  vi.useFakeTimers();
  mocks.runNavigationAutomation.mockReset();
  document.body.innerHTML = "";
  sessionStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("runBattleKillBugRecovery", () => {
  it("routes bug recovery reload through the navigation entry", async () => {
    document.body.innerHTML = `
      <table id="textlog"><tbody><tr><td class="tlb">Inventory slot is empty</td></tr></tbody></table>
    `;

    expect(runBattleKillBugRecovery({ type: BattleKillBugRecoveryEvent.RECOVER })).toBe(true);

    expect(document.querySelector("td").className).toBe("tlbWARN");
    expect(mocks.runNavigationAutomation).not.toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleKillBugRecovery"))).toMatchObject({
      result: "scheduledReload",
      reason: "recover",
      detail: {
        matchedTexts: ["Inventory slot is empty"],
        scannedRows: 1,
        delayMs: 700,
      },
    });

    await vi.advanceTimersByTimeAsync(700);

    expect(mocks.runNavigationAutomation).toHaveBeenCalledWith({
      type: "reloadNow",
      reason: "killBugRecovery",
      detail: { source: "battleKillBugRecovery", matchedText: "Inventory slot is empty" },
    });
  });

  it("marks normal bug log rows as quick-action rows without reloading", () => {
    document.body.innerHTML = `
      <table id="textlog"><tbody><tr><td class="tlb">You hit a monster.</td></tr></tbody></table>
    `;

    expect(runBattleKillBugRecovery({ type: BattleKillBugRecoveryEvent.RECOVER })).toBe(false);

    expect(document.querySelector("td").className).toBe("tlbQRA");
    expect(mocks.runNavigationAutomation).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleKillBugRecovery"))).toMatchObject({
      result: "notMatched",
      reason: "recover",
      detail: { matchedTexts: [], scannedRows: 1, delayMs: null },
    });
  });

  it("rejects unknown bug recovery events without reading or reloading", () => {
    document.body.innerHTML = `
      <table id="textlog"><tbody><tr><td class="tlb">Inventory slot is empty</td></tr></tbody></table>
    `;

    expect(runBattleKillBugRecovery({ type: "unknown" })).toBe(false);

    expect(document.querySelector("td").className).toBe("tlb");
    expect(mocks.runNavigationAutomation).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleKillBugRecovery"))).toMatchObject({
      result: "rejected",
      reason: "unknownKillBugRecoveryEvent",
      detail: { eventType: "unknown" },
    });
  });

  it("rejects null bug recovery events with evidence instead of throwing", () => {
    expect(runBattleKillBugRecovery(null)).toBe(false);

    expect(mocks.runNavigationAutomation).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleKillBugRecovery"))).toMatchObject({
      result: "rejected",
      reason: "unknownKillBugRecoveryEvent",
      detail: { eventType: null },
    });
  });
});
