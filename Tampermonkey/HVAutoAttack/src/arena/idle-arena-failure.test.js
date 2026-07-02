import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IdleArenaEvent, runIdleArenaAutomation } from "./idle-arena.js";
import { getValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { IDLE_ARENA_FAILURE_KEY } from "./idle-arena-failure.js";

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  runOptionAutomation: vi.fn(),
}));

vi.mock("../dom/http.js", () => ({ post: mocks.post }));
vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.useFakeTimers();
  vi.restoreAllMocks();
  mocks.post.mockReset();
  mocks.runOptionAutomation.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("runIdleArenaAutomation failure fallback", () => {
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
});
