import { afterEach, describe, expect, it, vi } from "vitest";
import { RiddleDatasetEvent, runRiddleDatasetAutomation } from "./riddle-dataset.js";

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
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const deleteValue = vi.fn();
    vi.stubGlobal("GM_deleteValue", deleteValue);
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {
      throw new Error("download blocked");
    });

    expect(() => runRiddleDatasetAutomation({ type: RiddleDatasetEvent.EXPORT })).not.toThrow();
    vi.runAllTimers();

    expect(warn).toHaveBeenCalledWith(
      "[HVAA][RMA] riddle dataset failed",
      expect.objectContaining({ stage: "export-download" })
    );
    expectDatasetFailure("export-download");
    expect(deleteValue).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalledWith(expect.stringContaining("已导出 1 条答题样本"));
  });

  it("records download cleanup revoke failures after a successful export trigger", () => {
    stubExportableSample();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    vi.stubGlobal("GM_deleteValue", vi.fn());
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {
      throw new Error("revoke blocked");
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    runRiddleDatasetAutomation({ type: RiddleDatasetEvent.EXPORT });
    vi.runAllTimers();

    expect(warn).toHaveBeenCalledWith(
      "[HVAA][RMA] riddle dataset failed",
      expect.objectContaining({ stage: "export-revoke" })
    );
    expectDatasetFailure("export-revoke");
    expect(info).toHaveBeenCalledWith(expect.stringContaining("已导出 1 条答题样本"));
  });
});
