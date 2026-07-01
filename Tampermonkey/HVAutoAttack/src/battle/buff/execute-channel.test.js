import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleChannelExecutionEvent, runBattleChannelExecution } from "./execute-channel.js";

const mocks = vi.hoisted(() => ({
  runBattleSkillCommand: vi.fn(),
  runBattleActionEffectEvidence: vi.fn(),
}));

vi.mock("../battle-skill-command.js", () => ({
  BattleSkillCommandEvent: Object.freeze({ CLICK_READY: "clickReady" }),
  runBattleSkillCommand: mocks.runBattleSkillCommand,
}));
vi.mock("../battle-action-effect-evidence.js", () => ({
  BattleActionEffectEvidenceEvent: Object.freeze({ RECORD_APPLIED: "recordApplied" }),
  runBattleActionEffectEvidence: mocks.runBattleActionEffectEvidence,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
});

function applyPlan(plan) {
  return runBattleChannelExecution({
    type: BattleChannelExecutionEvent.APPLY_PLAN,
    plan,
  });
}

describe("runBattleChannelExecution", () => {
  it("routes channel skill clicks through the skill command entry and returns the command result", () => {
    mocks.runBattleSkillCommand.mockReturnValue(false);

    expect(applyPlan({ type: "click", skillId: "412" })).toBe(false);

    expect(mocks.runBattleSkillCommand).toHaveBeenCalledWith({
      type: "clickReady",
      skillId: "412",
    });

    mocks.runBattleSkillCommand.mockReturnValue(true);
    expect(applyPlan({ type: "click", skillId: "412" })).toBe(true);
  });

  it("rejects unknown and null channel execution events as not acted with evidence", () => {
    for (const [event, eventType] of [[{ type: "unknown" }, "unknown"], [null, null]]) {
      for (const fn of Object.values(mocks)) fn.mockClear();
      expect(runBattleChannelExecution(event)).toBe(false);
      expect(mocks.runBattleSkillCommand).not.toHaveBeenCalled();
      expect(mocks.runBattleActionEffectEvidence).toHaveBeenCalledWith({
        type: "recordApplied",
        result: {
          kind: "unknown-channel-execution-event",
          reason: "unknownChannelExecutionEvent",
          eventType,
        },
        acted: false,
        knownResultKind: false,
        failureReason: "unknownChannelExecutionEvent",
      });
    }
  });
});
