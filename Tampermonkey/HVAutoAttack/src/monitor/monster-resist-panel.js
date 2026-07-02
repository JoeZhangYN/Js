// 怪物九抗面板：战斗中按怪名查库展示九抗。本期纯展示，不接攻击决策。
// 配色语义：抗性高(+)=红(难打) / 弱点(-)=绿(好打) / 0=灰。
import { gE, cE } from "../dom/query.js";
import { RESIST_KEYS } from "../data/monster-db.js";
import {
  MonsterResistPanelModelEvent,
  runMonsterResistPanelModel,
} from "./monster-resist-panel-model.js";

const RESIST_LABEL = {
  fire: "火",
  cold: "冰",
  elec: "雷",
  wind: "风",
  holy: "圣",
  dark: "暗",
  crushing: "钝",
  slashing: "斩",
  piercing: "刺",
};
const EVENT_REFRESH = "refresh";

export const MonsterResistPanelEvent = Object.freeze({
  REFRESH: EVENT_REFRESH,
});

let styleInjected = false;

const esc = (s) =>
  String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

function makeDeps(deps) {
  return {
    cE: deps.cE || cE,
    document: deps.document || document,
    gE: deps.gE || gE,
    readRows:
      deps.readRows ||
      ((monsterNames) =>
        runMonsterResistPanelModel(
          { type: MonsterResistPanelModelEvent.BUILD_ROWS, monsterNames },
          deps
        )),
  };
}

function injectStyle(deps) {
  if (styleInjected) return;
  styleInjected = true;
  const style = deps.cE("style");
  style.textContent = `
    #hvAAResist { font-size: 10px; margin-top: 4px; max-width: 380px; line-height: 1.4; }
    .hvAAResistRow { padding: 1px 0; border-top: 1px solid rgba(0,0,0,.15); white-space: nowrap; }
    .hvAAResistCell { display: inline-block; min-width: 30px; text-align: center; }
    .hvAAResistCell.r-pos { color: #c00; }
    .hvAAResistCell.r-neg { color: #090; }
    .hvAAResistCell.r-zero { color: #999; }
    .hvAAResistNone { color: #999; }
  `;
  deps.document.head.appendChild(style);
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
async function renderResistPanel(deps) {
  injectStyle(deps);
  let panel = deps.gE("#hvAAResist");
  if (!panel) {
    const box = deps.gE("#hvAABox2");
    if (!box) return;
    panel = box.appendChild(deps.cE("div"));
    panel.id = "hvAAResist";
  }
  const els = [...deps.gE("div.btm1", "all")];
  const monsterNames = els.map((el) => deps.gE(".btm3", el)?.textContent || "");
  const rows = (await deps.readRows(monsterNames)).map((row) => renderRow(row.name, row.info));
  panel.innerHTML = rows.join("") || "<div class='hvAAResistNone'>无怪物</div>";
}

const resistPanelEventHandlers = Object.freeze({
  [EVENT_REFRESH]: (_event, deps) => renderResistPanel(makeDeps(deps)),
});

export function runMonsterResistPanelAutomation(event = { type: EVENT_REFRESH }, deps = {}) {
  return resistPanelEventHandlers[event?.type]?.(event, deps) ?? false;
}
