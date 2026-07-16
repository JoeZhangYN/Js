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
import { retireLegacyBattleRoundStorage } from "../battle/battle-session-legacy-storage.js";

const STORAGE_FAILURE_FIXTURE_KEY = "storageFailureFixture";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  mocks.runDiagnosticConsoleAutomation.mockReset();
});

describe("storage shortcut cleanup", () => {
  it("uses explicit storage identities and retires legacy round keys", () => {
    setValue(STORAGE_KEYS.DISABLED, true);
    setValue("roundNow", 2);
    setValue("roundAll", 5);
    setValue("roundType", "ar");
    setValue(STORAGE_KEYS.BATTLE_CODE, "code");

    delValue(STORAGE_KEYS.DISABLED);
    retireLegacyBattleRoundStorage();

    expect(getValue(STORAGE_KEYS.DISABLED, true)).toBeNull();
    expect(getValue("roundNow", true)).toBeNull();
    expect(getValue("roundAll", true)).toBeNull();
    expect(getValue("roundType", true)).toBeNull();
    expect(getValue(STORAGE_KEYS.BATTLE_CODE)).toBe("code");
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

describe("storage GM authority", () => {
  it.each([
    ["false", false],
    ["zero", 0],
    ["empty string", ""],
  ])("preserves an authoritative GM %s value over stale local storage", (_label, gmValue) => {
    localStorage.setItem("hvAA_storageFailureFixture", JSON.stringify("stale-local"));
    vi.stubGlobal("GM_getValue", () => gmValue);

    expect(getValue(STORAGE_FAILURE_FIXTURE_KEY, true)).toBe(gmValue);
    expect(mocks.runDiagnosticConsoleAutomation).not.toHaveBeenCalled();
  });

  it("uses local storage only when the GM key is absent", () => {
    localStorage.setItem("hvAA_storageFailureFixture", JSON.stringify({ migrated: true }));
    vi.stubGlobal("GM_getValue", () => undefined);

    expect(getValue(STORAGE_FAILURE_FIXTURE_KEY, true)).toEqual({ migrated: true });
  });
});
