import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IdleArenaEvent, runIdleArenaAutomation } from "./idle-arena.js";
import { getValue, setValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  runOptionAutomation: vi.fn(),
}));

vi.mock("../dom/http.js", () => ({ post: mocks.post }));
vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({
    READ_FIELD: "readField",
  }),
  runOptionAutomation: mocks.runOptionAutomation,
}));

beforeEach(() => {
  localStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
  mocks.post.mockReset();
  mocks.runOptionAutomation.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("runIdleArenaAutomation", () => {
  it("schedules the next battle from the option entry", () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    mocks.runOptionAutomation.mockImplementation((event) =>
      event.key === "idleArenaTime" ? 10 : event.fallback
    );

    runIdleArenaAutomation({ type: IdleArenaEvent.SCHEDULE_NEXT_BATTLE });

    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "idleArenaTime",
      fallback: 0,
    });
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(9999);
    expect(mocks.runOptionAutomation).toHaveBeenCalledTimes(1);
  });

  it("resets persisted idle arena progress through the entry", () => {
    setValue(STORAGE_KEYS.ARENA, { date: "today", done: ["1"] });

    runIdleArenaAutomation({ type: IdleArenaEvent.RESET_PROGRESS });

    expect(getValue(STORAGE_KEYS.ARENA, true)).toBeNull();
  });

  it("falls back to starting the next battle for unknown events", () => {
    vi.useFakeTimers();
    mocks.runOptionAutomation.mockImplementation((event) => {
      if (event.key === "idleArenaGrTime") return 0;
      if (event.key === "idleArenaValue") return "";
      return event.fallback;
    });

    runIdleArenaAutomation({ type: "unknown" });

    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "idleArenaGrTime",
      fallback: 0,
    });
    expect(mocks.post).toHaveBeenCalledTimes(4);
  });
});
