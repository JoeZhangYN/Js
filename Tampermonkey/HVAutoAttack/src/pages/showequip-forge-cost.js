// file-size-gate: exempt 移植自 PriceForgedEquipment 独立脚本-自包含功能
// PriceForgedEquipment 合并版：在 showequip 页给每条强化加 tooltip + 总价 + Lv 预测 input。
// 算法源自 PriceForgedEquipment-Isekai 1.01 / PriceForgedEquipment-Persistent 1.02 (2022.12.20)。
// 数据走 src/data/forge-costs.js；isekai 路径选 FORGE_COSTS.isekai，否则 persistent。

import { gE, cE } from "../dom/query.js";
import { FORGE_COSTS } from "../data/forge-costs.js";

function pickConfig() {
  return window.location.pathname.includes("/isekai/")
    ? FORGE_COSTS.isekai
    : FORGE_COSTS.persistent;
}

function credit(credits) {
  if (credits >= 1000000) return (credits / 1000000).toFixed(2).replace(".00", "") + "m";
  if (credits >= 10000) return (credits / 1000).toFixed(2).replace(".00", "") + "k";
  return credits + "c";
}

function makeEmptyCost() {
  return { midGrade: 0, highGrade: 0, binding: 0, catalyst: 0, special: 0 };
}

function upgradeTotal(cost) {
  let total = 0;
  for (const k in cost) total += cost[k];
  return total;
}

function getRangeData(level, isDamage, cfg) {
  const table = isDamage ? cfg.rangesDamage : cfg.rangesNonDamage;
  for (const r in table) {
    if (r > level) return table[r];
  }
  return undefined;
}

function calculateUpgradeCost(upgradeLevel, bindingCost, basicMaterialCost, isDamage, cfg) {
  const cost = makeEmptyCost();
  for (let j = 0; j < upgradeLevel; j++) {
    const range = getRangeData(j, isDamage, cfg);
    if (!range) continue;
    cost.midGrade += range.midGradeQty * basicMaterialCost.midGrade;
    cost.highGrade += range.highGradeQty * basicMaterialCost.highGrade;
    cost.catalyst += range.catalystCost;
    cost.special += basicMaterialCost.special;
    if (j >= 5) cost.binding += bindingCost;
  }
  return cost;
}

function upgradeSummary(input, basicMaterialCost, maxLevel) {
  const summary = makeEmptyCost();
  for (const k in input) {
    summary.midGrade += input[k].midGrade;
    summary.highGrade += input[k].highGrade;
    summary.binding += input[k].binding;
    summary.catalyst += input[k].catalyst;
  }
  summary.special += basicMaterialCost.special * maxLevel;
  return summary;
}

function getEquipName(body) {
  if (typeof body.children[1] === "undefined") return "无此物品";
  const showequip = body.children[1];
  const nameDiv = showequip.children.length === 3
    ? showequip.children[0].children[0]
    : showequip.children[1].children[0];
  let name = nameDiv.children[0].textContent;
  if (nameDiv.children.length === 3) name += " " + nameDiv.children[2].textContent;
  return name;
}

function getBasicMaterialCost(materialCost) {
  const fullName = getEquipName(document.body);
  if (fullName.match(/Axe|Club|Rapier|Shortsword|Wakizashi|Estoc|Longsword|Mace|Katana/i)) return materialCost.metal;
  if (fullName.match(/Katalox|Redwood|Willow|Oak|Buckler|Kite/i)) return materialCost.wood;
  if (fullName.match(/Cotton/i)) return materialCost.cloth;
  if (fullName.match(/Leather/i)) return materialCost.leather;
  if (fullName.match(/Force/i)) return materialCost.force;
  if (fullName.match(/Phase/i)) return materialCost.phase;
  if (fullName.match(/Shade/i)) return materialCost.shade;
  if (fullName.match(/Power/i)) return materialCost.power;
  return materialCost.unknown;
}

function appendTitle(elem, titleStr, upgradeLvl, costObj, baseSummary, totalInvested) {
  let title = titleStr + " Lv." + upgradeLvl + "\n";
  if (baseSummary) {
    totalInvested[titleStr] = costObj;
    title += "中级材料 " + credit(costObj.midGrade) + "\n";
    title += "高级材料 " + credit(costObj.highGrade) + "\n";
    title += "绑定石 " + credit(costObj.binding) + "\n";
    title += "催化剂 " + credit(costObj.catalyst) + "\n";
    title += "特殊材料 " + credit(costObj.special) + "\n";
    title += "总计 " + credit(upgradeTotal(costObj));
  } else {
    // 预测模式：special 用 summary.special 替换（与上游一致）
    if (totalInvested[titleStr] && totalInvested.summary) {
      totalInvested[titleStr].special = totalInvested.summary.special;
    }
    const inv = totalInvested[titleStr] || makeEmptyCost();
    title += "中级材料 " + credit(costObj.midGrade) + " (" + credit(inv.midGrade) + ")\n";
    title += "高级材料 " + credit(costObj.highGrade) + " (" + credit(inv.highGrade) + ")\n";
    title += "绑定石 " + credit(costObj.binding) + " (" + credit(inv.binding) + ")\n";
    title += "催化剂 " + credit(costObj.catalyst) + " (" + credit(inv.catalyst) + ")\n";
    title += "特殊材料 " + credit(costObj.special) + " (" + credit(inv.special) + ")\n";
    title += "总计 " + credit(upgradeTotal(costObj)) + " (" + credit(upgradeTotal(inv)) + ")";
  }
  elem.title = title;
  elem.style = "cursor:help";
}

function outputSummary(equipment, output, basicMaterialCost, maxLevel, baseSummary, totalInvested) {
  if (Object.keys(output).length === 0) return;
  const summary = upgradeSummary(output, basicMaterialCost, maxLevel);
  const html = cE("div");
  html.id = "calccost";
  html.style = "margin:7px auto 2px; text-align:center";
  const header = cE("div");
  header.style = "font-weight:bold";
  header.innerHTML = "成本汇总:";
  html.appendChild(header);
  const mg = cE("span"); mg.className = "ep"; mg.innerHTML = "中级材料 " + credit(summary.midGrade); html.appendChild(mg);
  const hg = cE("span"); hg.className = "ep"; hg.innerHTML = " 高级材料 " + credit(summary.highGrade); html.appendChild(hg);
  const bi = cE("span"); bi.className = "ep"; bi.innerHTML = " 绑定石 " + credit(summary.binding); html.appendChild(bi);
  const ca = cE("span"); ca.className = "ep"; ca.innerHTML = "<br/> 催化剂 " + credit(summary.catalyst); html.appendChild(ca);
  const sp = cE("span"); sp.className = "ep"; sp.innerHTML = " 特殊材料 " + credit(summary.special); html.appendChild(sp);
  const tot = cE("p"); tot.style = "color:#F00";
  if (baseSummary) {
    totalInvested.summary = summary;
    tot.innerHTML = "总计 " + credit(upgradeTotal(summary));
  } else {
    tot.innerHTML = "总计 " + credit(upgradeTotal(summary)) + " (" + credit(upgradeTotal(totalInvested.summary)) + ")";
  }
  html.appendChild(tot);
  equipment.appendChild(html);
}

function calcCost(levelOverride, ctx) {
  const { upgrades, equipment, cfg, basicMaterialCost, totalInvested } = ctx;
  const output = {};
  let maxLevel = 0;
  let overrideLv = levelOverride;
  for (let i = 0; i < upgrades.length; i++) {
    let upgradeStr = upgrades[i].innerHTML;
    const upgradeIdentifier = upgradeStr.substring(0, upgradeStr.lastIndexOf(" "));
    const stat = cfg.mapping[upgradeIdentifier];
    if (!stat) continue;
    let upgradeLevel = parseInt(upgradeStr.substring(upgradeStr.lastIndexOf(" ") + 4, upgradeStr.length));
    if (stat[1] && overrideLv >= 100) overrideLv = 100;
    else if (!stat[1] && overrideLv >= 50) overrideLv = 50;
    if (overrideLv > 0) {
      upgradeLevel = overrideLv;
      upgradeStr = upgradeIdentifier + " Lv." + upgradeLevel;
    }
    const bindingCost = stat[0];
    const isDamage = stat[1];
    const costObj = calculateUpgradeCost(upgradeLevel, bindingCost, basicMaterialCost, isDamage, cfg);
    if (upgradeLevel > maxLevel) maxLevel = upgradeLevel;
    output[upgradeStr] = costObj;
    appendTitle(upgrades[i], upgradeIdentifier, upgradeLevel, costObj, levelOverride === -1, totalInvested);
  }
  outputSummary(equipment, output, basicMaterialCost, maxLevel, levelOverride === -1, totalInvested);
}

/**
 * showequip 页入口：扫 #eu span 强化条目，注入 tooltip + 总价 div + Lv 预测 input。
 * 已检测 isekai/persistent 路径自选价格；无强化条目（非传奇装备/普通页）自然 no-op。
 */
export function setupForgeCost() {
  const equipment = document.body;
  const upgrades = equipment.querySelectorAll("#eu span");
  if (!upgrades.length) return;

  const cfg = pickConfig();
  equipment.style = "height:425px";
  const basicMaterialCost = getBasicMaterialCost(cfg.materialCost);
  const ctx = { upgrades, equipment, cfg, basicMaterialCost, totalInvested: {} };

  // 预测 Lv 输入框（上游用 body.childNodes[3] 下的第一个 div；保留以保持外观一致）
  const anchorNode = equipment.childNodes[3];
  const anchorDiv = anchorNode && anchorNode.getElementsByTagName
    ? anchorNode.getElementsByTagName("div")[0]
    : null;
  if (anchorDiv) {
    const inp = cE("input");
    inp.size = 2;
    inp.onkeyup = function () {
      const existing = gE("calccost");
      if (existing) existing.remove();
      const toLevel = parseInt(this.value);
      if (isNaN(toLevel) || toLevel <= 0) {
        calcCost(-1, ctx);
        return;
      }
      calcCost(toLevel, ctx);
    };
    anchorDiv.appendChild(inp);
  }

  calcCost(-1, ctx);
}
