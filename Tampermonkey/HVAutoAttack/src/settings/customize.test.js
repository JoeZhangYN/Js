import { describe, expect, it } from "vitest";
import { readCustomizeInspectTarget } from "./customize.js";

function target({ className = "", id = "", onmouseover = null, src = "" } = {}) {
  return {
    className,
    id,
    src,
    getAttribute: (name) => (name === "onmouseover" ? onmouseover : null),
  };
}

describe("readCustomizeInspectTarget", () => {
  it("reads inspect labels from supported battle targets", () => {
    expect(readCustomizeInspectTarget(target({ className: "btsd", id: "101" }))).toBe("Skill Id: 101");
    expect(readCustomizeInspectTarget(target({ onmouseover: "common.show_itemc_box(222)" }))).toBe("Item Id: 222");
    expect(readCustomizeInspectTarget(target({ onmouseover: "equips.set(333)" }))).toBe("Equip Id: 333");
    expect(
      readCustomizeInspectTarget(
        target({ onmouseover: "battle.set_infopane_effect()", src: "https://hentaiverse.org/y/e/foo.png" })
      )
    ).toBe("Buff Img: foo");
  });

  it("fails closed for malformed inspect attributes", () => {
    expect(readCustomizeInspectTarget(target({ onmouseover: "common.show_itemc_box()" }))).toBeUndefined();
    expect(readCustomizeInspectTarget(target({ onmouseover: "equips.set()" }))).toBeUndefined();
    expect(readCustomizeInspectTarget(target({ onmouseover: "battle.set_infopane_effect()", src: "" }))).toBeUndefined();
    expect(readCustomizeInspectTarget(null)).toBeUndefined();
  });
});
