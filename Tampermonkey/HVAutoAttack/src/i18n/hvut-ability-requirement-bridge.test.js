import { describe, expect, it } from "vitest";
import "./hvut-ability-requirement-bridge.js";

describe("HVUT ability requirement bridge", () => {
  it("installs one immutable decision bridge before the sloppy runtime", () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, "HVAA_hvutAbilityRequirement");
    expect(descriptor).toMatchObject({ configurable: false, writable: false });
    expect(Object.isFrozen(window.HVAA_hvutAbilityRequirement)).toBe(true);
    expect(typeof window.HVAA_hvutAbilityRequirement.decide).toBe("function");
    expect(window.HVAA_hvutAbilityRequirement.layout).toEqual({
      POINTS_CENTER_LEVEL_BELOW: "pointsCenterLevelBelow",
    });
  });
});
