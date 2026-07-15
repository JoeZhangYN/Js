import { afterEach, describe, expect, it, vi } from "vitest";
import { triggerRiddleDatasetDownload } from "./riddle-dataset-download.js";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  sessionStorage.clear();
});

describe("riddle dataset download side effect", () => {
  it("returns false and records evidence when the browser blocks the click", () => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:dataset");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {
      throw new Error("download blocked");
    });

    expect(triggerRiddleDatasetDownload(new Blob(["zip"]))).toBe(false);
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastRiddleDatasetFailure"))).toMatchObject({
      capability: "riddleDataset",
      stage: "export-download",
    });
  });

  it("revokes the object URL after a successful trigger", () => {
    vi.useFakeTimers();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:dataset");
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    expect(triggerRiddleDatasetDownload(new Blob(["zip"]))).toBe(true);
    vi.runAllTimers();
    expect(revoke).toHaveBeenCalledWith("blob:dataset");
  });
});
