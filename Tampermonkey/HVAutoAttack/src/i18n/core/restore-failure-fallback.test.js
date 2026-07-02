import { afterEach, describe, expect, it, vi } from "vitest";
import { I18N_RESTORE_FAILURE_KEY, recordI18nRestoreFailure } from "./restore-failure.js";

afterEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
});

describe("i18n restore failure fallback", () => {
  it("returns restore failure evidence when storage and console diagnostics both fail", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === I18N_RESTORE_FAILURE_KEY) throw new Error("quota");
      return Reflect.apply(Storage.prototype.setItem, this, [key, value]);
    });
    vi.spyOn(console, "error").mockImplementation(() => {
      throw new Error("console blocked");
    });

    expect(() => recordI18nRestoreFailure("restore", new Error("restore failed"))).not.toThrow();
    expect(recordI18nRestoreFailure("restore", new Error("restore failed"))).toMatchObject({
      capability: "i18nRestore",
      stage: "restore",
      error: "restore failed",
    });
  });
});
