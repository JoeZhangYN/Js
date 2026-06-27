import { beforeEach, describe, expect, it } from "vitest";
import { BattleRuntimeEvent, runBattleRuntimeAutomation } from "./battle-runtime.js";
import { getValue, setValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";

beforeEach(() => {
  localStorage.clear();
});

describe("runBattleRuntimeAutomation", () => {
  it("clears the full persisted battle session through the entry", () => {
    setValue(STORAGE_KEYS.DISABLED, true);
    setValue(STORAGE_KEYS.ROUND_NOW, 2);
    setValue(STORAGE_KEYS.ROUND_ALL, 5);
    setValue(STORAGE_KEYS.MONSTER_STATUS, [{ id: 1 }]);
    setValue(STORAGE_KEYS.ROUND_TYPE, "ar");
    setValue(STORAGE_KEYS.BATTLE_CODE, "code");

    runBattleRuntimeAutomation({ type: BattleRuntimeEvent.CLEAR_SESSION });

    expect(getValue(STORAGE_KEYS.DISABLED, true)).toBeNull();
    expect(getValue(STORAGE_KEYS.ROUND_NOW, true)).toBeNull();
    expect(getValue(STORAGE_KEYS.ROUND_ALL, true)).toBeNull();
    expect(getValue(STORAGE_KEYS.MONSTER_STATUS, true)).toBeNull();
    expect(getValue(STORAGE_KEYS.ROUND_TYPE, true)).toBeNull();
    expect(getValue(STORAGE_KEYS.BATTLE_CODE, true)).toBeNull();
  });
});
