import { describe, expect, it, vi } from "vitest";
import {
  MonsterScanResultLearningEvent,
  runMonsterScanResultLearning,
} from "./monster-scan-result-learning.js";

const flushAsyncPersistence = () => new Promise((resolve) => setTimeout(resolve, 0));

function scanEvent() {
  return {
    type: MonsterScanResultLearningEvent.RECORD_LOG_ROW,
    html: "<td>Scanning Dragon</td>",
    onStored: vi.fn(),
    readMonsterMarkup: () => "clean",
  };
}

function scanDeps(extra = {}) {
  return {
    checkScanResultValidity: () => true,
    parseScanResult: () => ({
      lastUpdate: "2026-06-27",
      maxHP: 12345,
      monsterName: "Dragon",
    }),
    readMonsterStatus: () => [{ level: 500, monsterId: 101, name: "Dragon" }],
    storeProfile: vi.fn(async () => {}),
    writeCachedProfile: vi.fn(),
    storeHp: vi.fn(async () => {}),
    recordPersistenceFailure: vi.fn(),
    ...extra,
  };
}

describe("monster scan result persistence failures", () => {
  it("records profile store failures without claiming scan stored", async () => {
    const event = scanEvent();
    const deps = scanDeps({
      storeProfile: vi.fn(async () => {
        throw new Error("profile blocked");
      }),
    });

    expect(runMonsterScanResultLearning(event, deps)).toBe(true);
    await flushAsyncPersistence();

    expect(deps.recordPersistenceFailure).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "scan-store-profile", monsterId: 101 })
    );
    expect(deps.writeCachedProfile).not.toHaveBeenCalled();
    expect(deps.storeHp).not.toHaveBeenCalled();
    expect(event.onStored).not.toHaveBeenCalled();
  });

  it("records cache and HP store failures after profile storage succeeds", async () => {
    const event = scanEvent();
    const deps = scanDeps({
      writeCachedProfile: vi.fn(() => {
        throw new Error("cache blocked");
      }),
      storeHp: vi.fn(async () => {
        throw new Error("hp blocked");
      }),
    });

    expect(runMonsterScanResultLearning(event, deps)).toBe(true);
    await flushAsyncPersistence();

    expect(deps.recordPersistenceFailure).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "scan-cache-profile", monsterId: 101 })
    );
    expect(deps.recordPersistenceFailure).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "scan-store-hp", monsterId: 101, level: 500 })
    );
    expect(event.onStored).toHaveBeenCalledTimes(1);
  });
});
