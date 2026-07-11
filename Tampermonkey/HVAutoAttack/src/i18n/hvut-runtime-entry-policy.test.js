import { describe, expect, it } from "vitest";
import { GameWorld } from "../core/ingress-identity.js";
import {
  HvutRuntimeEntryMode,
  selectHvutRuntimeEntryPolicy,
} from "./hvut-runtime-entry-policy.js";

describe("HVUT runtime entry policy", () => {
  it.each([
    [GameWorld.PERSISTENT, "/", HvutRuntimeEntryMode.ACTIVE],
    [GameWorld.ISEKAI, "/isekai/", HvutRuntimeEntryMode.ACTIVE],
    [
      GameWorld.ISEKAI,
      "/isekai/equip/123/key",
      HvutRuntimeEntryMode.EXCLUDED_ISEKAI_EQUIPMENT_DOCUMENT,
    ],
  ])("classifies %s%s as %s", (world, pathname, mode) => {
    const policy = selectHvutRuntimeEntryPolicy({ world, pathname });
    expect(policy).toEqual({ mode });
    expect(Object.isFrozen(policy)).toBe(true);
  });

  it("does not exclude a persistent-world path that merely contains equip", () => {
    expect(
      selectHvutRuntimeEntryPolicy({ world: GameWorld.PERSISTENT, pathname: "/equip/123/key" })
    ).toEqual({ mode: HvutRuntimeEntryMode.ACTIVE });
  });
});
