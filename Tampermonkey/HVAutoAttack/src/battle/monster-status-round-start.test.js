import { beforeEach, describe, expect, it } from "vitest";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";
import { g } from "../state/store.js";

const td = (text) => ({ textContent: text });

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = "";
  g("monsterStatus", null);
  g("monsterAll", 0);
});

describe("monster status round start preparation", () => {
  it("records initialized spawn rosters through the monster status entry", () => {
    const outcome = runMonsterStatusAutomation({
      type: MonsterStatusEvent.PREPARE_ROUND_START,
      initialized: true,
      monsterAll: 1,
      battleLog: [
        td("Spawned Monster A: MID=101 (Alpha) LV=10 HP=1000"),
        td("Initializing the battle... (Round 1 / 1)"),
      ],
    });

    expect(outcome).toEqual({ initialized: true, repaired: false });
    expect(g("monsterStatus")).toEqual([
      expect.objectContaining({ order: 0, monsterId: 101, hp: 1000 }),
    ]);
  });

  it("reports repair when non-initialized status is missing", () => {
    document.body.innerHTML = '<div class="btm2" style="background:red"></div>';
    g("monsterAll", 1);

    expect(
      runMonsterStatusAutomation({
        type: MonsterStatusEvent.PREPARE_ROUND_START,
        initialized: false,
        battleLog: [td("Round begins")],
      })
    ).toEqual({ initialized: false, repaired: true });
  });
});
