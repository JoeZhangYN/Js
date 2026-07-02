import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import {
  BattleRecordArchiveEvent,
  runBattleRecordArchiveAutomation,
} from "./battle-record-archive.js";
import { BATTLE_RECORD_ARCHIVE_FAILURE_KEY } from "./battle-record-archive-failure.js";

function deps(values = {}) {
  return {
    delValue: vi.fn((key) => {
      delete values[key];
    }),
    getValue: vi.fn((key) => values[key]),
    setValue: vi.fn((key, value) => {
      values[key] = value;
    }),
    readLocalTimestampLabel: () => "finished",
    values,
  };
}

function lastFailure() {
  return JSON.parse(sessionStorage.getItem(BATTLE_RECORD_ARCHIVE_FAILURE_KEY));
}

beforeEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("battle record archive persistence failures", () => {
  it("does not report battle report recording success when code persistence fails", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const runtime = deps();
    runtime.setValue.mockImplementation(() => {
      throw new Error("battle code blocked");
    });

    expect(
      runBattleRecordArchiveAutomation(
        {
          type: BattleRecordArchiveEvent.START_BATTLE_REPORT_RECORDING,
          enabled: true,
          code: "AR-10",
        },
        runtime
      )
    ).toBe(false);

    expect(lastFailure()).toMatchObject({
      capability: "battleRecordArchive",
      stage: "start-recording",
      key: STORAGE_KEYS.BATTLE_CODE,
      failure: { kind: "storageWrite", error: "battle code blocked" },
    });
  });

  it("does not report current record success when current persistence fails", () => {
    const runtime = deps();
    runtime.setValue.mockImplementation(() => {
      throw new Error("drop write blocked");
    });

    expect(
      runBattleRecordArchiveAutomation(
        {
          type: BattleRecordArchiveEvent.STORE_OR_ARCHIVE_DROP_RECORD,
          record: { "#Credit": 5 },
          recordEach: false,
        },
        runtime
      )
    ).toBe(false);

    expect(runtime.values[STORAGE_KEYS.DROP]).toBeUndefined();
    expect(lastFailure()).toMatchObject({
      stage: "store-current",
      key: STORAGE_KEYS.DROP,
      failure: { error: "drop write blocked" },
    });
  });

  it("does not report archive success when clearing the current record fails", () => {
    const runtime = deps({ [STORAGE_KEYS.BATTLE_CODE]: "AR-10" });
    runtime.delValue.mockImplementation(() => {
      throw new Error("drop clear blocked");
    });

    expect(
      runBattleRecordArchiveAutomation(
        {
          type: BattleRecordArchiveEvent.STORE_OR_ARCHIVE_DROP_RECORD,
          record: { "#Credit": 5 },
          recordEach: true,
          roundNow: 2,
          roundAll: 2,
        },
        runtime
      )
    ).toBe(false);

    expect(runtime.values[STORAGE_KEYS.DROP_OLD]).toHaveLength(1);
    expect(lastFailure()).toMatchObject({
      stage: "archive-clear-current",
      key: STORAGE_KEYS.DROP,
      failure: { error: "drop clear blocked" },
    });
  });

  it("does not report clear success when history deletion fails", () => {
    const runtime = deps({ [STORAGE_KEYS.STATS]: {}, [STORAGE_KEYS.STATS_OLD]: [{}] });
    runtime.delValue.mockImplementation((key) => {
      if (key === STORAGE_KEYS.STATS_OLD) throw new Error("history delete blocked");
      delete runtime.values[key];
    });

    expect(
      runBattleRecordArchiveAutomation(
        { type: BattleRecordArchiveEvent.CLEAR_USAGE_REPORT },
        runtime
      )
    ).toBe(false);

    expect(lastFailure()).toMatchObject({
      stage: "clear-history",
      key: STORAGE_KEYS.STATS_OLD,
      failure: { error: "history delete blocked" },
    });
  });

  it("does not throw when archive failure evidence and warning both fail", () => {
    const runtime = deps();
    runtime.setValue.mockImplementation(() => {
      throw new Error("battle code blocked");
    });
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === BATTLE_RECORD_ARCHIVE_FAILURE_KEY) throw new Error("session blocked");
      return Reflect.apply(originalSetItem, this, [key, value]);
    });
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });

    expect(() =>
      runBattleRecordArchiveAutomation(
        {
          type: BattleRecordArchiveEvent.START_BATTLE_REPORT_RECORDING,
          enabled: true,
          code: "AR-10",
        },
        runtime
      )
    ).not.toThrow();
  });
});
