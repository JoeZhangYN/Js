import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(),
  setValue: vi.fn(),
}));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ INFO: "info", WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

vi.mock("./storage.js", async () => {
  const actual = await vi.importActual("./storage.js");
  return { ...actual, setValue: mocks.setValue };
});

import { AUTO_TUNE_FAILURE_KEY, AutoTuneEvent, runAutoTuneAutomation } from "./auto-tune.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { g } from "./store.js";
import { BattleTurnEvent, runBattleTurnAutomation } from "./battle-turn.js";
import { OptionEvent, runOptionAutomation } from "./option.js";

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.restoreAllMocks();
  mocks.setValue.mockReset();
  mocks.runDiagnosticConsoleAutomation.mockReset();
  mocks.setValue.mockImplementation((item, value) => {
    window.localStorage[`hvAA_${item}`] = typeof value === "string" ? value : JSON.stringify(value);
  });
  g("autoTunePotionCount", 0);
  runBattleTurnAutomation({ type: BattleTurnEvent.ROUND_STARTED });
  runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", autoTune: true } });
});

describe("auto-tune persistence failures", () => {
  it("does not advance auto-tune pad when history persistence fails", () => {
    mocks.setValue.mockImplementation(() => {
      throw new Error("auto-tune write blocked");
    });

    expect(runAutoTuneAutomation({ type: AutoTuneEvent.RECORD_BATTLE, potionsUsed: 2 })).toBe(
      false
    );

    expect(JSON.parse(window.sessionStorage.getItem(AUTO_TUNE_FAILURE_KEY))).toMatchObject({
      capability: "autoTune",
      stage: "record-history",
      storageKey: STORAGE_KEYS.AUTO_TUNE_HISTORY,
      failure: { kind: "storageWrite", error: "auto-tune write blocked" },
    });
    expect(mocks.runDiagnosticConsoleAutomation).toHaveBeenCalledWith({
      type: "warn",
      args: [
        "[HVAA] auto-tune persistence failed",
        expect.objectContaining({ capability: "autoTune", stage: "record-history" }),
      ],
    });
    expect(runAutoTuneAutomation({ type: AutoTuneEvent.READ_PAD })).toBe(1.3);
  });

  it("does not report auto-tune step success when pad persistence fails", () => {
    mocks.setValue.mockImplementation((item, value) => {
      if (item === STORAGE_KEYS.AUTO_TUNE_PAD) throw new Error("pad write blocked");
      window.localStorage[`hvAA_${item}`] =
        typeof value === "string" ? value : JSON.stringify(value);
    });

    for (let i = 0; i < 4; i++) {
      expect(runAutoTuneAutomation({ type: AutoTuneEvent.RECORD_BATTLE, potionsUsed: 2 })).toBe(
        true
      );
    }
    expect(runAutoTuneAutomation({ type: AutoTuneEvent.RECORD_BATTLE, potionsUsed: 2 })).toBe(
      false
    );

    expect(JSON.parse(window.sessionStorage.getItem(AUTO_TUNE_FAILURE_KEY))).toMatchObject({
      capability: "autoTune",
      stage: "explore-lower-pad",
      storageKey: STORAGE_KEYS.AUTO_TUNE_PAD,
      failure: { kind: "storageWrite", error: "pad write blocked" },
    });
    expect(runAutoTuneAutomation({ type: AutoTuneEvent.READ_PAD })).toBe(1.3);
  });

  it("does not throw when auto-tune failure evidence and diagnostic console both fail", () => {
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === AUTO_TUNE_FAILURE_KEY) throw new Error("session blocked");
      return Reflect.apply(originalSetItem, this, [key, value]);
    });
    mocks.runDiagnosticConsoleAutomation.mockImplementation(() => false);
    mocks.setValue.mockImplementation(() => {
      throw new Error("auto-tune write blocked");
    });

    expect(() =>
      runAutoTuneAutomation({ type: AutoTuneEvent.RECORD_BATTLE, potionsUsed: 2 })
    ).not.toThrow();
    expect(runAutoTuneAutomation({ type: AutoTuneEvent.RECORD_BATTLE, potionsUsed: 2 })).toBe(
      false
    );
  });
});
