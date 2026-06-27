import { beforeEach, describe, expect, it } from "vitest";
import { getValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { g } from "./store.js";
import { finalizePending, getLearnedRecovery, recordPreDrink } from "./recovery-learner.js";

beforeEach(() => {
  localStorage.clear();
  g("learnPending", null);
  g("turn", 0);
  g("option", {});
});

describe("recovery learner", () => {
  it("stores learned potion recovery behind the shared storage key", () => {
    recordPreDrink(11195, { hpAbs: 1000 });
    g("turn", 1);
    finalizePending({ hpAbs: 1450 });

    expect(getValue(STORAGE_KEYS.LEARNED_RECOVERY, true)).toEqual({
      11195: { amount: 450, n: 1 },
    });
    expect(getLearnedRecovery(11195)).toEqual({ stat: "hp", amount: 450 });
  });
});
