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
});

afterEach(() => {
  vi.useRealTimers();
});

describe("runBattleKillBugRecovery", () => {
  it("routes bug recovery reload through the navigation entry", async () => {
    document.body.innerHTML = `
      <table id="textlog"><tbody><tr><td class="tlb">Inventory slot is empty</td></tr></tbody></table>
    `;

    runBattleKillBugRecovery({ type: BattleKillBugRecoveryEvent.RECOVER });

    expect(document.querySelector("td").className).toBe("tlbWARN");
    expect(mocks.runNavigationAutomation).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(700);

    expect(mocks.runNavigationAutomation).toHaveBeenCalledWith({
      type: "reloadNow",
      reason: "killBugRecovery",
    });
  });

  it("marks normal bug log rows as quick-action rows without reloading", () => {
    document.body.innerHTML = `
      <table id="textlog"><tbody><tr><td class="tlb">You hit a monster.</td></tr></tbody></table>
    `;

    runBattleKillBugRecovery({ type: BattleKillBugRecoveryEvent.RECOVER });

    expect(document.querySelector("td").className).toBe("tlbQRA");
    expect(mocks.runNavigationAutomation).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("rejects unknown bug recovery events without reading or reloading", () => {
    document.body.innerHTML = `
      <table id="textlog"><tbody><tr><td class="tlb">Inventory slot is empty</td></tr></tbody></table>
    `;

    expect(runBattleKillBugRecovery({ type: "unknown" })).toBe(false);

    expect(document.querySelector("td").className).toBe("tlb");
    expect(mocks.runNavigationAutomation).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
