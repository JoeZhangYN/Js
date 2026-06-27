import { beforeEach, describe, expect, it, vi } from "vitest";
import { runRiddleAnsweringSession } from "./riddle.js";

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
  for (const fn of Object.values(mocks)) fn.mockClear();
  mocks.runOptionAutomation.mockImplementation((event) => {
    if (event.type === "isOn") return false;
    if (event.type === "readField" && event.key === "riddleAnswerTime") return 7;
    return undefined;
  });
  mocks.runRiddleMlAutomation.mockResolvedValue(null);
  mocks.runRiddleImageAutomation.mockReturnValue({ imageDataUrl: null, imageSrc: "" });
});

describe("runRiddleAnsweringSession", () => {
  it("reads riddle answer timing through the option entry", () => {
    runRiddleAnsweringSession();

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
});
