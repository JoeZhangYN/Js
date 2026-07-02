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

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleMonsterStatusRepair"))).toMatchObject({
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
});
