import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EncounterStateEvent, runEncounterStateAutomation } from "./encounter-state.js";

const mocks = vi.hoisted(() => ({ gmXhr: vi.fn() }));

vi.mock("../dom/gm-xhr.js", () => ({ gmXhr: mocks.gmXhr }));

const request = { method: "GET", url: "https://e-hentai.org/news.php?encounter" };

beforeEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
  mocks.gmXhr.mockReset();
  vi.setSystemTime(new Date("2026-06-27T00:00:05.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("encounter generation request completion", () => {
  it("settles with typed recovery when response parsing throws", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal(
      "DOMParser",
      class {
        parseFromString() {
          throw new Error("parser failed");
        }
      }
    );
    mocks.gmXhr.mockImplementation(({ onload }) => onload({ status: 200, responseText: "html" }));

    await expect(
      runEncounterStateAutomation({ type: EncounterStateEvent.LOAD_KEY, request })
    ).resolves.toMatchObject({
      status: "transportFailure",
      reason: "generationRequestFailed",
      persisted: true,
      recovery: { reason: "generationBackoff" },
    });
    expect(warn).toHaveBeenCalledWith(
      "[HVAA] encounter state failed",
      expect.objectContaining({ stage: "load-key-callback-exception" })
    );
  });

  it("settles through its watchdog when GM never invokes a callback", async () => {
    vi.useFakeTimers();
    mocks.gmXhr.mockImplementation(() => undefined);

    const pending = runEncounterStateAutomation({ type: EncounterStateEvent.LOAD_KEY, request });
    expect(mocks.gmXhr).toHaveBeenCalledWith(
      expect.objectContaining({ timeout: 15_000, onabort: expect.any(Function) })
    );
    await vi.advanceTimersByTimeAsync(15_000);

    await expect(pending).resolves.toMatchObject({
      status: "transportFailure",
      reason: "generationRequestTimeout",
      persisted: true,
      recovery: { reason: "generationBackoff" },
    });
  });
});
