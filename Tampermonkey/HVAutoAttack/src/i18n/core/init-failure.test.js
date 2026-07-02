import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18N_INIT_FAILURE_KEY, recordI18nInitFailure } from "./init-failure.js";

beforeEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

function lastI18nInitFailure() {
  return JSON.parse(sessionStorage.getItem(I18N_INIT_FAILURE_KEY));
}

describe("i18n init failure evidence", () => {
  it("persists i18n init failure evidence by entry", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    recordI18nInitFailure("interface", new Error("observer failed"));

    expect(lastI18nInitFailure()).toMatchObject({
      capability: "i18nInit",
      entry: "interface",
      error: "observer failed",
    });
  });

  it("keeps i18n init failure evidence when diagnostic console is blocked", () => {
    vi.spyOn(console, "error").mockImplementation(() => {
      throw new Error("console blocked");
    });

    recordI18nInitFailure("equip", new Error("translation failed"));

    expect(lastI18nInitFailure()).toMatchObject({
      capability: "i18nInit",
      entry: "equip",
      error: "translation failed",
    });
  });
});
