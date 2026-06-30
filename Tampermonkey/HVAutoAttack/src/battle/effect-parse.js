// HV buff/debuff effect 图标解析 SSOT。
// 把一个 effect <img>（玩家 #pane_effects 或怪物 .btm6 容器内）的 onmouseover
// 解析为「剩余回合数」与「effect 名」。收敛此前散落在
// snapshot.js / buff.js / condition-eval.js / critical-buff-guard.js 的多套
// 略有差异的内联正则，统一「无法解析 / 永续 → Infinity」语义，消除语义漂移。
//
// onmouseover 形如：battle.set_infopane_effect(this, 'Buff Name', 12)
//                 或：battle.set_infopane_effect(this, 'Buff Name', 'autocast')
// 第 3 参 = 剩余回合：数字 → 回合数；'autocast'/'permanent'/任意带引号串 → Infinity。

/** effect 第 3 参（剩余回合）正则：捕获末尾 `, X)` 里的 X。 */
const EFFECT_TURN_RE = /\(.*,.*, (.*?)\)$/;
/** effect 名正则：第一个单引号包裹的串。 */
const EFFECT_NAME_RE = /'(.*?)'/;
const EVENT_READ_EFFECT = "readEffect";

export const BattleEffectParseEvent = Object.freeze({
  READ_EFFECT: EVENT_READ_EFFECT,
});

const battleEffectParseEventHandlers = Object.freeze({
  [EVENT_READ_EFFECT]: (event) => readEffect(event.img),
});

function readEffect(img) {
  return {
    name: parseEffectName(img),
    turns: parseEffectTurns(img),
  };
}

/**
 * 解析 effect img 的剩余回合数。
 * 解析失败 / 永续（autocast/permanent 等带引号串）统一返 Infinity
 * （保守：buff 已存在时不误判过期，省 MP；真过期时 img 整个会从 DOM 移除）。
 * @param {Element} img
 * @returns {number}
 */
function parseEffectTurns(img) {
  const onmouseover = img.getAttribute("onmouseover");
  if (!onmouseover) return Infinity;
  const m = onmouseover.match(EFFECT_TURN_RE);
  if (!m) return Infinity;
  const v = m[1].trim();
  if (v.startsWith("'") || v.startsWith('"')) return Infinity;
  const n = parseInt(v);
  return isNaN(n) ? Infinity : n;
}

/**
 * 解析 effect img 的 effect 名（onmouseover 第一个单引号串）。
 * @param {Element} img
 * @returns {string} 名字；无法解析返 ""。
 */
function parseEffectName(img) {
  const onmouseover = img.getAttribute("onmouseover");
  if (!onmouseover) return "";
  const m = onmouseover.match(EFFECT_NAME_RE);
  return m ? m[1] : "";
}

export function runBattleEffectParse(event = { type: EVENT_READ_EFFECT }) {
  return battleEffectParseEventHandlers[event.type]?.(event);
}
