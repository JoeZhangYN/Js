import { beforeEach, describe, expect, it, vi } from "vitest";
import { runBattleItemExecution } from "./execute-item.js";

const mocks = vi.hoisted(() => ({
  runAutoTuneAutomation: vi.fn(),
  runBattleFocusCommand: vi.fn(),
  runBattleItemCommand: vi.fn(),
  runBattleSpiritToggleAutomation: vi.fn(),
  runRecoveryLearningAutomation: vi.fn(),
  runBattleActionEffectEvidence: vi.fn(),
}));

vi.mock("../../state/auto-tune.js", () => ({
  AutoTuneEvent: Object.freeze({ RECORD_POTION_USE: "recordPotionUse" }),
  runAutoTuneAutomation: mocks.runAutoTuneAutomation,
}));
vi.mock("../battle-focus-command.js", () => ({
  BattleFocusCommandEvent: Object.freeze({ CLICK: "click" }),
  runBattleFocusCommand: mocks.runBattleFocusCommand,
}));
vi.mock("../battle-item-command.js", () => ({
  BattleItemCommandEvent: Object.freeze({ CLICK_GEM: "clickGem", CLICK_ITEM: "clickItem" }),
  runBattleItemCommand: mocks.runBattleItemCommand,
}));
vi.mock("../battle-spirit-toggle.js", () => ({
  BattleSpiritToggleEvent: Object.freeze({ CLICK_AND_RECORD: "clickAndRecord" }),
  runBattleSpiritToggleAutomation: mocks.runBattleSpiritToggleAutomation,
}));
vi.mock("../../state/recovery-learner.js", () => ({
  RecoveryLearningEvent: Object.freeze({ RECORD_PRE_DRINK: "recordPreDrink" }),
  runRecoveryLearningAutomation: mocks.runRecoveryLearningAutomation,
}));
vi.mock("../battle-action-effect-evidence.js", () => ({
  BattleActionEffectEvidenceEvent: Object.freeze({ RECORD_APPLIED: "recordApplied" }),
  runBattleActionEffectEvidence: mocks.runBattleActionEffectEvidence,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
});

describe("runBattleItemExecution rejection evidence", () => {
  it("rejects unknown and null item execution events as not acted with evidence", () => {
    for (const [event, eventType] of [[{ type: "unknown" }, "unknown"], [null, null]]) {
      for (const fn of Object.values(mocks)) fn.mockClear();
      expect(runBattleItemExecution(event)).toBe(false);
      for (const fn of [mocks.runAutoTuneAutomation, mocks.runBattleFocusCommand, mocks.runBattleItemCommand, mocks.runBattleSpiritToggleAutomation, mocks.runRecoveryLearningAutomation]) {
        expect(fn).not.toHaveBeenCalled();
      }
      expect(mocks.runBattleActionEffectEvidence).toHaveBeenCalledWith({
        type: "recordApplied",
        result: {
          kind: "unknown-item-execution-event",
          reason: "unknownItemExecutionEvent",
          eventType,
        },
        acted: false,
        knownResultKind: false,
        failureReason: "unknownItemExecutionEvent",
      });
    }
  });
});
