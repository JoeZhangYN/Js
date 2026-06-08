// BATTLE_RULES：主循环 16 个决策步骤的声明式注册表（Phase 5b 编排倒置）。
// main-loop 只依赖 此数组 + runRules + dispatch 三个抽象，不再 import 具体 execute 实现——
// 本文件即「组合根」(composition root)：把具体实现 wire 进 BattleRule 抽象。
//
// 每条 rule：{ name, when?(snap,opt), decide(snap,opt)→ActionResult }。顺序 = 原 runSteps 顺序。
// decide 两类：
//   - 干净（5）：返真 ActionResult（flee/defend/useInfusions/useBuffSkill/useDeSkill）。
//   - delegate（11）：复杂 step（循环 / fallback 链 / 额外副作用如 autoTune 计数 / monsterStatus.sort）
//     暂包现有 execute（内部自带 click + tagEnd），标过渡桥，后续 chunk 逐个 PURE 化。
import { g } from "../../state/store.js";
import { checkCondition } from "../../settings/condition-eval.js";
import { checkCriticalBuffGuard } from "../critical-buff-guard.js";
import { pauseScript } from "../pause-control.js";
import { useGem, deadSoon, stallTopup, useScroll } from "../item.js";
import { isStallMode } from "../potion-economy.js";
import { useChannelSkill } from "../buff.js";
import { decideInfusion } from "../buff/decide-infusion.js";
import { decideBuff } from "../buff/decide-buff.js";
import { decideDeSkill } from "../debuff/decide-de-skill.js";
import { castDebuffOnAll } from "../debuff.js";
import { attack } from "../attack.js";
import { shouldSkipForBigSkill } from "./big-skill.js";
import { runBossImperil } from "./boss-imperil.js";

/**
 * delegate 工厂：包一个返 void 的现有 execute（内部自带 click + tagEnd）。
 * @param {string} name
 * @param {() => void} run
 * @returns {import("../../core/types.js").ActionResult}
 */
const delegate = (name, run) => ({ kind: "delegate", name, run });

/** @type {import("../../core/types.js").BattleRule[]} */
export const BATTLE_RULES = [
  // 1. 关键 buff 即将消失 + MP 不足 → 暂停告警（自 gate opt.pauseOnCriticalBuffExpire）
  {
    name: "criticalBuffGuard",
    decide: (snap) => delegate("criticalBuffGuard", () => checkCriticalBuffGuard(snap)),
  },
  // 2. 逃跑
  {
    name: "flee",
    when: (snap, opt) => opt.autoFlee && checkCondition(opt.fleeCondition, snap),
    decide: () => ({ kind: "click-then-reload", selector: "1001", delaySec: 3 }),
  },
  // 3. 自动暂停（step 内 disabled=false 恒走 pauseScript 分支，不触发 pauseChange 的 main() 递归）
  {
    name: "autoPause",
    when: (snap, opt) => opt.autoPause && checkCondition(opt.pauseCondition, snap),
    decide: () => delegate("autoPause", () => pauseScript()),
  },
  // 4. 宝石（useGem 自 gate gemElement；含 dyn-threshold + autoTune 计数副作用 → delegate）
  {
    name: "useGem",
    decide: (snap) => delegate("useGem", () => useGem(snap)),
  },
  // 5. 紧急回血回魔（循环 + recordPreDrink 学习观测 → delegate）
  {
    name: "deadSoon",
    when: (snap, opt) => opt.item && opt.itemOrderValue,
    decide: (snap) => delegate("deadSoon", () => deadSoon(snap)),
  },
  // 6. stall 主动 topup（3 段 fallback 链 + 自 gate stallMode → delegate）
  {
    name: "stallTopup",
    decide: (snap) => delegate("stallTopup", () => stallTopup(snap)),
  },
  // 7. 防御（attemptClick 内置 isOn 探活）
  {
    name: "defend",
    when: (snap, opt) => opt.defend && checkCondition(opt.defendCondition, snap),
    decide: () => ({ kind: "click", selector: "#ckey_defend" }),
  },
  // 8. 卷轴（嵌套循环按优先级试 7 种 → delegate）
  {
    name: "useScroll",
    when: (snap, opt) =>
      opt.scrollSwitch &&
      opt.scroll &&
      checkCondition(opt.scrollCondition, snap) &&
      opt.scrollRoundType &&
      opt.scrollRoundType[g("roundType")],
    decide: () => delegate("useScroll", () => useScroll()),
  },
  // 9. 元素灌注（仅法术模式）
  {
    name: "useInfusions",
    when: (snap, opt) =>
      snap.attackStatus !== 0 && opt.infusionSwitch && checkCondition(opt.infusionCondition, snap),
    decide: (snap, opt) => decideInfusion(opt, snap),
  },
  // 10. Channel（3 段 fallback 链 → delegate）
  {
    name: "useChannelSkill",
    when: (snap, opt) => opt.channelSkillSwitch && opt.channelSkill && snap.channeling,
    decide: () => delegate("useChannelSkill", () => useChannelSkill()),
  },
  // 11. BUFF
  {
    name: "useBuffSkill",
    when: (snap, opt) =>
      opt.buffSkillSwitch && opt.buffSkill && checkCondition(opt.buffSkillCondition, snap),
    decide: (snap, opt) => decideBuff(opt, snap),
  },
  // 12. Boss-Imperil（AoE 覆盖优化 + 可选 Spirit → delegate）
  {
    name: "bossImperil",
    when: (snap, opt) => opt.debuffSkillSwitch !== false && !!snap.skillReady["213"],
    decide: (snap, opt) => delegate("bossImperil", () => runBossImperil(opt, snap)),
  },
  // 13. 全员 Weaken（OFC/FRD 即将就绪时跳过；castDebuffOnAll 末尾有 sort 副作用 → delegate）
  {
    name: "castWeakenAll",
    when: (snap, opt) =>
      opt.debuffSkillSwitch &&
      opt.debuffSkillAllWk &&
      !shouldSkipForBigSkill(opt, snap, "We") &&
      snap.monsters.filter((m) => m.buffs.some((b) => b.includes("weaken"))).length <
        g("monsterAlive") &&
      checkCondition(opt.debuffSkillWkCondition, snap),
    decide: (snap) => delegate("castWeakenAll", () => castDebuffOnAll("We", snap)),
  },
  // 14. 全员 Imperil
  {
    name: "castImperilAll",
    when: (snap, opt) =>
      opt.debuffSkillSwitch &&
      opt.debuffSkillAllIm &&
      !shouldSkipForBigSkill(opt, snap, "Im") &&
      snap.monsters.filter((m) => m.buffs.some((b) => b.includes("imperil"))).length <
        g("monsterAlive") &&
      checkCondition(opt.debuffSkillImpCondition, snap),
    decide: (snap) => delegate("castImperilAll", () => castDebuffOnAll("Im", snap)),
  },
  // 15. 单目标 Debuff（stall 模式跳过——独怪上 debuff 浪费 MP + CD）
  {
    name: "useDeSkill",
    when: (snap, opt) =>
      !isStallMode(snap, opt, g("roundNow"), g("roundAll")) &&
      opt.debuffSkillSwitch &&
      opt.debuffSkill &&
      checkCondition(opt.debuffSkillCondition, snap),
    decide: (snap, opt) => decideDeSkill(opt, snap),
  },
  // 16. 攻击（最后一步，法术/物理多分支 → delegate）
  {
    name: "attack",
    decide: (snap) => delegate("attack", () => attack(snap)),
  },
];
