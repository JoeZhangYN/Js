import { beforeEach, describe, expect, it, vi } from "vitest";
import { getValue } from "./storage.js";
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
      snap: { hpAbs: 1000 },
    });
    runBattleTurnAutomation({ type: BattleTurnEvent.TURN_STARTED });
    runRecoveryLearningAutomation({
      type: RecoveryLearningEvent.FINALIZE_PENDING,
      snap: { hpAbs: 1450 },
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
      snap: { hpAbs: 1000 },
    });
    runBattleTurnAutomation({ type: BattleTurnEvent.TURN_STARTED });
    runRecoveryLearningAutomation({
      type: RecoveryLearningEvent.FINALIZE_PENDING,
      snap: { hpAbs: 900 },
    });

    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "dynamicHealLog",
      fallback: false,
    });
    expect(log).toHaveBeenCalledWith(expect.stringContaining("[recovery-learn] discard"));
    log.mockRestore();
  });
});
