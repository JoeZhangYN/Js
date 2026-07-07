import { checkCondition } from "../../settings/condition-eval.js";
import { BATTLE_SCROLL_OPTIONS } from "../../data/battle-scrolls.js";
import { BattleScrollCoverageEvent, runBattleScrollCoverage } from "./scroll-coverage.js";

const EVENT_DECIDE = "decide";

export const BattleScrollDecisionEvent = Object.freeze({
  DECIDE: EVENT_DECIDE,
});

const battleScrollDecisionEventHandlers = Object.freeze({
  [EVENT_DECIDE]: decideScroll,
});

function emptyScrollPlan() {
  return { kind: "item-plan", plan: { type: "scroll", candidates: [] } };
}

/**
 * 复刻 useScroll。遍历 scrollLib，对每张卷轴：启用 + 条件满足 + 对应 buff（j=1..mult）全部未上
 * → 收集为候选 item id（保持声明顺序）。原 DOM buff 探测改读 event.playerBuffs 子串匹配。
 * @param {object} event
 * @returns {import("../../core/types.js").ActionResult} { kind:"item-plan", plan }
 */
function decideScroll(event = {}) {
  const opt = event.opt || {};
  if (!opt.scrollSwitch || !opt.scroll) return emptyScrollPlan();
  if (!checkCondition(opt.scrollCondition, event.conditionFacts)) return emptyScrollPlan();
  if (!opt.scrollRoundType || !opt.scrollRoundType[event.roundType]) return emptyScrollPlan();
  const candidates = [];
  for (const scroll of BATTLE_SCROLL_OPTIONS) {
    if (
      !(
        opt.scroll[scroll.key] &&
        checkCondition(opt[`scroll${scroll.key}Condition`], event.conditionFacts)
      )
    ) {
      continue;
    }
    if (
      !runBattleScrollCoverage({
        type: BattleScrollCoverageEvent.READ_COVERAGE,
        state: event,
        scrollSpec: scroll,
        options: { scrollFirst: opt.scrollFirst },
      })
    ) {
      candidates.push(scroll.itemId);
    }
  }
  return { kind: "item-plan", plan: { type: "scroll", candidates } };
}

export function runBattleScrollDecision(event = { type: EVENT_DECIDE }) {
  return battleScrollDecisionEventHandlers[event?.type]?.(event) ?? emptyScrollPlan();
}
