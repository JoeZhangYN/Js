import { describe, expect, it } from "vitest";
import { ArmoryCategoryStatus } from "./hvut-armory-integration.js";
import { createArmoryLoadingView } from "./hvut-armory-loading-view.js";

const categories = [{ key: "weapon_1handed" }, { key: "armor_heavy" }];

function body(table, dataset, text) {
  const node = table.createTBody();
  Object.assign(node.dataset, dataset);
  node.insertRow().insertCell().textContent = text;
  return node;
}

function setup() {
  const table = document.createElement("table");
  const original = body(table, { hvutArmoryCategory: "armor_heavy" }, "Heavy original");
  const view = createArmoryLoadingView({
    document,
    table,
    categoryOrder: categories.map((category) => category.key),
  });
  return { table, original, view };
}

describe("HVUT Armory loading view", () => {
  it("replaces the original row with ordered placeholders and reports serial progress", () => {
    const { table, view } = setup();

    view.begin({ categories, retrying: false });
    view.progress({ category: "weapon_1handed", status: ArmoryCategoryStatus.STAGED });

    expect(Array.from(table.tBodies).map((node) => node.dataset.hvutArmoryLoading)).toEqual([
      "weapon_1handed",
      "armor_heavy",
    ]);
    expect(table.tBodies[0].textContent).toBe("Loaded... [weapon_1handed]");
    expect(table.tBodies[1].textContent).toBe("Loading... [armor_heavy]");
  });

  it("restores the exact original table after an aborted integration", () => {
    const { table, original, view } = setup();
    view.begin({ categories, retrying: false });
    view.progress({ category: "armor_heavy", status: ArmoryCategoryStatus.FAILED });

    view.restore();

    expect(Array.from(table.tBodies)).toEqual([original]);
    expect(table.textContent).toBe("Heavy original");
  });

  it("only replaces and restores attempted failure rows during retry", () => {
    const { table, original, view } = setup();
    const failed = body(table, { hvutArmoryFailure: "weapon_1handed" }, "Failed");

    view.begin({ categories: [categories[0]], retrying: true });
    expect(table.contains(original)).toBe(true);
    expect(table.contains(failed)).toBe(false);

    view.restore();
    expect(table.contains(original)).toBe(true);
    expect(table.contains(failed)).toBe(true);
  });
});
