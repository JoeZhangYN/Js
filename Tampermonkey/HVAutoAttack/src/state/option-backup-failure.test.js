import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(),
}));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

import {
  OPTION_BACKUP_FAILURE_KEY,
  OptionBackupEvent,
  runOptionBackupAutomation,
} from "./option-backup.js";
import { OptionEvent, runOptionAutomation } from "./option.js";
import { g } from "./store.js";

beforeEach(() => {
  vi.restoreAllMocks();
  mocks.runDiagnosticConsoleAutomation.mockReset();
  localStorage.clear();
  sessionStorage.clear();
  delete globalThis.GM_setValue;
  g("option", null);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("option backup failure fallback", () => {
  it("does not report save success when failure evidence and diagnostic console both fail", () => {
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", lang: "1" } });
    globalThis.GM_setValue = () => {
      throw new Error("quota");
    };
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === OPTION_BACKUP_FAILURE_KEY) throw new Error("evidence blocked");
      return Reflect.apply(originalSetItem, this, [key, value]);
    });
    mocks.runDiagnosticConsoleAutomation.mockImplementation(() => false);

    let result;
    expect(() => {
      result = runOptionBackupAutomation({ type: OptionBackupEvent.SAVE_CURRENT, code: "broken" });
    }).not.toThrow();
    expect(result).toBe(false);
  });

  it("does not report restore success when failure evidence and diagnostic console both fail", () => {
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", lang: "1" } });
    runOptionBackupAutomation({ type: OptionBackupEvent.SAVE_CURRENT, code: "saved" });
    globalThis.GM_setValue = () => {
      throw new Error("option write blocked");
    };
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === OPTION_BACKUP_FAILURE_KEY) throw new Error("evidence blocked");
      return Reflect.apply(originalSetItem, this, [key, value]);
    });
    mocks.runDiagnosticConsoleAutomation.mockImplementation(() => false);

    let result;
    expect(() => {
      result = runOptionBackupAutomation({ type: OptionBackupEvent.RESTORE, code: "saved" });
    }).not.toThrow();
    expect(result).toBe(false);
  });

  it("does not report delete success when failure evidence and diagnostic console both fail", () => {
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", lang: "1" } });
    runOptionBackupAutomation({ type: OptionBackupEvent.SAVE_CURRENT, code: "saved" });
    globalThis.GM_setValue = () => {
      throw new Error("backup write blocked");
    };
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === OPTION_BACKUP_FAILURE_KEY) throw new Error("evidence blocked");
      return Reflect.apply(originalSetItem, this, [key, value]);
    });
    mocks.runDiagnosticConsoleAutomation.mockImplementation(() => false);

    let result;
    expect(() => {
      result = runOptionBackupAutomation({ type: OptionBackupEvent.DELETE, code: "saved" });
    }).not.toThrow();
    expect(result).toBe(false);
  });
});
