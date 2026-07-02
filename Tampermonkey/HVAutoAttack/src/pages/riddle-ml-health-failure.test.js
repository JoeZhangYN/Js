import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
  delete globalThis.GM_getValue;
  delete globalThis.GM_setValue;
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-02T02:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("riddle ML health failure evidence", () => {
  it("records HEAD non-200 health evidence without blocking the health timer", async () => {
    const { RIDDLE_ML_HEALTH_FAILURE_KEY, RiddleMlEvent, runRiddleMlAutomation } =
      await loadSubject();
    mocks.gmXhr.mockImplementation(({ onload }) => onload({ status: 503 }));

    expect(runRiddleMlAutomation({ type: RiddleMlEvent.START_HEALTH })).toBe(true);
    const evidence = await readHealthFailureEvidence(RIDDLE_ML_HEALTH_FAILURE_KEY);

    expect(vi.getTimerCount()).toBe(1);
    expect(evidence).toMatchObject({
      capability: "riddleMlHealth",
      stage: "headOnload",
      reason: "nonOkStatus",
      status: 503,
    });
  });

  it("records GM storage failures instead of letting health state writes reject", async () => {
    const { RIDDLE_ML_HEALTH_FAILURE_KEY, RiddleMlEvent, runRiddleMlAutomation } =
      await loadSubject();
    globalThis.GM_setValue = () => {
      throw new Error("gm blocked");
    };
    mocks.gmXhr.mockImplementation(({ onload }) => onload({ status: 200 }));

    expect(runRiddleMlAutomation({ type: RiddleMlEvent.START_HEALTH })).toBe(true);
    const evidence = await readHealthFailureEvidence(RIDDLE_ML_HEALTH_FAILURE_KEY);

    expect(evidence).toMatchObject({
      capability: "riddleMlHealth",
      reason: "gmSetFailed",
      error: "gm blocked",
    });
  });

  it("isolates console hook failures during health diagnostics", async () => {
    const { RIDDLE_ML_HEALTH_FAILURE_KEY, RiddleMlEvent, runRiddleMlAutomation } =
      await loadSubject();
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });
    mocks.gmXhr.mockImplementation(({ onload }) => onload({ status: 503 }));

    expect(runRiddleMlAutomation({ type: RiddleMlEvent.START_HEALTH })).toBe(true);
    const evidence = await readHealthFailureEvidence(RIDDLE_ML_HEALTH_FAILURE_KEY);

    expect(evidence).toMatchObject({
      capability: "riddleMlHealth",
      stage: "healthConsole",
      reason: "consoleFailed",
      method: "warn",
      error: "console blocked",
    });
  });

  it("records request startup failures from the health HEAD adapter", async () => {
    const { RIDDLE_ML_HEALTH_FAILURE_KEY, RiddleMlEvent, runRiddleMlAutomation } =
      await loadSubject();
    mocks.gmXhr.mockImplementation(() => {
      throw new Error("adapter missing");
    });

    expect(runRiddleMlAutomation({ type: RiddleMlEvent.START_HEALTH })).toBe(true);
    const evidence = await readHealthFailureEvidence(RIDDLE_ML_HEALTH_FAILURE_KEY);

    expect(evidence).toMatchObject({
      capability: "riddleMlHealth",
      stage: "sendHead",
      reason: "requestStartFailed",
      error: "adapter missing",
    });
  });
});
