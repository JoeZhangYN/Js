import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  OPTION_BACKUP_FAILURE_KEY,
  OptionBackupEvent,
  runOptionBackupAutomation,
} from "./option-backup.js";
import { OptionEvent, runOptionAutomation } from "./option.js";
import { getValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { g } from "./store.js";

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  delete globalThis.GM_setValue;
  g("option", null);
});

describe("option backup entry", () => {
  it("saves the current option under the requested code", () => {
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", lang: "2" } });

    runOptionBackupAutomation({ type: OptionBackupEvent.SAVE_CURRENT, code: "main" });

    expect(runOptionBackupAutomation({ type: OptionBackupEvent.READ })).toEqual({
      main: { version: "10.0", lang: "2" },
    });
    expect(getValue(STORAGE_KEYS.BACKUP, true)).toEqual({
      main: { version: "10.0", lang: "2" },
    });
  });

  it("restores a saved option through the option entry", () => {
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", lang: "1" } });
    runOptionBackupAutomation({ type: OptionBackupEvent.SAVE_CURRENT, code: "old" });
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", lang: "2" } });

    expect(runOptionBackupAutomation({ type: OptionBackupEvent.RESTORE, code: "old" })).toBe(true);

    expect(runOptionAutomation({ type: OptionEvent.READ })).toEqual({ version: "10.0", lang: "1" });
  });

  it("deletes one backup without touching other backups", () => {
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", lang: "1" } });
    runOptionBackupAutomation({ type: OptionBackupEvent.SAVE_CURRENT, code: "a" });
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", lang: "2" } });
    runOptionBackupAutomation({ type: OptionBackupEvent.SAVE_CURRENT, code: "b" });

    expect(runOptionBackupAutomation({ type: OptionBackupEvent.DELETE, code: "a" })).toBe(true);

    expect(runOptionBackupAutomation({ type: OptionBackupEvent.READ })).toEqual({
      b: { version: "10.0", lang: "2" },
    });
  });

  it("answers backup code existence and renders backup list items", () => {
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", lang: "1" } });
    runOptionBackupAutomation({ type: OptionBackupEvent.SAVE_CURRENT, code: "a" });
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", lang: "2" } });
    runOptionBackupAutomation({ type: OptionBackupEvent.SAVE_CURRENT, code: "b" });

    expect(runOptionBackupAutomation({ type: OptionBackupEvent.HAS_CODE, code: "a" })).toBe(true);
    expect(runOptionBackupAutomation({ type: OptionBackupEvent.HAS_CODE, code: "missing" })).toBe(
      false
    );
    expect(runOptionBackupAutomation({ type: OptionBackupEvent.RENDER_LIST_ITEMS })).toBe(
      "<li>a</li><li>b</li>"
    );
  });

  it("ignores invalid option backup events without changing stored backups", () => {
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", lang: "1" } });
    runOptionBackupAutomation({ type: OptionBackupEvent.SAVE_CURRENT, code: "a" });

    expect(runOptionBackupAutomation({ type: "unknown" })).toBeUndefined();
    expect(runOptionBackupAutomation(null)).toBeUndefined();
    expect(getValue(STORAGE_KEYS.BACKUP, true)).toEqual({ a: { version: "10.0", lang: "1" } });
  });

  it("does not report save success when backup persistence fails", () => {
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", lang: "1" } });
    globalThis.GM_setValue = () => {
      throw new Error("quota exceeded");
    };

    expect(
      runOptionBackupAutomation({ type: OptionBackupEvent.SAVE_CURRENT, code: "broken" })
    ).toBe(false);

    expect(JSON.parse(sessionStorage.getItem(OPTION_BACKUP_FAILURE_KEY))).toMatchObject({
      capability: "optionBackup",
      action: OptionBackupEvent.SAVE_CURRENT,
      reason: "writeFailed",
      code: "broken",
      error: "quota exceeded",
    });
  });

  it("does not report delete success when backup persistence fails", () => {
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", lang: "1" } });
    runOptionBackupAutomation({ type: OptionBackupEvent.SAVE_CURRENT, code: "saved" });
    globalThis.GM_setValue = () => {
      throw new Error("write blocked");
    };

    expect(runOptionBackupAutomation({ type: OptionBackupEvent.DELETE, code: "saved" })).toBe(
      false
    );

    expect(JSON.parse(sessionStorage.getItem(OPTION_BACKUP_FAILURE_KEY))).toMatchObject({
      capability: "optionBackup",
      action: OptionBackupEvent.DELETE,
      reason: "writeFailed",
      code: "saved",
      error: "write blocked",
    });
  });

  it("does not report restore success when option write fails", () => {
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", lang: "1" } });
    runOptionBackupAutomation({ type: OptionBackupEvent.SAVE_CURRENT, code: "saved" });
    globalThis.GM_setValue = () => {
      throw new Error("option write blocked");
    };

    expect(runOptionBackupAutomation({ type: OptionBackupEvent.RESTORE, code: "saved" })).toBe(
      false
    );

    expect(JSON.parse(sessionStorage.getItem(OPTION_BACKUP_FAILURE_KEY))).toMatchObject({
      capability: "optionBackup",
      action: OptionBackupEvent.RESTORE,
      reason: "restoreFailed",
      code: "saved",
      error: "option write blocked",
    });
  });

  it("fails closed and records evidence for malformed backup storage", () => {
    localStorage.hvAA_backup = JSON.stringify("not-an-object");

    expect(runOptionBackupAutomation({ type: OptionBackupEvent.READ })).toEqual({});
    expect(runOptionBackupAutomation({ type: OptionBackupEvent.HAS_CODE, code: "anything" })).toBe(
      false
    );
    expect(JSON.parse(sessionStorage.getItem(OPTION_BACKUP_FAILURE_KEY))).toMatchObject({
      capability: "optionBackup",
      action: OptionBackupEvent.READ,
      reason: "malformedBackupStore",
      storeType: "string",
    });
  });

  it("does not report save success when failure evidence and warning both fail", () => {
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", lang: "1" } });
    globalThis.GM_setValue = () => {
      throw new Error("quota");
    };
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === OPTION_BACKUP_FAILURE_KEY) throw new Error("evidence blocked");
      return Reflect.apply(Storage.prototype.setItem, this, [key, value]);
    });
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });

    expect(() =>
      runOptionBackupAutomation({ type: OptionBackupEvent.SAVE_CURRENT, code: "broken" })
    ).not.toThrow();
    expect(
      runOptionBackupAutomation({ type: OptionBackupEvent.SAVE_CURRENT, code: "broken" })
    ).toBe(false);
  });
});
