import { afterEach, describe, expect, it, vi } from "vitest";
import { StorageWriteOutcome } from "./storage-io-policy.js";
import {
  readRiddleMlHealthStorage,
  writeRiddleMlHealthStorage,
} from "./riddle-ml-health-storage.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RMA-compatible health small-value storage", () => {
  it("skips an unchanged legacy GM value", async () => {
    const setValue = vi.fn();
    vi.stubGlobal(
      "GM_getValue",
      vi.fn(() => ({ down: false, maintenance: false }))
    );
    vi.stubGlobal("GM_setValue", setValue);

    await expect(
      writeRiddleMlHealthStorage("health", { maintenance: false, down: false })
    ).resolves.toBe(StorageWriteOutcome.SKIPPED_UNCHANGED);
    expect(setValue).not.toHaveBeenCalled();
  });

  it("supports the Promise GM API without changing the unprefixed key", async () => {
    const setValue = vi.fn(async () => undefined);
    vi.stubGlobal("GM_getValue", undefined);
    vi.stubGlobal("GM_setValue", undefined);
    vi.stubGlobal("GM", {
      getValue: vi.fn(async (_key, fallback) => fallback),
      setValue,
    });

    await expect(writeRiddleMlHealthStorage("is_down", true)).resolves.toBe(
      StorageWriteOutcome.WRITTEN
    );
    expect(setValue).toHaveBeenCalledWith("is_down", true);
    await expect(readRiddleMlHealthStorage("is_down", false)).resolves.toBe(false);
  });
});
