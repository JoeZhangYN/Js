import { beforeEach, describe, expect, it } from "vitest";
import { g } from "../state/store.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("monster status combatant count invariants", () => {
  it("normalizes runtime combatant count reads through the entry", () => {
    g("monsterAll", "3.9");
    g("monsterAlive", "9");
    g("bossAll", "bad");
    g("bossAlive", -2);

    expect(runMonsterStatusAutomation({ type: MonsterStatusEvent.READ_COMBATANT_COUNTS })).toEqual({
      monsterAll: 3,
      monsterAlive: 3,
      bossAll: 0,
      bossAlive: 0,
    });
  });

  it("clamps refreshed alive combatants to their totals", () => {
    document.body.innerHTML = [
      '<div class="btm1"><img src="/x/nbardead.png"></div>',
      '<div class="btm1"><img src="/x/nbardead.png"></div>',
      '<div class="btm1"><div class="btm2" style="background:red"></div></div>',
    ].join("");

    expect(
      runMonsterStatusAutomation({ type: MonsterStatusEvent.REFRESH_COMBATANT_COUNTS })
    ).toEqual({
      monsterAll: 3,
      monsterAlive: 1,
      bossAll: 1,
      bossAlive: 1,
    });
  });
});
