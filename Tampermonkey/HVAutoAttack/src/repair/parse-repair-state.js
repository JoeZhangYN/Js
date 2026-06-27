// 维修页解析（PURE）：两世界维修页 → 世界无关 RepairState。
//
// 两世界数据来源完全不同（维修后端端口的真实 bounded context 边界）：
//   主世界 Persistent：`?s=Forge&ss=re` 页内 `script[src*="/dynjs/"]`(dynjs) 拉回 JSON `{eid:{d:"...Condition..."}}`，
//     装备枚举 + 耐久 % 均取自此 JSON（`json[id].d` 文本 `Condition: X / Y (Z%)`）；
//     每件所需材料在页内 `[onclick*="set_forge_cost"]` 的 `Requires: Nx 料名, ...`（只有名、无 id/持有数）。
//   异世界 Isekai：`?s=Bazaar&ss=am&screen=repair` 页内联 `eqitems={eid:{m:{matId:需求}}}`
//     + `itemdata={matId:{n:名,c:持有}}` + `postoken`；**只有需修的件才有 .m**（满耐久件无 .m）。
//
// 关键统一：本层只产「需求材料(matId?/name/required count)」，**不取持有数**——持有量/价格/库存
// 一律由 material-shop 端口从商店页 `#item_pane`/`#shop_pane` 取（两世界同源），故无需在此解析持有。
// 故 RepairState.equips[].conditionPct：主世界 = 数值(0-100)、异世界 = null（异世界用「有无需求材料」
// 判定需修，见 decide-repair）。护符料 matId 61900-64999 在异世界源头剔除（与 HVUT charms_damaged 一致，
// 护符走「替换」非「维修」，不纳入自动买料/维修）。

/** @typedef {{ matId: string|null, name: string, count: number }} RepairMaterial 维修所需单项材料（count=需求量） */
/** @typedef {{ id: string, conditionPct: number|null, materials: RepairMaterial[] }} RepairEquip */
/** @typedef {{ isIsekai: boolean, token: string|null, equips: RepairEquip[] }} RepairState */

const CONDITION_RE = /Condition:\s*\d+\s*\/\s*\d+\s*\((\d+)%\)/;
// set_forge_cost(eid,'Requires: 5x 料名, 3x 料名') —— 主世界每件材料需求来源（容差单/双引号）。
const FORGE_COST_RE = /set_forge_cost\(\s*(\d+)\s*,\s*['"]Requires:\s*(.+?)['"]/g;
const REQ_ITEM_RE = /(\d+)\s*x\s+(.+)/;
// 护符料 id 区间（异世界）：走替换非维修，剔除。
const CHARM_MIN = 61900;
const CHARM_MAX = 64999;
const EVENT_PARSE_PERSISTENT = "parsePersistent";
const EVENT_PARSE_ISEKAI = "parseIsekai";

export const RepairStateParseEvent = Object.freeze({
  PERSISTENT: EVENT_PARSE_PERSISTENT,
  ISEKAI: EVENT_PARSE_ISEKAI,
});

/**
 * 解析「Requires: 5x A, 3x B」材料清单文本 → [{name,count}]。
 * 无 matId（主世界只有名）。无法解析项跳过（不崩）。
 * @param {string} requiresText
 * @returns {RepairMaterial[]}
 */
function parseRequiresList(requiresText) {
  const out = [];
  for (const part of requiresText.split(",")) {
    const m = part.trim().match(REQ_ITEM_RE);
    if (m) out.push({ matId: null, name: m[2].trim(), count: Number(m[1]) });
  }
  return out;
}

/**
 * 主世界维修页解析。装备枚举 + conditionPct 均来自 dynjs JSON；材料来自页内 set_forge_cost。
 * @param {Document} pageDoc `?s=Forge&ss=re` 页 document（仅用于扫 set_forge_cost 材料）
 * @param {string} dynjsText `script[src*="/dynjs/"]` 拉回的 JSON 原文（含 {id:{d:"...Condition..."}}）
 * @returns {RepairState}
 */
function parsePersistentRepairState(pageDoc, dynjsText) {
  // dynjs 形如 `<前缀> = {<装备 JSON>};`：按首/末花括号切片再 parse，鲁棒于变量名与换行
  // （替代旧 /\{.*\}/——换行即失效；语义对齐 HVUT load_dynjs 的「切前缀+末分号」）。
  let json = {};
  try {
    const text = dynjsText || "";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end > start) json = JSON.parse(text.slice(start, end + 1));
  } catch {
    json = {};
  }

  // 每件所需材料（set_forge_cost，best-effort；页无此数据则材料为空 → 走乐观维修+止损）。
  const materialsByEid = {};
  FORGE_COST_RE.lastIndex = 0;
  const pageHtml = pageDoc?.documentElement?.outerHTML || "";
  let fm;
  while ((fm = FORGE_COST_RE.exec(pageHtml)) !== null) {
    const reqText = fm[2];
    if (/Everything is fully repaired/i.test(reqText)) continue;
    materialsByEid[fm[1]] = parseRequiresList(reqText);
  }

  // 枚举装备 = dynjs JSON 的 keys（装备数据真实来源；当前装备集每件都在 dynjs，见 HVUT load_dynjs）。
  // 旧版用 `.eqp>[id]` DOM 选择器枚举，真实维修页无此结构 → 枚举 0 件 → 静默不修（主世界维修失效根因）。
  const equips = [];
  for (const id of Object.keys(json)) {
    const desc = json[id]?.d;
    const cm = typeof desc === "string" ? desc.match(CONDITION_RE) : null;
    if (!cm) continue; // 无耐久字段（不可解析）→ 跳过，不裸下标崩溃
    equips.push({
      id,
      conditionPct: Number(cm[1]),
      materials: materialsByEid[id] || [],
    });
  }
  return { isIsekai: false, token: null, equips };
}

/**
 * 异世界维修页解析。需修件 = eqitems 中有非空 .m 的件；材料 matId/name 由 itemdata 映射；
 * 护符料剔除。conditionPct=null（异世界维修页不直接给 %，用材料存在性判定需修）。
 * @param {string} pageText `?s=Bazaar&ss=am&screen=repair` 页原文
 * @returns {RepairState}
 */
function parseIsekaiRepairState(pageText) {
  const text = pageText || "";
  const tokenMatch =
    text.match(/name=['"]postoken['"][^>]*value=['"]([^'"]+)['"]/) ||
    text.match(/value=['"]([^'"]+)['"][^>]*name=['"]postoken['"]/);
  const token = tokenMatch ? tokenMatch[1] : null;

  let eqitems = {};
  let itemdata = {};
  try {
    const em = text.match(/eqitems\s*=\s*(\{.*?\});/);
    if (em) eqitems = JSON.parse(em[1]);
  } catch {
    eqitems = {};
  }
  try {
    const im = text.match(/itemdata\s*=\s*(\{.*?\});/);
    if (im) itemdata = JSON.parse(im[1]);
  } catch {
    itemdata = {};
  }

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
  return { isIsekai: true, token, equips };
}

export function runRepairStateParser(event) {
  if (event.type === EVENT_PARSE_PERSISTENT) {
    return parsePersistentRepairState(event.pageDoc, event.dynjsText);
  }
  if (event.type === EVENT_PARSE_ISEKAI) {
    return parseIsekaiRepairState(event.pageText);
  }
  return undefined;
}
