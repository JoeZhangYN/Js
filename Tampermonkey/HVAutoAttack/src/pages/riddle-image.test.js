import { afterEach, describe, expect, it, vi } from "vitest";
import { RiddleImageEvent, runRiddleImageAutomation } from "./riddle-image.js";

afterEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

function expectImageFailure(stage) {
  expect(JSON.parse(sessionStorage.getItem("HVAA:lastRiddleImageFailure"))).toMatchObject({
    capability: "riddleImage",
    stage,
  });
}

describe("riddle image entry", () => {
  it("rejects unknown and null image events without reading image state", () => {
    document.body.innerHTML = '<div id="riddleimage"><img src="https://example.test/riddle.webp"></div>';
    const getElementById = vi.spyOn(document, "getElementById");

    expect(runRiddleImageAutomation({ type: "unknown" })).toBeUndefined();
    expect(runRiddleImageAutomation(null)).toBeUndefined();
    expect(getElementById).not.toHaveBeenCalled();
  });

  it("captures sample image metadata through the entry", () => {
    document.body.innerHTML = '<div id="riddleimage"><img src="https://example.test/riddle.webp"></div>';

    const sample = runRiddleImageAutomation({ type: RiddleImageEvent.CAPTURE_SAMPLE });

    expect(sample.imageSrc).toBe("https://example.test/riddle.webp");
    expect(sample.imageDataUrl).toBeNull();
  });

  it("records sample data-url capture failures while keeping metadata", () => {
    document.body.innerHTML = '<div id="riddleimage"><img src="https://example.test/riddle.webp"></div>';
    const img = document.querySelector("img");
    Object.defineProperty(img, "naturalWidth", { configurable: true, value: 100 });
    Object.defineProperty(img, "naturalHeight", { configurable: true, value: 100 });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: () => {
        throw new Error("tainted canvas");
      },
    });

    const sample = runRiddleImageAutomation({ type: RiddleImageEvent.CAPTURE_SAMPLE });

    expect(sample.imageSrc).toBe("https://example.test/riddle.webp");
    expect(sample.imageDataUrl).toBeNull();
    expectImageFailure("capture-data-url");
  });

  it("returns null ML payload when the riddle image is absent", async () => {
    document.body.innerHTML = "";

    await expect(
      runRiddleImageAutomation({ type: RiddleImageEvent.PREPARE_ML_PAYLOAD })
    ).resolves.toBeNull();
  });

  it("returns null ML payload when canvas and fetch fallbacks all fail", async () => {
    document.body.innerHTML = '<div id="riddleimage"><img src="https://example.test/riddle.webp"></div>';
    const img = document.querySelector("img");
    Object.defineProperty(img, "complete", { configurable: true, value: true });
    Object.defineProperty(img, "naturalWidth", { configurable: true, value: 100 });
    Object.defineProperty(img, "naturalHeight", { configurable: true, value: 100 });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: () => {
        throw new Error("tainted canvas");
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("network failed")))
    );

    await expect(
      runRiddleImageAutomation({ type: RiddleImageEvent.PREPARE_ML_PAYLOAD })
    ).resolves.toBeNull();
    expect(fetch).toHaveBeenCalledTimes(3);
    expectImageFailure("prepare-ml-payload");
  });
});
