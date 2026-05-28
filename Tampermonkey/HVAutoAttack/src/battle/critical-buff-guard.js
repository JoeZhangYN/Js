// 关键 buff 即将消失 + MP 不足续施 → 暂停 + 告警的 graceful degradation。
// 灵感来自 Monsterbation L1318 stopOnBuffsExpiring：宁可停下让用户接管，也不要让脚本在
// "续 buff 失败 → 裸 buff 攻击 → 越打越虚" 的死循环里硬扛。
//
// 触发条件（与门，全满足）：
// 1. option.pauseOnCriticalBuffExpire 开启
// 2. option.criticalBuffsList 中至少一个 buff 当前 ≤ minTurns 回合
// 3. 当前 MP < criticalBuffMpFloor%（续 buff 大概率失败的阈值）
import { gE } from "../dom/query.js";
import { g, tagEndToTrue } from "../state/store.js";
import { setValue } from "../state/storage.js";
import { setAlarm } from "../alarm/alarm.js";
import { parseEffectName, parseEffectTurns } from "./effect-parse.js";

/**
 * 关键 buff 即将消失 + MP 不足 → 触发暂停。
 * @param {import("../core/types.js").BattleSnapshot} snap
 * @returns {boolean} true = 已触发暂停（main loop 必须 abort）
 */
export function checkCriticalBuffGuard(snap) {
  const opt = g("option");
  if (!opt.pauseOnCriticalBuffExpire) return false;

  const minTurns = opt.criticalBuffMinTurns ?? 2;
  const mpFloor = opt.criticalBuffMpFloor ?? 30;
  const list = (opt.criticalBuffsList || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length === 0) return false;

  // MP 充足 → 自动续 buff 大概率成功，不触发暂停
  if ((snap.mp ?? 100) >= mpFloor) return false;

  const allBuffs = gE("#pane_effects>img", "all");
  if (!allBuffs || !allBuffs.length) return false;

  for (const buff of allBuffs) {
    const name = parseEffectName(buff);
    if (!name || !list.includes(name)) continue;
    // 永续 buff → parseEffectTurns 返 Infinity → 被 > minTurns 跳过（不算"即将消失"）
    const remaining = parseEffectTurns(buff);
    if (remaining > minTurns) continue;

    // 触发：pause + alarm（沿用 pauseChange 的副作用模型：setValue disabled + tagEnd）
    console.warn(
      `[critical-buff-guard] "${name}" 剩 ${remaining} 回合 + MP ${(snap.mp ?? 0).toFixed(0)}% < ${mpFloor}% → 暂停脚本，请手动接管`
    );
    setAlarm("Error");
    setValue("disabled", true);
    const pauseBtn = gE(".pauseChange");
    if (pauseBtn) {
      pauseBtn.innerHTML = "<l0>继续</l0><l1>繼續</l1><l2>Continue</l2>";
    }
    document.title = `hvAA 暂停: ${name} 即将消失但 MP 不足`;
    tagEndToTrue();
    return true;
  }
  return false;
}
