import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MonsterKnowledgeEvent,
  runMonsterKnowledgeAutomation,
} from "./monster-knowledge-automation.js";
import * as sync from "./monster-db-sync.js";
import * as scan from "./monster-db-scan.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("runMonsterKnowledgeAutomation", () => {
  it("starts sync and scan learning for battle start", () => {
    const runSync = vi.spyOn(sync, "runMonsterDbSyncAutomation").mockReturnValue(undefined);
    const runScan = vi.spyOn(scan, "runMonsterScanLearningAutomation").mockReturnValue(true);

    runMonsterKnowledgeAutomation({ type: MonsterKnowledgeEvent.BATTLE_STARTED });

    expect(runSync).toHaveBeenCalledWith({ type: sync.MonsterDbSyncEvent.SYNC_REQUESTED });
    expect(runScan).toHaveBeenCalledWith({
      type: scan.MonsterScanLearningEvent.START,
      onStored: expect.any(Function),
    });
  });

  it("rejects unknown and null monster knowledge events without side effects", () => {
    const runSync = vi.spyOn(sync, "runMonsterDbSyncAutomation").mockReturnValue(undefined);
    const runScan = vi.spyOn(scan, "runMonsterScanLearningAutomation").mockReturnValue(true);

    expect(runMonsterKnowledgeAutomation({ type: "unknown" })).toBeUndefined();
    expect(runMonsterKnowledgeAutomation(null)).toBeUndefined();
    expect(runSync).not.toHaveBeenCalled();
    expect(runScan).not.toHaveBeenCalled();
  });
});
