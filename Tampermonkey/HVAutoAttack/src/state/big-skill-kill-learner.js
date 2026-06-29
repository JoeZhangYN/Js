// F4：清场大招(OFC/FRD)对 boss 的「能否一发秒杀」结果记忆学习器（默认 OFF 暗发）。
// 用户意图：能秒杀连 Imperil 都不用上 → 少花一回合 + 蓝。约束：竞技场随人物等级变强 → 判定必须自适应。
//
// **判定模型 = 纯结果记忆（按 MID）+ scale-drift 守卫**（不做伤害模型——战斗日志累积、无回合界，OFC 单发
// 伤害无法干净归因；而「这一发到底有没有秒掉」本身就是用户要的「实际值」，最直接可靠）。
//  - 观测：OFC/FRD 开火时记下各活 boss 的 MID/满血/是否带 imperil（pending，pre-cast 态）；
//    下回合 snapshot 看该 MID 是否已死 → 按 imperil 分支 EWMA 更新 killProbNoIm / killProbWithIm。
//  - 决策 ofcWillKillBoss 只认 **无 imperil 击杀率**（imperil 会增伤，with-im 击杀不证明 no-im 也能秒）。
//  - scale-drift 守卫：记观测时 boss 满血 lastHpMax；本场满血较其涨过 tol（你升级、怪变厚）→ 立即
//    distrust（保留 Imperil），直到新的 no-im 击杀在新血量上重新确认。EWMA 遗忘 + 此守卫共同跟随漂移。
//
// **安全核心**：跳 Imperil 需正面证据（足量 no-im 样本 + 高击杀率 + OFC 本回合就绪 + 未漂移）；
// 任一缺失 → 保留 Imperil（默认）。MID 未知 → 保留。
import { g } from "./store.js";
import { OptionEvent, runOptionAutomation } from "./option.js";
import { setValue, getValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";

const OFC_OC_NEED = 205;
const EVENT_RECORD_CAST = "recordCast";
const EVENT_FINALIZE_PENDING = "finalizePending";
const EVENT_WILL_KILL_BOSS = "willKillBoss";

export const BigSkillKillLearningEvent = Object.freeze({
  RECORD_CAST: EVENT_RECORD_CAST,
  FINALIZE_PENDING: EVENT_FINALIZE_PENDING,
  WILL_KILL_BOSS: EVENT_WILL_KILL_BOSS,
});

function isDynamicBigKillLogEnabled() {
  return Boolean(
    runOptionAutomation({
      type: OptionEvent.READ_FIELD,
      key: "dynamicBigKillLog",
      fallback: false,
    })
  );
}

/** EWMA：n 大趋稳，下限 0.1 保对等级漂移敏感（同 recovery/cd 学习器）。 */
function ewma(prior, obs, n) {
  const alpha = Math.max(0.1, 1 / n);
  return prior * (1 - alpha) + obs * alpha;
}

/**
 * 开火记录（SHELL，execute-attack 物理分支）：code∈OFC/FRD 且有活 boss 才记 pending。
 * @param {string} code
 * @param {import("../core/types.js").BattleSnapshot} snap
 */
function recordBigSkillCast(code, snap) {
  if (code !== "OFC" && code !== "FRD") return;
  const bosses = (snap?.view || [])
    .filter((m) => m.isBoss && !m.isDead && m.monsterId != null)
    .map((m) => ({
      mid: m.monsterId,
      hpMax: m.hpMax,
      imperilActive: (m.buffs || []).includes("imperil"),
    }));
  if (!bosses.length) return;
  g("bigKillPending", {
    globalTurn: snap?.globalTurn ?? 0,
    skill: code,
    bosses,
  });
}

/**
 * finalize（snapshot 入口，跑在 rules 前）：上回合的 OFC/FRD 是否秒掉各 pending boss（按 MID 判死）。
 * @param {{globalTurn:number, view:Array}} snap
 */
function finalizeBigSkillPending(snap) {
  const pending = g("bigKillPending");
  if (!pending) return;
  const now = snap?.globalTurn ?? 0;
  if (now === pending.globalTurn) return; // 同回合，未结算
  const learned = getValue(STORAGE_KEYS.LEARNED_BIG_KILL, true) || {};
  for (const b of pending.bosses) {
    const killed = (snap?.view || []).some((m) => m.monsterId === b.mid && !m.isDead) ? 0 : 1;
    if (!learned[b.mid]) learned[b.mid] = {};
    const rec = learned[b.mid];
    if (!rec[pending.skill]) {
      rec[pending.skill] = {
        killProbNoIm: 0,
        nNoIm: 0,
        killProbWithIm: 0,
        nWithIm: 0,
        lastHpMax: 0,
      };
    }
    const sk = rec[pending.skill];
    if (b.imperilActive) {
      sk.nWithIm += 1;
      sk.killProbWithIm = ewma(sk.killProbWithIm, killed, sk.nWithIm);
    } else {
      sk.nNoIm += 1;
      sk.killProbNoIm = ewma(sk.killProbNoIm, killed, sk.nNoIm);
    }
    sk.lastHpMax = b.hpMax; // 本次观测的 boss 满血（scale-drift 参照）
  }
  g("bigKillPending", null);
  setValue(STORAGE_KEYS.LEARNED_BIG_KILL, learned);
  if (isDynamicBigKillLogEnabled()) {
    console.log(`[big-kill] settle ${pending.skill}:`, JSON.stringify(learned));
  }
}

/**
 * 决策：是否「能确认 OFC 这一发会秒掉此 boss，故可跳过 Imperil」。PURE-ish（读 snap + 学习表）。
 * **仅全部成立返 skip:true**（任一缺失→保留 Imperil）：
 *  ① opt.skipImperilWhenOfcKills 开（默认 OFF，最先短路 → 默认零存储读）；② OFC 本回合就绪即开火；
 *  ③ 该 MID 有足量 **无 imperil** 样本（nNoIm≥bigKillMinSamples）；④ killProbNoIm≥bigKillProbThreshold；
 *  ⑤ scale-drift 未触发（本场满血未较 lastHpMax 涨过 bigKillScaleDriftTol）。
 * @param {number|undefined} mid
 * @param {import("../core/types.js").BattleSnapshot} snap
 * @param {object} opt
 * @returns {{skip:boolean, confidence?:number}}
 */
function ofcWillKillBoss(mid, snap, opt) {
  if (!opt?.skipImperilWhenOfcKills) return { skip: false };
  if (mid == null) return { skip: false };
  // OFC 必须本回合就绪即开火，否则跳 Imperil = boss 既不破防也不被秒，纯失误。
  if ((snap?.cdMap?.OFC ?? 99) !== 0 || (snap?.oc ?? 0) < OFC_OC_NEED) return { skip: false };
  const learned = getValue(STORAGE_KEYS.LEARNED_BIG_KILL, true) || {};
  const sk = learned[mid]?.OFC;
  if (!sk || sk.nNoIm < (opt.bigKillMinSamples ?? 4)) return { skip: false };
  if (sk.killProbNoIm < (opt.bigKillProbThreshold ?? 0.9)) return { skip: false };
  const boss = (snap?.view || []).find((m) => m.monsterId === mid && !m.isDead);
  const tol = opt.bigKillScaleDriftTol ?? 1.15;
  if (boss && sk.lastHpMax && boss.hpMax > sk.lastHpMax * tol) return { skip: false }; // 漂移→distrust
  return { skip: true, confidence: sk.killProbNoIm };
}

export function runBigSkillKillLearningAutomation(event = { type: EVENT_WILL_KILL_BOSS }) {
  if (event.type === EVENT_RECORD_CAST) return recordBigSkillCast(event.code, event.snap);
  if (event.type === EVENT_FINALIZE_PENDING) return finalizeBigSkillPending(event.snap);
  if (event.type === EVENT_WILL_KILL_BOSS) return ofcWillKillBoss(event.mid, event.snap, event.opt);
  return undefined;
}
