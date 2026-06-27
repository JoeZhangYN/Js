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
});
