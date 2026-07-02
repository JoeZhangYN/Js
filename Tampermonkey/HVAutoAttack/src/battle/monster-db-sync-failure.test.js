import { describe, expect, it, vi } from "vitest";
import { MonsterDbSyncEvent, runMonsterDbSyncAutomation } from "./monster-db-sync.js";

function syncRequested(extra = {}) {
  return { type: MonsterDbSyncEvent.SYNC_REQUESTED, ...extra };
}

function syncDeps(extra = {}) {
  return {
    readMeta: async () => null,
    profileIsEmpty: async () => true,
    readUtcDateKey: () => "2026-06-27",
    storeProfiles: async () => {},
    writeMeta: async () => {},
    ...extra,
  };
}

describe("runMonsterDbSyncAutomation failure evidence", () => {
  it("classifies malformed upstream data as parse failure", async () => {
    const result = await runMonsterDbSyncAutomation(
      syncRequested(),
      syncDeps({
        gmXhr: (opts) => opts.onload({ response: null, responseText: "{bad-json" }),
      })
    );

    expect(result).toMatchObject({
      synced: false,
      reason: "parse-error",
      failure: { source: "monsterDbSync", stage: "parse", reason: "parse-error" },
    });
  });

  it("classifies profile store failures with downstream cause evidence", async () => {
    const error = new Error("idb blocked");
    error.failure = { source: "monsterDbStore", stage: "transaction-abort" };

    const result = await runMonsterDbSyncAutomation(
      syncRequested(),
      syncDeps({
        gmXhr: (opts) => opts.onload({ response: [{ monsterId: 1, monsterName: "Dragon" }] }),
        storeProfiles: async () => {
          throw error;
        },
      })
    );

    expect(result).toMatchObject({
      synced: false,
      reason: "store-error",
      failure: {
        source: "monsterDbSync",
        stage: "store-profiles",
        count: 1,
        error: "idb blocked",
        cause: { source: "monsterDbStore", stage: "transaction-abort" },
      },
    });
  });

  it("classifies meta write failures separately from profile writes", async () => {
    const result = await runMonsterDbSyncAutomation(
      syncRequested(),
      syncDeps({
        gmXhr: (opts) => opts.onload({ response: [{ monsterId: 1 }] }),
        writeMeta: async () => {
          throw new Error("meta blocked");
        },
      })
    );

    expect(result).toMatchObject({
      synced: false,
      reason: "store-error",
      failure: {
        source: "monsterDbSync",
        stage: "write-meta",
        key: "lastSync",
        error: "meta blocked",
      },
    });
  });

  it("classifies request start failures without throwing from sync entry", async () => {
    const gmXhr = vi.fn(() => {
      throw new Error("bridge missing");
    });

    await expect(
      runMonsterDbSyncAutomation(syncRequested(), syncDeps({ gmXhr }))
    ).resolves.toMatchObject({
      synced: false,
      reason: "network-error",
      failure: { source: "monsterDbSync", stage: "request-start", error: "bridge missing" },
    });
  });
});
