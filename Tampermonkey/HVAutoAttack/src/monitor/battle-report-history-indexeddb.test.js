import { beforeEach, describe, expect, it } from "vitest";
import { createTestIndexedDb } from "../../test/fake-indexeddb.js";
import { createBattleReportHistoryIndexedDbAdapter } from "./battle-report-history-indexeddb.js";

const budget = Object.freeze({ rows: 200, compactAt: 225 });
let indexedDb;

beforeEach(() => {
  indexedDb = createTestIndexedDb();
});

describe("battle report IndexedDB history", () => {
  it("compacts exactly at 225 records and retains the newest 200", async () => {
    const adapter = createBattleReportHistoryIndexedDbAdapter({
      indexedDb,
      dbName: "battle-main",
    });
    for (let index = 0; index < 225; index += 1) {
      await adapter.append(
        "drop",
        { id: `drop-${index}`, createdAt: index, record: { __name: `${index}` } },
        budget
      );
    }

    const rows = await adapter.list("drop");
    expect(rows).toHaveLength(200);
    expect(rows[0].__name).toBe("25");
    expect(rows.at(-1).__name).toBe("224");
  });

  it("treats a repeated archive identity as exactly-once completion", async () => {
    const adapter = createBattleReportHistoryIndexedDbAdapter({
      indexedDb,
      dbName: "battle-main",
    });
    const envelope = { id: "session:drop", createdAt: 1, record: { __name: "AR" } };

    await adapter.append("drop", envelope, budget);
    const repeated = await adapter.append("drop", envelope, budget);

    expect(repeated).toMatchObject({ outcome: "skippedUnchanged", rows: 1 });
    expect(await adapter.list("drop")).toEqual([{ __name: "AR" }]);
  });

  it("isolates persistent and isekai histories by bound database", async () => {
    const persistent = createBattleReportHistoryIndexedDbAdapter({
      indexedDb,
      dbName: "battle-main",
    });
    const isekai = createBattleReportHistoryIndexedDbAdapter({
      indexedDb,
      dbName: "battle-isekai",
    });

    await persistent.append(
      "usage",
      { id: "main", createdAt: 1, record: { __name: "main" } },
      budget
    );

    expect(await persistent.list("usage")).toEqual([{ __name: "main" }]);
    expect(await isekai.list("usage")).toEqual([]);
  });
});
