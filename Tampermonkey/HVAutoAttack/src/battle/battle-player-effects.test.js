import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattlePlayerEffectsEvent, runBattlePlayerEffects } from "./battle-player-effects.js";

const mocks = vi.hoisted(() => ({
  gE: vi.fn(),
  parseEffectName: vi.fn((img) => img.getAttribute("data-name") || ""),
  parseEffectTurns: vi.fn((img) => Number(img.getAttribute("data-turns")) || Infinity),
}));

vi.mock("../dom/query.js", () => ({ gE: mocks.gE }));
vi.mock("./effect-parse.js", () => ({
  parseEffectName: mocks.parseEffectName,
  parseEffectTurns: mocks.parseEffectTurns,
}));

beforeEach(() => {
  document.body.innerHTML = "";
  for (const fn of Object.values(mocks)) fn.mockClear();
});

describe("runBattlePlayerEffects", () => {
  it("reads player effect rows and derived flags through one entry", () => {
    const haste = document.createElement("img");
    haste.src = "https://hentaiverse.org/y/e/haste.png";
    haste.setAttribute("data-name", "Hastened");
    haste.setAttribute("data-turns", "4");
    const spark = document.createElement("img");
    spark.src = "https://hentaiverse.org/y/e/sparklife.png";
    spark.setAttribute("data-name", "Spark of Life");
    spark.setAttribute("data-turns", "1");
    const pane = { querySelectorAll: () => [haste, spark] };

    mocks.gE.mockImplementation((selector) => {
      if (selector === "#pane_effects") return pane;
      if (selector === '#pane_effects>img[src*="channeling"]') return {};
      if (selector === '#pane_effects>img[onmouseover*="Ether Tap (x2)"]') return {};
      if (selector === '#pane_effects>img[src*="wpn_et"][id*="effect_expire"]') return null;
      return null;
    });

    expect(runBattlePlayerEffects({ type: BattlePlayerEffectsEvent.READ_CURRENT })).toEqual({
      channeling: true,
      etherTapActiveX2: true,
      etherTapExpiring: false,
      playerBuffs: ["haste", "sparklife"],
      playerEffectTurns: { haste: 4, sparklife: 1 },
      playerEffects: [
        { img: "haste", name: "Hastened", turns: 4 },
        { img: "sparklife", name: "Spark of Life", turns: 1 },
      ],
    });
  });

  it("rejects unknown events without touching DOM or parsers", () => {
    expect(runBattlePlayerEffects({ type: "unknown" })).toEqual({
      channeling: false,
      etherTapActiveX2: false,
      etherTapExpiring: false,
      playerBuffs: [],
      playerEffects: [],
      playerEffectTurns: {},
    });

    expect(mocks.gE).not.toHaveBeenCalled();
    expect(mocks.parseEffectName).not.toHaveBeenCalled();
    expect(mocks.parseEffectTurns).not.toHaveBeenCalled();
  });
});
