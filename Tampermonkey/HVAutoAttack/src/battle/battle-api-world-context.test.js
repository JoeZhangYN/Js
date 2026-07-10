import { beforeEach, describe, expect, it } from "vitest";
import { GameWorld } from "../core/ingress-identity.js";
import { selectWorldPolicy } from "../core/world-policy.js";
import {
  BattleApiWorldContextEvent,
  createBattleApiWorldContextCapability,
  runBattleApiWorldContext,
} from "./battle-api-world-context.js";

describe("runBattleApiWorldContext", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });

  it("classifies persistent battle API authority", () => {
    const capability = createBattleApiWorldContextCapability(
      selectWorldPolicy(GameWorld.PERSISTENT),
      { document }
    );
    expect(capability.run({ type: BattleApiWorldContextEvent.READ_CURRENT })).toEqual({
      world: "persistent",
      apiBaseUrl: "https://hentaiverse.org/",
      apiJsonUrl: "https://hentaiverse.org/json",
      hvcAssetId: "",
      hvcScriptSrc: "",
    });
  });

  it("classifies isekai battle API authority", () => {
    const capability = createBattleApiWorldContextCapability(selectWorldPolicy(GameWorld.ISEKAI), {
      document: {
        querySelector: () => ({ getAttribute: () => "/z/091c/hvc.js" }),
      },
    });
    expect(capability.run({ type: BattleApiWorldContextEvent.READ_CURRENT })).toEqual({
      world: "isekai",
      apiBaseUrl: "https://hentaiverse.org/isekai/",
      apiJsonUrl: "https://hentaiverse.org/isekai/json",
      hvcAssetId: "091c",
      hvcScriptSrc: "/z/091c/hvc.js",
    });
  });

  it("rejects unknown world context events", () => {
    expect(runBattleApiWorldContext({ type: "unknown" })).toBeUndefined();
  });

  it("rejects null world context events without reading document authority", () => {
    const capability = createBattleApiWorldContextCapability(selectWorldPolicy(GameWorld.ISEKAI), {
      document: {
        querySelector: () => {
          throw new Error("document authority should not be read");
        },
      },
    });

    expect(capability.run(null)).toBeUndefined();
  });
});
