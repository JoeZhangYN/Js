export const ArmoryPageFactsKind = Object.freeze({
  FACTS: "facts",
  REJECTED: "rejected",
});

function emptyFacts() {
  return { dynjs_eqstore: {}, eqitems: {}, itemdata: {} };
}

function equipmentRows(doc) {
  return Array.from(
    doc?.querySelectorAll?.('#equiplist > table tr[onmouseover*="hover_equip"]') || []
  );
}

function readScriptObject(scriptText, name, required, failures) {
  let value;
  try {
    const match = new RegExp(`(?:(?:var|let|const) )?${name}\\s?=\\s?(\\{.*?\\});`).exec(
      scriptText
    );
    value = JSON.parse(match?.[1] || "null");
  } catch (error) {
    if (required) {
      failures.push({
        stage: "scriptObjectParseFailed",
        detail: { name, error: error?.message || String(error) },
      });
    }
    return {};
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    if (required) failures.push({ stage: "scriptObjectMissing", detail: { name } });
    return {};
  }
  return value;
}

function readSellPrices(rows, failures) {
  const eqitems = {};
  for (const row of rows) {
    const eid = /hover_equip\((\d+)/.exec(row.getAttribute("onmouseover") || "")?.[1];
    const price = Number.parseInt((row.lastElementChild?.textContent || "").replace(/\D/g, ""));
    if (!eid || !Number.isFinite(price)) {
      failures.push({
        stage: "sellPriceMissing",
        detail: { eid: eid || null, text: row.lastElementChild?.textContent || "" },
      });
      continue;
    }
    eqitems[eid] = { c: price };
  }
  return eqitems;
}

export function readArmoryPageFacts(doc, screen) {
  const rows = equipmentRows(doc);
  const hasEquipment = rows.length > 0;
  const script = doc?.querySelector?.("#equipform ~ script:last-child");
  if (!script) {
    if (!hasEquipment) return { kind: ArmoryPageFactsKind.FACTS, facts: emptyFacts() };
    return {
      kind: ArmoryPageFactsKind.REJECTED,
      failures: [{ stage: "scriptMissing", detail: {} }],
    };
  }

  const failures = [];
  const scriptText = script.textContent || "";
  const facts = {
    dynjs_eqstore: readScriptObject(
      scriptText,
      "dynjs_eqstore",
      hasEquipment && screen === "purchase",
      failures
    ),
    eqitems: readScriptObject(
      scriptText,
      "eqitems",
      hasEquipment && screen !== "sell",
      failures
    ),
    itemdata: readScriptObject(scriptText, "itemdata", false, failures),
  };
  if (screen === "sell" && !Object.keys(facts.eqitems).length) {
    facts.eqitems = readSellPrices(rows, failures);
  }
  if (failures.length) return { kind: ArmoryPageFactsKind.REJECTED, failures };
  return { kind: ArmoryPageFactsKind.FACTS, facts };
}
