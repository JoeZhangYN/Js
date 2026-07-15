import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  StorageIoMetricsEvent,
  runStorageIoMetricsAutomation,
} from "../state/storage-io-metrics.js";
import { StorageIdentity, StorageWriteOutcome } from "../state/storage-io-policy.js";
import { EncounterStateEvent, runEncounterStateAutomation } from "./encounter-state.js";

const mocks = vi.hoisted(() => ({
  gmXhr: vi.fn(),
}));

vi.mock("../dom/gm-xhr.js", () => ({ gmXhr: mocks.gmXhr }));

const HVUT_RE_KEY = "hvut_re";
const GENERATION_REQUEST = {
  method: "GET",
  url: "https://e-hentai.org/news.php?encounter",
};

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.setSystemTime(new Date("2026-06-27T00:00:05.000Z"));
  mocks.gmXhr.mockReset();
  runStorageIoMetricsAutomation({ type: StorageIoMetricsEvent.RESET });
});

describe("runEncounterStateAutomation", () => {
  it("normalizes and writes the stored encounter day through the state entry", () => {
    localStorage.setItem(
      HVUT_RE_KEY,
      JSON.stringify({
        date: Date.UTC(2026, 5, 26, 23, 59),
        key: "old",
        count: 24,
        clear: false,
      })
    );

    const state = runEncounterStateAutomation({ type: EncounterStateEvent.READ_CURRENT });

    expect(state).toEqual({ date: 0, key: "", count: 0, clear: true });
    expect(JSON.parse(localStorage.getItem(HVUT_RE_KEY))).toEqual(state);
  });

  it("does not physically rewrite unchanged GM encounter state during repeated reads", () => {
    const stored = { date: Date.now() - 1_000, key: "", count: 1, clear: true };
    const gmGetValue = vi.fn(() => stored);
    const gmSetValue = vi.fn();
    vi.stubGlobal("GM_getValue", gmGetValue);
    vi.stubGlobal("GM_setValue", gmSetValue);

    expect(runEncounterStateAutomation({ type: EncounterStateEvent.READ_CURRENT })).toEqual(stored);
    expect(runEncounterStateAutomation({ type: EncounterStateEvent.READ_CURRENT })).toEqual(stored);

    expect(gmSetValue).not.toHaveBeenCalled();
    expect(
      runStorageIoMetricsAutomation({ type: StorageIoMetricsEvent.SNAPSHOT })[
        StorageIdentity.ENCOUNTER_STATE
      ]
    ).toMatchObject({
      attemptedWrites: 2,
      physicalWrites: 0,
      skippedWrites: 2,
      lastOutcome: StorageWriteOutcome.SKIPPED_UNCHANGED,
      lastSourceIdentity: "hvut_re",
    });
  });

  it("marks started encounters through the state entry", () => {
    localStorage.setItem(
      HVUT_RE_KEY,
      JSON.stringify({ date: 1000, key: "abc=", count: 1, clear: false })
    );

    runEncounterStateAutomation({
      type: EncounterStateEvent.MARK_STARTED,
      search: "?s=Battle&ss=ba&encounter=abc=",
    });

    expect(JSON.parse(localStorage.getItem(HVUT_RE_KEY))).toMatchObject({
      key: "abc=",
      clear: true,
    });
  });

  it("marks attempted encounter entry through the state entry", () => {
    const date = Date.now();
    const result = runEncounterStateAutomation({
      type: EncounterStateEvent.MARK_ATTEMPTED,
      state: { date, key: "abc=", count: 1, clear: false },
      key: "abc=",
    });

    expect(result).toMatchObject({
      ok: true,
      state: { date, key: "abc=", count: 1, clear: true },
      persistence: { ok: true, authority: "local" },
    });
    expect(JSON.parse(localStorage.getItem(HVUT_RE_KEY))).toEqual(result.state);
  });

  it("loads a news encounter key through the state entry", async () => {
    localStorage.setItem(HVUT_RE_KEY, JSON.stringify({ date: 0, key: "", count: 0, clear: true }));
    mocks.gmXhr.mockImplementation(({ onload }) => {
      onload({
        responseText:
          '<div id="eventpane"><a href="?s=Battle&amp;ss=ba&amp;encounter=xyz=">RE</a></div>',
      });
    });

    const result = await runEncounterStateAutomation({
      type: EncounterStateEvent.LOAD_KEY,
      request: GENERATION_REQUEST,
    });

    expect(result).toMatchObject({
      status: "available",
      persisted: true,
      state: { date: 0, key: "xyz=", count: 0, clear: false },
    });
    expect(JSON.parse(localStorage.getItem(HVUT_RE_KEY))).toMatchObject(result.state);
  });

  it("fails closed to default state when stored encounter JSON is corrupted", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    localStorage.setItem(HVUT_RE_KEY, "{bad-json");

    const state = runEncounterStateAutomation({ type: EncounterStateEvent.READ_CURRENT });

    expect(state).toEqual({ date: 0, key: "", count: 0, clear: true });
    expect(warn).toHaveBeenCalledWith(
      "[HVAA] encounter state failed",
      expect.objectContaining({ stage: "read-local-json" })
    );
  });

  it("records encounter local state write failures without throwing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("GM_setValue", undefined);
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("local write blocked");
    });

    expect(() =>
      runEncounterStateAutomation({
        type: EncounterStateEvent.MARK_ATTEMPTED,
        state: { date: Date.now(), key: "abc=", count: 1, clear: false },
        key: "abc=",
      })
    ).not.toThrow();
    expect(warn).toHaveBeenCalledWith(
      "[HVAA] encounter state failed",
      expect.objectContaining({ stage: "write-local" })
    );
  });

  it("rejects unknown and null state events without reading or writing encounter state", () => {
    expect(runEncounterStateAutomation({ type: "unknown" })).toBeUndefined();
    expect(runEncounterStateAutomation(null)).toBeUndefined();
    expect(localStorage.getItem(HVUT_RE_KEY)).toBeNull();
    expect(mocks.gmXhr).not.toHaveBeenCalled();
  });
});
