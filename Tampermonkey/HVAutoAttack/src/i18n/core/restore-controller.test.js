import { beforeEach, describe, expect, it, vi } from "vitest";

async function freshController() {
  vi.resetModules();
  return import("./restore-controller.js");
}

beforeEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("restore-controller fallback handling", () => {
  it("continues restore callbacks when one restore handler throws", async () => {
    const { ensureRestoreButton, registerRestore } = await freshController();
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
    expect(document.getElementById("change-translate").innerHTML).toBe("中");
  });

  it("continues language switching when restore, retranslate, or render handlers throw", async () => {
    const {
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
  });
});
