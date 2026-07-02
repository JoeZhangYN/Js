import { describe, expect, it, vi } from "vitest";
import {
  MonsterMaxHpInferenceEvent,
  runMonsterMaxHpInference,
} from "./monster-max-hp-inference.js";

describe("monster max HP inference", () => {
  it("learns dead monster max HP from accumulated battle damage", async () => {
    const status = [{ order: 0, monsterId: 101, level: 50 }];
    const readStoredMaxHp = vi.fn().mockResolvedValue(null);
    const writeStoredMaxHp = vi.fn().mockResolvedValue(undefined);

    const learned = runMonsterMaxHpInference(
      {
        type: MonsterMaxHpInferenceEvent.APPLY_DEATHS,
        battleLog: [
          { kind: "monster-taking", target: "Alpha", dmg: 1200 },
          { kind: "monster-taking", target: "the Alpha", dmg: 300 },
        ],
        monsterStatus: status,
        runtimeSnapshot: [{ order: 0, isDead: true, name: "the Alpha" }],
      },
      {
        readStoredMaxHp,
        writeStoredMaxHp,
      }
    );

    expect(learned).toEqual([{ order: 0, monsterId: 101, level: 50, inferredMaxHP: 1500 }]);
    expect(status[0].inferredMaxHP).toBe(1500);
    await Promise.resolve();
    await Promise.resolve();
    expect(readStoredMaxHp).toHaveBeenCalledWith(101, 50);
    expect(writeStoredMaxHp).toHaveBeenCalledWith(101, 50, 1500);
  });

  it("does not overwrite an existing stored max HP", async () => {
    const writeStoredMaxHp = vi.fn();

    runMonsterMaxHpInference(
      {
        type: MonsterMaxHpInferenceEvent.APPLY_DEATHS,
        battleLog: [{ kind: "monster-taking", target: "Beta", dmg: 900 }],
        monsterStatus: [{ order: 1, monsterId: 202, level: 60 }],
        runtimeSnapshot: [{ order: 1, isDead: true, name: "Beta" }],
      },
      {
        readStoredMaxHp: vi.fn().mockResolvedValue({ maxHP: 1000 }),
        writeStoredMaxHp,
      }
    );

    await Promise.resolve();
    await Promise.resolve();
    expect(writeStoredMaxHp).not.toHaveBeenCalled();
  });

  it("rejects unknown monster max HP inference events without reading or writing", () => {
    const monsterStatus = [{ order: 0, monsterId: 101, level: 50 }];
    const readStoredMaxHp = vi.fn();
    const writeStoredMaxHp = vi.fn();

    expect(
      runMonsterMaxHpInference(
        {
          type: "unknown",
          monsterStatus,
          runtimeSnapshot: [{ order: 0, isDead: true, name: "Alpha" }],
        },
        {
          readStoredMaxHp,
          writeStoredMaxHp,
        }
      )
    ).toEqual([]);

    expect(readStoredMaxHp).not.toHaveBeenCalled();
    expect(writeStoredMaxHp).not.toHaveBeenCalled();
    expect(monsterStatus[0].inferredMaxHP).toBeUndefined();
    expect(runMonsterMaxHpInference(null, { readStoredMaxHp, writeStoredMaxHp })).toEqual([]);
  });

  it("uses the event battle log instead of reading battle log itself", () => {
    const accumulateDamageByMonster = vi.fn(() => new Map());

    runMonsterMaxHpInference(
      {
        type: MonsterMaxHpInferenceEvent.APPLY_DEATHS,
        battleLog: [{ kind: "monster-taking", target: "Alpha", dmg: 700 }],
        monsterStatus: [{ order: 0, monsterId: 101, level: 50 }],
        runtimeSnapshot: [{ order: 0, isDead: true, name: "Alpha" }],
      },
      {
        accumulateDamageByMonster,
      }
    );

    expect(accumulateDamageByMonster).toHaveBeenCalledWith([
      { kind: "monster-taking", target: "Alpha", dmg: 700 },
    ]);
  });
});
