// 主循环 + 暂停切换 + monsterStatus 修复。
// Phase 5b-1：collectSnapshot 注入 + globalTurn 增量 + 5b-5 OFC/FRD 跳 debuff guard。
// Phase 5b-2 之后 step 内联代码改成 PURE decide(snap) + dispatch(actionResult)。
// file-size-gate: exempt phase-5b-mainloop
import { gE } from "../dom/query.js";
import { attemptClick, attemptClickWithTarget } from "../dom/attempt-click.js";
import { setValue, getValue, delValue } from "../state/storage.js";
import { g, tagEndToTrue } from "../state/store.js";
import { _alert } from "../core/lang.js";
import { goto } from "../core/navigate.js";
import { checkCondition } from "../settings/condition-eval.js";
import { battleInfo } from "../monitor/battle-info.js";
import { killBug } from "./kill-bug.js";
import { useGem, deadSoon, useScroll, stallTopup } from "./item.js";
import { isStallMode } from "./potion-economy.js";
import { useChannelSkill, useBuffSkill, useInfusions, checkAndActivateSpirit } from "./buff.js";
import { useDeSkill, castDebuffOnAll } from "./debuff.js";
import { attack, countMonsterHP } from "./attack.js";
import { runSteps } from "./step-runner.js";
import { incrementGlobalTurn, persistCdState } from "../state/cd-tracker.js";
import { collectSnapshot, assertNoDomRefs, aliveMonstersByOrder } from "./snapshot.js";
import { checkCriticalBuffGuard } from "./critical-buff-guard.js";
import { pauseScript } from "./pause-control.js";

/**
 * Phase 5b-5: OFC/FRD 即将就绪时跳过全员 Weaken/Imperil。
 * @param {object} opt
 * @param {import("../core/types.js").BattleSnapshot} snap
 * @param {"We"|"Im"} kind
 */
function shouldSkipForBigSkill(opt, snap, kind) {
  if (opt[`skipDebuffForBigSkill_${kind}`] === false) return false;
  // Boss 存活时不跳过 Imperil——Imperil 破防让 OFC 打 boss 更狠（一发不够也增伤）。
  // Weaken 减对面伤害，不影响 OFC 杀 boss 速度，仍按 OFC 优化跳过。
  if (kind === "Im" && snap.monsters.some((m) => m.isBoss && !m.isDead)) return false;
  const N = opt.skipDebuffForBigSkillThreshold ?? 3;
  if (snap.aliveCount <= (opt.physicalDowngradeThreshold || 3)) return false;
  const ocFutureMax = snap.oc + N * 10;
  for (const skill of ["OFC", "FRD"]) {
    if (!opt[`skill_${skill}`] && !opt.skill?.[skill]) continue;
    if ((snap.cdMap[skill] ?? 99) > N) continue;
    const ocNeed = skill === "OFC" ? 205 : 105;
    if (ocFutureMax >= ocNeed) return true;
  }
  return false;
}

export function main() {
  if (getValue("disabled")) {
    document.title = _alert(
      -1,
      "hvAutoAttack暂停中",
      "hvAutoAttack暫停中",
      "hvAutoAttack Paused"
    );
    gE("#hvAABox2>button").innerHTML =
      "<l0>继续</l0><l1>繼續</l1><l2>Continue</l2>";
    return;
  }

  // 状态初始化（不参与 step，必跑）
  if (
    getValue("monsterStatus") &&
    getValue("monsterStatus", true).length === g("monsterAll")
  ) {
    g("monsterStatus", getValue("monsterStatus", true));
  } else {
    fixMonsterStatus();
  }
  g("turn", g("turn") + 1);
  battleInfo();
  killBug();
  countMonsterHP();

  // Phase 5b-1: 跨 battle globalTurn 累计 + 持久化 + 一次性收集 snapshot
  incrementGlobalTurn();
  persistCdState();
  const snap = collectSnapshot();
  // vitals 镜像到 g()：snapshot 内 readPlayerVitals 已读过 hp/mp/sp/oc 的 DOM，
  // 此处只搬值，供"不传 snap 的 checkCondition"经 g(str) fallback 消费（消除原 70-87 的二次 DOM 读 = 待办 B-#2）。
  // 注：oc 统一为 readPlayerVitals 的 parseInt 数值（原 dvbh 布局曾存 textContent 字符串，已归一为数值）。
  g("hp", snap.hp);
  g("mp", snap.mp);
  g("sp", snap.sp);
  g("oc", snap.oc);
  // R9 调试断言：snapshot 不含 DOM 引用（生产可关，开发期保留）
  if (g("option")?.debugSnapshot) assertNoDomRefs(snap);

  // 行动决策链。任一 step 触发副作用并设 g("end", true) 即停止后续。
  runSteps([
    // 关键 buff 即将消失 + MP 不足 → 暂停脚本 + 告警（Monsterbation graceful degradation 借鉴）
    // 放最前：避免在"buff 没续上裸 buff 攻击"链路上继续浪费
    () => {
      checkCriticalBuffGuard(snap);
    },
    // 逃跑
    () => {
      if (g("option").autoFlee && checkCondition(g("option").fleeCondition)) {
        gE("1001").click();
        setTimeout(goto, 3 * 1000);
        tagEndToTrue();
      }
    },
    // 暂停（pauseChange 内部已 tagEndToTrue）
    () => {
      if (g("option").autoPause && checkCondition(g("option").pauseCondition)) {
        pauseChange();
      }
    },
    // 宝石
    () => {
      if (gE("#ikey_p")) useGem(snap);
    },
    // 紧急回血回魔
    () => {
      if (g("option").item && g("option").itemOrderValue) deadSoon(snap);
    },
    // PoC stall：1 怪 + 后续轮还有 → 主动喝 MP/SP pot 拉满下轮开局
    () => stallTopup(snap),
    // 防御（attemptClick 内置 isOn 探活；channeling 时按钮禁用 → 跳过，让后续 channel/attack 接管）
    () => {
      if (!g("option").defend) return;
      if (!checkCondition(g("option").defendCondition)) return;
      attemptClick("#ckey_defend");
    },
    // 卷轴
    () => {
      if (
        g("option").scrollSwitch &&
        g("option").scroll &&
        checkCondition(g("option").scrollCondition) &&
        g("option").scrollRoundType &&
        g("option").scrollRoundType[g("roundType")]
      ) {
        useScroll();
      }
    },
    // 元素灌注（仅法术模式）
    () => {
      if (
        g("attackStatus") !== 0 &&
        g("option").infusionSwitch &&
        checkCondition(g("option").infusionCondition)
      ) {
        useInfusions(snap);
      }
    },
    // Channel
    () => {
      if (
        g("option").channelSkillSwitch &&
        g("option").channelSkill &&
        gE('#pane_effects>img[src*="channeling"]')
      ) {
        useChannelSkill();
      }
    },
    // BUFF
    () => {
      if (
        g("option").buffSkillSwitch &&
        g("option").buffSkill &&
        checkCondition(g("option").buffSkillCondition)
      ) {
        useBuffSkill(snap);
      }
    },
    // Boss-Imperil（含 AoE 覆盖优化：N=3 时 boss 在 2,4 → click 3 一次覆盖两个 boss）
    () => {
      if (g("option").debuffSkillSwitch === false) return;
      if (!snap.skillReady["213"]) return;
      const sortedAlive = aliveMonstersByOrder(snap);
      const isBossNoIm = (m) => m.isBoss && !m.buffs.includes("imperil");
      if (!sortedAlive.some(isBossNoIm)) return;
      // HV AoE 模式 = backward（参 legacy castDebuffOnAll：click i+1 覆盖 [i, i+1]）。
      // 窗口 [c-aoe+1, c]。
      // tie-break：相同覆盖时优先 click needy boss 自身——保证它必被击中（防 backward/forward 模式不匹配）。
      const aoe = (snap.spellAoe && snap.spellAoe.Imperil) || g("option").debuffSkillAoe?.Im || 1;
      let bestIdx = -1, bestCov = -1, bestSelfNeed = false;
      for (let c = 0; c < sortedAlive.length; c++) {
        const start = Math.max(0, c - aoe + 1);
        const end = c;
        let cov = 0;
        for (let i = start; i <= end; i++) if (isBossNoIm(sortedAlive[i])) cov++;
        const selfNeed = isBossNoIm(sortedAlive[c]);
        if (cov > bestCov || (cov === bestCov && selfNeed && !bestSelfNeed)) {
          bestCov = cov; bestIdx = c; bestSelfNeed = selfNeed;
        }
      }
      if (bestIdx < 0 || bestCov <= 0) return;
      if (checkAndActivateSpirit()) return;
      // 探活：snap.skillReady["213"] 是 turn 入口快照，同回合内前序 step click 后已可能 opacity=0.5；
      // 必须实时 isOn 探活避免 channeling 同构死锁
      attemptClickWithTarget("213", `#mkey_${sortedAlive[bestIdx].id}`);
    },
    // 全员 Weaken（Phase 5b-5：OFC/FRD 即将就绪时跳过）
    () => {
      if (
        g("option").debuffSkillSwitch &&
        g("option").debuffSkillAllWk &&
        !shouldSkipForBigSkill(g("option"), snap, "We") &&
        // 待办 A-线索3：用 snap.monsters 计已上 weaken 的怪数（替代 gE 实时重查 DOM）；
        // 到达此 step 时前序若 click 必已 tagEnd+return，故 snap 等价 live DOM
        snap.monsters.filter((m) => m.buffs.some((b) => b.includes("weaken"))).length < g("monsterAlive") &&
        checkCondition(g("option").debuffSkillWkCondition)
      ) {
        castDebuffOnAll("We", snap);
      }
    },
    // 全员 Imperil（Phase 5b-5：OFC/FRD 即将就绪时跳过）
    () => {
      if (
        g("option").debuffSkillSwitch &&
        g("option").debuffSkillAllIm &&
        !shouldSkipForBigSkill(g("option"), snap, "Im") &&
        // 待办 A-线索3：用 snap.monsters 计已上 imperil 的怪数（替代 gE 实时重查 DOM）
        snap.monsters.filter((m) => m.buffs.some((b) => b.includes("imperil"))).length < g("monsterAlive") &&
        checkCondition(g("option").debuffSkillImpCondition)
      ) {
        castDebuffOnAll("Im", snap);
      }
    },
    // 单目标 Debuff（stall 模式跳过——独怪上 debuff 浪费 MP + CD）
    () => {
      if (isStallMode(snap, g("option"), g("roundNow"), g("roundAll"))) return;
      if (
        g("option").debuffSkillSwitch &&
        g("option").debuffSkill &&
        checkCondition(g("option").debuffSkillCondition)
      ) {
        useDeSkill(snap);
      }
    },
    // 攻击（最后一步）
    () => attack(snap),
  ]);
}

export function pauseChange() {
  if (getValue("disabled")) {
    if (gE(".pauseChange"))
      gE(".pauseChange").innerHTML =
        "<l0>暂停</l0><l1>暫停</l1><l2>Pause</l2>";
    delValue(0);
    main();
  } else {
    pauseScript();
  }
}

export function fixMonsterStatus() {
  document.title = _alert(
    -1,
    "monsterStatus错误，正在尝试修复",
    "monsterStatus錯誤，正在嘗試修復",
    "monsterStatus Error, trying to fix"
  );
  const monsterStatus = [];
  gE("div.btm2", "all").forEach((monster, i) => {
    monsterStatus.push({
      order: i,
      id: i === 9 ? 0 : i + 1,
      hp: monster.style.background === "" ? 1000 : 100000,
    });
  });
  setValue("monsterStatus", monsterStatus);
  goto();
}
