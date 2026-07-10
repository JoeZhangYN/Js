import { describe, expect, it } from "vitest";
import { ArmoryPageFactsKind, readArmoryPageFacts } from "./hvut-armory-page-facts.js";

function page(html) {
  const doc = document.implementation.createHTMLDocument("");
  doc.documentElement.innerHTML = html;
  return doc;
}

describe("HVUT Armory page facts", () => {
  it("owns fetched script values without executing or borrowing the detached page scope", () => {
    delete globalThis.__armoryScriptExecuted;
    const doc = page(`
      <form id="equipform"></form>
      <div id="equiplist"><table><tbody>
        <tr onmouseover="hover_equip(17)"><td>Item</td><td>1,234 C</td></tr>
      </tbody></table></div>
      <script>
        var dynjs_eqstore = {"17":{"n":"Owned fact","d":"detail"}};
        globalThis.__armoryScriptExecuted = true;
      </script>
    `);

    const result = readArmoryPageFacts(doc, "sell");

    expect(result).toEqual({
      kind: ArmoryPageFactsKind.FACTS,
      facts: {
        dynjs_eqstore: { 17: { n: "Owned fact", d: "detail" } },
        eqitems: { 17: { c: 1234 } },
        itemdata: {},
      },
    });
    expect(globalThis.__armoryScriptExecuted).toBeUndefined();
  });

  it("treats an empty salvage category as a valid empty fact lifetime", () => {
    const doc = page('<form id="equipform"></form><div id="equiplist"></div>');

    expect(readArmoryPageFacts(doc, "salvage")).toEqual({
      kind: ArmoryPageFactsKind.FACTS,
      facts: { dynjs_eqstore: {}, eqitems: {}, itemdata: {} },
    });
  });

  it("rejects missing salvage facts only when equipment needs them", () => {
    const doc = page(`
      <form id="equipform"></form>
      <div id="equiplist"><table><tr onmouseover="hover_equip(17)"><td>Item</td></tr></table></div>
      <script>var itemdata = {};</script>
    `);

    expect(readArmoryPageFacts(doc, "salvage")).toEqual({
      kind: ArmoryPageFactsKind.REJECTED,
      failures: [{ stage: "scriptObjectMissing", detail: { name: "eqitems" } }],
    });
  });
});
