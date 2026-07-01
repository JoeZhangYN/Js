import { describe, expect, it } from "vitest";
import {
  BattleApiWorldContextEvent,
  runBattleApiWorldContext,
} from "./battle-api-world-context.js";

const URLS = Object.freeze({
  mainUrl: "https://hentaiverse.org/",
  isekaiUrl: "https://hentaiverse.org/isekai/",
});

describe("runBattleApiWorldContext", () => {
  it("classifies persistent battle API authority", () => {
    expect(
      runBattleApiWorldContext(
        { type: BattleApiWorldContextEvent.READ_CURRENT },
        { ...URLS, isIsekai: false }
      )
    ).toEqual({
      world: "persistent",
      apiBaseUrl: "https://hentaiverse.org/",
      apiJsonUrl: "https://hentaiverse.org/json",
    });
  });

  it("classifies isekai battle API authority", () => {
    expect(
      runBattleApiWorldContext(
        { type: BattleApiWorldContextEvent.READ_CURRENT },
        { ...URLS, isIsekai: true }
      )
    ).toEqual({
      world: "isekai",
      apiBaseUrl: "https://hentaiverse.org/isekai/",
      apiJsonUrl: "https://hentaiverse.org/isekai/json",
    });
  });

  it("rejects unknown world context events", () => {
    expect(
      runBattleApiWorldContext({ type: "unknown" }, { ...URLS, isIsekai: false })
    ).toBeUndefined();
  });
});
