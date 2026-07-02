import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  setValue: vi.fn(),
  runOptionAutomation: vi.fn(),
}));

vi.mock("./storage.js", async () => {
  const actual = await vi.importActual("./storage.js");
  return { ...actual, setValue: mocks.setValue };
});

vi.mock("./option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));

import { RecoveryLearningEvent, runRecoveryLearningAutomation } from "./recovery-learner.js";
import { RECOVERY_LEARNING_FAILURE_KEY } from "./recovery-learner-failure.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { g } from "./store.js";
import { BattleTurnEvent, runBattleTurnAutomation } from "./battle-turn.js";

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.restoreAllMocks();
  mocks.setValue.mockReset();
  mocks.runOptionAutomation.mockReset();
  mocks.runOptionAutomation.mockReturnValue(false);
  g("learnPending", null);
  runBattleTurnAutomation({ type: BattleTurnEvent.ROUND_STARTED });
});

function recordPendingPotion() {
  runRecoveryLearningAutomation({
    type: RecoveryLearningEvent.RECORD_PRE_DRINK,
    potionId: 11195,
    recoveryAbs: { hp: 1000 },
  });
  runBattleTurnAutomation({ type: BattleTurnEvent.TURN_STARTED });
}

describe("recovery learning persistence failures", () => {
  it("does not report learned recovery success when storage write fails", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.setValue.mockImplementation(() => {
      throw new Error("recovery learning write blocked");
    });
    recordPendingPotion();

    expect(
      runRecoveryLearningAutomation({
        type: RecoveryLearningEvent.FINALIZE_PENDING,
        recoveryAbs: { hp: 1450 },
      })
    ).toBe(false);

    expect(JSON.parse(window.sessionStorage.getItem(RECOVERY_LEARNING_FAILURE_KEY))).toMatchObject({
      capability: "recoveryLearning",
      stage: "update-learned",
      failure: { kind: "storageWrite", error: "recovery learning write blocked" },
    });
    expect(g("learnPending")).toBeNull();
  });

  it("does not throw when recovery learning failure evidence and warning both fail", () => {
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === RECOVERY_LEARNING_FAILURE_KEY) throw new Error("session blocked");
      return Reflect.apply(originalSetItem, this, [key, value]);
    });
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });
    mocks.setValue.mockImplementation(() => {
      throw new Error("recovery learning write blocked");
    });
    recordPendingPotion();

    expect(() =>
      runRecoveryLearningAutomation({
        type: RecoveryLearningEvent.FINALIZE_PENDING,
        recoveryAbs: { hp: 1450 },
      })
    ).not.toThrow();
    expect(
      runRecoveryLearningAutomation({
        type: RecoveryLearningEvent.FINALIZE_PENDING,
        recoveryAbs: { hp: 1450 },
      })
    ).toBeUndefined();
  });
});
