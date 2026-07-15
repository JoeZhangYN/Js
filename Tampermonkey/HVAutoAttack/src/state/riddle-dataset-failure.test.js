import { describe, expect, it, vi } from "vitest";
import {
  recordRiddleDatasetFailure,
  RIDDLE_DATASET_FAILURE_KEY,
} from "./riddle-dataset-failure.js";

describe("riddle dataset failure fallback", () => {
  it("does not throw when failure evidence storage is unavailable", () => {
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === RIDDLE_DATASET_FAILURE_KEY) throw new Error("quota");
      return Reflect.apply(original, this, [key, value]);
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(() => recordRiddleDatasetFailure("record-write", { error: "idb quota" })).not.toThrow();
  });
});
