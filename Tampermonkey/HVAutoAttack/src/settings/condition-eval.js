// 条件评估器：解析 [["hp,1,50"], ["_buffTurn,protection,1,3"]] 这类表达式。
// 比较符 1>/2</3>=/4<=/5===/6!==。
//
// v2 非门扩展（向后兼容；旧数据无下列标记 → 行为与 legacy 完全一致）：
//   · 子句级非门：子句串前缀 "!"，如 "!mp,4,25" = 对 mp,4,25 取非门。
//   · 行级类型：行首哨兵子句 "||" 表示该行内并联(OR)；无哨兵 = 默认串联(AND)。
//   · 纯非门行（行内非 "||" 子句全部带 "!"）= 全局前置守卫：任一守卫的"排除条件"成立
//     → 整条件 false（顺延）。守卫在正向并联之前评估。
//   · 混合行（既有正向子句又有非门）：非门仅局部参与本行的 AND/OR（!子句取其反）。
//   正向行之间 = 并联(OR)；仅有守卫且都没触发 → true；完全无 group → false（沿用 legacy）。
//
// 传 snap 时为纯函数：isCd 吃 snap.skillReady、buffTurn 吃 snap.playerEffectTurns、
// 普通变量吃 snap[str]；无 snap 或字段未被 snapshot 收集时 fallback g()/DOM（向后兼容）。
import { gE, isOn } from "../dom/query.js";
import { g } from "../state/store.js";
import { BattleEffectParseEvent, runBattleEffectParse } from "../battle/effect-parse.js";

/** 并联(OR)行的行首哨兵 token；普通子句不会等于它。 */
const ROW_OR = "||";

/**
 * 评估一组条件（前置守卫 + 正向 OR-of-AND；含非门扩展）。
 * @param {Array<Array<string>>|Object|undefined} parms
 * @param {object=} snap Phase 5b-2 起 decide 函数传 snapshot；snap[str] 优先，fallback 到 g(str)
 * @returns {boolean}
 */
export function checkCondition(parms, snap) {
  if (typeof parms === "undefined") return true;
  const returnValue = function (str) {
    if (str.match(/^_/)) {
      const arr = str.split("_");
      return func[arr[1]](...[...arr].splice(2));
    }
    if (str.match(/^'.*?'$|^".*?"$/)) return str.slice(1, -1);
    if (isNaN(str * 1)) {
      if (snap && str in snap) return snap[str];
      return g(str);
    }
    return str * 1;
  };
  const func = {
    // CD 判定优先吃 snapshot.skillReady（纯）；id 未被 snapshot 收集或无 snap 时
    // fallback isOn(DOM)（覆盖缺口兜底）。返 0=可用 / 1=在 CD（语义对齐原 isOn）。
    isCd(id) {
      if (snap && snap.skillReady && id in snap.skillReady) {
        return snap.skillReady[id] ? 0 : 1;
      }
      return isOn(id) ? 0 : 1;
    },
    // buff 剩余回合优先吃 snapshot.playerEffectTurns（纯，子串匹配 effect 名）；
    // 无 snap 时 fallback DOM。语义同 parseEffectTurns：缺=0 / 永续=Infinity。
    buffTurn(img) {
      if (snap && snap.playerEffectTurns) {
        for (const [name, turns] of Object.entries(snap.playerEffectTurns)) {
          if (name.includes(img)) return turns;
        }
        return 0;
      }
      const buff = gE(`#pane_effects>img[src*="${img}"]`);
      if (!buff) return 0;
      return runBattleEffectParse({ type: BattleEffectParseEvent.READ_EFFECT, img: buff }).turns;
    },
  };
  const comparators = {
    1: (a, b) => a > b,
    2: (a, b) => a < b,
    3: (a, b) => a >= b,
    4: (a, b) => a <= b,
    5: (a, b) => a === b,
    6: (a, b) => a !== b,
  };
  // 单子句原子比较（保留 legacy 语义：缺/坏比较符 → false）。clause = "a,op,b"。
  const rawMatch = (clause) => {
    const k = clause.split(",");
    if (!comparators[k[1]]) return false;
    return comparators[k[1]](returnValue(k[0]), returnValue(k[2]));
  };

  // 分桶：纯非门行 → 前置守卫；其余 → 正向行（OR 间）。
  const preGates = [];
  const positives = [];
  for (const i in parms) {
    const row = parms[i];
    if (!Array.isArray(row)) continue;
    const rowType = row[0] === ROW_OR ? "or" : "and";
    const clauses = row.filter((c) => c !== ROW_OR);
    if (clauses.length === 0) continue;
    const isPureNeg = clauses.every((c) => c.charAt(0) === "!");
    (isPureNeg ? preGates : positives).push({ rowType, clauses });
  }
  // 完全无有效 group → 沿用 legacy 空条件语义（false）。
  if (preGates.length === 0 && positives.length === 0) return false;

  // 1) 前置守卫：纯非门行用"原始匹配"（排除条件成立即触发）；任一行触发 → 整体 false。
  for (const gate of preGates) {
    const exprs = gate.clauses.map((c) => c.slice(1)); // 去掉前缀 "!"
    const tripped = gate.rowType === "or" ? exprs.some(rawMatch) : exprs.every(rawMatch);
    if (tripped) return false;
  }

  // 2) 正向行并联(OR)；仅有守卫且都没触发 → true。
  if (positives.length === 0) return true;
  for (const grp of positives) {
    // 混合行：正向子句取 rawMatch，"!" 子句取 !rawMatch；按行类型组合。
    const clauseVal = (c) => (c.charAt(0) === "!" ? !rawMatch(c.slice(1)) : rawMatch(c));
    const ok = grp.rowType === "or" ? grp.clauses.some(clauseVal) : grp.clauses.every(clauseVal);
    if (ok) return true;
  }
  return false;
}
