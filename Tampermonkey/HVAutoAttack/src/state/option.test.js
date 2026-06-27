import { beforeEach, describe, expect, it } from "vitest";
import { clearOption, getOption, readOption, setOption, writeOption } from "./option.js";
import { getValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { g } from "./store.js";

beforeEach(() => {
  localStorage.clear();
  g("option", null);
});

describe("option persistence entry", () => {
  it("reads and writes the whole option through one entry", () => {
    writeOption({ version: "10.0", lang: "2" });

    expect(readOption()).toEqual({ version: "10.0", lang: "2" });
    expect(getValue(STORAGE_KEYS.OPTION, true)).toEqual({ version: "10.0", lang: "2" });
  });

  it("updates one field without dropping persisted fields", () => {
    writeOption({ version: "10.0", lang: "1", repair: true });
    g("option", null);

    setOption("lang", "2");

    expect(readOption()).toEqual({ version: "10.0", lang: "2", repair: true });
    expect(getOption("repair", false)).toBe(true);
  });

  it("clears runtime and persisted option", () => {
    writeOption({ version: "10.0", lang: "2" });

    clearOption();

    expect(readOption()).toBeNull();
    expect(getValue(STORAGE_KEYS.OPTION, true)).toBeNull();
  });
});
