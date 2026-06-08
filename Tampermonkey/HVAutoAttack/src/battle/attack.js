// 怪物 HP 统计（countMonsterHP）+ 死亡反推满血 HP（todo 491）。
// attack 决策已 PURE 化迁出：决策见 attack/decide-attack.js，副作用见 attack/execute-attack.js。
// file-size-gate: exempt phase-4-monolith
import { gE } from "../dom/query.js";
import { g } from "../state/store.js";
import { DEBUFF_SKILL_LIB } from "../data/debuff-lib.js";
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
