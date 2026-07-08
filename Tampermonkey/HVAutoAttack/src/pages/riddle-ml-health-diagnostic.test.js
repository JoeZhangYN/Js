import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  gmXhr: vi.fn(),
  runDiagnosticConsoleAutomation: vi.fn(),
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
  runRiddleImageAutomation: vi.fn(),
}));

async function loadSubject() {
  vi.resetModules();
  return import("./riddle-ml.js");
}

async function flushHealthCycle() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

async function readHealthFailureEvidence(key) {
  for (let i = 0; i < 10; i += 1) {
    await flushHealthCycle();
    const raw = sessionStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  }
  return null;
}

beforeEach(() => {
  sessionStorage.clear();
  for (const fn of Object.values(mocks)) fn.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("riddle ML health diagnostics", () => {
  it("isolates typed console failures during health diagnostics", async () => {
    const { RIDDLE_ML_HEALTH_FAILURE_KEY, RiddleMlEvent, runRiddleMlAutomation } =
      await loadSubject();
    mocks.runDiagnosticConsoleAutomation.mockReturnValue(false);
    mocks.gmXhr.mockImplementation(({ onload }) => onload({ status: 503 }));

    expect(runRiddleMlAutomation({ type: RiddleMlEvent.START_HEALTH })).toBe(true);
    const evidence = await readHealthFailureEvidence(RIDDLE_ML_HEALTH_FAILURE_KEY);

    expect(evidence).toMatchObject({
      capability: "riddleMlHealth",
      stage: "healthConsole",
      reason: "consoleFailed",
      method: "warn",
      error: "diagnostic console blocked",
    });
  });
});
