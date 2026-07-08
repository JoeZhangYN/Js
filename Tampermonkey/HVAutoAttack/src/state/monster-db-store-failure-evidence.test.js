import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadStoreWithIndexedDb } from "./monster-db-store-test-fixture.js";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(),
}));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

function failingOpenIndexedDb() {
  return {
    open: () => {
      const req = { result: null, error: new Error("open blocked"), onerror: null };
      setTimeout(() => req.onerror?.(), 0);
      return req;
    },
  };
}

beforeEach(() => {
  sessionStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
  mocks.runDiagnosticConsoleAutomation.mockReset();
});

describe("monster db store failure evidence", () => {
  it("persists classified IndexedDB failures", async () => {
    const { MONSTER_DB_STORE_FAILURE_KEY, MonsterDbStoreEvent, runMonsterDbStoreAutomation } =
      await loadStoreWithIndexedDb(failingOpenIndexedDb());

    await expect(
      runMonsterDbStoreAutomation({ type: MonsterDbStoreEvent.PROFILE_IS_EMPTY })
    ).rejects.toMatchObject({ failure: expect.objectContaining({ stage: "open" }) });

    expect(MONSTER_DB_STORE_FAILURE_KEY).toBe("HVAA:lastMonsterDbStoreFailure");
    expect(JSON.parse(sessionStorage.getItem(MONSTER_DB_STORE_FAILURE_KEY))).toMatchObject({
      capability: "monsterDbStore",
      source: "monsterDbStore",
      stage: "open",
      error: "open blocked",
    });
  });

  it("keeps classified IndexedDB rejection when diagnostics are blocked", async () => {
    mocks.runDiagnosticConsoleAutomation.mockImplementation(() => false);
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === "HVAA:lastMonsterDbStoreFailure") throw new Error("session blocked");
      return Reflect.apply(originalSetItem, this, [key, value]);
    });
    const { MonsterDbStoreEvent, runMonsterDbStoreAutomation } =
      await loadStoreWithIndexedDb(failingOpenIndexedDb());

    await expect(
      runMonsterDbStoreAutomation({ type: MonsterDbStoreEvent.PROFILE_IS_EMPTY })
    ).rejects.toMatchObject({
      failure: expect.objectContaining({
        capability: "monsterDbStore",
        stage: "open",
        error: "open blocked",
      }),
    });
  });
});
