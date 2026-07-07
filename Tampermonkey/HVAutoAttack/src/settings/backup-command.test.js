import { beforeEach, describe, expect, it } from "vitest";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { OPTION_BACKUP_FAILURE_KEY } from "../state/option-backup.js";
import { g } from "../state/store.js";
import { SettingsBackupCommandEvent, runSettingsBackupCommand } from "./backup-command.js";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  delete globalThis.GM_setValue;
  g("option", null);
});

describe("settings backup command entry", () => {
  it("renders and checks backup choices through the settings command entry", () => {
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", lang: "1" } });
    expect(
      runSettingsBackupCommand({ type: SettingsBackupCommandEvent.SAVE_CURRENT, code: "main" }).ok
    ).toBe(true);

    expect(
      runSettingsBackupCommand({ type: SettingsBackupCommandEvent.HAS_CODE, code: "main" })
    ).toBe(true);
    expect(
      runSettingsBackupCommand({ type: SettingsBackupCommandEvent.RENDER_LIST_ITEMS })
    ).toBe("<li>main</li>");
  });

  it("returns typed save, delete, and restore command results", () => {
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", lang: "1" } });

    expect(runSettingsBackupCommand({ type: SettingsBackupCommandEvent.SAVE_CURRENT, code: "a" }))
      .toMatchObject({ ok: true, type: SettingsBackupCommandEvent.SAVE_CURRENT, code: "a" });
    expect(runSettingsBackupCommand({ type: SettingsBackupCommandEvent.DELETE, code: "a" }))
      .toMatchObject({ ok: true, type: SettingsBackupCommandEvent.DELETE, code: "a" });
    expect(
      runSettingsBackupCommand({ type: SettingsBackupCommandEvent.RENDER_LIST_ITEMS })
    ).toBe("");

    runSettingsBackupCommand({ type: SettingsBackupCommandEvent.SAVE_CURRENT, code: "restore" });
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", lang: "2" } });

    expect(runSettingsBackupCommand({ type: SettingsBackupCommandEvent.RESTORE, code: "restore" }))
      .toMatchObject({ ok: true, type: SettingsBackupCommandEvent.RESTORE, code: "restore" });
  });

  it("preserves failure messages without claiming backup command success", () => {
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", lang: "1" } });
    globalThis.GM_setValue = () => {
      throw new Error("quota");
    };

    expect(runSettingsBackupCommand({ type: SettingsBackupCommandEvent.SAVE_CURRENT, code: "bad" }))
      .toMatchObject({
        ok: false,
        type: SettingsBackupCommandEvent.SAVE_CURRENT,
        code: "bad",
        message: { l2: "Failed to backup configuration" },
      });
    expect(JSON.parse(sessionStorage.getItem(OPTION_BACKUP_FAILURE_KEY))).toMatchObject({
      capability: "optionBackup",
      action: "saveCurrent",
      reason: "writeFailed",
      code: "bad",
      error: "quota",
    });
  });

  it("fails closed for unknown backup commands", () => {
    expect(runSettingsBackupCommand({ type: "unknown" })).toBeUndefined();
    expect(runSettingsBackupCommand(null)).toBeUndefined();
  });
});
