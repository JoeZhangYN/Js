import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(),
  runUserFeedbackAutomation: vi.fn(),
}));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ INFO: "info" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

vi.mock("../core/lang.js", () => ({
  UserFeedbackEvent: Object.freeze({ TEXT: "text" }),
  runUserFeedbackAutomation: mocks.runUserFeedbackAutomation,
}));

import { RIDDLE_DATASET_STATUS_COPY, reportRiddleDatasetStatus } from "./riddle-dataset-status.js";

beforeEach(() => {
  mocks.runDiagnosticConsoleAutomation.mockReset();
  mocks.runUserFeedbackAutomation.mockReset();
  mocks.runUserFeedbackAutomation.mockImplementation((event) => event.copy.l0);
});

describe("riddle dataset status feedback", () => {
  it("localizes export status text before reporting it through typed diagnostics", () => {
    reportRiddleDatasetStatus(RIDDLE_DATASET_STATUS_COPY.EXPORT_SUCCESS, { count: 2 });

    expect(mocks.runUserFeedbackAutomation).toHaveBeenCalledWith({
      type: "text",
      copy: RIDDLE_DATASET_STATUS_COPY.EXPORT_SUCCESS,
    });
    expect(mocks.runDiagnosticConsoleAutomation).toHaveBeenCalledWith({
      type: "info",
      args: [expect.stringContaining("已导出 2 条答题样本")],
    });
  });
});
