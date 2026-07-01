import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleActionEffectDispatchEvent,
  runBattleActionEffectDispatch,
} from "./battle-action-effect-dispatch.js";
import { BattleCommandEvidenceEvent, runBattleCommandEvidence } from "./battle-command-evidence.js";

function applyResult(result) {
  return runBattleActionEffectDispatch({
    type: BattleActionEffectDispatchEvent.APPLY_ACTION_RESULT,
    result,
  });
}

beforeEach(() => {
  document.body.innerHTML = "";
  window.sessionStorage.clear();
});

describe("battle action effect command evidence bridge", () => {
  it("carries fresh command failure evidence into action effect evidence", () => {
    const target = document.createElement("div");
    target.id = "mkey_3";
    target.innerHTML = '<img src="x/nbardead.png">';
    target.click = vi.fn();
    document.body.appendChild(target);

    expect(applyResult({ kind: "click-skill-then-target", skillId: "213", targetId: 3 })).toBe(
      false
    );

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleActionEffect"))).toMatchObject({
      acted: false,
      failureReason: "targetDead",
      command: {
        command: "target.clickSkillThenTarget",
        acted: false,
        failureReason: "targetDead",
        detail: { skillId: "213", targetId: 3 },
      },
    });
  });

  it("does not reuse stale command evidence for effects that write no command", () => {
    runBattleCommandEvidence({
      type: BattleCommandEvidenceEvent.RECORD_RESULT,
      command: "skill.clickReady",
      result: "rejected",
      reason: "skillNotReady",
      detail: { skillId: "213" },
    });

    expect(applyResult({ kind: "noop" })).toBe(false);

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleActionEffect"))).toMatchObject({
      acted: false,
      failureReason: "actionExecutorRejected",
    });
    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleActionEffect")).command).toBeUndefined();
  });
});
