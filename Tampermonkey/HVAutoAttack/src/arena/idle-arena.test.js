import { beforeEach, describe, expect, it } from "vitest";
import { IdleArenaEvent, runIdleArenaAutomation } from "./idle-arena.js";
import { getValue, setValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";

beforeEach(() => {
  localStorage.clear();
});

describe("runIdleArenaAutomation", () => {
  it("resets persisted idle arena progress through the entry", () => {
    setValue(STORAGE_KEYS.ARENA, { date: "today", done: ["1"] });

    runIdleArenaAutomation({ type: IdleArenaEvent.RESET_PROGRESS });

    expect(getValue(STORAGE_KEYS.ARENA, true)).toBeNull();
  });
});
