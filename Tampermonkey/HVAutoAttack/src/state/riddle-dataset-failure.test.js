import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(),
}));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

import {
  RiddleDatasetEvent,
  RiddleSampleSource,
  runRiddleDatasetAutomation,
} from "./riddle-dataset.js";
import { RIDDLE_DATASET_FAILURE_KEY } from "./riddle-dataset-failure.js";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  mocks.runDiagnosticConsoleAutomation.mockReset();
  sessionStorage.clear();
});

describe("riddle dataset failure fallback", () => {
  it("does not throw when sample write failure evidence and diagnostic console both fail", () => {
    const setValue = vi.fn(() => {
      throw new Error("gm quota");
    });
    vi.stubGlobal("GM_setValue", setValue);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === RIDDLE_DATASET_FAILURE_KEY) throw new Error("quota");
      return Reflect.apply(Storage.prototype.setItem, this, [key, value]);
    });
    mocks.runDiagnosticConsoleAutomation.mockImplementation(() => false);

    expect(() =>
      runRiddleDatasetAutomation({
        type: RiddleDatasetEvent.RECORD_SAMPLE,
        answers: "ra",
        source: RiddleSampleSource.ML,
      })
    ).not.toThrow();

    expect(setValue).toHaveBeenCalledTimes(1);
  });

  it("does not throw when export list failure evidence and diagnostic console both fail", () => {
    vi.stubGlobal("GM_listValues", () => {
      throw new Error("list blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === RIDDLE_DATASET_FAILURE_KEY) throw new Error("quota");
      return Reflect.apply(Storage.prototype.setItem, this, [key, value]);
    });
    mocks.runDiagnosticConsoleAutomation.mockImplementation(() => false);

    expect(() => runRiddleDatasetAutomation({ type: RiddleDatasetEvent.EXPORT })).not.toThrow();
  });
});
