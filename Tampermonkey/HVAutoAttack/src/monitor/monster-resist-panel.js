// 怪物九抗面板：战斗中按怪名查库展示九抗。本期纯展示，不接攻击决策。
// 配色语义：抗性高(+)=红(难打) / 弱点(-)=绿(好打) / 0=灰。
import { gE, cE } from "../dom/query.js";
import { g } from "../state/store.js";
import { RESIST_KEYS } from "../data/monster-db.js";
import { primeMonsterCache, getCachedMonster } from "../state/monster-cache.js";

const RESIST_LABEL = {
  fire: "火", cold: "冰", elec: "雷", wind: "风", holy: "圣",
  dark: "暗", crushing: "钝", slashing: "斩", piercing: "刺",
};

let styleInjected = false;

const esc = (s) =>
  String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

function injectStyle() {
  if (styleInjected) return;
  styleInjected = true;
  const style = cE("style");
  style.textContent = `
    #hvAAResist { font-size: 10px; margin-top: 4px; max-width: 380px; line-height: 1.4; }
    .hvAAResistRow { padding: 1px 0; border-top: 1px solid rgba(0,0,0,.15); white-space: nowrap; }
    .hvAAResistCell { display: inline-block; min-width: 30px; text-align: center; }
    .hvAAResistCell.r-pos { color: #c00; }
    .hvAAResistCell.r-neg { color: #090; }
    .hvAAResistCell.r-zero { color: #999; }
    .hvAAResistNone { color: #999; }
  `;
  document.head.appendChild(style);
}

function renderRow(name, info) {
  const head = `<b>${esc(name)}</b>`;
  if (!info) {
    return `<div class="hvAAResistRow">${head} <span class="hvAAResistNone">待 scan</span></div>`;
  }
  const cells = RESIST_KEYS.map((k) => {
    const v = info[k];
    const cls = v > 0 ? "r-pos" : v < 0 ? "r-neg" : "r-zero";
    return `<span class="hvAAResistCell ${cls}">${RESIST_LABEL[k]}${v > 0 ? "+" : ""}${v}</span>`;
  }).join("");
  return `<div class="hvAAResistRow">${head}(${esc(info.attack)}) ${cells}</div>`;
}

/**
 * 渲染/刷新九抗面板（读当前每怪名查库）。抗性不随血量变，每 round 刷一次即可。
 */
export async function renderResistPanel() {
  injectStyle();
  let panel = gE("#hvAAResist");
  if (!panel) {
    const box = gE("#hvAABox2");
    if (!box) return;
    panel = box.appendChild(cE("div"));
    panel.id = "hvAAResist";
  }
  const els = [...gE("div.btm1", "all")];
  // 怪物身份键 = monsterId（开局 spawn 行 → monsterStatus）。按 order 取 MID（不能用数组下标——
  // 本面板也会在 main() countMonsterHP 把 monsterStatus 按 finWeight sort 后被 scan 回调触发，
  // 故按 order 字段映射，DOM `.btm1` 第 i 个 = order i）。
  const idByOrder = new Map((g("monsterStatus") || []).map((s) => [s.order, s.monsterId]));
  // 预取本轮怪 MID 画像进内存 cache：供本面板渲染 + collectSnapshot(同步) join（路径 B 预取时机）
  await primeMonsterCache(els.map((_, i) => idByOrder.get(i)));
  const rows = [];
  els.forEach((el, i) => {
    const name = gE(".btm3", el)?.textContent;
    if (!name) return;
    rows.push(renderRow(name, getCachedMonster(idByOrder.get(i)))); // 名仅显示，画像按 MID 查
  });
  panel.innerHTML = rows.join("") || "<div class='hvAAResistNone'>无怪物</div>";
}
