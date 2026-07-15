import { describe, expect, it, vi } from "vitest";
import { GameWorld } from "../core/ingress-identity.js";
import { selectWorldPolicy } from "../core/world-policy.js";
import { StorageWriteOutcome } from "../state/storage-io-policy.js";
import { createHvutStorageBridge, HVUT_DERIVED_FAMILIES } from "./hvut-storage-bridge.js";

describe("HVUT storage bridge", () => {
  it("keeps derived families out of the synchronous GM config authority", async () => {
    const config = { read: vi.fn(), write: vi.fn(), remove: vi.fn() };
    const derived = {
      run: vi.fn((event) => {
        if (event.type === "hydrate") return Promise.resolve({ outcome: "skippedPolicy" });
        if (event.type === "read") return { saved: true };
        return Promise.resolve({ outcome: StorageWriteOutcome.WRITTEN });
      }),
    };
    const bridge = createHvutStorageBridge(selectWorldPolicy(GameWorld.PERSISTENT), {
      config,
      derived,
    });

    expect(bridge.configSet("ml_log", [])).toBe(false);
    expect(config.write).not.toHaveBeenCalled();
    expect(bridge.derivedGet("ml_log", [])).toEqual({ saved: true });
    await expect(bridge.derivedSet("ml_log", [])).resolves.toBe(true);
    expect(HVUT_DERIVED_FAMILIES).toEqual([
      "equipdata",
      "ml_log",
      "ss_log",
      "ab_level",
      "tr_level",
    ]);
  });

  it("installs an immutable bridge before the sloppy runtime", () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, "HVAA_hvutStorage");
    expect(descriptor).toMatchObject({ configurable: false, writable: false });
    expect(Object.isFrozen(window.HVAA_hvutStorage)).toBe(true);
  });

  it("keeps shared persistent config authority when Isekai is active", () => {
    const config = { read: vi.fn(), write: vi.fn(), remove: vi.fn() };
    const persistentConfig = { read: vi.fn(), write: vi.fn(), remove: vi.fn() };
    const derived = { run: vi.fn() };
    const bridge = createHvutStorageBridge(selectWorldPolicy(GameWorld.ISEKAI), {
      config,
      persistentConfig,
      derived,
    });

    bridge.configGet("notification", null, "persistent");
    bridge.configSet("notification", { enabled: true }, "persistent");
    expect(persistentConfig.read).toHaveBeenCalledWith("notification", null);
    expect(persistentConfig.write).toHaveBeenCalledWith("notification", { enabled: true });
    expect(config.read).not.toHaveBeenCalled();
  });
});
