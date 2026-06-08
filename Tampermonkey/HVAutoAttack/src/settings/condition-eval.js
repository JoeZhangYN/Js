// 条件评估器：解析 [["hp,1,50"], ["_buffTurn,protection,1,3"]] 这类 OR-of-AND 表达式。
// 比较符 1>/2</3>=/4<=/5===/6!==。
// 传 snap 时为纯函数：isCd 吃 snap.skillReady、buffTurn 吃 snap.playerEffectTurns、
// 普通变量吃 snap[str]；无 snap 或字段未被 snapshot 收集时 fallback g()/DOM（向后兼容）。
import { gE, isOn } from "../dom/query.js";
import { g } from "../state/store.js";
import { parseEffectTurns } from "../battle/effect-parse.js";

/**
 * 评估一组条件（OR-of-AND）。
 * @param {Array<Array<string>>|Object|undefined} parms
 * @param {object=} snap Phase 5b-2 起 decide 函数传 snapshot；snap[str] 优先，fallback 到 g(str)
 * @returns {boolean}
 */
export function checkCondition(parms, snap) {
  if (typeof parms === "undefined") return true;
  const result = [];
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
      return parseEffectTurns(buff);
    },
  };
  const comparators = {
    "1": (a, b) => a > b,
    "2": (a, b) => a < b,
    "3": (a, b) => a >= b,
    "4": (a, b) => a <= b,
    "5": (a, b) => a === b,
    "6": (a, b) => a !== b,
  };
  for (const i in parms) {
    for (let j = 0; j < parms[i].length; j++) {
      if (!Array.isArray(parms[i])) continue;
      let k = parms[i][j].split(",");
      k[0] = returnValue(k[0]);
      k[2] = returnValue(k[2]);
      if (comparators[k[1]]) {
        result[i] = comparators[k[1]](k[0], k[2]);
      }
      if (result[i] === false) j = parms[i].length;
    }
    if (result[i] === true) return true;
  }
  return false;
}
