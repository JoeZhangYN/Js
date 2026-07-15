import { describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { StorageWriteOutcome } from "../state/storage-io-policy.js";
import { BATTLE_RECORD_ARCHIVE_FAILURE_KEY } from "./battle-record-archive-failure.js";
import { createBattleRecordArchiveTestDeps } from "./battle-record-archive-test-fixture.js";
import { BattleDropEvent, runBattleDropAutomation } from "./drop-monitor.js";

function logLine(text, item) {
  const row = document.createElement("td");
  if (item) {
    const span = document.createElement("span");
    span.textContent = `[${item.name}]`;
    span.style.color = item.color;
    row.appendChild(span);
  } else {
    row.textContent = text;
  }
  return row;
}

function deps({ rows, values = {}, option = {}, roundNow = 1, roundAll = 2 }) {
  const archive = createBattleRecordArchiveTestDeps(values);
  return {
    ...archive,
    g: (key) => {
      if (key === "option") return option;
      if (key === "roundNow") return roundNow;
      if (key === "roundAll") return roundAll;
      return undefined;
    },
    gE: (selector, rootOrAll) => {
      if (rootOrAll === "all") return rows;
      return rootOrAll.querySelector(selector);
    },
    readOptionField: (key, fallback) => (option[key] !== undefined ? option[key] : fallback),
    readLocalTimestampLabel: () => "now",
  };
}

describe("runBattleDropAutomation", () => {
  it("does not report drop recording success when archive persistence fails", () => {
    const runtime = deps({
      option: { dropMonitor: true, dropQuality: 0, recordEach: false },
      rows: [logLine("You gain 12 EXP")],
    });
    const baseRun = runtime.runCheckpoint;
    runtime.runCheckpoint = (event) =>
      event.type === "checkpointSlice"
        ? { outcome: StorageWriteOutcome.FAILED, error: new Error("drop checkpoint blocked") }
        : baseRun(event);

    expect(runBattleDropAutomation({ type: BattleDropEvent.RECORD_BATTLE_DROPS }, runtime)).toEqual(
      { kind: "failed", reason: "dropArchiveFailed" }
    );

    expect(runtime.values[STORAGE_KEYS.DROP]).toBeUndefined();
    expect(JSON.parse(sessionStorage.getItem(BATTLE_RECORD_ARCHIVE_FAILURE_KEY))).toMatchObject({
      capability: "battleRecordArchive",
      stage: "runtime-checkpoint",
      key: "battleReport",
      failure: { kind: "storageWrite", error: "drop checkpoint blocked" },
    });
  });

  it("rejects unknown drop events without reading logs or writing drops", () => {
    const runtime = deps({
      option: { dropMonitor: true, dropQuality: 0, recordEach: false },
      rows: [logLine("You gain 12 EXP")],
    });

    expect(runBattleDropAutomation({ type: "unknown" }, runtime)).toBe(false);
    expect(runBattleDropAutomation(null, runtime)).toBe(false);

    expect(runtime.values[STORAGE_KEYS.DROP]).toBeUndefined();
    expect(runtime.readRuntime()).toEqual({ kind: "absent" });
  });

  it("does not record drops when the drop monitor option is disabled", () => {
    const runtime = deps({
      option: { dropMonitor: false, dropQuality: 0, recordEach: false },
      rows: [logLine("You gain 12 EXP")],
    });

    expect(runBattleDropAutomation({ type: BattleDropEvent.RECORD_BATTLE_DROPS }, runtime)).toEqual(
      { kind: "skipped", reason: "dropMonitorDisabled" }
    );
    expect(runtime.values[STORAGE_KEYS.DROP]).toBeUndefined();
  });

  it("records EXP, credits, and items through the event entry", () => {
    const runtime = deps({
      option: { dropMonitor: true, dropQuality: 0, recordEach: false },
      rows: [
        logLine("You gain 12 EXP"),
        logLine("You gain 34 Credit"),
        logLine("", { color: "rgb(186, 5, 180)", name: "2x Crystal of Vigor" }),
      ],
    });

    expect(runBattleDropAutomation({ type: BattleDropEvent.RECORD_BATTLE_DROPS }, runtime)).toEqual(
      { kind: "recorded", archive: { archived: false } }
    );

    expect(runtime.readRuntime().checkpoint.drop).toMatchObject({
      "#Credit": 34,
      "#EXP": 12,
      "Crystal of Vigor": 2,
      "#startTime": "now",
    });
  });

  it("archives the active drop record at the final round", async () => {
    const values = {
      [STORAGE_KEYS.BATTLE_CODE]: "AR-10",
      [STORAGE_KEYS.DROP]: { "#Credit": 5, "#EXP": 0, "#startTime": "old" },
    };
    const runtime = deps({
      option: { dropMonitor: true, dropQuality: 0, recordEach: true },
      roundAll: 3,
      roundNow: 3,
      rows: [logLine("You gain 1 Credit")],
      values,
    });
    runtime.seedRuntime({
      code: "AR-10",
      drop: { "#Credit": 5, "#EXP": 0, "#startTime": "old" },
    });

    const result = runBattleDropAutomation({ type: BattleDropEvent.RECORD_BATTLE_DROPS }, runtime);

    expect(values).toEqual({
      [STORAGE_KEYS.BATTLE_CODE]: "AR-10",
      [STORAGE_KEYS.DROP]: { "#Credit": 5, "#EXP": 0, "#startTime": "old" },
    });
    expect(await result.archive.completion).toBe(true);
    expect(runtime.histories.get("drop").map(({ record }) => record)).toEqual([
      {
        "#Credit": 6,
        "#EXP": 0,
        "#endTime": "now",
        "#startTime": "old",
        __name: "AR-10",
      },
    ]);
  });
});
