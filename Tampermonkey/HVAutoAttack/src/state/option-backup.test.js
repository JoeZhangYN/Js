import { beforeEach, describe, expect, it } from "vitest";
import {
  deleteOptionBackup,
  readOptionBackups,
  restoreOptionBackup,
  saveCurrentOptionBackup,
} from "./option-backup.js";
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

    saveCurrentOptionBackup("main");

    expect(readOptionBackups()).toEqual({ main: { version: "10.0", lang: "2" } });
    expect(getValue(STORAGE_KEYS.BACKUP, true)).toEqual({
      main: { version: "10.0", lang: "2" },
    });
  });

  it("restores a saved option through the option entry", () => {
    writeOption({ version: "10.0", lang: "1" });
    saveCurrentOptionBackup("old");
    writeOption({ version: "10.0", lang: "2" });

    expect(restoreOptionBackup("old")).toBe(true);

    expect(readOption()).toEqual({ version: "10.0", lang: "1" });
  });

  it("deletes one backup without touching other backups", () => {
    writeOption({ version: "10.0", lang: "1" });
    saveCurrentOptionBackup("a");
    writeOption({ version: "10.0", lang: "2" });
    saveCurrentOptionBackup("b");

    expect(deleteOptionBackup("a")).toBe(true);

    expect(readOptionBackups()).toEqual({ b: { version: "10.0", lang: "2" } });
  });
});
