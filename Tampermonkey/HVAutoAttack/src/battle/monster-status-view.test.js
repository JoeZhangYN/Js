import { beforeEach, describe, expect, it } from "vitest";
import { MonsterStatusViewEvent, runMonsterStatusView } from "./monster-status-view.js";

beforeEach(() => {
  document.body.innerHTML = "";
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
});
