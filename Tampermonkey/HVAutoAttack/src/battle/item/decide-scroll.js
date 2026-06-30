import { checkCondition } from "../../settings/condition-eval.js";
import { isScrollCoveredByPlayerBuffs } from "./scroll-coverage.js";

function emptyScrollPlan() {
  return { kind: "item-plan", plan: { type: "scroll", candidates: [] } };
}

/**
 * 复刻 useScroll。遍历 scrollLib，对每张卷轴：启用 + 条件满足 + 对应 buff（j=1..mult）全部未上
 * → 收集为候选 item id（保持声明顺序）。原 DOM buff 探测改读 event.playerBuffs 子串匹配。
 * @param {object} event
 * @returns {import("../../core/types.js").ActionResult} { kind:"item-plan", plan }
 */
export function decideScroll(event = {}) {
  const opt = event.opt || {};
  if (!opt.scrollSwitch || !opt.scroll) return emptyScrollPlan();
  if (!checkCondition(opt.scrollCondition, event.conditionFacts)) return emptyScrollPlan();
  if (!opt.scrollRoundType || !opt.scrollRoundType[event.roundType]) return emptyScrollPlan();
  const candidates = [];
  for (const i in SCROLL_LIB) {
    const lib = SCROLL_LIB[i];
    if (!(opt.scroll[i] && checkCondition(opt[`scroll${i}Condition`], event.conditionFacts))) {
      continue;
    }
    if (!isScrollCoveredByPlayerBuffs(event, lib, { scrollFirst: opt.scrollFirst })) {
      candidates.push(lib.id);
    }
  }
  return { kind: "item-plan", plan: { type: "scroll", candidates } };
}

/** 卷轴库（从 item.js useScroll 内联 scrollLib 原样复制）。 */
const SCROLL_LIB = Object.freeze({
  Go: Object.freeze({
    name: "Scroll of the Gods",
    id: 13299,
    mult: "3",
    img1: "absorb",
    img2: "shadowveil",
    img3: "sparklife",
  }),
  Av: Object.freeze({
    name: "Scroll of the Avatar",
    id: 13199,
    mult: "2",
    img1: "haste",
    img2: "protection",
  }),
  Pr: Object.freeze({
    name: "Scroll of Protection",
    id: 13111,
    mult: "1",
    img1: "protection",
  }),
  Sw: Object.freeze({
    name: "Scroll of Swiftness",
    id: 13101,
    mult: "1",
    img1: "haste",
  }),
  Li: Object.freeze({
    name: "Scroll of Life",
    id: 13221,
    mult: "1",
    img1: "sparklife",
  }),
  Sh: Object.freeze({
    name: "Scroll of Shadows",
    id: 13211,
    mult: "1",
    img1: "shadowveil",
  }),
  Ab: Object.freeze({
    name: "Scroll of Absorption",
    id: 13201,
    mult: "1",
    img1: "absorb",
  }),
});
