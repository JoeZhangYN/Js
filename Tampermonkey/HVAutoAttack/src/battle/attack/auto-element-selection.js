// PURE: 按怪物九抗选自动攻击元素（autoElement，默认关）。choose 弱点(resists 最负 = 最易破)元素。
// 缺 resists(未 scan/库无该怪) → null → 调用方回退 snap.attackStatus（零行为变化，安全降级）。
// element 编码对齐 spell-lib / attackStatus：1=Fire 2=Cold 3=Elec 4=Wind 5=Holy 6=Dark。
// 把"数据库九抗"接进攻击决策（原 resist-panel 仅显示、决策不消费 → 孤岛接通 live consumer）。

const ELEMENT_TO_STATUS = Object.freeze({ fire: 1, cold: 2, elec: 3, wind: 4, holy: 5, dark: 6 });
const DEFAULT_POOL = Object.freeze(["fire", "cold", "elec", "wind", "holy", "dark"]);
const EVENT_SELECT = "select";

export const AutoElementSelectionEvent = Object.freeze({
  SELECT: EVENT_SELECT,
});

const autoElementSelectionEventHandlers = Object.freeze({
  [EVENT_SELECT]: (event) => selectAutoElement(event.target, event.opt),
});

/**
 * 选目标怪最弱抗性对应的攻击属性编码。
 * @param {import("../../core/types.js").UnifiedMonster} target 首怪（视图）
 * @param {object} opt opt.autoElementPool 可选限定玩家可用元素(默认全 6)
 * @returns {{element: (1|2|3|4|5|6|null)}} 弱点元素编码；缺 resists/无候选 → null
 */
function selectAutoElement(target, opt) {
  if (!target || !target.resists) return { element: null };
  const pool =
    opt && opt.autoElementPool && opt.autoElementPool.length ? opt.autoElementPool : DEFAULT_POOL;
  let bestEl = null;
  let bestResist = Infinity;
  for (const el of pool) {
    const r = target.resists[el];
    if (r === undefined || r === null) continue;
    if (r < bestResist) {
      bestResist = r;
      bestEl = el;
    }
  }
  return { element: bestEl ? ELEMENT_TO_STATUS[bestEl] : null };
}

export function runAutoElementSelection(event = { type: EVENT_SELECT }) {
  return autoElementSelectionEventHandlers[event?.type]?.(event) ?? { element: null };
}
