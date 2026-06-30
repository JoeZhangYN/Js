import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleMonsterSurfaceEvent, runBattleMonsterSurface } from "./battle-monster-surface.js";

const mocks = vi.hoisted(() => ({
  gE: vi.fn((selector, mode) =>
    mode === "all" ? document.querySelectorAll(selector) : document.querySelector(selector)
  ),
}));

vi.mock("../dom/query.js", () => ({ gE: mocks.gE }));

function setHpBarWidth(img, width) {
  Object.defineProperty(img, "offsetWidth", { configurable: true, value: width });
}

beforeEach(() => {
  document.body.innerHTML = "";
  mocks.gE.mockClear();
});

describe("runBattleMonsterSurface", () => {
  it("reads current monster facts from the battle surface", () => {
    document.body.innerHTML = `
      <div class="btm1">
        <div class="btm2" style="background:red"></div>
        <div class="btm3"> Alpha </div>
        <div class="btm5"><img src="/x/nbargreen.png"></div>
        <div class="btm6">
          <img src="/e/sleep.png" onmouseover="battle.set_infopane_effect(this, 'Sleep', 3)">
        </div>
      </div>
      <div class="btm1" style="opacity: 0.3;">
        <div class="btm3">Beta</div>
      </div>
    `;
    setHpBarWidth(document.querySelector(".btm5 img"), 60);

    expect(runBattleMonsterSurface({ type: BattleMonsterSurfaceEvent.READ_CURRENT })).toEqual([
      {
        id: 1,
        order: 0,
        isDead: false,
        isBoss: true,
        name: "Alpha",
        hpRatio: 0.5,
        buffs: ["sleep"],
        buffEffects: [{ img: "sleep", name: "Sleep", turns: 3 }],
      },
      {
        id: 2,
        order: 1,
        isDead: true,
        isBoss: false,
        name: "Beta",
        hpRatio: 0,
        buffs: [],
        buffEffects: [],
      },
    ]);
  });

  it("keeps HV monster id wrapping", () => {
    document.body.innerHTML = Array.from({ length: 10 }, () => `<div class="btm1"></div>`).join("");

    expect(runBattleMonsterSurface().at(-1)).toMatchObject({ id: 0, order: 9, hpRatio: 1 });
  });

  it("rejects unknown events without touching DOM", () => {
    expect(runBattleMonsterSurface({ type: "unknown" })).toEqual([]);

    expect(mocks.gE).not.toHaveBeenCalled();
  });
});
