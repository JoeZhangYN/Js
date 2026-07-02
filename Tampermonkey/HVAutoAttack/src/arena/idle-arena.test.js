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

function currentUtcDateKey() {
  const date = new Date();
  return `${date.getUTCFullYear()}/${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}

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

  it("rejects unknown idle arena events without starting a battle", () => {
    vi.useFakeTimers();
    mocks.runOptionAutomation.mockImplementation((event) => {
      if (event.key === "idleArenaGrTime") return 0;
      if (event.key === "idleArenaValue") return "";
      return event.fallback;
    });

    expect(runIdleArenaAutomation({ type: "unknown" })).toBe(false);
    expect(runIdleArenaAutomation(null)).toBe(false);

    expect(mocks.runOptionAutomation).not.toHaveBeenCalled();
    expect(mocks.post).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("records token fetch request failures and stops waiting for all token pages", async () => {
    vi.useFakeTimers();
    const failure = { kind: "networkError", href: "?s=Battle&ss=gr", retries: 4 };
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.runOptionAutomation.mockImplementation((event) => {
      if (event.key === "idleArenaGrTime") return 0;
      return event.fallback;
    });
    mocks.post.mockImplementation((href, _success, _parm, _type, onFailure) => {
      if (href === "?s=Battle&ss=gr") onFailure(failure);
    });

    runIdleArenaAutomation({ type: IdleArenaEvent.START_NEXT_BATTLE });
    await vi.advanceTimersByTimeAsync(200);

    const arena = getValue(STORAGE_KEYS.ARENA, true);
    expect(arena.requestFailure).toEqual({
      source: "idleArena",
      stage: "token-fetch",
      failure,
    });
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastIdleArenaFailure"))).toMatchObject({
      source: "idleArena",
      stage: "token-fetch",
      failure,
    });
    expect(warn).toHaveBeenCalledWith(
      "[HVAA] idle arena request failed",
      expect.objectContaining({ stage: "token-fetch", failure })
    );
  });

  it("records battle start request failures without advancing arena progress", () => {
    const failure = { kind: "httpStatus", href: "?s=Battle&ss=ar", status: 500 };
    vi.spyOn(console, "warn").mockImplementation(() => {});
    setValue(STORAGE_KEYS.ARENA, {
      date: currentUtcDateKey(),
      gr: 0,
      done: [],
      token: { length: 4, postoken: "pt", 1: true },
    });
    mocks.runOptionAutomation.mockImplementation((event) => {
      if (event.key === "idleArenaValue") return "1";
      return event.fallback;
    });
    mocks.post.mockImplementation((_href, _success, _parm, _type, onFailure) =>
      onFailure(failure)
    );

    runIdleArenaAutomation({ type: IdleArenaEvent.START_NEXT_BATTLE });

    const arena = getValue(STORAGE_KEYS.ARENA, true);
    expect(arena.done).toEqual([]);
    expect(arena.requestFailure).toEqual({
      source: "idleArena",
      stage: "battle-start",
      failure,
    });
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastIdleArenaFailure"))).toMatchObject({
      source: "idleArena",
      stage: "battle-start",
      failure,
    });
  });
});
