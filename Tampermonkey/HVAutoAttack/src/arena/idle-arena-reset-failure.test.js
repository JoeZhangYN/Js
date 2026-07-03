import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IdleArenaEvent, runIdleArenaAutomation } from "./idle-arena.js";
import { IDLE_ARENA_FAILURE_KEY } from "./idle-arena-failure.js";

beforeEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("idle arena reset failure", () => {
  it("records reset progress storage deletion failure without throwing", () => {
    vi.stubGlobal(
      "GM_deleteValue",
      vi.fn(() => {
        throw new Error("arena delete blocked");
      })
    );
    vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(runIdleArenaAutomation({ type: IdleArenaEvent.RESET_PROGRESS })).toBe(false);

    expect(globalThis.GM_deleteValue).toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem(IDLE_ARENA_FAILURE_KEY))).toMatchObject({
      capability: "idleArena",
      source: "idleArena",
      stage: "reset-progress",
      failure: { kind: "storageDelete", error: "arena delete blocked" },
    });
  });
});
