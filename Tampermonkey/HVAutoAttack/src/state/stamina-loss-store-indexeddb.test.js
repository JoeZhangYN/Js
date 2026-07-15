import { beforeEach, describe, expect, it } from "vitest";
import { createTestIndexedDb } from "../../test/fake-indexeddb.js";
import { createStaminaLossIndexedDbAdapter } from "./stamina-loss-store-indexeddb.js";

const DAY = 24 * 60 * 60 * 1000;
const budget = Object.freeze({ days: 365, rows: 1000, compactAt: 1100 });
let indexedDb;

beforeEach(() => {
  indexedDb = createTestIndexedDb();
});

describe("stamina loss IndexedDB history", () => {
  it("expires records older than 365 days during append", async () => {
    const adapter = createStaminaLossIndexedDbAdapter({ indexedDb, dbName: "stamina-main" });
    await adapter.append({ id: "expired", observedAt: 0, stamp: "expired", amount: 1 }, budget, 0);

    const result = await adapter.append(
      { id: "current", observedAt: 366 * DAY, stamp: "current", amount: 2 },
      budget,
      366 * DAY
    );

    expect(result).toMatchObject({ rows: 1, pruned: 1 });
    expect(await adapter.list()).toEqual([
      { id: "current", observedAt: 366 * DAY, stamp: "current", amount: 2 },
    ]);
  });

  it("compacts at 1100 records and retains the newest 1000", async () => {
    const adapter = createStaminaLossIndexedDbAdapter({ indexedDb, dbName: "stamina-main" });
    for (let index = 0; index < 1100; index += 1) {
      await adapter.append(
        { id: `${index}`, observedAt: index, stamp: `${index}`, amount: index },
        budget,
        365 * DAY
      );
    }

    const rows = await adapter.list();
    expect(rows).toHaveLength(1000);
    expect(rows[0].id).toBe("100");
    expect(rows.at(-1).id).toBe("1099");
  });

  it("isolates histories by world database name", async () => {
    const persistent = createStaminaLossIndexedDbAdapter({ indexedDb, dbName: "stamina-main" });
    const isekai = createStaminaLossIndexedDbAdapter({ indexedDb, dbName: "stamina-isekai" });
    await persistent.append({ id: "main", observedAt: 1, stamp: "main", amount: 3 }, budget, 1);

    expect(await persistent.list()).toHaveLength(1);
    expect(await isekai.list()).toEqual([]);
  });
});
