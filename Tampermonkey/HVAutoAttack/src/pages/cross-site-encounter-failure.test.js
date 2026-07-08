import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CrossSiteEncounterEvent,
  runCrossSiteEncounterNavigation,
} from "./cross-site-encounter-navigation.js";
import { CROSS_SITE_ENCOUNTER_FAILURE_KEY } from "./cross-site-encounter-failure.js";
import { PageKind } from "./page-kind.js";

const mocks = vi.hoisted(() => ({
  getValue: vi.fn(),
  setValue: vi.fn(),
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
  mocks.getValue.mockReset();
  mocks.setValue.mockReset();
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
  });

  it("does not throw when return-origin failure evidence and warning both fail", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("session blocked");
    });
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });
    mocks.setValue.mockImplementation(() => {
      throw new Error("return origin write blocked");
    });

    expect(() =>
      runCrossSiteEncounterNavigation(pageReady(PageKind.LOBBY), {
        origin: () => "https://alt.hentaiverse.org",
      })
    ).not.toThrow();
    console.warn.mockRestore();
    Storage.prototype.setItem.mockRestore();
  });
});
