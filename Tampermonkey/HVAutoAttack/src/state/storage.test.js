import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(),
}));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

import { delValue, getValue, setValue, STORAGE_READ_FAILURE_KEY } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";

const STORAGE_FAILURE_FIXTURE_KEY = "storageFailureFixture";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  mocks.runDiagnosticConsoleAutomation.mockReset();
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

describe("storage write diagnostics", () => {
  it("routes incomplete option write advisories through typed diagnostics", async () => {
    vi.resetModules();
    vi.doMock("./persist-keys.js", () => ({
      STORAGE_KEYS: { OPTION: STORAGE_FAILURE_FIXTURE_KEY },
    }));
    const { setValue: setFixtureValue } = await import("./storage.js");

    setFixtureValue(STORAGE_FAILURE_FIXTURE_KEY, { lang: "2" });

    expect(mocks.runDiagnosticConsoleAutomation).toHaveBeenCalledWith({
      type: "warn",
      args: [expect.stringContaining("缺 version 字段"), { lang: "2" }],
    });
  });
});

describe("storage read failures", () => {
  it("fails closed and records evidence for corrupted localStorage JSON", () => {
    localStorage.setItem("hvAA_storageFailureFixture", "{bad-json");

    expect(getValue(STORAGE_FAILURE_FIXTURE_KEY, true)).toBeNull();
    expect(STORAGE_READ_FAILURE_KEY).toBe("HVAA:lastStorageReadFailure");
    expect(mocks.runDiagnosticConsoleAutomation).toHaveBeenCalledWith({
      type: "warn",
      args: [
        "[HVAA] storage read failed",
        expect.objectContaining({
          capability: "storageRead",
          item: STORAGE_FAILURE_FIXTURE_KEY,
          key: "hvAA_storageFailureFixture",
          source: "localStorageJson",
        }),
      ],
    });
    expect(JSON.parse(sessionStorage.getItem(STORAGE_READ_FAILURE_KEY))).toMatchObject({
      capability: "storageRead",
      item: STORAGE_FAILURE_FIXTURE_KEY,
      key: "hvAA_storageFailureFixture",
      source: "localStorageJson",
    });
  });

  it("falls back to localStorage when GM_getValue throws", () => {
    vi.stubGlobal("GM_getValue", () => {
      throw new Error("GM read blocked");
    });
    setValue(STORAGE_FAILURE_FIXTURE_KEY, { done: ["1"] });

    expect(getValue(STORAGE_FAILURE_FIXTURE_KEY, true)).toEqual({ done: ["1"] });
    expect(mocks.runDiagnosticConsoleAutomation).toHaveBeenCalledWith({
      type: "warn",
      args: [
        "[HVAA] storage read failed",
        expect.objectContaining({
          capability: "storageRead",
          item: STORAGE_FAILURE_FIXTURE_KEY,
          key: "hvAA_storageFailureFixture",
          source: "GM_getValue",
          error: "GM read blocked",
        }),
      ],
    });
  });

  it("fails closed when storage read evidence and diagnostic console both fail", () => {
    mocks.runDiagnosticConsoleAutomation.mockImplementation(() => false);
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === STORAGE_READ_FAILURE_KEY) throw new Error("session blocked");
      return Reflect.apply(originalSetItem, this, [key, value]);
    });
    localStorage.setItem("hvAA_storageFailureFixture", "{bad-json");

    expect(getValue(STORAGE_FAILURE_FIXTURE_KEY, true)).toBeNull();
  });
});
