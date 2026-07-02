import { beforeEach, describe, expect, it, vi } from "vitest";
import { delValue, getValue, setValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";

const STORAGE_FAILURE_FIXTURE_KEY = "storageFailureFixture";

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
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

describe("storage read failures", () => {
  it("fails closed and records evidence for corrupted localStorage JSON", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    localStorage.setItem("hvAA_storageFailureFixture", "{bad-json");

    expect(getValue(STORAGE_FAILURE_FIXTURE_KEY, true)).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      "[HVAA] storage read failed",
      expect.objectContaining({
        item: STORAGE_FAILURE_FIXTURE_KEY,
        key: "hvAA_storageFailureFixture",
        source: "localStorageJson",
      })
    );
  });

  it("falls back to localStorage when GM_getValue throws", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("GM_getValue", () => {
      throw new Error("GM read blocked");
    });
    setValue(STORAGE_FAILURE_FIXTURE_KEY, { done: ["1"] });

    expect(getValue(STORAGE_FAILURE_FIXTURE_KEY, true)).toEqual({ done: ["1"] });
    expect(warn).toHaveBeenCalledWith(
      "[HVAA] storage read failed",
      expect.objectContaining({
        item: STORAGE_FAILURE_FIXTURE_KEY,
        key: "hvAA_storageFailureFixture",
        source: "GM_getValue",
        error: "GM read blocked",
      })
    );
  });
});
