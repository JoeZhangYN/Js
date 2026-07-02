import { afterEach, describe, expect, it, vi } from "vitest";
import {
  RiddleDatasetEvent,
  RiddleSampleSource,
  runRiddleDatasetAutomation,
} from "./riddle-dataset.js";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("riddle dataset entry", () => {
  it("rejects invalid dataset events without writing samples or registering menus", () => {
    const setValue = vi.fn();
    const registerMenu = vi.fn();
    vi.stubGlobal("GM_setValue", setValue);
    vi.stubGlobal("GM_registerMenuCommand", registerMenu);

    expect(
      runRiddleDatasetAutomation({
        type: "unknown",
        imageDataUrl: "data:image/webp;base64,AAAA",
        answers: "ra",
        source: RiddleSampleSource.ML,
      })
    ).toBeUndefined();
    expect(runRiddleDatasetAutomation(null)).toBeUndefined();

    expect(setValue).not.toHaveBeenCalled();
    expect(registerMenu).not.toHaveBeenCalled();
  });

  it("records samples through the entry and derives confidence from source", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-27T00:00:01Z"));
    const setValue = vi.fn();
    vi.stubGlobal("GM_setValue", setValue);

    runRiddleDatasetAutomation({
      type: RiddleDatasetEvent.RECORD_SAMPLE,
      imageDataUrl: "data:image/webp;base64,AAAA",
      answers: "ra",
      source: RiddleSampleSource.RANDOM,
      imageSrc: "pony.webp",
    });

    expect(setValue).toHaveBeenCalledWith(
      "saved_pony_2026-06-27_00-00-01",
      expect.objectContaining({
        json: expect.objectContaining({
          source: "random",
          confidence: "low",
          answers: "ra",
          image_src: "pony.webp",
        }),
        imageBase64: "data:image/webp;base64,AAAA",
      })
    );
  });

  it("registers the export menu once through the entry", () => {
    const registerMenu = vi.fn();
    vi.stubGlobal("GM_registerMenuCommand", registerMenu);

    runRiddleDatasetAutomation({ type: RiddleDatasetEvent.REGISTER_EXPORT_MENU });
    runRiddleDatasetAutomation({ type: RiddleDatasetEvent.REGISTER_EXPORT_MENU });

    expect(registerMenu).toHaveBeenCalledTimes(1);
    expect(registerMenu.mock.calls[0][0]).toBe("导出答题训练样本(zip: 图片+json)");
    expect(registerMenu.mock.calls[0][1]).toEqual(expect.any(Function));
  });
});
