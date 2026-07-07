import { beforeEach, describe, expect, it } from "vitest";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { g } from "../state/store.js";
import { SettingsOptionCommandEvent, runSettingsOptionCommand } from "./option-command.js";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  delete globalThis.GM_setValue;
  g("option", null);
});

describe("settings option command entry", () => {
  it("exports and parses settings option payloads through one command entry", () => {
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", lang: "1" } });

    const text = runSettingsOptionCommand({ type: SettingsOptionCommandEvent.EXPORT_TEXT });
    const parsed = runSettingsOptionCommand({
      type: SettingsOptionCommandEvent.PARSE_IMPORT_TEXT,
      text,
    });

    expect(parsed).toEqual({
      ok: true,
      type: SettingsOptionCommandEvent.PARSE_IMPORT_TEXT,
      option: { version: "10.0", lang: "1" },
    });
  });

  it("returns an import format message without exposing parse details", () => {
    expect(
      runSettingsOptionCommand({
        type: SettingsOptionCommandEvent.PARSE_IMPORT_TEXT,
        text: "not json",
      })
    ).toMatchObject({
      ok: false,
      type: SettingsOptionCommandEvent.PARSE_IMPORT_TEXT,
      message: { l2: "Invalid configuration format" },
    });
  });

  it("returns typed write and clear results for settings commands", () => {
    expect(
      runSettingsOptionCommand({
        type: SettingsOptionCommandEvent.WRITE_OPTION,
        option: { version: "10.0", lang: "2" },
      })
    ).toMatchObject({ ok: true, type: SettingsOptionCommandEvent.WRITE_OPTION, reload: true });
    expect(runSettingsOptionCommand({ type: SettingsOptionCommandEvent.EXPORT_TEXT })).toBe(
      '{"version":"10.0","lang":"2"}'
    );

    expect(
      runSettingsOptionCommand({ type: SettingsOptionCommandEvent.CLEAR_OPTION })
    ).toMatchObject({ ok: true, type: SettingsOptionCommandEvent.CLEAR_OPTION });
    expect(runSettingsOptionCommand({ type: SettingsOptionCommandEvent.EXPORT_TEXT })).toBe("null");
  });

  it("does not claim settings option write success when persistence fails", () => {
    globalThis.GM_setValue = () => {
      throw new Error("option write blocked");
    };

    expect(
      runSettingsOptionCommand({
        type: SettingsOptionCommandEvent.WRITE_OPTION,
        option: { version: "10.0" },
      })
    ).toMatchObject({
      ok: false,
      type: SettingsOptionCommandEvent.WRITE_OPTION,
      reload: true,
      message: { l2: "Failed to save configuration" },
    });
  });

  it("returns typed language write results for settings language changes", () => {
    expect(
      runSettingsOptionCommand({
        type: SettingsOptionCommandEvent.WRITE_LANGUAGE,
        value: "2",
      })
    ).toMatchObject({ ok: true, type: SettingsOptionCommandEvent.WRITE_LANGUAGE, value: "2" });
    expect(runSettingsOptionCommand({ type: SettingsOptionCommandEvent.EXPORT_TEXT })).toBe(
      '{"lang":"2"}'
    );
  });

  it("does not claim language write success when persistence fails", () => {
    globalThis.GM_setValue = () => {
      throw new Error("language write blocked");
    };

    expect(
      runSettingsOptionCommand({
        type: SettingsOptionCommandEvent.WRITE_LANGUAGE,
        value: "1",
      })
    ).toMatchObject({
      ok: false,
      type: SettingsOptionCommandEvent.WRITE_LANGUAGE,
      value: "1",
      message: { l2: "Failed to save language" },
    });
  });

  it("fails closed for unknown settings option commands", () => {
    expect(runSettingsOptionCommand({ type: "unknown" })).toBeUndefined();
    expect(runSettingsOptionCommand(null)).toBeUndefined();
  });
});
