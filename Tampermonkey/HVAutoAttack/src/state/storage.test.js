import { beforeEach, describe, expect, it } from "vitest";
import { delValue, getValue, setValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";

beforeEach(() => {
  localStorage.clear();
});

describe("storage shortcut cleanup", () => {
  it("clears battle runtime keys through named storage keys", () => {
    setValue(STORAGE_KEYS.DISABLED, true);
    setValue(STORAGE_KEYS.ROUND_NOW, 2);
    setValue(STORAGE_KEYS.ROUND_ALL, 5);
    setValue(STORAGE_KEYS.MONSTER_STATUS, [{ id: 1 }]);
    setValue(STORAGE_KEYS.ROUND_TYPE, "ar");
    setValue(STORAGE_KEYS.BATTLE_CODE, "code");

    delValue(2);

    expect(getValue(STORAGE_KEYS.DISABLED, true)).toBeNull();
    expect(getValue(STORAGE_KEYS.ROUND_NOW, true)).toBeNull();
    expect(getValue(STORAGE_KEYS.ROUND_ALL, true)).toBeNull();
    expect(getValue(STORAGE_KEYS.MONSTER_STATUS, true)).toBeNull();
    expect(getValue(STORAGE_KEYS.ROUND_TYPE, true)).toBeNull();
    expect(getValue(STORAGE_KEYS.BATTLE_CODE, true)).toBeNull();
  });
});
