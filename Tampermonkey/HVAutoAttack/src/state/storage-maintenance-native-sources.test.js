import { describe, expect, it } from "vitest";
import { GameWorld } from "../core/ingress-identity.js";
import { selectWorldPolicy } from "../core/world-policy.js";
import { BattleReportHistoryEvent } from "../monitor/battle-report-history.js";
import { BattleSessionCheckpointEvent } from "./battle-session-checkpoint.js";
import { LearnedMonsterStoreEvent } from "./learned-monster-store.js";
import { createStorageMaintenanceMigration } from "./storage-maintenance-migration.js";
import { createNativeStorageMaintenanceSources } from "./storage-maintenance-native-sources.js";
import { StaminaLossStoreEvent } from "./stamina-loss-store.js";
import { StorageWriteOutcome } from "./storage-io-policy.js";

function legacyAdapter(values) {
  return {
    readKey: async (key) => values.get(key) ?? null,
    removeKeys: async (keys) => keys.forEach((key) => values.delete(key)),
  };
}

describe("native compatibility migration sources", () => {
  it("moves every legacy aggregate through its typed target and retires only verified keys", async () => {
    const policy = selectWorldPolicy(GameWorld.PERSISTENT);
    const prefix = policy.storage.prefix;
    const values = new Map([
      [`${prefix}dropOld`, [{ __name: "old", "#Credit": 2 }]],
      [`${prefix}statsOld`, [{ __name: "old", self: { _turn: 3 } }]],
      [`${prefix}battleCode`, "AR-1"],
      [`${prefix}drop`, { "#Credit": 4 }],
      [`${prefix}staminaLostLog`, { old: 7 }],
      [`${prefix}learnedBigKill`, { 7: { OFC: { min: 1 } } }],
      [`${prefix}learnedIncomingBurst`, { 8: { maxHit: 12, type: "magic" } }],
    ]);
    const histories = new Map([
      ["drop", []],
      ["usage", []],
    ]);
    let checkpoint = null;
    const stamina = [];
    const learned = new Map([
      ["bigKill", []],
      ["incomingBurst", []],
    ]);
    const sources = createNativeStorageMaintenanceSources(policy, legacyAdapter(values), {
      runHistory: async (event) => {
        const records = histories.get(event.family);
        if (event.type === BattleReportHistoryEvent.APPEND) records.push(event.envelope);
        if (event.type === BattleReportHistoryEvent.LIST_ENVELOPES) return records;
        return { outcome: StorageWriteOutcome.WRITTEN };
      },
      runCheckpoint: (event) => {
        if (event.type === BattleSessionCheckpointEvent.CHECKPOINT_SLICE) checkpoint = event.value;
        if (event.type === BattleSessionCheckpointEvent.READ_SLICE) {
          return checkpoint ? { kind: "loaded", checkpoint } : { kind: "absent" };
        }
        return { outcome: StorageWriteOutcome.WRITTEN };
      },
      runStamina: async (event) => {
        if (event.type === StaminaLossStoreEvent.APPEND) stamina.push(event);
        if (event.type === StaminaLossStoreEvent.LIST_RECORDS) return stamina;
        return { outcome: StorageWriteOutcome.WRITTEN };
      },
      runLearned: async (event) => {
        const records = learned.get(event.family);
        if (event.type === LearnedMonsterStoreEvent.UPSERT_MANY) {
          records.push(
            ...event.records.map((record) => ({
              ...record,
              migrationSourceId: event.migrationSourceId,
            }))
          );
        }
        if (event.type === LearnedMonsterStoreEvent.READ_RECORDS) return records;
        return { outcome: StorageWriteOutcome.WRITTEN };
      },
    });
    const receiptValues = new Map();
    const migration = createStorageMaintenanceMigration(
      {
        sources,
        receipts: {
          read: async (key) => receiptValues.get(key) || null,
          write: async (receipt) => receiptValues.set(receipt.sourceId, receipt),
        },
      },
      { requestIdle: (callback) => callback() }
    );

    const preview = await migration.preview();
    expect(preview.count).toBe(6);
    await expect(migration.run(preview)).resolves.toMatchObject({ count: 6 });
    expect(values.size).toBe(0);
    expect(histories.get("drop")).toHaveLength(1);
    expect(histories.get("usage")).toHaveLength(1);
    expect(checkpoint).toMatchObject({ code: "AR-1", drop: { "#Credit": 4 } });
    expect(stamina).toHaveLength(1);
    expect(learned.get("bigKill")).toHaveLength(1);
    expect(learned.get("incomingBurst")).toHaveLength(1);
  });
});
