import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  setValue: vi.fn(),
  delValue: vi.fn(),
}));

vi.mock("./storage.js", async () => {
  const actual = await vi.importActual("./storage.js");
  return { ...actual, setValue: mocks.setValue, delValue: mocks.delValue };
});

import { RiddleLogEvent, runRiddleLogAutomation } from "./riddle-log.js";
import { RIDDLE_LOG_FAILURE_KEY } from "./riddle-log-failure.js";
import { RiddleStatsEvent, runRiddleStatsAutomation } from "./riddle-stats.js";
import { RIDDLE_STATS_FAILURE_KEY } from "./riddle-stats-failure.js";

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.restoreAllMocks();
  mocks.setValue.mockReset();
  mocks.delValue.mockReset();
  mocks.setValue.mockImplementation((item, value) => {
    window.localStorage[`hvAA_${item}`] = typeof value === "string" ? value : JSON.stringify(value);
  });
  mocks.delValue.mockImplementation((item) => {
    window.localStorage.removeItem(`hvAA_${item}`);
  });
});

describe("riddle stats persistence failures", () => {
  it("does not log riddle detail when stats write fails", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.setValue.mockImplementation(() => {
      throw new Error("riddle stats write blocked");
    });

    expect(
      runRiddleStatsAutomation({ type: RiddleStatsEvent.RECORD_DETAIL, detail: "blocked" })
    ).toBe(false);

    expect(JSON.parse(window.sessionStorage.getItem(RIDDLE_STATS_FAILURE_KEY))).toMatchObject({
      capability: "riddleStats",
      stage: "record-detail",
      failure: { kind: "storageWrite", error: "riddle stats write blocked" },
    });
    expect(runRiddleLogAutomation({ type: RiddleLogEvent.READ })).toEqual([]);
  });

  it("does not report riddle stats reset success when storage delete fails", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.delValue.mockImplementation(() => {
      throw new Error("riddle stats delete blocked");
    });

    expect(runRiddleStatsAutomation({ type: RiddleStatsEvent.RESET })).toBe(false);

    expect(JSON.parse(window.sessionStorage.getItem(RIDDLE_STATS_FAILURE_KEY))).toMatchObject({
      capability: "riddleStats",
      stage: "reset",
      failure: { kind: "storageWrite", error: "riddle stats delete blocked" },
    });
  });

  it("does not report riddle stats record success when evidence log write fails", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.setValue.mockImplementation((item, value) => {
      if (item === "riddleLog") throw new Error("riddle log write blocked");
      window.localStorage[`hvAA_${item}`] =
        typeof value === "string" ? value : JSON.stringify(value);
    });

    expect(runRiddleStatsAutomation({ type: RiddleStatsEvent.RECORD_APPEAR })).toBe(false);

    expect(runRiddleStatsAutomation({ type: RiddleStatsEvent.READ }).appear).toBe(1);
    expect(JSON.parse(window.sessionStorage.getItem(RIDDLE_LOG_FAILURE_KEY))).toMatchObject({
      capability: "riddleLog",
      stage: "persist",
      failure: { kind: "storageWrite", error: "riddle log write blocked" },
    });
  });

  it("does not throw when riddle stats failure evidence and warning both fail", () => {
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === RIDDLE_STATS_FAILURE_KEY) throw new Error("session blocked");
      return Reflect.apply(originalSetItem, this, [key, value]);
    });
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });
    mocks.setValue.mockImplementation(() => {
      throw new Error("riddle stats write blocked");
    });

    expect(() => runRiddleStatsAutomation({ type: RiddleStatsEvent.RECORD_APPEAR })).not.toThrow();
    expect(runRiddleStatsAutomation({ type: RiddleStatsEvent.RECORD_APPEAR })).toBe(false);
  });
});
