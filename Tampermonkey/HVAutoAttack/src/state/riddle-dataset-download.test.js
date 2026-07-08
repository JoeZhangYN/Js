import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(),
  runUserFeedbackAutomation: vi.fn(),
}));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ INFO: "info", WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

vi.mock("../core/lang.js", () => ({
  UserFeedbackEvent: Object.freeze({ TEXT: "text" }),
  runUserFeedbackAutomation: mocks.runUserFeedbackAutomation,
}));

import { RiddleDatasetEvent, runRiddleDatasetAutomation } from "./riddle-dataset.js";

beforeEach(() => {
  mocks.runDiagnosticConsoleAutomation.mockReset();
  mocks.runUserFeedbackAutomation.mockReset();
  mocks.runUserFeedbackAutomation.mockImplementation((event) => event.copy.l0);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function stubExportableSample() {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-27T00:00:01Z"));
  vi.stubGlobal("GM_listValues", () => ["saved_pony_good"]);
  vi.stubGlobal("GM_getValue", () => ({
    json: { source: "ml", answers: "ra", confidence: "high", image_src: "pony.webp" },
    imageBase64: "",
    timestamp: Date.now(),
  }));
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:dataset");
}

function expectDatasetFailure(stage) {
  expect(JSON.parse(sessionStorage.getItem("HVAA:lastRiddleDatasetFailure"))).toMatchObject({
    capability: "riddleDataset",
    stage,
  });
}

describe("riddle dataset download side effect", () => {
  it("records download click failures without clearing exported samples or reporting success", () => {
    stubExportableSample();
    const deleteValue = vi.fn();
    vi.stubGlobal("GM_deleteValue", deleteValue);
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {
      throw new Error("download blocked");
    });

    expect(() => runRiddleDatasetAutomation({ type: RiddleDatasetEvent.EXPORT })).not.toThrow();
    vi.runAllTimers();

    expect(mocks.runDiagnosticConsoleAutomation).toHaveBeenCalledWith({
      type: "warn",
      args: [
        "[HVAA][RMA] riddle dataset failed",
        expect.objectContaining({ stage: "export-download" }),
      ],
    });
    expectDatasetFailure("export-download");
    expect(deleteValue).not.toHaveBeenCalled();
    expect(mocks.runDiagnosticConsoleAutomation).not.toHaveBeenCalledWith({
      type: "info",
      args: [expect.stringContaining("已导出 1 条答题样本")],
    });
  });

  it("records download cleanup revoke failures after a successful export trigger", () => {
    stubExportableSample();
    vi.stubGlobal("GM_deleteValue", vi.fn());
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {
      throw new Error("revoke blocked");
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    runRiddleDatasetAutomation({ type: RiddleDatasetEvent.EXPORT });
    vi.runAllTimers();

    expect(mocks.runDiagnosticConsoleAutomation).toHaveBeenCalledWith({
      type: "warn",
      args: [
        "[HVAA][RMA] riddle dataset failed",
        expect.objectContaining({ stage: "export-revoke" }),
      ],
    });
    expectDatasetFailure("export-revoke");
    expect(mocks.runDiagnosticConsoleAutomation).toHaveBeenCalledWith({
      type: "info",
      args: [expect.stringContaining("已导出 1 条答题样本")],
    });
  });
});
