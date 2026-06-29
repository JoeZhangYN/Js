import { beforeEach, describe, expect, it, vi } from "vitest";
import { getValue, setValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { g } from "./store.js";
import { RecoveryLearningEvent, runRecoveryLearningAutomation } from "./recovery-learner.js";
import { BattleTurnEvent, runBattleTurnAutomation } from "./battle-turn.js";

const mocks = vi.hoisted(() => ({
  runOptionAutomation: vi.fn(),
}));

vi.mock("./option.js", () => ({
  OptionEvent: Object.freeze({
    READ_FIELD: "readField",
  }),
  runOptionAutomation: mocks.runOptionAutomation,
}));

beforeEach(() => {
  localStorage.clear();
  g("learnPending", null);
  runBattleTurnAutomation({ type: BattleTurnEvent.ROUND_STARTED });
  mocks.runOptionAutomation.mockReset();
  mocks.runOptionAutomation.mockReturnValue(false);
});

describe("recovery learner", () => {
  it("stores learned potion recovery behind the shared storage key", () => {
    runRecoveryLearningAutomation({
      type: RecoveryLearningEvent.RECORD_PRE_DRINK,
      potionId: 11195,
      snap: { recoveryAbs: { hp: 1000 } },
    });
    runBattleTurnAutomation({ type: BattleTurnEvent.TURN_STARTED });
    runRecoveryLearningAutomation({
      type: RecoveryLearningEvent.FINALIZE_PENDING,
      recoveryAbs: { hp: 1450 },
    });

    expect(getValue(STORAGE_KEYS.LEARNED_RECOVERY, true)).toEqual({
      11195: { amount: 450, n: 1 },
    });
    expect(
      runRecoveryLearningAutomation({
        type: RecoveryLearningEvent.READ_RECOVERY,
        potionId: 11195,
      })
    ).toEqual({ stat: "hp", amount: 450 });
  });

  it("reads the dynamic heal log switch through the option entry", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    mocks.runOptionAutomation.mockReturnValue(true);

    runRecoveryLearningAutomation({
      type: RecoveryLearningEvent.RECORD_PRE_DRINK,
      potionId: 11195,
      snap: { recoveryAbs: { hp: 1000 } },
    });
    runBattleTurnAutomation({ type: BattleTurnEvent.TURN_STARTED });
    runRecoveryLearningAutomation({
      type: RecoveryLearningEvent.FINALIZE_PENDING,
      recoveryAbs: { hp: 900 },
    });

    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "dynamicHealLog",
      fallback: false,
    });
    expect(log).toHaveBeenCalledWith(expect.stringContaining("[recovery-learn] discard"));
    log.mockRestore();
  });

  it("normalizes pending recovery samples before settling them", () => {
    g("learnPending", {
      potionId: "11195",
      stat: "mp",
      pre: "1000.8",
      turn: "0.9",
    });
    runBattleTurnAutomation({ type: BattleTurnEvent.TURN_STARTED });

    runRecoveryLearningAutomation({
      type: RecoveryLearningEvent.FINALIZE_PENDING,
      recoveryAbs: { hp: "1450.5", mp: 9999 },
    });

    const learned = getValue(STORAGE_KEYS.LEARNED_RECOVERY, true);
    expect(learned[11195].amount).toBeCloseTo(449.7);
    expect(learned[11195].n).toBe(1);
    expect(g("learnPending")).toBeNull();
  });

  it("clears invalid pending recovery samples without learning", () => {
    g("learnPending", {
      potionId: 99999,
      stat: "hp",
      pre: 1000,
      turn: 1,
    });

    runRecoveryLearningAutomation({
      type: RecoveryLearningEvent.FINALIZE_PENDING,
      recoveryAbs: { hp: 1450 },
    });

    expect(g("learnPending")).toBeNull();
    expect(getValue(STORAGE_KEYS.LEARNED_RECOVERY, true)).toBeNull();
  });

  it("ignores malformed learned recovery rows when answering recovery", () => {
    setValue(STORAGE_KEYS.LEARNED_RECOVERY, {
      11195: { amount: "bad", n: 2 },
      11295: { amount: 125, n: "3" },
      unknown: { amount: 999, n: 1 },
    });

    expect(
      runRecoveryLearningAutomation({
        type: RecoveryLearningEvent.READ_RECOVERY,
        potionId: 11195,
      })
    ).toEqual({ stat: "hp", amount: 400 });
    expect(
      runRecoveryLearningAutomation({
        type: RecoveryLearningEvent.READ_RECOVERY,
        potionId: "11295",
      })
    ).toEqual({ stat: "mp", amount: 125 });
  });
});
