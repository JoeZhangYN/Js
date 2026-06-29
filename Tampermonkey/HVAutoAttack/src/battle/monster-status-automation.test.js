import { beforeEach, describe, expect, it } from "vitest";
import { getValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { g } from "../state/store.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";

const td = (text) => ({ textContent: text });

beforeEach(() => {
  localStorage.clear();
  g("monsterStatus", null);
});

describe("monster status automation", () => {
  it("records spawn roster through the monster status entry", () => {
    runMonsterStatusAutomation({
      type: MonsterStatusEvent.RECORD_SPAWN_ROSTER,
      monsterAll: 2,
      battleLog: [
        td("Spawned Monster B: MID=202 (Beta) LV=10 HP=2000"),
        td("Spawned Monster A: MID=101 (Alpha) LV=10 HP=1000"),
        td("Initializing the battle... (Round 1 / 1)"),
      ],
    });

    expect(getValue(STORAGE_KEYS.MONSTER_STATUS, true)).toEqual([
      {
        order: 0,
        id: 1,
        monsterId: 101,
        name: "Alpha",
        level: 10,
        hp: 1000,
        hpInferred: false,
      },
      {
        order: 1,
        id: 2,
        monsterId: 202,
        name: "Beta",
        level: 10,
        hp: 2000,
        hpInferred: false,
      },
    ]);
  });

  it("refreshes combatant counts through the monster status entry", () => {
    document.body.innerHTML = [
      '<div class="btm1"><div class="btm2" style="background:red"></div></div>',
      '<div class="btm1"><img src="/x/nbardead.png"><div class="btm2" style="background:blue"></div></div>',
      '<div class="btm1" style="opacity: 0.3;"><div class="btm2" style="background:green"></div></div>',
    ].join("");

    expect(
      runMonsterStatusAutomation({ type: MonsterStatusEvent.REFRESH_COMBATANT_COUNTS })
    ).toEqual({
      monsterAll: 3,
      monsterAlive: 2,
      bossAll: 3,
      bossAlive: 2,
    });
    expect(g("monsterAll")).toBe(3);
    expect(g("monsterAlive")).toBe(2);
    expect(g("bossAll")).toBe(3);
    expect(g("bossAlive")).toBe(2);
  });

  it("reads combatant counts through the monster status entry", () => {
    g("monsterAll", 4);
    g("monsterAlive", 3);
    g("bossAll", 2);
    g("bossAlive", 1);

    expect(runMonsterStatusAutomation({ type: MonsterStatusEvent.READ_COMBATANT_COUNTS })).toEqual({
      monsterAll: 4,
      monsterAlive: 3,
      bossAll: 2,
      bossAlive: 1,
    });
  });

  it("exposes monster identity by combatant order through the entry", () => {
    g("monsterStatus", [
      { order: 1, monsterId: 202 },
      { order: 0, monsterId: 101 },
    ]);

    const readMonsterIdByOrder = runMonsterStatusAutomation({
      type: MonsterStatusEvent.READ_IDS_BY_ORDER,
    });

    expect(readMonsterIdByOrder(0)).toBe(101);
    expect(readMonsterIdByOrder(1)).toBe(202);
    expect(readMonsterIdByOrder(2)).toBeUndefined();
  });

  it("reads current monster status through the entry", () => {
    const status = [{ order: 0, monsterId: 101, hp: 1000 }];
    g("monsterStatus", status);

    expect(runMonsterStatusAutomation({ type: MonsterStatusEvent.READ_STATUS })).toBe(status);
  });
});
