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
  runOptionAutomation({ type: OptionEvent.CLEAR });
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function expectAnswerFailure(reason) {
  expect(JSON.parse(sessionStorage.getItem("HVAA:lastRiddleMlAnswerFailure"))).toMatchObject({
    capability: "riddleMlAnswer",
    stage: reason === "disabled" ? "option" : "request",
    reason,
    fallback: "random",
  });
}

describe("riddle ML entry", () => {
  it("rejects unknown and null ML events without starting health checks or answering", () => {
    const readOption = vi.spyOn(Storage.prototype, "getItem");

    expect(runRiddleMlAutomation({ type: "unknown" })).toBeUndefined();
    expect(runRiddleMlAutomation(null)).toBeUndefined();

    expect(vi.getTimerCount()).toBe(0);
    expect(readOption).not.toHaveBeenCalled();
    expect(mocks.runRiddleImageAutomation).not.toHaveBeenCalled();
    expect(mocks.gmXhr).not.toHaveBeenCalled();
  });

  it("starts the health check timer through the entry only once", () => {
    expect(runRiddleMlAutomation({ type: RiddleMlEvent.START_HEALTH })).toBe(true);
    expect(runRiddleMlAutomation({ type: RiddleMlEvent.START_HEALTH })).toBe(true);

    expect(vi.getTimerCount()).toBe(1);
  });

  it("skips ML answering when the option entry reports mlAnswer disabled", async () => {
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", mlAnswer: false } });

    await expect(runRiddleMlAutomation({ type: RiddleMlEvent.TRY_ANSWER })).resolves.toBeNull();
    expectAnswerFailure("disabled");
    expect(mocks.runRiddleImageAutomation).not.toHaveBeenCalled();
    expect(mocks.gmXhr).not.toHaveBeenCalled();
  });

  it("runs the ML answer attempt as payload, request, and outcome flow", async () => {
    runOptionAutomation({
      type: OptionEvent.WRITE,
      option: { version: "10.0", mlEndpoint: "https://ml.example/answer", mlApiKey: "key" },
    });
    mocks.runRiddleImageAutomation.mockResolvedValue({ blob: { size: 12 } });
    mocks.gmXhr.mockImplementation(({ onload }) => {
      onload({
        status: 200,
        responseText: JSON.stringify({ return: "good", answer: ["ts", "ra"] }),
        responseHeaders: "x-ratelimit-remaining: 9",
      });
    });

    await expect(runRiddleMlAutomation({ type: RiddleMlEvent.TRY_ANSWER })).resolves.toEqual(["ts", "ra"]);

    expect(mocks.runRiddleImageAutomation).toHaveBeenCalledWith({ type: "prepareMlPayload" });
    expect(mocks.gmXhr).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: "https://ml.example/answer",
        data: { size: 12 },
        headers: { "Content-Type": "image/jpeg", apikey: "key" },
      })
    );
    expect(mocks.runRiddleStatsAutomation).toHaveBeenCalledWith({ type: "recordOutcome", outcome: "ok" });
    const actualOrder = [
      mocks.runRiddleImageAutomation.mock.invocationCallOrder[0],
      mocks.gmXhr.mock.invocationCallOrder[0],
      mocks.runRiddleStatsAutomation.mock.invocationCallOrder[0],
    ];
    expect(actualOrder).toEqual([...actualOrder].sort((a, b) => a - b));
  });

  it("classifies malformed ML service responses through the response decision", async () => {
    mocks.runRiddleImageAutomation.mockResolvedValue({ blob: { size: 12 } });
    mocks.gmXhr.mockImplementation(({ onload }) => {
      onload({
        status: 200,
        responseText: "not-json",
        responseHeaders: "",
      });
    });

    await expect(runRiddleMlAutomation({ type: RiddleMlEvent.TRY_ANSWER })).resolves.toBeNull();

    expect(mocks.runRiddleStatsAutomation).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "recordDetail",
        detail: expect.stringContaining("non_json status=200"),
      })
    );
    expect(mocks.runRiddleStatsAutomation).toHaveBeenCalledWith({ type: "recordOutcome", outcome: "non_json" });
    expectAnswerFailure("non_json");
    expect(mocks.runAlarmAutomation).toHaveBeenCalledWith({ type: "trigger", kind: "Error" });
  });

  it("classifies good ML responses without answer codes through the response decision", async () => {
    mocks.runRiddleImageAutomation.mockResolvedValue({ blob: { size: 12 } });
    mocks.gmXhr.mockImplementation(({ onload }) => {
      onload({
        status: 200,
        responseText: JSON.stringify({ return: "good", answer: "??" }),
        responseHeaders: "",
      });
    });

    await expect(runRiddleMlAutomation({ type: RiddleMlEvent.TRY_ANSWER })).resolves.toBeNull();

    expect(mocks.runRiddleStatsAutomation).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "recordDetail",
        detail: 'no_answer_code answer="??"',
      })
    );
    expect(mocks.runRiddleStatsAutomation).toHaveBeenCalledWith({ type: "recordOutcome", outcome: "no_answer_code" });
    expectAnswerFailure("no_answer_code");
    expect(mocks.runAlarmAutomation).toHaveBeenCalledWith({ type: "trigger", kind: "Error" });
  });
});
