import { describe, expect, it, vi } from "vitest";
import {
  MonsterScanResultLearningEvent,
  runMonsterScanResultLearning,
} from "./monster-scan-result-learning.js";

describe("monster scan result learning", () => {
  it("records a valid scan profile and matching battle-level HP", async () => {
    const storeProfile = vi.fn(async () => {});
    const writeCachedProfile = vi.fn();
    const storeHp = vi.fn();
    const onStored = vi.fn();
    const info = {
      lastUpdate: "2026-06-27",
      maxHP: 12345,
      monsterName: "Dragon",
    };

    expect(
      runMonsterScanResultLearning(
        {
          type: MonsterScanResultLearningEvent.RECORD_LOG_ROW,
          html: "<td>Scanning Dragon</td>",
          onStored,
          readMonsterMarkup: () => "clean",
        },
        {
          checkScanResultValidity: () => true,
          parseScanResult: () => ({ ...info }),
          readUtcDateKey: () => "2026-06-27",
          readMonsterStatus: () => [{ level: 500, monsterId: 101, name: "Dragon" }],
          storeProfile,
          writeCachedProfile,
          storeHp,
        }
      )
    ).toBe(true);

    await Promise.resolve();

    const profile = { ...info, monsterId: 101 };
    expect(storeProfile).toHaveBeenCalledWith(profile);
    expect(writeCachedProfile).toHaveBeenCalledWith(101, profile);
    expect(storeHp).toHaveBeenCalledWith(101, 500, 12345, "2026-06-27");
    expect(onStored).toHaveBeenCalledTimes(1);
  });

  it("rejects polluted scan markup before writing", () => {
    const storeProfile = vi.fn();

    expect(
      runMonsterScanResultLearning(
        {
          type: MonsterScanResultLearningEvent.RECORD_LOG_ROW,
          html: "<td>Scanning Dragon</td>",
          readMonsterMarkup: () => "imperil",
        },
        {
          checkScanResultValidity: () => false,
          parseScanResult: () => ({ monsterName: "Dragon" }),
          readMonsterStatus: () => [{ level: 500, monsterId: 101, name: "Dragon" }],
          storeProfile,
        }
      )
    ).toBe(false);
    expect(storeProfile).not.toHaveBeenCalled();
  });

  it("rejects scans that cannot resolve a monster status identity", () => {
    const storeProfile = vi.fn();

    expect(
      runMonsterScanResultLearning(
        {
          type: MonsterScanResultLearningEvent.RECORD_LOG_ROW,
          html: "<td>Scanning Dragon</td>",
          readMonsterMarkup: () => "clean",
        },
        {
          checkScanResultValidity: () => true,
          parseScanResult: () => ({ monsterName: "Dragon" }),
          readMonsterStatus: () => [{ level: 500, monsterId: 101, name: "Wyvern" }],
          storeProfile,
        }
      )
    ).toBe(false);
    expect(storeProfile).not.toHaveBeenCalled();
  });
});
