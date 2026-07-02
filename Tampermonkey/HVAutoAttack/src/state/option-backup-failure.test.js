import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  OPTION_BACKUP_FAILURE_KEY,
  OptionBackupEvent,
  runOptionBackupAutomation,
} from "./option-backup.js";
import { OptionEvent, runOptionAutomation } from "./option.js";
import { g } from "./store.js";

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  delete globalThis.GM_setValue;
  g("option", null);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("option backup failure fallback", () => {
  it("does not report restore success when failure evidence and warning both fail", () => {
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", lang: "1" } });
    runOptionBackupAutomation({ type: OptionBackupEvent.SAVE_CURRENT, code: "saved" });
    globalThis.GM_setValue = () => {
      throw new Error("option write blocked");
    };
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === OPTION_BACKUP_FAILURE_KEY) throw new Error("evidence blocked");
      return Reflect.apply(Storage.prototype.setItem, this, [key, value]);
    });
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });

    let result;
    expect(() => {
      result = runOptionBackupAutomation({ type: OptionBackupEvent.RESTORE, code: "saved" });
    }).not.toThrow();
    expect(result).toBe(false);
  });
});
