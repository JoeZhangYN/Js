import { describe, expect, it, vi } from "vitest";
import { MonsterDbSyncEvent, runMonsterDbSyncAutomation } from "./monster-db-sync.js";

function syncRequested(extra = {}) {
  return { type: MonsterDbSyncEvent.SYNC_REQUESTED, ...extra };
}

describe("runMonsterDbSyncAutomation", () => {
  it("skips the daily sync when the profile store is already populated", async () => {
    const gmXhr = vi.fn();

    await expect(
      runMonsterDbSyncAutomation(syncRequested(), {
        readMeta: async () => "2026-06-27",
        gmXhr,
        profileIsEmpty: async () => false,
        readUtcDateKey: () => "2026-06-27",
      })
    ).resolves.toEqual({ synced: false, reason: "already-synced-today" });

    expect(gmXhr).not.toHaveBeenCalled();
  });

  it("syncs through the event entry when the local profile store is empty", async () => {
    const storeProfiles = vi.fn(async () => {});
    const writeMeta = vi.fn(async () => {});

    const result = await runMonsterDbSyncAutomation(syncRequested(), {
      storeProfiles,
      readMeta: async () => "2026-06-27",
      gmXhr: (opts) =>
        opts.onload({
          response: [
            {
              attack: "piercing",
              cold: -5,
              created_at: "ignored",
              crushing: 0,
              dark: 0,
              elec: 0,
              fire: 10,
              holy: 0,
              lastUpdate: "2026-06-27",
              monsterClass: "Dragonkin",
              monsterId: 101,
              monsterName: "Dragon",
              piercing: -10,
              plvl: 500,
              slashing: 0,
              trainer: "trainer",
              wind: 0,
            },
          ],
        }),
      profileIsEmpty: async () => true,
      writeMeta,
      readUtcDateKey: () => "2026-06-27",
    });

    expect(result).toEqual({ synced: true, count: 1 });
    expect(storeProfiles).toHaveBeenCalledWith([
      {
        attack: "piercing",
        cold: -5,
        crushing: 0,
        dark: 0,
        elec: 0,
        fire: 10,
        holy: 0,
        lastUpdate: "2026-06-27",
        monsterClass: "Dragonkin",
        monsterId: 101,
        monsterName: "Dragon",
        piercing: -10,
        plvl: 500,
        slashing: 0,
        trainer: "trainer",
        wind: 0,
      },
    ]);
    expect(writeMeta).toHaveBeenCalledWith("lastSync", "2026-06-27");
  });
});
