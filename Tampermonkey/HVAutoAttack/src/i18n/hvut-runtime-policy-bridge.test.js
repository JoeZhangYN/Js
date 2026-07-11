import { describe, expect, it } from "vitest";
import { GameWorld } from "../core/ingress-identity.js";
import { selectWorldPolicy } from "../core/world-policy.js";
import { HvutRuntimeEntryMode } from "./hvut-runtime-entry-policy.js";
import { createHvutRuntimePolicyBridge } from "./hvut-runtime-policy-bridge.js";

describe("HVUT runtime policy bridge", () => {
  it.each([
    [GameWorld.PERSISTENT, "hvut", true],
    [GameWorld.ISEKAI, "hvuti", false],
  ])("binds %s authority once", (world, storageNamespace, randomEncounter) => {
    const bridge = createHvutRuntimePolicyBridge(selectWorldPolicy(world), {
      world,
      pathname: "/",
    });

    expect(bridge).toMatchObject({
      entry: { mode: HvutRuntimeEntryMode.ACTIVE },
      authority: {
        serverName: world,
        storageNamespace,
        randomEncounter,
      },
      profile: { identity: world },
    });
    expect(Object.isFrozen(bridge)).toBe(true);
  });

  it("binds the Isekai equipment-document exclusion at composition", () => {
    const bridge = createHvutRuntimePolicyBridge(selectWorldPolicy(GameWorld.ISEKAI), {
      world: GameWorld.ISEKAI,
      pathname: "/isekai/equip/123/key",
    });

    expect(bridge.entry.mode).toBe(HvutRuntimeEntryMode.EXCLUDED_ISEKAI_EQUIPMENT_DOCUMENT);
  });

  it("installs an immutable out-of-box bridge for the sloppy runtime", () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, "HVAA_hvutRuntimePolicy");
    expect(descriptor).toMatchObject({ configurable: false, writable: false });
    expect(Object.isFrozen(window.HVAA_hvutRuntimePolicy)).toBe(true);
  });
});
