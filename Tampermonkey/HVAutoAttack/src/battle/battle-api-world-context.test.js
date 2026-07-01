import { beforeEach, describe, expect, it } from "vitest";
import {
  BattleApiWorldContextEvent,
  runBattleApiWorldContext,
} from "./battle-api-world-context.js";

const URLS = Object.freeze({
  mainUrl: "https://hentaiverse.org/",
  isekaiUrl: "https://hentaiverse.org/isekai/",
});

describe("runBattleApiWorldContext", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });

  it("classifies persistent battle API authority", () => {
    expect(
      runBattleApiWorldContext(
        { type: BattleApiWorldContextEvent.READ_CURRENT },
        { ...URLS, isIsekai: false, document }
      )
    ).toEqual({
      world: "persistent",
      apiBaseUrl: "https://hentaiverse.org/",
      apiJsonUrl: "https://hentaiverse.org/json",
      hvcAssetId: "",
      hvcScriptSrc: "",
    });
  });

  it("classifies isekai battle API authority", () => {
    expect(
      runBattleApiWorldContext(
        { type: BattleApiWorldContextEvent.READ_CURRENT },
        {
          ...URLS,
          isIsekai: true,
          document: {
            querySelector: () => ({ getAttribute: () => "/z/091c/hvc.js" }),
          },
        }
      )
    ).toEqual({
      world: "isekai",
      apiBaseUrl: "https://hentaiverse.org/isekai/",
      apiJsonUrl: "https://hentaiverse.org/isekai/json",
      hvcAssetId: "091c",
      hvcScriptSrc: "/z/091c/hvc.js",
    });
  });

  it("rejects unknown world context events", () => {
    expect(
      runBattleApiWorldContext({ type: "unknown" }, { ...URLS, isIsekai: false })
    ).toBeUndefined();
  });
});
