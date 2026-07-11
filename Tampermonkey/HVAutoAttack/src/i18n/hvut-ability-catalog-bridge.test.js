import { describe, expect, it } from "vitest";
import "./hvut-ability-catalog-bridge.js";

describe("HVUT ability catalog bridge", () => {
  it("installs one immutable bridge before the sloppy runtime", () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      window,
      "HVAA_hvutAbilityCatalog"
    );
    expect(descriptor).toMatchObject({
      configurable: false,
      enumerable: false,
      writable: false,
    });
    expect(Object.isFrozen(window.HVAA_hvutAbilityCatalog)).toBe(true);
    expect(typeof window.HVAA_hvutAbilityCatalog.createDefinition).toBe("function");
  });
});
