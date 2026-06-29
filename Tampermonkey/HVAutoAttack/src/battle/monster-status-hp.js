// Monster HP runtime update implementation. Called only by monster-status-automation.
import { gE } from "../dom/query.js";
import { g } from "../state/store.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { DEBUFF_SKILL_LIB } from "../data/debuff-lib.js";
import { parseBattleLog, accumulateDamageByMonster, normalizeMonsterName } from "./log-parser.js";
import { MonsterDbStoreEvent, runMonsterDbStoreAutomation } from "../state/monster-db-store.js";

/**
 * 本次页面生命周期内已触发 HP 反推的怪名集合（todo 491）。
 * 页面 reload 后自动清空，确保每页面每怪最多触发一次 parseBattleLog + 写库检查。
 * @type {Set<string>}
 */
const inferredThisPage = new Set();

function inferAndStoreMaxHP(monsterId, level, inferredMaxHP) {
  if (monsterId == null || level == null || !(inferredMaxHP > 0)) return;
  runMonsterDbStoreAutomation({
    type: MonsterDbStoreEvent.HP_READ,
    monsterId,
    level,
  })
    .then((existing) => {
      if (existing && existing.maxHP != null) return;
      return runMonsterDbStoreAutomation({
        type: MonsterDbStoreEvent.HP_WRITE,
        monsterId,
        level,
        maxHP: inferredMaxHP,
      });
    })
    .catch(() => {});
}

function readTargetWeightOptions() {
  return {
    ruleReverse: runOptionAutomation({
      type: OptionEvent.READ_FIELD,
      key: "ruleReverse",
      fallback: false,
    }),
    weight: runOptionAutomation({
      type: OptionEvent.READ_FIELD,
      key: "weight",
      fallback: {},
    }),
  };
}

export function updateMonsterHpRuntime() {
  const monsterHpElements = gE("div.btm4>div.btm5:nth-child(1)", "all");
  const monsterEls = gE("div.btm1", "all");
  const monsterStatus = g("monsterStatus");
  const hpArray = [];
  const newlyDead = [];

  monsterHpElements.forEach((monster, i) => {
    const isDead = !!gE('img[src*="nbardead.png"]', monster);
    const hpNow = isDead
      ? Infinity
      : Math.floor((monsterStatus[i].hp * parseFloat(gE("img", monster).style.width)) / 120) + 1;

    monsterStatus[i].isDead = isDead;
    monsterStatus[i].hpNow = hpNow;

    if (isDead) {
      const btm3 = monsterEls[i]?.querySelector?.(".btm3");
      const name = btm3 ? btm3.textContent.trim() : "";
      if (name && !inferredThisPage.has(name)) newlyDead.push({ idx: i, name });
    }
    if (!isDead) hpArray.push(hpNow);
  });

  if (newlyDead.length > 0) {
    const dmgMap = accumulateDamageByMonster(parseBattleLog());
    for (const { idx, name } of newlyDead) {
      inferredThisPage.add(name);
      const acc = dmgMap.get(normalizeMonsterName(name));
      if (acc && acc.totalDamage > 0) {
        const st = monsterStatus[idx];
        st.inferredMaxHP = acc.totalDamage;
        inferAndStoreMaxHP(st.monsterId, st.level, acc.totalDamage);
      }
    }
  }

  const hpLowest = Math.min(...hpArray);
  const hpMost = Math.max(...hpArray);
  const targetWeightOptions = readTargetWeightOptions();
  const isReverse = targetWeightOptions.ruleReverse;
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
          ? -targetWeightOptions.weight[key]
          : targetWeightOptions.weight[key];
      }
    });
  });

  monsterStatus.sort((a, b) => a.finWeight - b.finWeight);
  g("monsterStatus", monsterStatus);
}
