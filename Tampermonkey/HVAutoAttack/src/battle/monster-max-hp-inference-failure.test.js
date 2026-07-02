import { describe, expect, it, vi } from "vitest";
import {
  MonsterMaxHpInferenceEvent,
  runMonsterMaxHpInference,
} from "./monster-max-hp-inference.js";

const flushAsyncPersistence = () => new Promise((resolve) => setTimeout(resolve, 0));

function inferenceEvent(name = "Alpha") {
  return {
    type: MonsterMaxHpInferenceEvent.APPLY_DEATHS,
    battleLog: [{ kind: "monster-taking", target: name, dmg: 1200 }],
    monsterStatus: [{ order: 0, monsterId: 101, level: 50 }],
    runtimeSnapshot: [{ order: 0, isDead: true, name }],
  };
}

describe("monster max HP inference persistence failures", () => {
  it("records stored HP read failures without throwing from inference", async () => {
    const recordPersistenceFailure = vi.fn();
    const learned = runMonsterMaxHpInference(inferenceEvent(), {
      readStoredMaxHp: vi.fn(async () => {
        throw new Error("read blocked");
      }),
      writeStoredMaxHp: vi.fn(),
      recordPersistenceFailure,
    });

    expect(learned).toEqual([{ order: 0, monsterId: 101, level: 50, inferredMaxHP: 1200 }]);
    await flushAsyncPersistence();
    expect(recordPersistenceFailure).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "death-inference-store-hp", monsterId: 101, level: 50 })
    );
  });

  it("records stored HP write failures without throwing from inference", async () => {
    const recordPersistenceFailure = vi.fn();
    runMonsterMaxHpInference(inferenceEvent("Beta"), {
      readStoredMaxHp: vi.fn(async () => null),
      writeStoredMaxHp: vi.fn(async () => {
        throw new Error("write blocked");
      }),
      recordPersistenceFailure,
    });

    await flushAsyncPersistence();
    expect(recordPersistenceFailure).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "death-inference-store-hp", maxHP: 1200 })
    );
  });
});
