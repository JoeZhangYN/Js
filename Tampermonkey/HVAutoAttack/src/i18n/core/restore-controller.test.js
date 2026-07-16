import { beforeEach, describe, expect, it, vi } from "vitest";

async function freshController() {
  vi.resetModules();
  return import("./restore-controller.js");
}

beforeEach(() => {
  document.body.innerHTML = "";
  sessionStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function lastI18nRestoreFailure(key) {
  return JSON.parse(sessionStorage.getItem(key));
}

describe("restore-controller fallback handling", () => {
  it("gives shared custom entries precedence in forward and reverse translation", async () => {
    vi.stubGlobal("GM_getValue", () => ({
      schemaVersion: 1,
      entries: [{ group: "topMenu", source: "Stamina", zhCN: "体力" }],
    }));
    const { resolveEn, t } = await freshController();

    expect(t("Stamina", "topMenu")).toBe("体力");
    expect(resolveEn("体力", "topMenu")).toBe("Stamina");
  });

  it("continues restore callbacks when one restore handler throws", async () => {
    const { I18N_RESTORE_FAILURE_KEY, ensureRestoreButton, registerRestore } =
      await freshController();
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const failed = vi.fn(() => {
      throw new Error("restore failed");
    });
    const recovered = vi.fn();

    registerRestore(failed);
    registerRestore(recovered);
    ensureRestoreButton().click();

    expect(failed).toHaveBeenCalledOnce();
    expect(recovered).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledWith(
      "[HVAA][i18n] restore 回调出错:",
      expect.objectContaining({ message: "restore failed" })
    );
    expect(lastI18nRestoreFailure(I18N_RESTORE_FAILURE_KEY)).toMatchObject({
      capability: "i18nRestore",
      stage: "restore",
      error: "restore failed",
    });
    expect(document.getElementById("change-translate").innerHTML).toBe("中");
  });

  it("continues language switching when restore, retranslate, or render handlers throw", async () => {
    const {
      I18N_RESTORE_FAILURE_KEY,
      registerI18nRender,
      registerRestore,
      registerRetranslate,
      setLang,
    } = await freshController();
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const restored = vi.fn();
    const retranslated = vi.fn();
    const rendered = vi.fn();
    const node = document.createElement("span");
    document.body.appendChild(node);

    registerRestore(() => {
      throw new Error("restore failed");
    });
    registerRestore(restored);
    registerRetranslate(() => {
      throw new Error("retranslate failed");
    });
    registerRetranslate(retranslated);
    registerI18nRender(node, () => {
      rendered();
      node.textContent = "rendered";
    });

    setLang(0);

    expect(restored).toHaveBeenCalledOnce();
    expect(retranslated).toHaveBeenCalledOnce();
    expect(rendered).toHaveBeenCalledTimes(2);
    expect(node.textContent).toBe("rendered");
    expect(error).toHaveBeenCalledWith(
      "[HVAA][i18n] restore 回调出错:",
      expect.objectContaining({ message: "restore failed" })
    );
    expect(error).toHaveBeenCalledWith(
      "[HVAA][i18n] retranslate 回调出错:",
      expect.objectContaining({ message: "retranslate failed" })
    );
    expect(lastI18nRestoreFailure(I18N_RESTORE_FAILURE_KEY)).toMatchObject({
      capability: "i18nRestore",
      stage: "retranslate",
      error: "retranslate failed",
    });
  });

  it("keeps i18n failure evidence when diagnostic console is blocked", async () => {
    const { I18N_RESTORE_FAILURE_KEY, ensureRestoreButton, registerRestore } =
      await freshController();
    vi.spyOn(console, "error").mockImplementation(() => {
      throw new Error("console blocked");
    });
    const recovered = vi.fn();

    registerRestore(() => {
      throw new Error("restore blocked");
    });
    registerRestore(recovered);
    ensureRestoreButton().click();

    expect(recovered).toHaveBeenCalledOnce();
    expect(lastI18nRestoreFailure(I18N_RESTORE_FAILURE_KEY)).toMatchObject({
      capability: "i18nRestore",
      stage: "restore",
      error: "restore blocked",
    });
  });
});

describe("translated business identity resolution", () => {
  it("resolves a translated ability title element back to its registered English identity", async () => {
    const { registerTranslation, resolveEn } = await freshController();
    const title = document.createElement("div");
    const marker = document.createElement("span");
    const name = document.createTextNode("Ether Theft");
    title.append(marker, name);
    registerTranslation(name, name.data);
    name.data = "以太窃取";

    expect(resolveEn(title, "ability")).toBe("Ether Theft");
  });

  it("resolves a translated ability literal when no source node was registered", async () => {
    const { resolveEn } = await freshController();

    expect(resolveEn("体力值增幅", "ability")).toBe("HP Tank");
  });
});
