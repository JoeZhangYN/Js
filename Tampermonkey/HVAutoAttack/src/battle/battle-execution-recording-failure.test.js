import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleAttackExecutionEvent, runBattleAttackExecution } from "./attack/execute-attack.js";
import { BattleChannelExecutionEvent, runBattleChannelExecution } from "./buff/execute-channel.js";
import { BattleItemExecutionEvent, runBattleItemExecution } from "./item/execute-item.js";

const mocks = vi.hoisted(() => ({
  runBattleActionEffectEvidence: vi.fn(),
  runBattleFocusCommand: vi.fn(),
  runBattleItemCommand: vi.fn(),
  runBattleSkillCommand: vi.fn(),
}));

vi.mock("./battle-action-effect-evidence.js", () => ({
  BattleActionEffectEvidenceEvent: { RECORD_APPLIED: "recordApplied" },
  runBattleActionEffectEvidence: mocks.runBattleActionEffectEvidence,
}));
vi.mock("./battle-focus-command.js", () => ({
  BattleFocusCommandEvent: { CLICK: "click" },
  runBattleFocusCommand: mocks.runBattleFocusCommand,
}));
vi.mock("./battle-item-command.js", () => ({
  BattleItemCommandEvent: { CLICK_GEM: "clickGem", CLICK_ITEM: "clickItem" },
  runBattleItemCommand: mocks.runBattleItemCommand,
}));
vi.mock("./battle-skill-command.js", () => ({
  BattleSkillCommandEvent: { CLICK_READY: "clickReady" },
  runBattleSkillCommand: mocks.runBattleSkillCommand,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
});

describe("battle execution recording failures", () => {
  it("does not throw from unknown attack execution events when recording fails", () => {
    mocks.runBattleActionEffectEvidence.mockImplementation(() => {
      throw new Error("effect recording failed");
    });

    expect(runBattleAttackExecution({ type: "unknown" })).toBe(false);
  });

  it("does not throw from unknown item execution events when recording fails", () => {
    mocks.runBattleActionEffectEvidence.mockImplementation(() => {
      throw new Error("effect recording failed");
    });

    expect(runBattleItemExecution({ type: "unknown" })).toBe(false);
  });

  it("does not throw from unknown channel execution events when recording fails", () => {
    mocks.runBattleActionEffectEvidence.mockImplementation(() => {
      throw new Error("effect recording failed");
    });

    expect(runBattleChannelExecution({ type: "unknown" })).toBe(false);
  });

  it("does not throw when a sub-command throws and failure recording also fails", () => {
    mocks.runBattleFocusCommand.mockImplementation(() => {
      throw new Error("focus failed");
    });
    mocks.runBattleActionEffectEvidence.mockImplementation(() => {
      throw new Error("effect recording failed");
    });

    expect(
      runBattleAttackExecution({
        type: BattleAttackExecutionEvent.APPLY_PLAN,
        plan: { type: "focus" },
      })
    ).toBe(false);
  });

  it("keeps successful item execution acted when no failure evidence is needed", () => {
    mocks.runBattleItemCommand.mockReturnValue(true);
    mocks.runBattleActionEffectEvidence.mockImplementation(() => {
      throw new Error("effect recording failed");
    });

    expect(
      runBattleItemExecution({
        type: BattleItemExecutionEvent.APPLY_PLAN,
        plan: { type: "gem" },
      })
    ).toBe(true);
    expect(mocks.runBattleActionEffectEvidence).not.toHaveBeenCalled();
  });

  it("keeps successful channel execution acted when no failure evidence is needed", () => {
    mocks.runBattleSkillCommand.mockReturnValue(true);
    mocks.runBattleActionEffectEvidence.mockImplementation(() => {
      throw new Error("effect recording failed");
    });

    expect(
      runBattleChannelExecution({
        type: BattleChannelExecutionEvent.APPLY_PLAN,
        plan: { type: "click", skillId: 220 },
      })
    ).toBe(true);
    expect(mocks.runBattleActionEffectEvidence).not.toHaveBeenCalled();
  });
});
