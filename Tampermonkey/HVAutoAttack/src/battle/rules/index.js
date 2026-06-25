// BATTLE_RULES：主循环 16 个决策步骤的声明式注册表（Phase 5b 编排倒置 + 深度 B 全 PURE）。
// main-loop 只依赖 此数组 + runRules + dispatch 三个抽象，不再 import 具体 execute 实现——
// 本文件即「组合根」(composition root)：把 PURE decide 实现 wire 进 BattleRule 抽象。
//
// 每条 rule：{ name, when?(snap,opt), decide(snap,opt)→ActionResult }。顺序 = 原 runSteps 顺序。
// 深度 B 后**全部 16 条 decide 均为 PURE**（只读 snap + g() runtime，零 DOM 判断）；副作用全在
// dispatch/execute-*（SHELL）。已无 delegate 过渡桥。
import { g } from "../../state/store.js";
import { checkCondition } from "../../settings/condition-eval.js";
import { isStallMode } from "../potion-economy.js";
import { decideInfusion } from "../buff/decide-infusion.js";
import { decideBuff } from "../buff/decide-buff.js";
import { decideChannel } from "../buff/decide-channel.js";
import { decideDeSkill } from "../debuff/decide-de-skill.js";
import { decideCastDebuffOnAll } from "../debuff/decide-cast-all.js";
import { decideAttack } from "../attack/decide-attack.js";
import { decideGemUse, decidePotion, decideStallTopup, decideScroll } from "../item/decide-item.js";
import { decideCriticalBuff } from "../critical-buff-guard/decide-critical-buff.js";
import { shouldSkipForBigSkill } from "./big-skill.js";
import { decideBossImperil } from "./decide-boss-imperil.js";
import { ofcWillKillBoss } from "../../state/big-skill-kill-learner.js";

/** @type {import("../../core/types.js").BattleRule[]} */
export const BATTLE_RULES = [
  // 1. 关键 buff 即将消失 + MP 不足 → 暂停告警（decide 自 gate opt.pauseOnCriticalBuffExpire）
  {
    name: "criticalBuffGuard",
    decide: (snap, opt) => decideCriticalBuff(opt, snap),
  },
  // 2. 逃跑
  {
    name: "flee",
    when: (snap, opt) => opt.autoFlee && checkCondition(opt.fleeCondition, snap),
    decide: () => ({ kind: "click-then-reload", selector: "1001", delaySec: 3 }),
  },
  // 3. 自动暂停（step 内 disabled=false 恒走 pauseScript 分支）
  {
    name: "autoPause",
    when: (snap, opt) => opt.autoPause && checkCondition(opt.pauseCondition, snap),
    decide: () => ({ kind: "pause" }),
  },
  // 4. 宝石（decideGemUse 自 gate snap.gemName；dyn-threshold 在 decide，autoTune 计数在 execute）
  {
    name: "useGem",
    decide: (snap, opt) => decideGemUse(opt, snap),
  },
  // 5. 紧急回血回魔（decide 出候选 id 列表，execute 探活+喝第一个可用）
  {
    name: "deadSoon",
    when: (snap, opt) => opt.item && opt.itemOrderValue,
    decide: (snap, opt) => decidePotion(opt, snap),
  },
  // 6. stall 主动 topup（decide 自 gate stallMode，出 attempts 链；execute tryFirst）
  {
    name: "stallTopup",
    decide: (snap, opt) => decideStallTopup(opt, snap),
  },
  // 7. 防御（attemptClick 内置 isOn 探活）
  {
    name: "defend",
    when: (snap, opt) => opt.defend && checkCondition(opt.defendCondition, snap),
    decide: () => ({ kind: "click", selector: "#ckey_defend" }),
  },
  // 8. 卷轴（decide 出候选 item id，execute 探活+点第一个可用）
  {
    name: "useScroll",
    when: (snap, opt) =>
      opt.scrollSwitch &&
      opt.scroll &&
      checkCondition(opt.scrollCondition, snap) &&
      opt.scrollRoundType &&
      opt.scrollRoundType[g("roundType")],
    decide: (snap, opt) => decideScroll(opt, snap),
  },
  // 9. 元素灌注（仅法术模式）
  {
    name: "useInfusions",
    when: (snap, opt) =>
      snap.attackStatus !== 0 && opt.infusionSwitch && checkCondition(opt.infusionCondition, snap),
    decide: (snap, opt) => decideInfusion(opt, snap),
  },
  // 10. Channel（decide 三段优先级返单 click，execute 探活+click）
  {
    name: "useChannelSkill",
    when: (snap, opt) => opt.channelSkillSwitch && opt.channelSkill && snap.channeling,
    decide: (snap, opt) => decideChannel(opt, snap),
  },
  // 11. BUFF
  {
    name: "useBuffSkill",
    when: (snap, opt) =>
      opt.buffSkillSwitch && opt.buffSkill && checkCondition(opt.buffSkillCondition, snap),
    decide: (snap, opt) => decideBuff(opt, snap),
  },
  // 12. Boss-Imperil（decide 算 AoE bestIdx 目标 → click-skill-then-target，含 Spirit 前置）
  //     拖战时跳过：Imperil 只加速击杀，与「让独怪活久攒 OC/蓝」相悖（与 useDeSkill 同款 stall 守卫）。
  //     F4（默认 OFF）：每只活 boss 都确认 OFC 能秒 → 跳过 boss-Imperil（能秒连 imperil 都不用上）。
  {
    name: "bossImperil",
    when: (snap, opt) => {
      if (isStallMode(snap, opt, g("roundNow"), g("roundAll"))) return false;
      if (opt.debuffSkillSwitch === false || !snap.skillReady["213"]) return false;
      const bosses = (snap.view || []).filter((m) => m.isBoss && !m.isDead);
      if (bosses.length && bosses.every((b) => ofcWillKillBoss(b.monsterId, snap, opt).skip)) {
        return false;
      }
      return true;
    },
    decide: (snap, opt) => decideBossImperil(opt, snap),
  },
  // 13. 全员 Weaken（OFC/FRD 即将就绪时跳过）
  {
    name: "castWeakenAll",
    when: (snap, opt) =>
      opt.debuffSkillSwitch &&
      opt.debuffSkillAllWk &&
      !shouldSkipForBigSkill(opt, snap, "We") &&
      snap.view.filter((m) => m.buffs.some((b) => b.includes("weaken"))).length <
        g("monsterAlive") &&
      checkCondition(opt.debuffSkillWkCondition, snap),
    decide: (snap, opt) => decideCastDebuffOnAll(opt, snap, "We"),
  },
  // 14. 全员 Imperil（拖战同样跳过——独怪此时也是 Imperil 唯一目标，加速击杀反拖战意图）
  {
    name: "castImperilAll",
    when: (snap, opt) =>
      !isStallMode(snap, opt, g("roundNow"), g("roundAll")) &&
      opt.debuffSkillSwitch &&
      opt.debuffSkillAllIm &&
      !shouldSkipForBigSkill(opt, snap, "Im") &&
      snap.view.filter((m) => m.buffs.some((b) => b.includes("imperil"))).length <
        g("monsterAlive") &&
      checkCondition(opt.debuffSkillImpCondition, snap),
    decide: (snap, opt) => decideCastDebuffOnAll(opt, snap, "Im"),
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
  // 16. 攻击（最后一步，PURE decideAttack 返 attack-plan）
  {
    name: "attack",
    decide: (snap, opt) => decideAttack(opt, snap),
  },
];
