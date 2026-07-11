import { describe, expect, it } from "vitest";
import { GameWorld } from "../core/ingress-identity.js";
import { selectHvutWorldProfile } from "./hvut-world-profile.js";

describe("HVUT world profile", () => {
  it("binds authority-only variation without changing shared business calls", () => {
    const isekai = selectHvutWorldProfile(GameWorld.ISEKAI);
    const persistent = selectHvutWorldProfile(GameWorld.PERSISTENT);

    expect(isekai).toMatchObject({
      identity: GameWorld.ISEKAI,
      encounterPageType: "is",
      top: { staminaRestorative: false },
      armory: { materialCountByQuality: { 4: 3, 5: 2, default: 1 } },
    });
    expect(persistent).toMatchObject({
      identity: GameWorld.PERSISTENT,
      encounterPageType: "hv",
      top: { staminaRestorative: true },
      armory: { materialCountByQuality: { default: 1 } },
    });
  });

  it("rejects an unknown world instead of falling back to another authority", () => {
    expect(selectHvutWorldProfile("unknown")).toBeNull();
  });
});
