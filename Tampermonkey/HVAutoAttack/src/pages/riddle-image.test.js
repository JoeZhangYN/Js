import { afterEach, describe, expect, it, vi } from "vitest";
import { RiddleImageEvent, runRiddleImageAutomation } from "./riddle-image.js";

afterEach(() => {
  vi.restoreAllMocks();
});

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

  it("returns null ML payload when the riddle image is absent", async () => {
    document.body.innerHTML = "";

    await expect(
      runRiddleImageAutomation({ type: RiddleImageEvent.PREPARE_ML_PAYLOAD })
    ).resolves.toBeNull();
  });
});
