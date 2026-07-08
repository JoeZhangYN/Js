import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  setValue: vi.fn(),
  delValue: vi.fn(),
}));

vi.mock("./storage.js", async () => {
  const actual = await vi.importActual("./storage.js");
  return { ...actual, setValue: mocks.setValue, delValue: mocks.delValue };
});

import { OptionEvent, runOptionAutomation } from "./option.js";
import { OPTION_FAILURE_KEY } from "./option-failure.js";
import { g } from "./store.js";

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.restoreAllMocks();
  mocks.setValue.mockReset();
  mocks.delValue.mockReset();
  mocks.setValue.mockImplementation((item, value) => {
    window.localStorage[`hvAA_${item}`] = typeof value === "string" ? value : JSON.stringify(value);
  });
  mocks.delValue.mockImplementation((item) => {
    window.localStorage.removeItem(`hvAA_${item}`);
  });
  g("option", null);
});

describe("option persistence failures", () => {
  it("does not update runtime option when option write fails", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.setValue.mockImplementation(() => {
      throw new Error("option write blocked");
    });

    expect(
      runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", lang: "2" } })
    ).toBe(false);

    expect(g("option")).toBeNull();
    expect(JSON.parse(window.sessionStorage.getItem(OPTION_FAILURE_KEY))).toMatchObject({
      capability: "option",
      stage: "write",
      failure: { kind: "storageWrite", error: "option write blocked" },
    });
  });

  it("does not mutate existing runtime option when single field write fails", () => {
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", lang: "1" } });
    mocks.setValue.mockImplementation(() => {
      throw new Error("option write blocked");
    });

    expect(runOptionAutomation({ type: OptionEvent.WRITE_FIELD, key: "lang", value: "2" })).toBe(
      false
    );

    expect(g("option")).toEqual({ version: "10.0", lang: "1" });
  });

  it("does not mutate runtime option when startup version persistence fails", () => {
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "9.9", lang: "1" } });
    mocks.setValue.mockImplementation(() => {
      throw new Error("option write blocked");
    });

    expect(
      runOptionAutomation({
        type: OptionEvent.SYNC_STARTUP_OPTION,
        currentVersion: "10.0",
      })
    ).toEqual({
      configured: false,
      reason: "optionPersistenceFailed",
      previousVersion: "9.9",
      currentVersion: "10.0",
    });

    expect(g("option")).toEqual({ version: "9.9", lang: "1" });
    expect(g("lang")).toBeUndefined();
  });

  it("does not clear runtime option when option delete fails", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", lang: "1" } });
    mocks.delValue.mockImplementation(() => {
      throw new Error("option delete blocked");
    });

    expect(runOptionAutomation({ type: OptionEvent.CLEAR })).toBe(false);

    expect(g("option")).toEqual({ version: "10.0", lang: "1" });
    expect(JSON.parse(window.sessionStorage.getItem(OPTION_FAILURE_KEY))).toMatchObject({
      capability: "option",
      stage: "clear",
      failure: { kind: "storageWrite", error: "option delete blocked" },
    });
  });

  it("does not throw when option failure evidence and warning both fail", () => {
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === OPTION_FAILURE_KEY) throw new Error("session blocked");
      return Reflect.apply(originalSetItem, this, [key, value]);
    });
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });
    mocks.setValue.mockImplementation(() => {
      throw new Error("option write blocked");
    });

    expect(() =>
      runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0" } })
    ).not.toThrow();
    expect(runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0" } })).toBe(
      false
    );
  });
});
