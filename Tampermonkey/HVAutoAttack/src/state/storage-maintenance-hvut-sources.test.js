import { describe, expect, it } from "vitest";
import { GameWorld } from "../core/ingress-identity.js";
import { selectWorldPolicy } from "../core/world-policy.js";
import { createHvutStorageMaintenanceSources } from "./storage-maintenance-hvut-sources.js";
import { createStorageMaintenanceMigration } from "./storage-maintenance-migration.js";

describe("HVUT compatibility migration sources", () => {
  it("moves only the current world's derived aggregates and removes their old mirrors", async () => {
    const policy = selectWorldPolicy(GameWorld.ISEKAI);
    const values = new Map([
      ["hvuti_equipdata", { version: 1, 7: { checked: true } }],
      ["hvuti_ml_log", [{ version: 1 }, { wins: 2 }]],
      ["hvut_ml_log", [{ version: 1 }, { wins: 99 }]],
    ]);
    const targets = new Map();
    const legacy = {
      readKey: async (key) => values.get(key) ?? null,
      readFirst: async (keys) => {
        for (const key of keys) if (values.has(key)) return values.get(key);
        return null;
      },
      removeKeys: async (keys) => keys.forEach((key) => values.delete(key)),
    };
    const sources = createHvutStorageMaintenanceSources(policy, legacy, {
      hvutBridge: {
        derivedSet: async (family, value) => (targets.set(family, structuredClone(value)), true),
        derivedGet: (family) => targets.get(family),
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
    expect(preview.records.map((record) => record.sourceId)).toEqual([
      "hvutDerived:equipdata",
      "hvutDerived:ml_log",
    ]);
    await migration.run(preview);
    expect(targets.get("equipdata")).toEqual({ version: 1, 7: { checked: true } });
    expect(targets.get("ml_log")).toEqual([{ version: 1 }, { wins: 2 }]);
    expect(values.has("hvuti_equipdata")).toBe(false);
    expect(values.has("hvuti_ml_log")).toBe(false);
    expect(values.get("hvut_ml_log")).toEqual([{ version: 1 }, { wins: 99 }]);
  });

  it("retains legacy data when the target already contains different current data", async () => {
    const policy = selectWorldPolicy(GameWorld.PERSISTENT);
    const values = new Map([["hvut_equipdata", { version: 1, legacy: true }]]);
    const targets = new Map([["equipdata", { version: 1, current: true }]]);
    const legacy = {
      readKey: async (key) => values.get(key) ?? null,
      readFirst: async () => null,
      removeKeys: async (keys) => keys.forEach((key) => values.delete(key)),
    };
    const [source] = createHvutStorageMaintenanceSources(policy, legacy, {
      hvutBridge: {
        derivedGet: (family) => targets.get(family),
        derivedSet: async (family, value) => (targets.set(family, value), true),
      },
    });

    await expect(
      source.writeTarget(source.normalize(await source.readSource()))
    ).rejects.toMatchObject({ recovery: "retainLegacyAndReviewConflict" });
    expect(values.has("hvut_equipdata")).toBe(true);
    expect(targets.get("equipdata")).toEqual({ version: 1, current: true });
  });
});
