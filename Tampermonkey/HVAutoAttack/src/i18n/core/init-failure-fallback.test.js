import { afterEach, describe, expect, it, vi } from "vitest";
import { I18N_INIT_FAILURE_KEY, recordI18nInitFailure } from "./init-failure.js";

afterEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
});

describe("i18n init failure fallback", () => {
  it("returns init failure evidence when storage and console diagnostics both fail", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === I18N_INIT_FAILURE_KEY) throw new Error("quota");
      return Reflect.apply(Storage.prototype.setItem, this, [key, value]);
    });
    vi.spyOn(console, "error").mockImplementation(() => {
      throw new Error("console blocked");
    });

    expect(() => recordI18nInitFailure("interface", new Error("observer failed"))).not.toThrow();
    expect(recordI18nInitFailure("interface", new Error("observer failed"))).toMatchObject({
      capability: "i18nInit",
      entry: "interface",
      error: "observer failed",
    });
  });
});
