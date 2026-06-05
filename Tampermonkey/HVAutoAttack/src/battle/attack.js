// 攻击决策：focus / spirit / ether tap / 法术阶选择 / 物理技能优先级 / AoE 目标。
// Phase 5b-2 wave 1：法术阶选择 + 物理技能选择 → 拆出 PURE 决策辅助 (decide-tier / decide-skill)。
// 副作用 (focus/spirit/ether-tap/Merciful 斩杀的 target click) 仍在 attack() 内（单回合 SHELL）。
// file-size-gate: exempt phase-4-monolith
import { gE, isOn, isSpiritActive } from "../dom/query.js";
import { g, tagEndToTrue } from "../state/store.js";
import { checkCondition } from "../settings/condition-eval.js";
import { DEBUFF_SKILL_LIB } from "../data/debuff-lib.js";
import { OFFENSIVE_SPELL_LIB } from "../data/spell-lib.js";
import { recordFire } from "../state/cd-tracker.js";
import { selectSpellTier } from "./attack/decide-tier.js";
import { scorePhysicalSkillCandidates } from "./attack/decide-skill.js";
import { decideByUtility } from "./utility-engine.js";
import { isStallMode } from "./potion-economy.js";
import { parseBattleLog, accumulateDamageByMonster, normalizeMonsterName } from "./log-parser.js";
import { getMonster, setMonster } from "../state/monster-db-store.js";

/**
 * 本次页面生命周期内已触发 HP 反推的怪名集合（todo 491）。
 * 页面 reload 后自动清空，确保每页面每怪最多触发一次 parseBattleLog + 写库检查。
 * （死亡后 monsterStatus[i].isDead 不持久化，reload 后 wasDead = undefined，若不缓存则每 turn 重复触发）
 * @type {Set<string>}
 */
const _inferredThisPage = new Set();

/**
 * 怪物死亡时从战斗日志累计伤害反推满血 HP，写入 monsterStatus[i].inferredMaxHP 并补写怪物库。
 * todo 491：从 HVDamageNumber 思路借鉴——累计本场战斗对该怪的总伤害即为其满血 HP 下限。
 * overkill（最后一击超出剩余 HP）会导致略高估，可接受；≤0 的值跳过不写库。
 * fire-and-forget：Promise 链内错误静默，不影响主循环。
 * @param {string} monsterName 怪物名（来自 .btm3 textContent）
 * @param {number} inferredMaxHP 反推值
 */
function inferAndStoreMaxHP(monsterName, inferredMaxHP) {
  if (!monsterName || inferredMaxHP <= 0) return;
  getMonster(monsterName)
    .then((existing) => {
      if (existing && existing.maxHP != null) return; // 已有 maxHP 则不覆盖
      /** @type {import("../data/monster-db.js").MonsterInfo} */
      const toStore = existing
        ? { ...existing, maxHP: inferredMaxHP }
        : { monsterName, maxHP: inferredMaxHP };
      return setMonster(toStore);
    })
    .catch(() => {}); // 静默：写库失败不影响主循环
}

export function countMonsterHP() {
  const monsterHpElements = gE("div.btm4>div.btm5:nth-child(1)", "all");
  // 同步读 btm1 数组，与 monsterHpElements 等长等序，用于取 .btm3 怪名（todo 491）
  const monsterEls = gE("div.btm1", "all");
  const monsterStatus = g("monsterStatus");
  const hpArray = [];

  // 死亡检测：本 turn 新死亡的怪 → 触发 HP 反推（todo 491）
  // 延迟到遍历结束后批量处理，避免在 forEach 中重复解析 battleLog
  /** @type {Array<{idx: number, name: string}>} */
  const newlyDead = [];

  monsterHpElements.forEach((monster, i) => {
    const isDead = !!gE('img[src*="nbardead.png"]', monster);
    const hpNow = isDead
      ? Infinity
      : Math.floor(
          (monsterStatus[i].hp * parseFloat(gE("img", monster).style.width)) /
            120
        ) + 1;

    monsterStatus[i].isDead = isDead;
    monsterStatus[i].hpNow = hpNow;

    // 新死亡检测：本 turn 死亡 且 本页面生命周期未处理过（todo 491）
    // wasDead 为 undefined（reload 后 monsterStatus 无 isDead 字段）等价 falsy，首次死亡触发
    // _inferredThisPage 按怪名去重：避免 reload 后已死怪每 turn 重复触发 parseBattleLog
    if (isDead) {
      const btm3 = monsterEls[i]?.querySelector?.(".btm3");
      const name = btm3 ? btm3.textContent.trim() : "";
      if (name && !_inferredThisPage.has(name)) {
        newlyDead.push({ idx: i, name });
      }
    }

    if (!isDead) {
      hpArray.push(hpNow);
    }
  });

  // 有新死亡的怪 → 解析本场战斗日志，累计伤害，反推 HP（todo 491）
  if (newlyDead.length > 0) {
    const events = parseBattleLog();
    const dmgMap = accumulateDamageByMonster(events);
    for (const { idx, name } of newlyDead) {
      // 无论累计是否成功，都标记为已处理（避免后续 reload 重复触发）
      _inferredThisPage.add(name);
      const acc = dmgMap.get(normalizeMonsterName(name)); // 归一两端怪名(消日志冠词/空白差异)再匹配; _inferredThisPage/写库仍用原始名
      if (acc && acc.totalDamage > 0) {
        // 写入 monsterStatus[idx].inferredMaxHP（供调试/future panel 显示）
        monsterStatus[idx].inferredMaxHP = acc.totalDamage;
        // fire-and-forget 写库
        inferAndStoreMaxHP(name, acc.totalDamage);
      }
    }
  }

  const hpLowest = Math.min(...hpArray);
  const hpMost = Math.max(...hpArray);
  const isReverse = g("option").ruleReverse;
  const weightFactor = isReverse ? hpMost * 10 : 10 / hpLowest;

  monsterStatus.forEach((monster) => {
    monster.finWeight = monster.isDead
      ? Infinity
      : isReverse
      ? weightFactor / monster.hpNow
      : monster.hpNow * weightFactor;
  });

  const monsterBuffElements = gE("div.btm6", "all");
  monsterBuffElements.forEach((buffElement, i) => {
    DEBUFF_SKILL_LIB.forEach((skill, key) => {
      if (gE(`img[src*="${skill.img}"]`, buffElement)) {
        monsterStatus[i].finWeight += isReverse
          ? -g("option").weight[key]
          : g("option").weight[key];
      }
    });
  });

  monsterStatus.sort((a, b) => a.finWeight - b.finWeight);
  g("monsterStatus", monsterStatus);
}

/** @param {import("../core/types.js").BattleSnapshot} snap 当前 turn 快照（main() 透传，全程复用） */
export function attack(snap) {
  const option = g("option");
  const spiritElement = gE("#ckey_spirit");
  const spiritOn = isSpiritActive(spiritElement);
  const monsterStatus = g("monsterStatus");
  const aliveMonsters = monsterStatus.filter((monster) => !monster.isDead);

  // 专注
  if (option.focus && checkCondition(option.focusCondition)) {
    gE("#ckey_focus").click();
    return;
  }

  // 灵动架势——stall 模式让 stallTopup 全权管，attack 不参与切换避免循环
  // 防抖闸：上次切换 N 回合内不再翻（hysteresis），避免 turnOnSS/turnOffSS 条件同时成立的死循环
  const _stallNow = isStallMode(snap, option, g("roundNow"), g("roundAll"));
  const _lastSpiritToggle = g("lastSpiritToggleGlobalTurn") ?? -999;
  const _curGlobalTurn = g("globalTurn") || 0;
  const _spiritCooldown = option.spiritToggleMinInterval ?? 3;
  const _wantsOn = option.turnOnSS && checkCondition(option.turnOnSSCondition) && !spiritOn;
  const _wantsOff = option.turnOffSS && checkCondition(option.turnOffSSCondition) && spiritOn;
  const _bothActive = option.turnOnSS && checkCondition(option.turnOnSSCondition) &&
    option.turnOffSS && checkCondition(option.turnOffSSCondition);
  if (_stallNow) {
    // stall 中跳过 attack 的 spirit 切换
  } else if (_bothActive) {
    // 两条 condition 同时为真 = 用户配置冲突（缺 hysteresis）→ 不切换避免死循环
    if (option.dynamicHealLog ?? true) {
      console.log("[spirit-toggle] turnOnSS && turnOffSS conditions both true, skip (config conflict)");
    }
  } else if (_curGlobalTurn - _lastSpiritToggle < _spiritCooldown) {
    // 防抖：刚切换不久，本回合不再切
  } else if (_wantsOn || _wantsOff) {
    spiritElement.click();
    g("lastSpiritToggleGlobalTurn", _curGlobalTurn);
    tagEndToTrue();
    return;
  }

  // 检查 Ether Tap
  const firstMonster = aliveMonsters[0];
  const etherTapCondition =
    option.etherTap &&
    gE(`#mkey_${firstMonster.id}>div.btm6>img[src*="coalescemana"]`) &&
    (!gE('#pane_effects>img[onmouseover*="Ether Tap (x2)"]') ||
      gE('#pane_effects>img[src*="wpn_et"][id*="effect_expire"]')) &&
    checkCondition(option.etherTapCondition);

  if (!etherTapCondition) {
    const attackStatus = g("attackStatus");
    if (attackStatus !== 0) {
      // Phase 5b-2 wave 1: PURE 决策决定哪一阶法术（复用 main() 透传的 snap）
      const { tier: selectedTier } = selectSpellTier(option, snap);

      if (selectedTier > 0) {
        const spellId = `1${attackStatus}${selectedTier}`;
        // 探活：selectSpellTier 是 PURE 决策读不到运行时按钮 opacity；MP 不足 / 静默 / 当前阶 CD 等都会让 spell 按钮 opacity=0.5。
        // 关键：CD 时不能 return 退出 attack()，否则跳过后续 skill 块 + 默认 mkey click → 全无副作用 → 卡死。
        // 正确退化：fall through 到 skill 块和最后默认 mkey click（普通武器攻击始终可用，保证主循环不停）。
        if (isOn(spellId)) {
          gE(spellId).click();
          // AoE 目标选择
          const spellKey = `${attackStatus}${selectedTier}`;
          const spellName = OFFENSIVE_SPELL_LIB.get(spellKey);
          const aoeCount = spellName ? (g("spellAoe")[spellName] || (option.spellAoe && option.spellAoe[spellKey]) || 1) : 1;

          if (aoeCount >= 2 && aliveMonsters.length > 1) {
            monsterStatus.sort((a, b) => a.order - b.order);
            const aliveByOrder = monsterStatus.filter(m => !m.isDead);
            gE(`#mkey_${aliveByOrder[0].id}`).click();
            monsterStatus.sort((a, b) => a.finWeight - b.finWeight);
            tagEndToTrue();
            return;
          }
          // 单目标 spell click 已发，fall through 到末尾默认 mkey 选目标
        }
        // spell on CD: 静默 skip，fall through 到 skill 块 / 默认 mkey（保留原始优雅退化语义）
      }
    }
  }

  // 检查技能情况，并释放技能
  if (option.skillSwitch) {
    // 物理技能顺序/技能表已下沉至 PURE 决策 decide-skill.js（scorePhysicalSkillCandidates 内部各自维护）；
    // 此处原 skillOrder / skillLib 两个常量为 first-match 旧实现残留，已随 utility scoring 替换删除。

    /** 当为盾战时，当怪物已经被晕眩，则跳过盾击
     * @type {boolean}
     * @example
     * // true - 盾战且已晕眩
     * // false - 不是盾战或没晕眩
     */
    const firstMonsterStunned =
      option.fightingStyle === "2" &&
      gE(`#mkey_${aliveMonsters[0].id} img[src*="wpn_stun"]`); // 检查怪物是否晕眩

    // 当最后一回合且仅剩最后一直怪物时,优先释放最后的慈悲,秒杀无需灵动架势
    if (
      option.mercifulBlow && // 按钮启动
      option.fightingStyle === "2" &&
      aliveMonsters.length === 1 &&
      g("roundNow") === g("roundAll") // 最后一回合
      // checkCondition(option['skillT3Condition']) 判断条件T3
    ) {
      const target = aliveMonsters[0];
      if (
        target.hpNow / target.hp < 0.248 &&
        gE(`#mkey_${target.id} img[src*="wpn_bleed"]`) &&
        snap.oc >= 105
      ) {
        const skillElement = gE(`2${option.fightingStyle}03`);
        if (isOn(skillElement)) {
          skillElement.click();
          gE(`#mkey_${target.id}`).click();
          tagEndToTrue();
          return;
        }
      }
    }

    // A 方案 PoC：utility scoring 决定物理技能（替代 first-match 优先级；复用 main() 透传的 snap）
    const scored = scorePhysicalSkillCandidates(option, snap, { firstMonsterStunned: !!firstMonsterStunned });
    const candidates = scored.map((c) => ({
      name: c.code,
      score: c.score,
      explain: c.explain,
      dispatch: () => {
        // 探活：scorePhysicalSkillCandidates 是 PURE 决策，读不到运行时按钮 opacity；
        // 必须 isOn 探活避免裸 click 死锁
        if (!isOn(c.id)) return;
        g("skillOTOS")[c.code] = (g("skillOTOS")[c.code] || 0) + 1;
        gE(c.id).click();
        recordFire(c.code);
        // Merciful Blow：T3 多怪场景斩杀流血残血
        if (
          option.mercifulBlow &&
          option.fightingStyle === "2" &&
          c.code === "T3" &&
          aliveMonsters.length > 1
        ) {
          for (const monster of aliveMonsters) {
            if (
              monster.hpNow / monster.hp < 0.248 &&
              gE(`#mkey_${monster.id} img[src*="wpn_bleed"]`)
            ) {
              gE(`#mkey_${monster.id}`).click();
              tagEndToTrue();
              return;
            }
          }
        }
      },
    }));
    decideByUtility(candidates);
  }

  // 默认攻击第一个或者的目标
  gE(`#mkey_${firstMonster.id}`).click();
  tagEndToTrue();
}
