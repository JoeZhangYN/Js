// Monster HP runtime update implementation. Called only by monster-status-automation.
import { g } from "../state/store.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { parseBattleLog, accumulateDamageByMonster } from "./log-parser.js";
import { normalizeMonsterName } from "../monster/monster-identity.js";
import { MonsterDbStoreEvent, runMonsterDbStoreAutomation } from "../state/monster-db-store.js";
import { MonsterStatusViewEvent, runMonsterStatusView } from "./monster-status-view.js";

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
  const monsterStatus = g("monsterStatus");
  if (!Array.isArray(monsterStatus)) return;

  const runtimeSnapshot = runMonsterStatusView({
    type: MonsterStatusViewEvent.READ_HP_RUNTIME_SNAPSHOT,
  });
  const statusByOrder = new Map(monsterStatus.map((status) => [status.order, status]));
  const hpArray = [];
  const newlyDead = [];

  runtimeSnapshot.forEach((monster) => {
    const status = statusByOrder.get(monster.order);
    if (!status) return;
    const hpNow = monster.isDead
      ? Infinity
      : Math.floor((status.hp * monster.hpBarWidth) / 120) + 1;

    status.isDead = monster.isDead;
    status.hpNow = hpNow;

    if (monster.isDead) {
      if (monster.name && !inferredThisPage.has(monster.name)) {
        newlyDead.push({ order: monster.order, name: monster.name });
      }
    }
    if (!monster.isDead) hpArray.push(hpNow);
  });

  if (newlyDead.length > 0) {
    const dmgMap = accumulateDamageByMonster(parseBattleLog());
    for (const { order, name } of newlyDead) {
      inferredThisPage.add(name);
      const acc = dmgMap.get(normalizeMonsterName(name));
      if (acc && acc.totalDamage > 0) {
        const st = statusByOrder.get(order);
        if (!st) continue;
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

  runtimeSnapshot.forEach((monster) => {
    const status = statusByOrder.get(monster.order);
    if (!status) return;
    monster.activeDebuffKeys.forEach((key) => {
      status.finWeight += isReverse
        ? -targetWeightOptions.weight[key]
        : targetWeightOptions.weight[key];
    });
  });

  monsterStatus.sort((a, b) => a.finWeight - b.finWeight);
  g("monsterStatus", monsterStatus);
}
