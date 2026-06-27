import { beforeEach, describe, expect, it } from "vitest";
import { getValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { g } from "./store.js";
import { RecoveryLearningEvent, runRecoveryLearningAutomation } from "./recovery-learner.js";

beforeEach(() => {
  localStorage.clear();
  g("learnPending", null);
  g("turn", 0);
  g("option", {});
});

describe("recovery learner", () => {
  it("stores learned potion recovery behind the shared storage key", () => {
    runRecoveryLearningAutomation({
      type: RecoveryLearningEvent.RECORD_PRE_DRINK,
      potionId: 11195,
      snap: { hpAbs: 1000 },
    });
    g("turn", 1);
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
});
