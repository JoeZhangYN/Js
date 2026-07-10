import { describe, expect, it } from "vitest";
import { FORGE_COSTS } from "../data/forge-costs.js";
import { registerTranslation } from "../i18n/core/restore-controller.js";
import {
  createForgeCostCapability,
  readShowEquipLogicalName,
  readShowEquipName,
} from "./showequip-forge-cost.js";

function showequipBody(innerHtml) {
  document.body.innerHTML = `<div id="navbar"></div><div id="showequip">${innerHtml}</div><div id="eu"><span>Damage Lv.1</span></div>`;
  return document.body;
}

describe("readShowEquipName", () => {
  it("reads showequip names from known page layouts", () => {
    const simpleName = showequipBody("<div></div><div><div><span>Oak Staff</span></div></div>");
    expect(readShowEquipName(simpleName)).toBe("Oak Staff");

    const suffixedName = showequipBody(
      "<div><div><span>Legendary Rapier</span><span></span><span>of Slaughter</span></div></div><div></div><div></div>"
    );
    expect(readShowEquipName(suffixedName)).toBe("Legendary Rapier of Slaughter");
  });

  it("prefers the showequip name surface over forge upgrade text", () => {
    const body = showequipBody(
      '<div><div><span>Peerless Katalox Staff</span><span></span><span>of Destruction</span></div></div><div id="eu"><span>Damage Lv.40</span></div>'
    );

    expect(readShowEquipName(body)).toBe("Peerless Katalox Staff of Destruction");
  });

  it("resolves translated name nodes back to English business identity", () => {
    const body = showequipBody("<div><div><span>传奇橡木法杖</span></div></div>");
    const textNode = body.querySelector("#showequip span").firstChild;
    registerTranslation(textNode, "Legendary Oak Staff");

    expect(readShowEquipLogicalName(body)).toBe("Legendary Oak Staff");
  });

  it("fails closed for missing showequip name nodes", () => {
    expect(readShowEquipName(null)).toBe("无此物品");
    document.body.innerHTML = "";
    expect(readShowEquipName(document.body)).toBe("无此物品");
    expect(readShowEquipName(showequipBody("<div></div><div></div>"))).toBe("无此物品");
  });
});

describe("createForgeCostCapability", () => {
  it("binds either world policy while preserving one context-free call shape", () => {
    document.body.innerHTML = "";
    const persistent = createForgeCostCapability(FORGE_COSTS.persistent);
    const isekai = createForgeCostCapability(FORGE_COSTS.isekai);

    expect(persistent.run()).toBeUndefined();
    expect(isekai.run()).toBeUndefined();
  });

  it("rejects incomplete world policies at composition time", () => {
    expect(() => createForgeCostCapability({})).toThrow(/complete world policy/);
  });
});
