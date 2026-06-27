// 怪物 HP 统计（countMonsterHP）+ 死亡反推满血 HP（todo 491）。
// attack 决策已 PURE 化迁出：决策见 attack/decide-attack.js，副作用见 attack/execute-attack.js。
// file-size-gate: exempt phase-4-monolith
import { gE } from "../dom/query.js";
import { g } from "../state/store.js";
import { DEBUFF_SKILL_LIB } from "../data/debuff-lib.js";
import { parseBattleLog, accumulateDamageByMonster, normalizeMonsterName } from "./log-parser.js";
import {
  MonsterDbStoreEvent,
  runMonsterDbStoreAutomation,
} from "../state/monster-db-store.js";

/**
 * 本次页面生命周期内已触发 HP 反推的怪名集合（todo 491）。
 * 页面 reload 后自动清空，确保每页面每怪最多触发一次 parseBattleLog + 写库检查。
 * （死亡后 monsterStatus[i].isDead 不持久化，reload 后 wasDead = undefined，若不缓存则每 turn 重复触发）
 * @type {Set<string>}
 */
const _inferredThisPage = new Set();

/**
 * 怪物死亡时从战斗日志累计伤害反推满血 HP，写入 monsterStatus[i].inferredMaxHP 并补 (MID,LV) 满血表。
 * 借鉴 HVDamageNumber：累计本场对该怪总伤害 ≈ 其满血下限（overkill 略高估，可接受）。
 * **(MID,LV) 键**（MID 唯一定位怪、LV 决定本场满血）；仅当该 (MID,LV) 无已存值才写——开局 spawn
 * 行 / scan 的准确值优先，死亡反推是"开局日志整缺"的末位兜底。fire-and-forget：错误静默。
 * @param {number|undefined} monsterId
 * @param {number|undefined} level   本场战斗 LV
 * @param {number} inferredMaxHP
 */
function inferAndStoreMaxHP(monsterId, level, inferredMaxHP) {
  if (monsterId == null || level == null || !(inferredMaxHP > 0)) return;
  runMonsterDbStoreAutomation({
    type: MonsterDbStoreEvent.HP_READ,
    monsterId,
    level,
  })
    .then((existing) => {
      if (existing && existing.maxHP != null) return; // 已有(准确/先前反推)则不覆盖
      return runMonsterDbStoreAutomation({
        type: MonsterDbStoreEvent.HP_WRITE,
        monsterId,
        level,
        maxHP: inferredMaxHP,
      });
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
      const acc = dmgMap.get(normalizeMonsterName(name)); // 归一两端怪名(消日志冠词/空白差异)再匹配伤害
      if (acc && acc.totalDamage > 0) {
        const st = monsterStatus[idx];
        st.inferredMaxHP = acc.totalDamage; // 供调试/panel 显示
        // fire-and-forget 写 (MID,LV) 满血表（MID/LV 来自开局 spawn 行，存于 monsterStatus）
        inferAndStoreMaxHP(st.monsterId, st.level, acc.totalDamage);
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
