import { beforeEach, describe, expect, it } from "vitest";
import { g } from "../state/store.js";
import { MonsterStatusHpRuntimeEvent, runMonsterStatusHpRuntime } from "./monster-status-hp.js";

beforeEach(() => {
  document.body.innerHTML = "";
  g("monsterStatus", null);
});

describe("runMonsterStatusHpRuntime", () => {
  it("updates HP runtime state through one event entry", () => {
    document.body.innerHTML = [
      '<div class="btm1"><div class="btm3">Alpha</div></div>',
      '<div class="btm4"><div class="btm5"><img style="width:60px"></div></div>',
      '<div class="btm6"></div>',
    ].join("");
    g("monsterStatus", [{ order: 0, monsterId: 101, hp: 1000 }]);

    expect(
      runMonsterStatusHpRuntime({
        type: MonsterStatusHpRuntimeEvent.UPDATE,
        battleLog: [],
      })
    ).toEqual({ battleLogTelemetry: { battleLog: [] } });

    expect(g("monsterStatus")).toEqual([
      expect.objectContaining({ monsterId: 101, hpNow: 501, isDead: false }),
    ]);
  });

  it("rejects unknown monster status HP runtime events without side effects", () => {
    const status = [{ order: 0, monsterId: 101, hp: 1000 }];
    g("monsterStatus", status);

    expect(runMonsterStatusHpRuntime({ type: "unknown" })).toBe(false);
    expect(runMonsterStatusHpRuntime(null)).toBe(false);

    expect(g("monsterStatus")).toBe(status);
  });
});
