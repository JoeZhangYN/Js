// 每条 rule：{ name, when?(snap,opt), decide(snap,opt)→ActionResult }。顺序 = 原 runSteps 顺序。
// 深度 B 后**全部 16 条 decide 均为 PURE**（只读 snap，零 DOM 判断）；副作用全在
import { checkCondition } from "../../settings/condition-eval.js";
import {
  BattleDebuffCoverageEvent,
  runBattleDebuffCoverageAutomation,
} from "../battle-debuff-coverage.js";
import { BattleStallModeEvent, runBattleStallModeAutomation } from "../battle-stall-mode.js";
import { decideInfusion } from "../buff/decide-infusion.js";
import { decideBuff } from "../buff/decide-buff.js";
import { decideChannel } from "../buff/decide-channel.js";
import { decideDeSkill } from "../debuff/decide-de-skill.js";
import { decideCastDebuffOnAll } from "../debuff/decide-cast-all.js";
import { decideAttack } from "../attack/decide-attack.js";
import { decideGemUse, decidePotion, decideStallTopup, decideScroll } from "../item/decide-item.js";
import { decideCriticalBuff } from "../critical-buff-guard/decide-critical-buff.js";
import { BigSkillDebuffEvent, runBigSkillDebuffAutomation } from "./big-skill.js";
import { BossImperilEvent, runBossImperilAutomation } from "./decide-boss-imperil.js";
import { decideBurstControl } from "../debuff/decide-burst-control.js";

const readRuleRuntimeContext = (snap) => snap;
const isStallingForRules = (snap, opt, runtime = readRuleRuntimeContext(snap)) =>
  runBattleStallModeAutomation({
    type: BattleStallModeEvent.READ_ACTIVE,
    snap,
    opt,
    roundNow: runtime.roundNow,
    roundAll: runtime.roundAll,
  });
const hasMissingDebuff = (snap, runtime, debuffName) =>
  runBattleDebuffCoverageAutomation({
    type: BattleDebuffCoverageEvent.HAS_MISSING_DEBUFF,
    snap,
    debuffName,
    monsterAlive: runtime.monsterAlive,
  });
const canFlee = (snap, opt) => opt.autoFlee && checkCondition(opt.fleeCondition, snap);
const flee = () => ({ kind: "click-then-reload", selector: "1001", delaySec: 3 });
const canAutoPause = (snap, opt) => opt.autoPause && checkCondition(opt.pauseCondition, snap);
const pause = () => ({ kind: "pause" });
const canDefend = (snap, opt) => opt.defend && checkCondition(opt.defendCondition, snap);
const defend = () => ({ kind: "click", selector: "#ckey_defend" });
const shouldSkipDebuffForBigSkill = (opt, snap, kind) =>
  runBigSkillDebuffAutomation({
    type: BigSkillDebuffEvent.SHOULD_SKIP_DEBUFF,
    opt,
    snap,
    kind,
  });

/** @type {import("../../core/types.js").BattleRule[]} */
export const BATTLE_RULES = [
  // 1. 关键 buff 即将消失 + MP 不足 → 暂停告警（decide 自 gate opt.pauseOnCriticalBuffExpire）
  { name: "criticalBuffGuard", decide: (snap, opt) => decideCriticalBuff(opt, snap) },
  // 2. 逃跑
  { name: "flee", when: canFlee, decide: flee },
  // 3. 自动暂停（dispatch 交给 runBattlePauseAutomation 统一写暂停状态）
  { name: "autoPause", when: canAutoPause, decide: pause },
  // 4. 宝石（decideGemUse 自 gate snap.gemName；dyn-threshold 在 decide，autoTune 计数在 execute）
  { name: "useGem", decide: (snap, opt) => decideGemUse(opt, snap) },
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
  { name: "defend", when: canDefend, decide: defend },
  // 8. 卷轴（decide 出候选 item id，execute 探活+点第一个可用）
  {
    name: "useScroll",
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
  // 11.5 burstControl（F5，默认 OFF）：学习到的高爆发怪威胁血量蹦极 → 单点 Silence/Sleep 控住它。
  //      置于进攻 debuff（bossImperil 等）之前——保命先于增伤；但在急救/topup（步 4-6）之后。
  //      重逻辑在 decide，不适用时返 noop（不空耗回合）。
  {
    name: "burstControl",
    decide: (snap, opt) => decideBurstControl(opt, snap),
  },
  // 12. Boss-Imperil（decide 算 AoE bestIdx 目标 → click-skill-then-target，含 Spirit 前置）
  //     拖战时跳过：Imperil 只加速击杀，与「让独怪活久攒 OC/蓝」相悖（与 useDeSkill 同款 stall 守卫）。
  //     F4（默认 OFF）：每只活 boss 都确认 OFC 能秒 → 跳过 boss-Imperil（能秒连 imperil 都不用上）。
  {
    name: "bossImperil",
    when: (snap, opt) => runBossImperilAutomation({ type: BossImperilEvent.CAN_CAST, snap, opt }),
    decide: (snap, opt) => runBossImperilAutomation({ type: BossImperilEvent.DECIDE, snap, opt }),
  },
  // 13. 全员 Weaken（OFC/FRD 即将就绪时跳过）
  {
    name: "castWeakenAll",
    when: (snap, opt) =>
      opt.debuffSkillSwitch &&
      opt.debuffSkillAllWk &&
      !shouldSkipDebuffForBigSkill(opt, snap, "We") &&
      hasMissingDebuff(snap, readRuleRuntimeContext(snap), "weaken") &&
      checkCondition(opt.debuffSkillWkCondition, snap),
    decide: (snap, opt) => decideCastDebuffOnAll(opt, snap, "We"),
  },
  // 14. 全员 Imperil（拖战同样跳过——独怪此时也是 Imperil 唯一目标，加速击杀反拖战意图）
  {
    name: "castImperilAll",
    when: (snap, opt) =>
      !isStallingForRules(snap, opt) &&
      opt.debuffSkillSwitch &&
      opt.debuffSkillAllIm &&
      !shouldSkipDebuffForBigSkill(opt, snap, "Im") &&
      hasMissingDebuff(snap, readRuleRuntimeContext(snap), "imperil") &&
      checkCondition(opt.debuffSkillImpCondition, snap),
    decide: (snap, opt) => decideCastDebuffOnAll(opt, snap, "Im"),
  },
  // 15. 单目标 Debuff（stall 模式跳过——独怪上 debuff 浪费 MP + CD）
  {
    name: "useDeSkill",
    when: (snap, opt) =>
      !isStallingForRules(snap, opt) &&
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
