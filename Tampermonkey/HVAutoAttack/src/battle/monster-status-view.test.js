import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MonsterStatusViewEvent, runMonsterStatusView } from "./monster-status-view.js";

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("monster status view", () => {
  it("reads combatant count facts from the battle DOM", () => {
    document.body.innerHTML = [
      '<div class="btm1"><div class="btm2" style="background:red"></div></div>',
      '<div class="btm1"><img src="/x/nbardead.png"><div class="btm2" style="background:blue"></div></div>',
      '<div class="btm1" style="opacity: 0.3;"><div class="btm2" style="background:green"></div></div>',
    ].join("");

    expect(runMonsterStatusView({ type: MonsterStatusViewEvent.READ_COMBATANT_COUNTS })).toEqual({
      monsterAll: 3,
      monsterDead: 1,
      bossAll: 3,
      bossDead: 1,
    });
  });

  it("reads repair fallback status from rendered monster slots", () => {
    document.body.innerHTML = [
      '<div class="btm2"></div>',
      '<div class="btm2" style="background:red"></div>',
    ].join("");

    expect(runMonsterStatusView({ type: MonsterStatusViewEvent.READ_REPAIR_SNAPSHOT })).toEqual({
      monsterAll: 2,
      inferredStatus: [
        { order: 0, id: 1, hp: 1000, hpInferred: true },
        { order: 1, id: 2, hp: 100000, hpInferred: true },
      ],
    });
  });

  it("reads HP runtime facts by rendered monster order", () => {
    document.body.innerHTML = [
      '<div class="btm1"><span class="btm3">Alpha</span></div>',
      '<div class="btm1"><span class="btm3">Beta</span></div>',
      '<div class="btm4"><div class="btm5"><img style="width:60px"></div></div>',
      '<div class="btm4"><div class="btm5"><img style="width:120px"><img src="/x/nbardead.png"></div></div>',
      '<div class="btm6"><img src="/y/sleep.png"></div>',
      '<div class="btm6"><img src="/y/weaken.png"></div>',
    ].join("");

    expect(runMonsterStatusView({ type: MonsterStatusViewEvent.READ_HP_RUNTIME_SNAPSHOT })).toEqual(
      [
        {
          order: 0,
          isDead: false,
          hpBarWidth: 60,
          name: "Alpha",
          activeDebuffKeys: ["Sle"],
        },
        {
          order: 1,
          isDead: true,
          hpBarWidth: 120,
          name: "Beta",
          activeDebuffKeys: ["We"],
        },
      ]
    );
  });

  it("rejects unknown monster status view events without reading rendered DOM", () => {
    const querySelector = vi.spyOn(document, "querySelector");
    const querySelectorAll = vi.spyOn(document, "querySelectorAll");

    expect(runMonsterStatusView({ type: "unknown" })).toEqual({
      monsterAll: 0,
      monsterDead: 0,
      bossAll: 0,
      bossDead: 0,
    });

    expect(querySelector).not.toHaveBeenCalled();
    expect(querySelectorAll).not.toHaveBeenCalled();
  });
});
