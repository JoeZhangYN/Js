// BattleSnapshot 收集（Phase 5b-1）。
// file-size-gate: exempt phase-5b-snapshot
// 每 turn 入口一次性 batch DOM 读取 → plain object → decide 函数全程纯函数（不再读 DOM）。
//
// **3 铁律**：
// A. snapshot 只存值（number/string/array of plain object），**禁** Element / Node 引用
// B. snapshot 生命周期 = 当前 turn 内（不入 store / setValue）
// C. dispatch 副作用用 selector 字符串重查询 DOM，不用缓存引用
//
import { gE, isSpiritActive } from "../dom/query.js";
import { BattleTurnEvent, runBattleTurnAutomation } from "../state/battle-turn.js";
import { CdRuntimeEvent, runCdRuntimeAutomation } from "../state/cd-tracker.js";
import { parseBattleLog, estimatePlayerIncomingDps, estimatePerMonsterDps } from "./log-parser.js";
import { RecoveryLearningEvent, runRecoveryLearningAutomation } from "../state/recovery-learner.js";
import { CdLearningEvent, runCdLearningAutomation } from "../state/cd-learner.js";
import {
  BigSkillKillLearningEvent,
  runBigSkillKillLearningAutomation,
} from "../state/big-skill-kill-learner.js";
import {
  IncomingBurstLearningEvent,
  runIncomingBurstLearningAutomation,
} from "../state/incoming-burst-learner.js";
import { parseEffectTurns, parseEffectName } from "./effect-parse.js";
import { monsterHpVars } from "./monster-view.js";
import {
  BattleStartRuntimeEvent,
  runBattleStartRuntimeAutomation,
} from "./battle-start-runtime.js";
import { AbilityAoeEvent, runAbilityAoeAutomation } from "../pages/ability-page.js";
import { BattleSkillUsageEvent, runBattleSkillUsageAutomation } from "./battle-skill-usage.js";
import { BattleMonsterViewEvent, runBattleMonsterView } from "./battle-monster-view.js";

/**
 * 解析一个 effect 容器（玩家 #pane_effects 或怪物 .btm6）内全部 img 为 {img, turns}[]。
 * img = effect 图标文件名（/e/<name>.png 的 <name>）；turns = 剩余回合（永续 → Infinity）。
 * @param {Element|null} container
 * @returns {Array<{img: string, turns: number}>}
 */
function readEffects(container) {
  if (!container) return [];
  return [...container.querySelectorAll("img")].map((img) => ({
    img: img.src.match(/\/e\/(.*?)\.png/)?.[1] || "",
    name: parseEffectName(img), // 显示名（onmouseover 第一个引号串），供 decide 区别于 img 文件名
    turns: parseEffectTurns(img),
  }));
}

/**
 * 解析玩家 #pane_effects buff 列表。
 * @returns {Array<{img: string, turns: number}>}
 */
function readPlayerEffects() {
  return readEffects(gE("#pane_effects"));
}

/**
 * 解析单怪物的 buff/debuff list。
 * @param {Element} mEl `.btm1` 元素
 * @returns {{names: string[], effects: Array<{img: string, turns: number}>}}
 */
function readMonsterBuffs(mEl) {
  const effects = readEffects(mEl.querySelector(".btm6"));
  return { names: effects.map((e) => e.img), effects };
}

/**
 * 解析所有怪物。返回 plain object 数组，**不**含 DOM 引用。
 * @returns {Array<{id:number, order:number, isDead:boolean, hpRatio:number, buffs:string[]}>}
 */
function readMonsters() {
  const els = gE("div.btm1", "all");
  return [...els].map((el, i) => {
    const isDead = el.style.opacity === "0.3" || !!el.querySelector('img[src*="nbardead"]');
    const hpBar = el.querySelector(".btm5 img[src*='nbargreen']");
    const hpRatio = hpBar ? Math.max(0, hpBar.offsetWidth) / 120 : isDead ? 0 : 1;
    const { names, effects } = readMonsterBuffs(el);
    const m2El = el.querySelector(".btm2");
    const isBoss = !!(m2El && m2El.style.background);
    const nameEl = el.querySelector(".btm3");
    const name = nameEl ? nameEl.textContent.trim() : "";
    return {
      id: i === 9 ? 0 : i + 1,
      order: i,
      isDead,
      isBoss,
      name,
      hpRatio,
      buffs: names,
      buffEffects: effects,
    };
  });
}

/**
 * 玩家 hp/mp/sp/oc 读取（兼容 #vbh / #dvbh 双布局）。
 * 返 percentage（hp/mp/sp 0..100）+ 绝对值（hpMax/mpMax/spMax + hpAbs/mpAbs/spAbs）。
 * #dvrhd / #dvrm / #dvrs 是 max 值的 textContent；当前绝对值 = max × percentage / 100。
 */
function readPlayerVitals() {
  let hp, mp, sp, oc;
  if (gE("#vbh")) {
    hp = (gE("#vbh>div>img").offsetWidth / 500) * 100;
    mp = (gE("#vbm>div>img").offsetWidth / 210) * 100;
    sp = (gE("#vbs>div>img").offsetWidth / 210) * 100;
    oc = gE("#vcp>div>div")
      ? (gE("#vcp>div>div", "all").length - gE("#vcp>div>div#vcr", "all").length) * 25
      : 0;
  } else {
    hp = (gE("#dvbh>div>img").offsetWidth / 414) * 100;
    mp = (gE("#dvbm>div>img").offsetWidth / 414) * 100;
    sp = (gE("#dvbs>div>img").offsetWidth / 414) * 100;
    oc = parseInt(gE("#dvrc")?.textContent) || 0;
  }
  const hpMax = parseInt(gE("#dvrhd")?.textContent) || 0;
  const mpMax = parseInt(gE("#dvrm")?.textContent) || 0;
  const spMax = parseInt(gE("#dvrs")?.textContent) || 0;
  return {
    hp,
    mp,
    sp,
    oc,
    hpMax,
    mpMax,
    spMax,
    hpAbs: (hp / 100) * hpMax,
    mpAbs: (mp / 100) * mpMax,
    spAbs: (sp / 100) * spMax,
    hpDeficit: hpMax - (hp / 100) * hpMax,
    mpDeficit: mpMax - (mp / 100) * mpMax,
    spDeficit: spMax - (sp / 100) * spMax,
  };
}

/**
 * 读所有可施法 skill 按钮的 ready 状态（opacity 不为 0.5）。
 * Phase 5b-2 给 decide-* 纯函数用，避免它们再调 isOn (DOM)。
 * @returns {Record<string, boolean>}
 */
function readSkillReady() {
  const map = {};
  // Buff IDs 411/412/413/421/422/423/431/432 + Regen 312
  // Debuff IDs 211/212/213/221/222/223/231/232/233
  // Healing IDs 311/312/313
  // Magic IDs 111-163 (18 个)
  // Physical IDs 1101/1111/2{1,2,3}{0,1,2,3,4} 等
  const ids = [
    "111",
    "112",
    "113",
    "121",
    "122",
    "123",
    "131",
    "132",
    "133",
    "141",
    "142",
    "143",
    "151",
    "152",
    "153",
    "161",
    "162",
    "163",
    "211",
    "212",
    "213",
    "221",
    "222",
    "223",
    "231",
    "232",
    "233",
    "311",
    "312",
    "313",
    "411",
    "412",
    "413",
    "421",
    "422",
    "423",
    "431",
    "432",
    "1001",
    "1011",
    "1101",
    "1111",
    "2101",
    "2102",
    "2103",
    "2201",
    "2202",
    "2203",
    "2301",
    "2302",
    "2303",
  ];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    map[id] = el.style.opacity !== "0.5";
  }
  return map;
}

function readySkillIds(skillReady) {
  return Object.entries(skillReady || {})
    .filter(([, ready]) => ready)
    .map(([id]) => id);
}

function recoveryAbs(vitals) {
  return { hp: vitals.hpAbs, mp: vitals.mpAbs, sp: vitals.spAbs };
}

function liveMonsterIds(view) {
  return (view || [])
    .filter((monster) => monster.monsterId != null && !monster.isDead)
    .map((monster) => monster.monsterId);
}

/**
 * 一次性 batch DOM read 组装当前 turn snapshot。
 * @returns {import("../core/types.js").BattleSnapshot}
 */
export function collectSnapshot(event = {}) {
  const monsters = readMonsters();
  const { view, monsterIdentities } = runBattleMonsterView({
    type: BattleMonsterViewEvent.READ_VIEW,
    monsters,
  });
  const playerEffects = readPlayerEffects();
  const vitals = readPlayerVitals();
  const spiritEl = gE("#ckey_spirit");
  // 战斗日志只解析一遍，两个 DPS 估计复用同一份 events（避免每 turn 重复全量遍历 textlog）
  const battleLog = parseBattleLog();
  const turn = runBattleTurnAutomation({ type: BattleTurnEvent.READ_CURRENT });
  // 学习器 finalize 全部跑在 rules 之前（结算上回合行动的观测）。globalTurn/skillReady 先备好供两用。
  const globalTurn = runCdRuntimeAutomation({ type: CdRuntimeEvent.READ_GLOBAL_TURN });
  const skillReady = readSkillReady();
  // T1: 上回合若有 pending 喝药观测，此处结算 → 学习 delta
  runRecoveryLearningAutomation({
    type: RecoveryLearningEvent.FINALIZE_PENDING,
    snap: { recoveryAbs: recoveryAbs(vitals) },
  });
  // F3: 上回合开火的技能若本回合脱灰 → 收敛真实 CD（只需 globalTurn + readySkillIds）
  runCdLearningAutomation({
    type: CdLearningEvent.FINALIZE_PENDING,
    snap: { globalTurn, readySkillIds: readySkillIds(skillReady) },
  });
  // F4: 上回合 OFC/FRD 开火的 boss 本回合是否已死 → 按 MID 学击杀率（只需 globalTurn + liveMonsterIds）
  runBigSkillKillLearningAutomation({
    type: BigSkillKillLearningEvent.FINALIZE_PENDING,
    snap: { globalTurn, liveMonsterIds: liveMonsterIds(view) },
  });
  // F5（默认 OFF，开关关时零开销）：从本回合战斗日志学每 MID 单发最大伤害 + 类型；attach 给 decide。
  const learnIncomingBurst = !!event.learnIncomingBurst;
  if (learnIncomingBurst)
    runIncomingBurstLearningAutomation({
      type: IncomingBurstLearningEvent.RECORD_EVENTS,
      events: battleLog,
      monsterIdentities,
    });
  return {
    turn,
    globalTurn,
    ...vitals,
    channeling: !!gE('#pane_effects>img[src*="channeling"]'),
    spiritOn: isSpiritActive(spiritEl),
    monsters,
    view,
    aliveCount: monsters.filter((m) => !m.isDead).length,
    // 单怪 HP%（0..100，对齐条件里 hp/mp 口径）：供非门表达"濒死的怪不上 debuff"等。从统一视图派生。
    ...monsterHpVars(view),
    playerBuffs: playerEffects.map((e) => e.img),
    playerEffectTurns: Object.fromEntries(playerEffects.map((e) => [e.img, e.turns])),
    // ether-tap 玩家效果事实（attack ether-tap gate 用，避免 decideAttack 再读 DOM）：
    // 与原 attack.js 同选择器，批在本次 #pane_effects 读里 → 维持"DOM 读一次"。
    etherTapActiveX2: !!gE('#pane_effects>img[onmouseover*="Ether Tap (x2)"]'),
    etherTapExpiring: !!gE('#pane_effects>img[src*="wpn_et"][id*="effect_expire"]'),
    // 深度B：玩家效果明细 [{img,name,turns}]（供 channel/critical 等 decide 用，含显示名+剩余回合）
    playerEffects,
    // 深度B：宝石按钮文案（供 decideGem，PURE 不读 DOM）；无宝石按钮 → null
    gemName: gE("#ikey_p")?.textContent ?? null,
    cdMap: runCdRuntimeAutomation({ type: CdRuntimeEvent.READ_MAP }),
    skillReady,
    skillOTOS: runBattleSkillUsageAutomation({ type: BattleSkillUsageEvent.READ_USAGE }),
    spellAoe: runAbilityAoeAutomation({ type: AbilityAoeEvent.READ_SPELL_AOE }),
    attackStatus: runBattleStartRuntimeAutomation({
      type: BattleStartRuntimeEvent.READ_ATTACK_STATUS,
    }),
    // PoC L1：战斗日志解析得 DPS 估计（复用上方 battleLog，本 turn 只解析一遍）
    playerIncomingDps: estimatePlayerIncomingDps(battleLog, turn),
    monsterDpsByName: estimatePerMonsterDps(battleLog, turn),
    // F5：每 MID 致死/爆发伤害学习表（开关关→空，decide 自然 noop）
    learnedBurstByMid: learnIncomingBurst
      ? runIncomingBurstLearningAutomation({ type: IncomingBurstLearningEvent.READ_MAP })
      : {},
  };
}
