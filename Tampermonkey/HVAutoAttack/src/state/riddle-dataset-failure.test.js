import { afterEach, describe, expect, it, vi } from "vitest";
import { RiddleDatasetEvent, RiddleSampleSource, runRiddleDatasetAutomation } from "./riddle-dataset.js";
import { RIDDLE_DATASET_FAILURE_KEY } from "./riddle-dataset-failure.js";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  sessionStorage.clear();
});

describe("riddle dataset failure fallback", () => {
  it("does not throw when sample write failure evidence and warning both fail", () => {
    const setValue = vi.fn(() => {
      throw new Error("gm quota");
    });
    vi.stubGlobal("GM_setValue", setValue);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === RIDDLE_DATASET_FAILURE_KEY) throw new Error("quota");
      return Reflect.apply(Storage.prototype.setItem, this, [key, value]);
    });
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });

    expect(() =>
      runRiddleDatasetAutomation({
        type: RiddleDatasetEvent.RECORD_SAMPLE,
        answers: "ra",
        source: RiddleSampleSource.ML,
      })
    ).not.toThrow();

    expect(setValue).toHaveBeenCalledTimes(1);
  });
});
