import { beforeEach, describe, expect, it } from "vitest";
import { BattleHudEvent, runBattleHudAutomation } from "./battle-info.js";

beforeEach(() => {
  document.body.innerHTML = '<div id="hvAABox2"></div>';
  document.title = "";
});

function makeDeps(values) {
  return {
    cE: (tag) => document.createElement(tag),
    document,
    g: (key) => values[key],
    gE: (selector) => document.querySelector(selector),
  };
}

describe("runBattleHudAutomation", () => {
  it("renders the battle HUD and synchronizes the title", () => {
    const values = {
      attackStatus: 1,
      monsterAlive: 2,
      monsterAll: 3,
      roundAll: 5,
      roundNow: 4,
      roundType: "ar",
      runSpeed: 1.5,
      turn: 12,
    };

    expect(
      runBattleHudAutomation({ type: BattleHudEvent.REFRESH }, makeDeps(values))
    ).toBe(true);

    const hud = document.querySelector(".hvAALog");
    expect(hud.textContent).toContain("Turns: 12");
    expect(hud.textContent).toContain("Arena");
    expect(document.title).toBe("12||1.5||4/5||2/3");
  });

  it("ignores unknown events", () => {
    expect(runBattleHudAutomation({ type: "unknown" })).toBe(false);
  });
});
