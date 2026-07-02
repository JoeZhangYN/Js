import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { RiddleMlEvent, runRiddleMlAutomation } from "./riddle-ml.js";

const mocks = vi.hoisted(() => ({
  gmXhr: vi.fn(),
  runAlarmAutomation: vi.fn(),
  runRiddleImageAutomation: vi.fn(),
  runRiddleStatsAutomation: vi.fn(),
}));

vi.mock("../dom/gm-xhr.js", () => ({
  gmXhr: mocks.gmXhr,
  hasNonLatin1: (value) => [...value].some((char) => char.charCodeAt(0) > 255),
}));

vi.mock("../alarm/alarm.js", () => ({
  AlarmEvent: Object.freeze({ TRIGGER: "trigger" }),
  runAlarmAutomation: mocks.runAlarmAutomation,
}));

vi.mock("../state/riddle-stats.js", () => ({
  RiddleStatsEvent: Object.freeze({
    RECORD_DETAIL: "recordDetail",
    RECORD_OUTCOME: "recordOutcome",
  }),
  runRiddleStatsAutomation: mocks.runRiddleStatsAutomation,
}));

vi.mock("./riddle-image.js", () => ({
  RiddleImageEvent: Object.freeze({ PREPARE_ML_PAYLOAD: "prepareMlPayload" }),
  runRiddleImageAutomation: mocks.runRiddleImageAutomation,
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  runOptionAutomation({ type: OptionEvent.CLEAR });
  vi.clearAllMocks();
  mocks.runRiddleImageAutomation.mockResolvedValue({ blob: { size: 12 } });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("riddle ML request fallback", () => {
  it("resolves to random fallback when ML onload response handling throws", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console hook failed");
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.gmXhr.mockImplementation(({ onload }) => {
      onload({
        status: 200,
        responseText: JSON.stringify({ return: "good", answer: "ts" }),
        responseHeaders: "x-ratelimit-remaining: 1",
      });
    });

    await expect(runRiddleMlAutomation({ type: RiddleMlEvent.TRY_ANSWER })).resolves.toBeNull();

    expect(mocks.runRiddleStatsAutomation).toHaveBeenCalledWith(
      expect.objectContaining({ type: "recordDetail", detail: "onload_exception console hook failed" })
    );
    expect(mocks.runRiddleStatsAutomation).toHaveBeenCalledWith({
      type: "recordOutcome",
      outcome: "exception",
    });
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastRiddleMlAnswerFailure"))).toMatchObject({
      capability: "riddleMlAnswer",
      stage: "request",
      reason: "exception",
      fallback: "random",
    });
    expect(mocks.runAlarmAutomation).toHaveBeenCalledWith({ type: "trigger", kind: "Error" });
  });

  it("classifies ML POST transport errors and resolves to random fallback", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mocks.gmXhr.mockImplementation(({ onerror }) => {
      onerror({ status: 0, statusText: "CORS blocked" });
    });

    await expect(runRiddleMlAutomation({ type: RiddleMlEvent.TRY_ANSWER })).resolves.toBeNull();

    expect(mocks.runRiddleStatsAutomation).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "recordDetail",
        detail: expect.stringContaining("onerror status=0"),
      })
    );
    expect(mocks.runRiddleStatsAutomation).toHaveBeenCalledWith({
      type: "recordOutcome",
      outcome: "onerror",
    });
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastRiddleMlAnswerFailure"))).toMatchObject({
      capability: "riddleMlAnswer",
      stage: "request",
      reason: "onerror",
      fallback: "random",
    });
    expect(mocks.runAlarmAutomation).toHaveBeenCalledWith({ type: "trigger", kind: "Error" });
  });

  it("classifies ML POST timeouts and resolves to random fallback", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mocks.gmXhr.mockImplementation(({ ontimeout }) => {
      ontimeout();
    });

    await expect(runRiddleMlAutomation({ type: RiddleMlEvent.TRY_ANSWER })).resolves.toBeNull();

    expect(mocks.runRiddleStatsAutomation).toHaveBeenCalledWith({
      type: "recordDetail",
      detail: "timeout (>12s)",
    });
    expect(mocks.runRiddleStatsAutomation).toHaveBeenCalledWith({
      type: "recordOutcome",
      outcome: "timeout",
    });
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastRiddleMlAnswerFailure"))).toMatchObject({
      capability: "riddleMlAnswer",
      stage: "request",
      reason: "timeout",
      fallback: "random",
    });
    expect(mocks.runAlarmAutomation).toHaveBeenCalledWith({ type: "trigger", kind: "Error" });
  });

  it("keeps duplicate ML requests random when fallback evidence and warning both fail", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === "HVAA:lastRiddleMlAnswerFailure") throw new Error("quota");
      return Reflect.apply(Storage.prototype.setItem, this, [key, value]);
    });
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });
    mocks.gmXhr.mockImplementation(() => {});

    runRiddleMlAutomation({ type: RiddleMlEvent.TRY_ANSWER });
    await Promise.resolve();

    await expect(runRiddleMlAutomation({ type: RiddleMlEvent.TRY_ANSWER })).resolves.toBeNull();
  });
});
