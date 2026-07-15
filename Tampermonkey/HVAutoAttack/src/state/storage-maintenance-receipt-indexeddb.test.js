import { describe, expect, it } from "vitest";
import { createTestIndexedDb } from "../../test/fake-indexeddb.js";
import { createStorageMaintenanceReceiptAdapter } from "./storage-maintenance-receipt-indexeddb.js";

describe("storage maintenance receipt IndexedDB", () => {
  it("persists resumable receipt state without GM storage", async () => {
    const indexedDb = createTestIndexedDb();
    const receipts = createStorageMaintenanceReceiptAdapter({ indexedDb, dbName: "maintenance" });
    await receipts.write({ sourceId: "hvut:ml", state: "copiedVerified" });
    await receipts.write({ sourceId: "hvut:ml", state: "sourceDeleted" });

    await expect(receipts.read("hvut:ml")).resolves.toMatchObject({ state: "sourceDeleted" });
    await expect(receipts.list()).resolves.toHaveLength(1);
  });

  it("isolates receipts by world database name", async () => {
    const indexedDb = createTestIndexedDb();
    const persistent = createStorageMaintenanceReceiptAdapter({
      indexedDb,
      dbName: "maintenance:persistent",
    });
    const isekai = createStorageMaintenanceReceiptAdapter({
      indexedDb,
      dbName: "maintenance:isekai",
    });
    await persistent.write({ sourceId: "battleRuntime", state: "sourceDeleted" });
    await isekai.write({ sourceId: "battleRuntime", state: "copiedVerified" });

    await expect(persistent.read("battleRuntime")).resolves.toMatchObject({
      state: "sourceDeleted",
    });
    await expect(isekai.read("battleRuntime")).resolves.toMatchObject({
      state: "copiedVerified",
    });
  });
});
