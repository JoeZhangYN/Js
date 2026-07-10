// Armory 维修页解析（PURE）：两世界共享同一 `eqitems + itemdata + postoken` 契约，
// 输出不携带 World。持有量、价格和库存由 material-shop 能力负责；本层只返回维修需求。

/** @typedef {{ matId: string|null, name: string, count: number }} RepairMaterial 维修所需单项材料（count=需求量） */
/** @typedef {{ id: string, conditionPct: number|null, materials: RepairMaterial[] }} RepairEquip */
/** @typedef {{ token: string|null, equips: RepairEquip[] }} RepairState */

// 护符料走替换而非维修，源头剔除。
const CHARM_MIN = 61900;
const CHARM_MAX = 64999;
const EVENT_PARSE_ARMORY = "parseArmory";

export const RepairStateParseEvent = Object.freeze({
  ARMORY: EVENT_PARSE_ARMORY,
});

const repairStateParseEventHandlers = Object.freeze({
  [EVENT_PARSE_ARMORY]: (event) => parseArmoryRepairState(event.pageText),
});

function parseScriptObject(text, name) {
  const marker = new RegExp(`\\b${name}\\s*=\\s*\\{`).exec(text);
  if (!marker) return {};
  const start = marker.index + marker[0].lastIndexOf("{");
  let depth = 0;
  for (let i = start; i < text.length; i += 1) {
    if (text[i] === "{") depth += 1;
    else if (text[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1));
        } catch {
          return {};
        }
      }
    }
  }
  return {};
}

/**
 * Armory 维修页解析。需修件 = eqitems 中有非空 .m 的件；材料 matId/name 由 itemdata 映射；
 * 护符料剔除。conditionPct=null（异世界维修页不直接给 %，用材料存在性判定需修）。
 * @param {string} pageText `?s=Bazaar&ss=am&screen=repair` 页原文
 * @returns {RepairState}
 */
function parseArmoryRepairState(pageText) {
  const text = pageText || "";
  const tokenMatch =
    text.match(/name=['"]postoken['"][^>]*value=['"]([^'"]+)['"]/) ||
    text.match(/value=['"]([^'"]+)['"][^>]*name=['"]postoken['"]/);
  const token = tokenMatch ? tokenMatch[1] : null;

  const eqitems = parseScriptObject(text, "eqitems");
  const itemdata = parseScriptObject(text, "itemdata");

  const equips = [];
  for (const eid of Object.keys(eqitems)) {
    const requires = eqitems[eid]?.m;
    if (!requires) continue;
    const materials = [];
    for (const matId of Object.keys(requires)) {
      const idNum = Number(matId);
      if (idNum >= CHARM_MIN && idNum <= CHARM_MAX) continue; // 护符料走替换，剔除
      const name = itemdata[matId]?.n ?? matId;
      materials.push({ matId, name, count: Number(requires[matId]) });
    }
    if (materials.length === 0) continue; // 仅护符损坏 → 不纳入自动维修
    equips.push({ id: String(eid), conditionPct: null, materials });
  }
  return { token, equips };
}

export function runRepairStateParser(event) {
  return repairStateParseEventHandlers[event?.type]?.(event);
}
