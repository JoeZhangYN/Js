// F3：技能真实 CD 收敛学习器。观测「开火 → 脱灰(skillReady false→true)」的 globalTurn 差 = 真 CD，
// EWMA 收敛，fallback SKILL_REGISTRY.cdBase。范式同 recovery-learner.js（观测→finalize→EWMA→持久化）。
//
// **安全 by-construction（两道夹）**：
//  ① 本学习器拒学「gap > cdBase」的样本（clamp 到 cdBase）—— OC 饿/未及时开火只会膨胀 gap，
//     故学习 CD 永 ≤ cdBase（只能把 CD 往下拉，永不上调）。
//  ② 消费方 cd-tracker.turnsUntilReady 再夹 Math.min(learned, cdBase)；且真正开火仍以 DOM
//     snap.skillReady 为权威（decide-skill.js）—— 学习 CD 只锐化 shouldSkipForBigSkill 的前瞻，
//     绝不导致误开火。
//
// pending 为 **map**（多技能可同时计时，异于 recovery 的单 learnPending），runtime-only（g()），
// 不持久——重载丢一个在途样本可接受。learned 表持久（按需 getValue / 即时 setValue）。
import { g } from "./store.js";
import { OptionEvent, runOptionAutomation } from "./option.js";
import { setValue, getValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { SKILL_REGISTRY } from "./skill-registry.js";

const EVENT_RECORD_FIRE = "recordFire";
const EVENT_FINALIZE_PENDING = "finalizePending";
const EVENT_READ_CD = "readCd";

export const CdLearningEvent = Object.freeze({
  RECORD_FIRE: EVENT_RECORD_FIRE,
  FINALIZE_PENDING: EVENT_FINALIZE_PENDING,
  READ_CD: EVENT_READ_CD,
});

function isDynamicHealLogEnabled() {
  return Boolean(
    runOptionAutomation({
      type: OptionEvent.READ_FIELD,
      key: "dynamicHealLog",
      fallback: false,
    })
  );
}

/**
 * 开火记录（SHELL）：execute-attack 物理分支 recordFire 之后调。
 * @param {string} code SKILL_REGISTRY 的 key
 * @param {string} id 本次开火解析后的 skillId（脱灰探测用 snap.skillReady[id]）
 * @param {import("../core/types.js").BattleSnapshot} snap 仅读入口传入的 globalTurn
 */
function recordCdFire(code, id, snap) {
  if (!SKILL_REGISTRY[code]) return;
  const pending = g("cdLearnPending") || {};
  pending[code] = { firedTurn: snap?.globalTurn ?? 0, id };
  g("cdLearnPending", pending);
}

/**
 * finalize（snapshot 入口，跑在 rules 前）：对每个在途 pending，若其技能已脱灰则结算 gap。
 * @param {{globalTurn:number, skillReady:Record<string,boolean>}} snap
 */
function finalizeCdPending(snap) {
  const pending = g("cdLearnPending");
  if (!pending) return;
  const now = snap?.globalTurn ?? 0;
  let changed = false;
  for (const code of Object.keys(pending)) {
    const p = pending[code];
    const gap = now - p.firedTurn;
    if (gap <= 0) continue; // 同回合，未结算（与 recovery-learner 同款守卫）
    if (!snap?.skillReady?.[p.id]) continue; // 仍灰（CD 中 / OC 不足）→ 续等
    const entry = SKILL_REGISTRY[code];
    delete pending[code];
    changed = true;
    if (!entry) continue;
    if (gap > entry.cdBase * 3) continue; // 陈旧/异常测量（早就该好却 3× 未结算）→ 弃
    // 夹①：拒学膨胀 —— gap 只可能因 OC 饿/迟放被拉长，真 CD 不会超过保守 cdBase。
    const sample = Math.min(gap, entry.cdBase);
    updateLearnedCd(code, sample, entry.cdBase);
  }
  if (changed) g("cdLearnPending", pending);
}

/** EWMA 更新并即时持久化（数学复刻 recovery-learner.updateLearned）。 */
function updateLearnedCd(code, sample, cdBase) {
  const learned = getValue(STORAGE_KEYS.LEARNED_CD, true) || {};
  const prior = learned[code];
  const n = (prior?.n ?? 0) + 1;
  const priorCd = prior?.cd ?? cdBase;
  const alpha = Math.max(0.1, 1 / n); // n 大趋稳；下限 0.1 保对装备/等级漂移敏感
  const newCd = priorCd * (1 - alpha) + sample * alpha;
  learned[code] = { cd: newCd, n };
  setValue(STORAGE_KEYS.LEARNED_CD, learned);
  if (isDynamicHealLogEnabled()) {
    console.log(`[cd-learn] ${code}: gap→${sample} → cd=${newCd.toFixed(1)} (n=${n})`);
  }
}

/**
 * 取学到的真实 CD（n>0 返学值，否则 fallback cdBase）。
 * 注：消费方仍需再夹 Math.min(learnedCd, cdBase)（防持久化被篡改成过大值）。
 * @param {string} code
 * @returns {number}
 */
function getLearnedCd(code) {
  const entry = SKILL_REGISTRY[code];
  const fallback = entry ? entry.cdBase : 0;
  const learned = getValue(STORAGE_KEYS.LEARNED_CD, true) || {};
  if (learned[code] && learned[code].n > 0) return learned[code].cd;
  return fallback;
}

export function runCdLearningAutomation(event = { type: EVENT_READ_CD }) {
  if (event.type === EVENT_RECORD_FIRE) return recordCdFire(event.code, event.id, event.snap);
  if (event.type === EVENT_FINALIZE_PENDING) return finalizeCdPending(event.snap);
  if (event.type === EVENT_READ_CD) return getLearnedCd(event.code);
  return undefined;
}
