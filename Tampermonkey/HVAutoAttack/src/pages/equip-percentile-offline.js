// file-size-gate: exempt 移植自 Percentage Ranges 独立脚本-自包含功能
// 离线装备百分位（移植自 Percentage Ranges.js, 1.1.9, 仅保留 Isekai 装备 popup hook）
// 改写：ES6 module / 无 jQuery / 无论坛 hover / 无 GM_setValue（state.showPercent 走 localStorage）
import { QUALITY_CONFIG, QUALITY_CN_MAP, QUALITY_EN_TO_CN } from "../data/equip-quality-ranges.js";
import {
  persistEquipmentPercentilePreference,
  recordEquipmentPercentilePreferenceReadFailure,
} from "./equip-percentile-failure.js";

const STORAGE_KEY_SHOW_PERCENT = "hvAA_equipPercentile_offline_showPercent";

const REGEX_VAL = /^(\d+(?:\.\d+)?)(?:\s+(.+))?$/;
const REGEX_BASE = /Base:\s*([+-]?[\d.]+)/i;
const REGEX_TIER = /Tier\s+(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)/i;
const REGEX_DAMAGE = /^(Magic|Attack|Void|Crushing|Piercing|Slashing) Damage/;

const CHARM_EXCLUSIVE_BONUS = ["HP Bonus", "MP Bonus", "Counter-parry"];

const KEY_TOGGLE = "f";
const KEY_FORGE = "w";

const state = {
  showPercent: true,
  showMaxForge: false,
};

/** @type {WeakMap<HTMLElement, any>} */
const equipMap = new WeakMap();

let popup = null;

function $sub(container, selector) {
  return container.querySelector(selector);
}
function $$all(selector) {
  return document.querySelectorAll(selector);
}
function elc(tag, props, children) {
  const e = document.createElement(tag);
  if (props) {
    for (const k in props) {
      const v = props[k];
      if (v === undefined || v === null || v === false) continue;
      if (k === "style" && typeof v === "object") Object.assign(e.style, v);
      else if (k.startsWith("on") && typeof v === "function") e[k.toLowerCase()] = v;
      else if (k in e) e[k] = v;
      else e.setAttribute(k, String(v));
    }
  }
  if (children && children.length) {
    for (const c of children) {
      if (c != null && typeof c !== "boolean") {
        e.append(typeof c === "number" ? String(c) : c);
      }
    }
  }
  return e;
}

function parseEquip(container) {
  if ($sub(container, ".hv-lpr-avg")) return;
  const eq = $sub(container, ".eq");
  const eqt = $sub(container, ".eqt");
  if (!eq || !eqt) return;

  const title = container.firstElementChild?.textContent.trim();
  if (!title) return;

  const entries = Object.entries(QUALITY_CONFIG);
  // 标题可能被汉化（✪传奇✪…）：先按英文品质词匹配，失配再按 QUALITY_CN_MAP 中文键兜底（逻辑值仍走英文 key）
  let found = entries.find(([key]) => title.startsWith(key));
  if (!found) {
    const cn = Object.entries(QUALITY_CN_MAP).find(([cnKey]) => title.startsWith(cnKey));
    if (cn) found = entries.find(([key]) => key === cn[1]);
  }
  if (!found) return;
  const [quality, { range, cap }] = found;

  const stats = [];
  const rows = [
    ...eq.querySelectorAll(".ex > div, .ep > div"),
    ...Array.from(eq.querySelectorAll('[title^="Base: "]')).filter((el) => !el.closest(".ex, .ep")),
  ];

  for (const row of rows) {
    const span = row.querySelector("span");
    if (!span) continue;
    const match = span.textContent.trim().match(REGEX_VAL);
    if (!match) continue;
    const [, valStr, typeText] = match;
    const name = typeText || row.firstElementChild?.textContent.trim();
    if (!name) continue;
    const baseMatch = row.getAttribute("title")?.match(REGEX_BASE);
    const prefixNode = span.previousSibling;
    const suffixNode = span.parentNode?.nextSibling || null;
    stats.push({
      title: name,
      val: parseFloat(valStr),
      valStr,
      base: baseMatch ? parseFloat(baseMatch[1]) : null,
      rate: REGEX_DAMAGE.test(name) ? 2 : 1,
      prefix: prefixNode?.nodeType === 3 ? prefixNode.textContent : "",
      suffix: suffixNode?.textContent || null,
      typeText,
      _el: span,
      _preNode: prefixNode,
      _sufNode: suffixNode,
    });
  }

  const avg = elc("div", {
    class: "hv-lpr-avg",
    style: container.closest("#popup_box")
      ? "position: absolute; bottom: 4px; left: 0; right: 0; text-align :center;"
      : undefined,
  });
  container.appendChild(avg);

  const tierMatch = eqt.textContent.match(REGEX_TIER);
  const equip = {
    title,
    quality,
    range,
    stats,
    _eq: eq,
    _avg: avg,
    ...(tierMatch
      ? {
          type: "Soulbound",
          tier_up: +tierMatch[1],
          tier_iw: +tierMatch[2],
          tier_max: +tierMatch[3],
          forge_max: +tierMatch[3] * 2,
          _eqt: eqt,
        }
      : {
          type: "Tradeable",
          level: +(eqt.textContent.match(/Level (\d+)/i)?.[1] || 0),
          forge_max: cap,
        }),
  };

  equipMap.set(container, equip);

  const excludePatterns = [
    "?s=Character&ss=eq",
    "?s=Battle&ss=iw",
    "?s=Bazaar&ss=am&screen=modify&",
  ];
  const showCompare =
    /\/equip(?:\/|$)/.test(location.pathname) ||
    (document.getElementById("equipinfo")?.contains(container) &&
      location.search !== "" &&
      excludePatterns.every((pattern) => !location.search.includes(pattern)));

  if (showCompare) {
    const select = elc(
      "select",
      {
        id: "hv-quality-compare",
        onchange: () => renderEquip(container, select.value),
      },
      Object.keys(QUALITY_CONFIG).map((k) =>
        elc("option", { value: k, selected: k === quality }, [QUALITY_EN_TO_CN[k] || k])
      )
    );
    equip._compare = container.appendChild(
      elc("div", { style: "padding: 6px; border-top: 1px solid #A47C78;" }, [
        elc("b", {}, ["与其他稀有度对比: "]),
        select,
      ])
    );
  }

  renderEquip(container, null);
}

function parseEquipmentSurfaces(node) {
  if (!(node instanceof HTMLElement)) return;

  const showEquip = node.matches(".showequip") ? node : node.closest(".showequip");
  if (showEquip) parseEquip(showEquip);
  node.querySelectorAll(".showequip").forEach(parseEquip);

  const popupSurface = node.matches("#popup_box") ? node : node.closest("#popup_box");
  if (popupSurface?.style.visibility === "visible") parseEquip(popupSurface);

  const equipInfoSurface = node.matches("#equipinfo") ? node : node.closest("#equipinfo");
  if (equipInfoSurface) parseEquip(equipInfoSurface);
}

function getColor(percent, max = 70, min = 30) {
  return percent >= max ? "hv-txt-green" : percent <= min ? "hv-txt-red" : "hv-txt-mid";
}

function renderEquip(container, compareQuality) {
  const equip = equipMap.get(container);
  if (!equip) return;
  const { showPercent, showMaxForge } = state;

  if (equip.type === "Soulbound") {
    const { tier_up: up, tier_iw: iw, tier_max: max } = equip;
    if (showMaxForge && (max - up > 0 || max - iw > 0)) {
      const diffX = max - up > 0 ? `${up}<span class="hv-txt-green">+${max - up}</span>` : max;
      const diffY = max - iw > 0 ? `${iw}<span class="hv-txt-green">+${max - iw}</span>` : max;
      equip._eqt.innerHTML = `Tier ${diffX} / ${diffY} / ${max}`;
    } else {
      equip._eqt.textContent = `Tier ${up} / ${iw} / ${max}`;
    }
  }

  let totalPercent = 0;
  let statCount = 0;

  let realKey = compareQuality;
  if (realKey && QUALITY_CN_MAP[realKey]) realKey = QUALITY_CN_MAP[realKey];
  const [min, max] = compareQuality ? QUALITY_CONFIG[realKey].range : equip.range;

  const forgeCurrent = equip.type === "Soulbound" ? equip.tier_up + equip.tier_iw : 0;

  for (const stat of equip.stats) {
    const el = stat._el;
    el.classList.remove("hv-txt-red", "hv-txt-green", "hv-txt-mid");

    let percent = null;
    if (stat.base !== null) {
      const span = max - min || 30;
      percent = parseFloat((((stat.base - (max - span)) / span) * 100).toFixed(1));
      totalPercent += percent;
      statCount++;
    }

    const isForgeMode =
      showMaxForge && equip.forge_max > forgeCurrent && !CHARM_EXCLUSIVE_BONUS.includes(stat.title);
    const isPercentMode = showPercent && !isForgeMode && percent !== null;
    const hideSurrounding = isForgeMode || isPercentMode;

    if (stat._preNode) {
      stat._preNode.textContent = hideSurrounding ? "" : stat.prefix;
    }
    if (stat._sufNode && !stat.typeText) {
      stat._sufNode.textContent = hideSurrounding ? "" : stat.suffix;
    }

    const typeText = stat.typeText ? ` ${stat.typeText}` : "";

    if (isForgeMode) {
      const maxVal =
        (stat.val * (1 + (equip.forge_max * stat.rate) / 100)) /
        (1 + (forgeCurrent * stat.rate) / 100);
      const gainText = Math.round((maxVal - stat.val) * 100) / 100;
      el.innerHTML = `${stat.valStr}<span class="hv-txt-green">+${gainText}</span>${typeText}`;
    } else if (isPercentMode && percent !== null) {
      el.textContent = `${percent}%${typeText}`;
      el.classList.add(getColor(percent));
    } else {
      el.textContent = `${stat.valStr}${typeText}`;
    }
  }

  if (equip._avg) {
    if (statCount > 0) {
      const avg = parseFloat((totalPercent / statCount).toFixed(1));
      const mode = showMaxForge
        ? "最大强化(按W返回F切换)"
        : showPercent
          ? "百分比(按F返回W切换)"
          : "数值(按F返回W切换)";
      equip._avg.innerHTML =
        `<div class="${getColor(avg, 60, 40)}" style="margin-bottom: 4px;">优秀度: ${avg}%</div>` +
        `<div style="font-size: 12px;" title="热键: f, w">显示模式: ${mode}</div>`;
    } else {
      equip._avg.textContent = "";
    }
  }
}

function renderAll() {
  if (popup?.style.visibility === "visible") renderEquip(popup, null);
  $$all(".showequip").forEach((el) => {
    const select = el.querySelector("select");
    renderEquip(el, select ? select.value : null);
  });
}

function actionTogglePercent() {
  if (state.showMaxForge) state.showMaxForge = false;
  state.showPercent = !state.showPercent;
  persistEquipmentPercentilePreference(STORAGE_KEY_SHOW_PERCENT, state.showPercent);
  renderAll();
}

function actionToggleForge() {
  state.showMaxForge = !state.showMaxForge;
  if (state.showMaxForge) state.showPercent = false;
  renderAll();
}

function isValidKey(e) {
  if (e.repeat || e.ctrlKey || e.altKey || e.metaKey) return false;
  const target = e.target;
  if (!target) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return false;
  return true;
}

function injectStyle() {
  const css = `
    .hv-lpr-avg { padding: 2px; font-size:12px; font-weight: bold; }
    .hv-txt-red { color: #f03939ff; }
    .hv-txt-green { color: #0ab844ff; }
    .hv-txt-mid { color: #1d3271ff; }
  `;
  const styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);
  return styleEl;
}

let activeDisposer = null;

function restoreEquip(container) {
  const equip = equipMap.get(container);
  if (!equip) return;
  if (equip.type === "Soulbound") {
    equip._eqt.textContent = `Tier ${equip.tier_up} / ${equip.tier_iw} / ${equip.tier_max}`;
  }
  for (const stat of equip.stats) {
    stat._el.classList.remove("hv-txt-red", "hv-txt-green", "hv-txt-mid");
    stat._el.textContent = `${stat.valStr}${stat.typeText ? ` ${stat.typeText}` : ""}`;
    if (stat._preNode) stat._preNode.textContent = stat.prefix;
    if (stat._sufNode && !stat.typeText) stat._sufNode.textContent = stat.suffix;
  }
  equip._avg?.remove();
  equip._compare?.remove();
  equipMap.delete(container);
}

export function runOfflineEquipPercentileEnhancement() {
  if (activeDisposer) return activeDisposer;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY_SHOW_PERCENT);
    if (stored !== null) state.showPercent = JSON.parse(stored);
  } catch (error) {
    recordEquipmentPercentilePreferenceReadFailure(STORAGE_KEY_SHOW_PERCENT, error);
  }

  const style = injectStyle();

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "childList") {
        parseEquipmentSurfaces(m.target);
        m.addedNodes.forEach(parseEquipmentSurfaces);
      } else if (m.type === "attributes" && m.attributeName === "style") {
        parseEquipmentSurfaces(m.target);
      }
    }
  });

  popup = document.getElementById("popup_box");
  if (popup) observer.observe(popup, { attributes: true, childList: true, subtree: true });

  const equipInfo = document.getElementById("equipinfo");
  if (equipInfo) observer.observe(equipInfo, { childList: true, subtree: true });

  document.querySelectorAll(".showequip").forEach(parseEquip);

  const handleKeydown = (e) => {
    if (!isValidKey(e)) return;
    const key = e.key.toLowerCase();
    if (key === KEY_TOGGLE) {
      e.preventDefault();
      actionTogglePercent();
    } else if (key === KEY_FORGE) {
      e.preventDefault();
      actionToggleForge();
    }
  };
  document.addEventListener("keydown", handleKeydown, true);

  activeDisposer = () => {
    observer.disconnect();
    document.removeEventListener("keydown", handleKeydown, true);
    const containers = new Set(document.querySelectorAll(".showequip"));
    if (popup) containers.add(popup);
    containers.forEach(restoreEquip);
    style.remove();
    popup = null;
    activeDisposer = null;
  };
  return activeDisposer;
}
