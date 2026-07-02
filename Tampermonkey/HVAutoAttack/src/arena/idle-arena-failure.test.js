import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IdleArenaEvent, runIdleArenaAutomation } from "./idle-arena.js";
import { getValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { IDLE_ARENA_FAILURE_KEY } from "./idle-arena-failure.js";

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  runOptionAutomation: vi.fn(),
  setValue: vi.fn(),
}));

vi.mock("../dom/http.js", () => ({ post: mocks.post }));
vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));
vi.mock("../state/storage.js", async () => {
  const actual = await vi.importActual("../state/storage.js");
  return { ...actual, setValue: mocks.setValue };
});

beforeEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  sessionStorage.clear();
  vi.useFakeTimers();
  vi.restoreAllMocks();
  mocks.post.mockReset();
  mocks.runOptionAutomation.mockReset();
  mocks.setValue.mockReset();
  mocks.setValue.mockImplementation((item, value) => {
    window.localStorage[`hvAA_${item}`] =
      typeof value === "string" ? value : JSON.stringify(value);
  });
  delete globalThis.GM_setValue;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("runIdleArenaAutomation failure fallback", () => {
  function currentUtcDateKey() {
    const date = new Date();
    return `${date.getUTCFullYear()}/${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
  }

  function tokenDoc() {
    return new DOMParser().parseFromString(
      '<form><input name="postoken" value="pt"></form><img src="startchallenge.png" onclick="init_battle(1)">',
      "text/html"
    );
  }

  it("records token fetch failure without continuing when diagnostics are blocked", async () => {
    const failure = { kind: "networkError", href: "?s=Battle&ss=gr", retries: 4 };
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === IDLE_ARENA_FAILURE_KEY) throw new Error("quota");
      return Reflect.apply(Storage.prototype.setItem, this, [key, value]);
    });
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });
    mocks.runOptionAutomation.mockImplementation((event) => {
      if (event.key === "idleArenaGrTime") return 0;
      return event.fallback;
    });
    mocks.post.mockImplementation((href, _success, _parm, _type, onFailure) => {
      if (href === "?s=Battle&ss=gr") onFailure(failure);
    });

    runIdleArenaAutomation({ type: IdleArenaEvent.START_NEXT_BATTLE });
    await vi.advanceTimersByTimeAsync(200);

    expect(getValue(STORAGE_KEYS.ARENA, true).requestFailure).toMatchObject({
      capability: "idleArena",
      source: "idleArena",
      stage: "token-fetch",
      failure,
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("records token persistence failure without scheduling a battle retry", async () => {
    mocks.setValue.mockImplementation(() => {
      throw new Error("arena write blocked");
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.runOptionAutomation.mockImplementation((event) => {
      if (event.key === "idleArenaGrTime") return 0;
      return event.fallback;
    });
    mocks.post.mockImplementation((href, success) =>
      success(tokenDoc(), { target: { responseURL: href } })
    );

    runIdleArenaAutomation({ type: IdleArenaEvent.START_NEXT_BATTLE });
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(200);

    expect(mocks.setValue).toHaveBeenCalled();
    expect(mocks.setValue.mock.results.some((result) => result.type === "throw")).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    expect(console.warn).toHaveBeenCalledWith(
      "[HVAA] idle arena request failed",
      expect.objectContaining({ stage: "token-persist" })
    );
  });

  it("records battle-start progress persistence failure without throwing from callback", () => {
    localStorage.setItem(
      "hvAA_arena",
      JSON.stringify({
        date: currentUtcDateKey(),
        gr: 0,
        done: [],
        token: { length: 4, postoken: "pt", 1: true },
      })
    );
    mocks.setValue.mockImplementation(() => {
      throw new Error("arena write blocked");
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.runOptionAutomation.mockImplementation((event) => {
      if (event.key === "idleArenaValue") return "1";
      return event.fallback;
    });
    mocks.post.mockImplementation((_href, success) => success());

    expect(() =>
      runIdleArenaAutomation({ type: IdleArenaEvent.START_NEXT_BATTLE })
    ).not.toThrow();
    expect(mocks.setValue).toHaveBeenCalled();
    expect(mocks.setValue.mock.results.some((result) => result.type === "throw")).toBe(true);
    expect(console.warn).toHaveBeenCalledWith(
      "[HVAA] idle arena request failed",
      expect.objectContaining({ stage: "battle-start-persist" })
    );
  });
});
