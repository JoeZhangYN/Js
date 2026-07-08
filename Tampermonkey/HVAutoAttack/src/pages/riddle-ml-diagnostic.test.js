import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { RiddleMlEvent, runRiddleMlAutomation } from "./riddle-ml.js";

const mocks = vi.hoisted(() => ({
  gmXhr: vi.fn(),
  runDiagnosticConsoleAutomation: vi.fn(),
  runRiddleImageAutomation: vi.fn(),
}));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ WARN: "warn", ERROR: "error", INFO: "info" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

vi.mock("../dom/gm-xhr.js", () => ({
  gmXhr: mocks.gmXhr,
  hasNonLatin1: () => false,
}));

vi.mock("../alarm/alarm.js", () => ({
  AlarmEvent: Object.freeze({ TRIGGER: "trigger" }),
  runAlarmAutomation: vi.fn(),
}));

vi.mock("../state/riddle-stats.js", () => ({
  RiddleStatsEvent: Object.freeze({
    RECORD_DETAIL: "recordDetail",
    RECORD_OUTCOME: "recordOutcome",
  }),
  runRiddleStatsAutomation: vi.fn(),
}));

vi.mock("./riddle-image.js", () => ({
  RiddleImageEvent: Object.freeze({ PREPARE_ML_PAYLOAD: "prepareMlPayload" }),
  runRiddleImageAutomation: mocks.runRiddleImageAutomation,
}));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  runOptionAutomation({ type: OptionEvent.CLEAR });
  for (const fn of Object.values(mocks)) fn.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("riddle ML diagnostics", () => {
  it("keeps disabled ML fallback when answer typed warning is blocked", async () => {
    mocks.runDiagnosticConsoleAutomation.mockReturnValue(false);
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", mlAnswer: false } });

    await expect(runRiddleMlAutomation({ type: RiddleMlEvent.TRY_ANSWER })).resolves.toBeNull();

    expect(JSON.parse(sessionStorage.getItem("HVAA:lastRiddleMlAnswerFailure"))).toMatchObject({
      capability: "riddleMlAnswer",
      fallback: "random",
    });
    expect(mocks.runRiddleImageAutomation).not.toHaveBeenCalled();
    expect(mocks.gmXhr).not.toHaveBeenCalled();
  });
});
