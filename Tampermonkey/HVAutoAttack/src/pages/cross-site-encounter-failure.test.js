import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CrossSiteEncounterEvent,
  runCrossSiteEncounterNavigation,
} from "./cross-site-encounter-navigation.js";
import { CROSS_SITE_ENCOUNTER_FAILURE_KEY } from "./cross-site-encounter-failure.js";
import { PageKind } from "./page-kind.js";

const mocks = vi.hoisted(() => ({
  runDiagnosticConsoleAutomation: vi.fn(),
  getValue: vi.fn(),
  setValue: vi.fn(),
}));

vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));

vi.mock("../state/storage.js", () => ({
  getValue: mocks.getValue,
  setValue: mocks.setValue,
}));

function pageReady(kind) {
  return { type: CrossSiteEncounterEvent.PAGE_READY, kind };
}

function lastFailure() {
  return JSON.parse(sessionStorage.getItem(CROSS_SITE_ENCOUNTER_FAILURE_KEY));
}

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  sessionStorage.clear();
});

describe("cross-site encounter return-origin failure", () => {
  it("records return-origin persistence failures without blocking game-page flow", () => {
    mocks.setValue.mockImplementation(() => {
      throw new Error("return origin write blocked");
    });

    expect(
      runCrossSiteEncounterNavigation(pageReady(PageKind.LOBBY), {
        origin: () => "https://alt.hentaiverse.org",
      })
    ).toBe(false);

    expect(lastFailure()).toMatchObject({
      capability: "crossSiteEncounter",
      stage: "persist-return-origin",
      failure: {
        kind: "storageWrite",
        key: "url",
        origin: "https://alt.hentaiverse.org",
        error: "return origin write blocked",
      },
    });
    expect(mocks.runDiagnosticConsoleAutomation).toHaveBeenCalledWith({
      type: "warn",
      args: [
        "[HVAA] cross-site encounter failed",
        expect.objectContaining({
          capability: "crossSiteEncounter",
          stage: "persist-return-origin",
        }),
      ],
    });
  });

  it("does not throw when return-origin failure evidence and typed warning both fail", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("session blocked");
    });
    mocks.runDiagnosticConsoleAutomation.mockImplementation(() => false);
    mocks.setValue.mockImplementation(() => {
      throw new Error("return origin write blocked");
    });

    expect(() =>
      runCrossSiteEncounterNavigation(pageReady(PageKind.LOBBY), {
        origin: () => "https://alt.hentaiverse.org",
      })
    ).not.toThrow();
    Storage.prototype.setItem.mockRestore();
  });
});
