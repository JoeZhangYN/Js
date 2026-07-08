import { beforeEach, describe, expect, it, vi } from "vitest";
import { RiddleEvent, runRiddleAutomation } from "./riddle-automation.js";

const mocks = vi.hoisted(() => ({
  runAlarmAutomation: vi.fn(),
  runOptionAutomation: vi.fn(),
  runRiddleDatasetAutomation: vi.fn(),
  runRiddleImageAutomation: vi.fn(() => ({ imageDataUrl: null, imageSrc: "" })),
  runRiddleLogAutomation: vi.fn(),
  runRiddleMlAutomation: vi.fn(() => Promise.resolve(null)),
  runRiddleStatsAutomation: vi.fn(),
  runRiddleSubmissionTiming: vi.fn(),
  runRiddleVisualAid: vi.fn(),
}));

vi.mock("../alarm/alarm.js", () => ({
  AlarmEvent: Object.freeze({ TRIGGER: "trigger" }),
  runAlarmAutomation: mocks.runAlarmAutomation,
}));
vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({ IS_ON: "isOn", READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));
vi.mock("../core/navigate.js", () => ({
  NavigationEvent: Object.freeze({
    OPEN_WINDOW: "openWindow",
    RELOAD_NOW: "reloadNow",
  }),
  runNavigationAutomation: vi.fn(),
}));
vi.mock("../state/riddle-dataset.js", () => ({
  RiddleDatasetEvent: Object.freeze({ RECORD_SAMPLE: "recordSample" }),
  RiddleSampleSource: Object.freeze({ MANUAL: "manual", ML: "ml", RANDOM: "random" }),
  runRiddleDatasetAutomation: mocks.runRiddleDatasetAutomation,
}));
vi.mock("./riddle-image.js", () => ({
  RiddleImageEvent: Object.freeze({ CAPTURE_SAMPLE: "captureSample" }),
  runRiddleImageAutomation: mocks.runRiddleImageAutomation,
}));
vi.mock("../state/riddle-log.js", () => ({
  RiddleLogEvent: Object.freeze({ PUSH: "push" }),
  runRiddleLogAutomation: mocks.runRiddleLogAutomation,
}));
vi.mock("./riddle-ml.js", () => ({
  RiddleMlEvent: Object.freeze({ START_HEALTH: "startHealth", TRY_ANSWER: "tryAnswer" }),
  runRiddleMlAutomation: mocks.runRiddleMlAutomation,
}));
vi.mock("../state/riddle-stats.js", () => ({
  RiddleStatsEvent: Object.freeze({ RECORD_APPEAR: "recordAppear" }),
  runRiddleStatsAutomation: mocks.runRiddleStatsAutomation,
}));
vi.mock("./riddle-submission-timing.js", () => ({
  RiddleSubmissionTimingEvent: Object.freeze({
    START: "start",
    EXTERNAL_SUBMITTED: "externalSubmitted",
    ML_ANSWERS_READY: "mlAnswersReady",
  }),
  runRiddleSubmissionTiming: mocks.runRiddleSubmissionTiming,
}));
vi.mock("./riddle-helper.js", () => ({ runRiddleVisualAid: mocks.runRiddleVisualAid }));

beforeEach(() => {
  document.body.innerHTML = "";
  sessionStorage.clear();
  for (const fn of Object.values(mocks)) fn.mockClear();
  mocks.runOptionAutomation.mockImplementation((event) => {
    if (event.type === "isOn") return false;
    if (event.type === "readField" && event.key === "riddleAnswerTime") return 7;
    return undefined;
  });
  mocks.runRiddleMlAutomation.mockResolvedValue(null);
  mocks.runRiddleImageAutomation.mockReturnValue({ imageDataUrl: null, imageSrc: "" });
});

describe("runRiddleAutomation answering session", () => {
  it("runs the answering session in business order", () => {
    runRiddleAutomation({ type: RiddleEvent.RIDDLE_PAGE });

    const actualOrder = [
      mocks.runAlarmAutomation.mock.invocationCallOrder[0],
      mocks.runRiddleStatsAutomation.mock.invocationCallOrder[0],
      mocks.runRiddleSubmissionTiming.mock.invocationCallOrder[0],
    ];
    expect(actualOrder).toEqual([...actualOrder].sort((a, b) => a - b));
  });

  it("reads riddle answer timing through the option entry", () => {
    runRiddleAutomation({ type: RiddleEvent.RIDDLE_PAGE });

    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "riddleAnswerTime",
      fallback: 3,
    });
    expect(mocks.runRiddleSubmissionTiming).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "start",
        beforeEnd: 7,
      })
    );
  });

  it("starts ML health before timing and tries ML after timing when enabled", () => {
    mocks.runOptionAutomation.mockImplementation((event) => {
      if (event.type === "isOn" && event.key === "mlAnswer") return true;
      if (event.type === "readField" && event.key === "riddleAnswerTime") return 7;
      return false;
    });

    runRiddleAutomation({ type: RiddleEvent.RIDDLE_PAGE });

    expect(mocks.runRiddleMlAutomation).toHaveBeenNthCalledWith(1, { type: "startHealth" });
    expect(mocks.runRiddleMlAutomation).toHaveBeenNthCalledWith(2, { type: "tryAnswer" });
    const actualOrder = [
      mocks.runRiddleMlAutomation.mock.invocationCallOrder[0],
      mocks.runRiddleSubmissionTiming.mock.invocationCallOrder[0],
      mocks.runRiddleMlAutomation.mock.invocationCallOrder[1],
    ];
    expect(actualOrder).toEqual([...actualOrder].sort((a, b) => a - b));
  });

  it("records ML answer failures while keeping random timing fallback active", async () => {
    mocks.runOptionAutomation.mockImplementation((event) => {
      if (event.type === "isOn" && event.key === "mlAnswer") return true;
      if (event.type === "readField" && event.key === "riddleAnswerTime") return 7;
      return false;
    });
    mocks.runRiddleMlAutomation.mockImplementation((event) =>
      event.type === "tryAnswer" ? Promise.reject(new Error("ml blocked")) : true
    );

    runRiddleAutomation({ type: RiddleEvent.RIDDLE_PAGE });
    await Promise.resolve();
    await Promise.resolve();

    expect(mocks.runRiddleSubmissionTiming).toHaveBeenCalledWith(
      expect.objectContaining({ type: "start", beforeEnd: 7 })
    );
    expect(mocks.runRiddleLogAutomation).toHaveBeenCalledWith({
      type: "push",
      message: "ml answer failed error=ml blocked fallback=random",
    });
  });

  it("records a manual training sample through the submit hook when backup is enabled", () => {
    document.body.innerHTML = '<button id="riddlesubmit"></button>';
    mocks.runOptionAutomation.mockImplementation((event) => {
      if (event.type === "isOn" && event.key === "mlBackupOnFail") return true;
      if (event.type === "readField" && event.key === "riddleAnswerTime") return 7;
      return false;
    });

    runRiddleAutomation({ type: RiddleEvent.RIDDLE_PAGE });
    document.getElementById("riddlesubmit").click();

    expect(mocks.runRiddleSubmissionTiming).toHaveBeenCalledWith({
      type: "externalSubmitted",
    });
    expect(mocks.runRiddleImageAutomation).toHaveBeenCalledWith({ type: "captureSample" });
    expect(mocks.runRiddleDatasetAutomation).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "recordSample",
        answers: "",
        source: "manual",
      })
    );
  });
});
