import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleLifecycleEvidenceEvent,
  runBattleLifecycleEvidence,
} from "./battle-lifecycle-evidence.js";

describe("runBattleLifecycleEvidence", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("records battle lifecycle evidence", () => {
    const debug = vi.fn();

    expect(
      runBattleLifecycleEvidence(
        {
          type: BattleLifecycleEvidenceEvent.RECORD_LIFECYCLE,
          phase: "battleStarted",
          result: true,
          steps: [{ step: "startRuntime", result: true }],
        },
        { sessionStorage: window.sessionStorage, debug }
      )
    ).toBe(true);

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleLifecycle"))).toMatchObject({
      phase: "battleStarted",
      result: true,
      steps: [{ step: "startRuntime", result: true }],
      storageWriteOk: true,
    });
  });

  it("rejects null lifecycle evidence events without writing diagnostics", () => {
    expect(runBattleLifecycleEvidence(null)).toBe(false);
    expect(window.sessionStorage.getItem("HVAA:lastBattleLifecycle")).toBeNull();
  });
});
