import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runOptionAutomation: vi.fn(),
  runRiddleDatasetAutomation: vi.fn(),
  runRiddleImageAutomation: vi.fn(() => ({ imageDataUrl: null, imageSrc: "" })),
  runRiddleLogAutomation: vi.fn(),
  runRiddleMlAutomation: vi.fn(() => Promise.resolve(null)),
  runRiddleSubmissionTiming: vi.fn(),
}));

vi.mock("../alarm/alarm.js", () => ({
  AlarmEvent: Object.freeze({ TRIGGER: "trigger" }),
  runAlarmAutomation: vi.fn(),
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
  runRiddleStatsAutomation: vi.fn(),
}));
vi.mock("./riddle-submission-timing.js", () => ({
  RiddleSubmissionTimingEvent: Object.freeze({
    START: "start",
    EXTERNAL_SUBMITTED: "externalSubmitted",
    ML_ANSWERS_READY: "mlAnswersReady",
  }),
  runRiddleSubmissionTiming: mocks.runRiddleSubmissionTiming,
}));
vi.mock("./riddle-helper.js", () => ({ runRiddleVisualAid: vi.fn() }));

beforeEach(() => {
  document.body.innerHTML = "";
  sessionStorage.clear();
  for (const fn of Object.values(mocks)) fn.mockClear();
  mocks.runOptionAutomation.mockImplementation((event) => {
    if (event.type === "isOn" && event.key === "mlBackupOnFail") return true;
    if (event.type === "readField" && event.key === "riddleAnswerTime") return 7;
    return false;
  });
});

describe("riddle submit flow fallback", () => {
  it("clears pending automated source when submit command fails before a manual click", async () => {
    const { runRiddleAnsweringSession } = await import("./riddle.js");
    document.body.innerHTML = '<button id="riddlesubmit"></button>';

    runRiddleAnsweringSession();
    const timingStart = mocks.runRiddleSubmissionTiming.mock.calls.find(
      ([event]) => event.type === "start"
    )[0];
    timingStart.submit(["ra"], "ML");
    document.getElementById("riddlesubmit").click();

    expect(JSON.parse(sessionStorage.getItem("HVAA:lastRiddleSubmitFailure"))).toMatchObject({
      capability: "riddleSubmit",
      stage: "missing-riddler",
    });
    expect(mocks.runRiddleDatasetAutomation).toHaveBeenCalledWith(
      expect.objectContaining({ type: "recordSample", source: "manual" })
    );
  });
});
