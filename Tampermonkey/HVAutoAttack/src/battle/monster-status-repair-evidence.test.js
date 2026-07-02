import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MonsterStatusRepairEvidenceEvent,
  runMonsterStatusRepairEvidence,
} from "./monster-status-repair-evidence.js";

function deps() {
  return {
    sessionStorage: window.sessionStorage,
    debug: vi.fn(),
  };
}

beforeEach(() => {
  window.sessionStorage.clear();
});

describe("runMonsterStatusRepairEvidence", () => {
  it("records monster status repair evidence", () => {
    expect(
      runMonsterStatusRepairEvidence(
        {
          type: MonsterStatusRepairEvidenceEvent.RECORD_REPAIR,
          result: "rejected",
          reason: "unknownMonsterStatusEvent",
          detail: { eventType: null },
        },
        deps()
      )
    ).toBe(true);

    expect(
      JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleMonsterStatusRepair"))
    ).toMatchObject({
      result: "rejected",
      reason: "unknownMonsterStatusEvent",
      detail: { eventType: null },
      storageWriteOk: true,
    });
  });

  it("rejects unknown and null evidence events without writing diagnostics", () => {
    const d = deps();

    expect(runMonsterStatusRepairEvidence({ type: "unknown" }, d)).toBe(false);
    expect(runMonsterStatusRepairEvidence(null, d)).toBe(false);

    expect(window.sessionStorage.getItem("HVAA:lastBattleMonsterStatusRepair")).toBeNull();
    expect(d.debug).not.toHaveBeenCalled();
  });

  it("keeps monster status repair evidence visible when storage is unavailable", () => {
    const debug = vi.fn();
    const blockedStorage = {
      setItem: vi.fn(() => {
        throw new Error("quota");
      }),
    };

    expect(
      runMonsterStatusRepairEvidence(
        {
          type: MonsterStatusRepairEvidenceEvent.RECORD_REPAIR,
          result: "repairFailed",
          reason: "missingMonsterStatus",
          detail: { monsterId: 1 },
        },
        { sessionStorage: blockedStorage, debug }
      )
    ).toBe(false);

    expect(debug).toHaveBeenCalledWith(
      "[HVAA] monster status repair",
      expect.objectContaining({ storageWriteOk: false, storageWriteError: "quota" })
    );
  });

  it("keeps monster status repair evidence stored when debug output fails", () => {
    expect(() =>
      runMonsterStatusRepairEvidence(
        {
          type: MonsterStatusRepairEvidenceEvent.RECORD_REPAIR,
          result: "repaired",
          reason: "missingMonsterStatus",
          detail: { monsterId: 1 },
        },
        {
          sessionStorage: window.sessionStorage,
          debug: () => {
            throw new Error("console blocked");
          },
        }
      )
    ).not.toThrow();

    expect(
      JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleMonsterStatusRepair"))
    ).toMatchObject({
      result: "repaired",
      reason: "missingMonsterStatus",
      storageWriteOk: true,
    });
  });
});
