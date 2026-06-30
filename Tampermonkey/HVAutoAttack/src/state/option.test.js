import { beforeEach, describe, expect, it } from "vitest";
import { OptionEvent, runOptionAutomation } from "./option.js";
import { getValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { g } from "./store.js";

beforeEach(() => {
  localStorage.clear();
  g("option", null);
});

describe("option persistence entry", () => {
  it("reads and writes the whole option through one entry", () => {
    runOptionAutomation({
      type: OptionEvent.WRITE,
      option: { version: "10.0", lang: "2" },
    });

    expect(runOptionAutomation({ type: OptionEvent.READ })).toEqual({ version: "10.0", lang: "2" });
    expect(getValue(STORAGE_KEYS.OPTION, true)).toEqual({ version: "10.0", lang: "2" });
  });

  it("updates one field without dropping persisted fields", () => {
    runOptionAutomation({
      type: OptionEvent.WRITE,
      option: { version: "10.0", lang: "1", repair: true },
    });
    g("option", null);

    runOptionAutomation({ type: OptionEvent.WRITE_FIELD, key: "lang", value: "2" });

    expect(runOptionAutomation({ type: OptionEvent.READ })).toEqual({
      version: "10.0",
      lang: "2",
      repair: true,
    });
    expect(
      runOptionAutomation({ type: OptionEvent.READ_FIELD, key: "repair", fallback: false })
    ).toBe(true);
  });

  it("clears runtime and persisted option", () => {
    runOptionAutomation({
      type: OptionEvent.WRITE,
      option: { version: "10.0", lang: "2" },
    });

    runOptionAutomation({ type: OptionEvent.CLEAR });

    expect(runOptionAutomation({ type: OptionEvent.READ })).toBeNull();
    expect(getValue(STORAGE_KEYS.OPTION, true)).toBeNull();
  });

  it("owns default-on field checks", () => {
    runOptionAutomation({
      type: OptionEvent.WRITE,
      option: { version: "10.0", mlAnswer: undefined, riddleHelperUi: false },
    });

    expect(runOptionAutomation({ type: OptionEvent.IS_ON, key: "mlAnswer" })).toBe(true);
    expect(runOptionAutomation({ type: OptionEvent.IS_ON, key: "riddleHelperUi" })).toBe(false);
  });

  it("serves battle action options as a named business query", () => {
    runOptionAutomation({
      type: OptionEvent.WRITE,
      option: { version: "10.0", rules: true },
    });

    expect(runOptionAutomation({ type: OptionEvent.READ_BATTLE_ACTION_OPTIONS })).toEqual({
      version: "10.0",
      rules: true,
    });
  });

  it("syncs startup option version and runtime language through one command", () => {
    runOptionAutomation({
      type: OptionEvent.WRITE,
      option: { version: "9.9", lang: "2", repair: true },
    });

    expect(
      runOptionAutomation({
        type: OptionEvent.SYNC_STARTUP_OPTION,
        currentVersion: "10.0",
      })
    ).toEqual({
      configured: true,
      lang: "2",
      previousVersion: "9.9",
      currentVersion: "10.0",
      versionUpdated: true,
    });
    expect(g("lang")).toBe("2");
    expect(runOptionAutomation({ type: OptionEvent.READ })).toEqual({
      version: "10.0",
      lang: "2",
      repair: true,
    });
  });

  it("reports missing startup option without creating partial state", () => {
    expect(
      runOptionAutomation({
        type: OptionEvent.SYNC_STARTUP_OPTION,
        currentVersion: "10.0",
      })
    ).toEqual({ configured: false });
    expect(runOptionAutomation({ type: OptionEvent.READ })).toBeNull();
  });

  it("exports and parses option text through the entry", () => {
    runOptionAutomation({
      type: OptionEvent.WRITE,
      option: { version: "10.0", lang: "2" },
    });

    expect(runOptionAutomation({ type: OptionEvent.EXPORT_TEXT })).toBe(
      JSON.stringify({ version: "10.0", lang: "2" })
    );
    expect(
      runOptionAutomation({
        type: OptionEvent.PARSE_IMPORT_TEXT,
        text: '{"version":"10.0","lang":"1"}',
      })
    ).toEqual({ ok: true, option: { version: "10.0", lang: "1" } });
    expect(runOptionAutomation({ type: OptionEvent.PARSE_IMPORT_TEXT, text: "not json" })).toEqual({
      ok: false,
    });
  });

  it("rejects unknown option events without changing runtime or persisted option", () => {
    const option = { version: "10.0", lang: "2" };
    runOptionAutomation({ type: OptionEvent.WRITE, option });

    expect(runOptionAutomation({ type: "unknown", option: { version: "bad" } })).toBeUndefined();

    expect(g("option")).toBe(option);
    expect(getValue(STORAGE_KEYS.OPTION, true)).toEqual(option);
  });
});
