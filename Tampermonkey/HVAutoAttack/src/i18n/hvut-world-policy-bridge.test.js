import { describe, expect, it } from "vitest";
import { GameWorld } from "../core/ingress-identity.js";
import { selectWorldPolicy } from "../core/world-policy.js";
import { createHvutWorldPolicyBridge } from "./hvut-world-policy-bridge.js";

describe("HVUT world policy bridge", () => {
  it.each([
    [GameWorld.PERSISTENT, "hvut", true],
    [GameWorld.ISEKAI, "hvuti", false],
  ])("binds %s authority once", (world, storageNamespace, randomEncounter) => {
    const bridge = createHvutWorldPolicyBridge(selectWorldPolicy(world));

    expect(bridge).toMatchObject({ world, serverName: world, storageNamespace, randomEncounter });
    expect(Object.isFrozen(bridge)).toBe(true);
  });

  it("installs an immutable out-of-box bridge for the sloppy runtime", () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, "HVAA_hvutWorldPolicy");
    expect(descriptor).toMatchObject({ configurable: false, writable: false });
    expect(Object.isFrozen(window.HVAA_hvutWorldPolicy)).toBe(true);
  });
});
