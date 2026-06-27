import { beforeEach, describe, expect, it } from "vitest";
import { OptionBackupEvent, runOptionBackupAutomation } from "./option-backup.js";
import { readOption, writeOption } from "./option.js";
import { getValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { g } from "./store.js";

beforeEach(() => {
  localStorage.clear();
  g("option", null);
});

describe("option backup entry", () => {
  it("saves the current option under the requested code", () => {
    writeOption({ version: "10.0", lang: "2" });

    runOptionBackupAutomation({ type: OptionBackupEvent.SAVE_CURRENT, code: "main" });

    expect(runOptionBackupAutomation({ type: OptionBackupEvent.READ })).toEqual({
      main: { version: "10.0", lang: "2" },
    });
    expect(getValue(STORAGE_KEYS.BACKUP, true)).toEqual({
      main: { version: "10.0", lang: "2" },
    });
  });

  it("restores a saved option through the option entry", () => {
    writeOption({ version: "10.0", lang: "1" });
    runOptionBackupAutomation({ type: OptionBackupEvent.SAVE_CURRENT, code: "old" });
    writeOption({ version: "10.0", lang: "2" });

    expect(runOptionBackupAutomation({ type: OptionBackupEvent.RESTORE, code: "old" })).toBe(true);

    expect(readOption()).toEqual({ version: "10.0", lang: "1" });
  });

  it("deletes one backup without touching other backups", () => {
    writeOption({ version: "10.0", lang: "1" });
    runOptionBackupAutomation({ type: OptionBackupEvent.SAVE_CURRENT, code: "a" });
    writeOption({ version: "10.0", lang: "2" });
    runOptionBackupAutomation({ type: OptionBackupEvent.SAVE_CURRENT, code: "b" });

    expect(runOptionBackupAutomation({ type: OptionBackupEvent.DELETE, code: "a" })).toBe(true);

    expect(runOptionBackupAutomation({ type: OptionBackupEvent.READ })).toEqual({
      b: { version: "10.0", lang: "2" },
    });
  });
});
