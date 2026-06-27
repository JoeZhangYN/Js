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
});
