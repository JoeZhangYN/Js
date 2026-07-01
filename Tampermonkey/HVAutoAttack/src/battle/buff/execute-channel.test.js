import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleChannelExecutionEvent, runBattleChannelExecution } from "./execute-channel.js";

const mocks = vi.hoisted(() => ({
  runBattleSkillCommand: vi.fn(),
}));

vi.mock("../battle-skill-command.js", () => ({
  BattleSkillCommandEvent: Object.freeze({ CLICK_READY: "clickReady" }),
  runBattleSkillCommand: mocks.runBattleSkillCommand,
}));

beforeEach(() => {
  mocks.runBattleSkillCommand.mockReset();
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

  it("rejects unknown channel execution events", () => {
    expect(runBattleChannelExecution({ type: "unknown" })).toBe(false);

    expect(mocks.runBattleSkillCommand).not.toHaveBeenCalled();
  });
});
