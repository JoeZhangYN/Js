import { afterEach, describe, expect, it, vi } from "vitest";
import {
  RiddleDatasetEvent,
  RiddleSampleSource,
  runRiddleDatasetAutomation,
} from "./riddle-dataset.js";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function expectDatasetFailure(stage) {
  expect(JSON.parse(sessionStorage.getItem("HVAA:lastRiddleDatasetFailure"))).toMatchObject({
    capability: "riddleDataset",
    stage,
  });
}

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

  it("records missing GM_setValue as dataset failure evidence", () => {
    vi.stubGlobal("GM_setValue", undefined);

    runRiddleDatasetAutomation({
      type: RiddleDatasetEvent.RECORD_SAMPLE,
      answers: "ra",
      source: RiddleSampleSource.ML,
    });

    expectDatasetFailure("record-missing-gm-set");
  });

  it("records GM_setValue write failures without throwing", () => {
    vi.stubGlobal("GM_setValue", () => {
      throw new Error("quota");
    });

    expect(() =>
      runRiddleDatasetAutomation({
        type: RiddleDatasetEvent.RECORD_SAMPLE,
        answers: "ra",
        source: RiddleSampleSource.ML,
      })
    ).not.toThrow();
    expectDatasetFailure("record-write");
  });

  it("continues dataset export when one stored sample cannot be read or deleted", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-27T00:00:01Z"));
    vi.stubGlobal("GM_listValues", () => ["saved_pony_bad", "saved_pony_good"]);
    vi.stubGlobal("GM_getValue", (key) => {
      if (key === "saved_pony_bad") throw new Error("read blocked");
      return {
        json: { source: "ml", answers: "ra", confidence: "high", image_src: "pony.webp" },
        imageBase64: "",
        timestamp: Date.now(),
      };
    });
    vi.stubGlobal("GM_deleteValue", (key) => {
      if (key === "saved_pony_good") throw new Error("delete blocked");
    });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:dataset");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    runRiddleDatasetAutomation({ type: RiddleDatasetEvent.EXPORT });
    vi.runAllTimers();

    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expectDatasetFailure("export-delete");
  });

  it("records stored sample read failures during dataset export", () => {
    vi.stubGlobal("GM_listValues", () => ["saved_pony_bad"]);
    vi.stubGlobal("GM_getValue", () => {
      throw new Error("read blocked");
    });

    runRiddleDatasetAutomation({ type: RiddleDatasetEvent.EXPORT });

    expectDatasetFailure("export-read");
  });

  it("records missing GM_listValues as export failure evidence", () => {
    vi.stubGlobal("GM_listValues", undefined);

    runRiddleDatasetAutomation({ type: RiddleDatasetEvent.EXPORT });

    expectDatasetFailure("export-missing-gm-list");
  });

  it("records GM_listValues failures without throwing from dataset export", () => {
    vi.stubGlobal("GM_listValues", () => {
      throw new Error("list blocked");
    });

    expect(() => runRiddleDatasetAutomation({ type: RiddleDatasetEvent.EXPORT })).not.toThrow();
    expectDatasetFailure("export-list");
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
