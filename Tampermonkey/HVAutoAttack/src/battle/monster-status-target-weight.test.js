import { beforeEach, describe, expect, it } from "vitest";
import { g } from "../state/store.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";

beforeEach(() => {
  document.body.innerHTML = "";
  g("monsterStatus", null);
});

describe("monster status target weight entry", () => {
  it("keeps all-dead target weights finite-safe through the monster status entry", () => {
    document.body.innerHTML = [
      '<div class="btm1"><div class="btm3">Alpha</div></div>',
      '<div class="btm4"><div class="btm5"><img style="width:120px"><img src="/x/nbardead.png"></div></div>',
      '<div class="btm6"><img src="/y/sleep.png"></div>',
    ].join("");
    g("monsterStatus", [{ order: 0, monsterId: 101, hp: 1000 }]);

    runMonsterStatusAutomation({ type: MonsterStatusEvent.UPDATE_HP });

    expect(g("monsterStatus")).toEqual([
      expect.objectContaining({
        monsterId: 101,
        isDead: true,
        hpNow: Infinity,
        finWeight: Infinity,
      }),
    ]);
  });
});
