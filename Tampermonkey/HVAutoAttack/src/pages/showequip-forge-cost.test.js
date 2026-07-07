import { describe, expect, it } from "vitest";
import { readShowEquipName } from "./showequip-forge-cost.js";

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

  it("fails closed for missing showequip name nodes", () => {
    expect(readShowEquipName(null)).toBe("无此物品");
    document.body.innerHTML = "";
    expect(readShowEquipName(document.body)).toBe("无此物品");
    expect(readShowEquipName(showequipBody("<div></div><div></div>"))).toBe("无此物品");
  });
});
