import { describe, expect, it } from "vitest";
import { readShowEquipName } from "./showequip-forge-cost.js";

function node(children = [], textContent = "") {
  return { children, textContent };
}

describe("readShowEquipName", () => {
  it("reads showequip names from known page layouts", () => {
    const simpleName = node([node(), node([node(), node([node([node([], "Oak Staff")])])])]);
    const suffixedName = node([
      node(),
      node([node([node([node([], "Legendary Rapier"), node(), node([], "of Slaughter")])]), node(), node()]),
    ]);

    expect(readShowEquipName(simpleName)).toBe("Oak Staff");
    expect(readShowEquipName(suffixedName)).toBe("Legendary Rapier of Slaughter");
  });

  it("fails closed for missing showequip name nodes", () => {
    expect(readShowEquipName(null)).toBe("无此物品");
    expect(readShowEquipName(node())).toBe("无此物品");
    expect(readShowEquipName(node([node(), node([node()])]))).toBe("无此物品");
  });
});
