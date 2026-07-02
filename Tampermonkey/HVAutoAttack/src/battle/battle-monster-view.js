import { RESIST_KEYS } from "../data/monster-db.js";
import { MonsterCacheEvent, runMonsterCacheAutomation } from "../state/monster-cache.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";

const EVENT_READ_VIEW = "readView";
const EVENT_READ_ALIVE_BY_ORDER = "readAliveByOrder";
const EVENT_READ_BY_ORDER = "readByOrder";
const EVENT_READ_HP_VARS = "readHpVars";

export const BattleMonsterViewEvent = Object.freeze({
  READ_VIEW: EVENT_READ_VIEW,
  READ_ALIVE_BY_ORDER: EVENT_READ_ALIVE_BY_ORDER,
  READ_BY_ORDER: EVENT_READ_BY_ORDER,
  READ_HP_VARS: EVENT_READ_HP_VARS,
});

const EMPTY_MONSTER_VIEW = Object.freeze({
  view: [],
  monsterIdentities: [],
  aliveCount: 0,
  soloMonsterHpPercent: 100,
  lowestMonsterHpPercent: 100,
  firstMonsterHpPercent: 100,
});

const battleMonsterViewEventHandlers = Object.freeze({
  [EVENT_READ_VIEW]: (event) => readBattleMonsterView(event.monsters),
  [EVENT_READ_ALIVE_BY_ORDER]: (event) => aliveByOrder(event.view),
  [EVENT_READ_BY_ORDER]: (event) => byOrder(event.view),
  [EVENT_READ_HP_VARS]: (event) => monsterHpVars(event.view),
});

function readBattleMonsterView(monsters) {
  const monsterStatus = runMonsterStatusAutomation({ type: MonsterStatusEvent.READ_STATUS });
  const view = joinMonsterView(
    monsters || [],
    monsterStatus,
    runMonsterCacheAutomation({ type: MonsterCacheEvent.READ_DB })
  );
  const monsterIdentities = view.map((monster) => ({
    monsterId: monster.monsterId,
    name: monster.name,
  }));
  return {
    view,
    monsterIdentities,
    aliveCount: view.filter((monster) => !monster.isDead).length,
    ...runBattleMonsterView({ type: BattleMonsterViewEvent.READ_HP_VARS, view }),
  };
}

const FALLBACK_HP = 100000;

function joinMonsterView(snapMonsters, monsterStatus, dbById = {}) {
  const statusByOrder = new Map((monsterStatus || []).map((s) => [s.order, s]));
  return (snapMonsters || []).map((m) => {
    const st = statusByOrder.get(m.order);
    const db = (st && st.monsterId != null && dbById[st.monsterId]) || null;
    const hasResists = !!db && db.fire !== undefined;
    return {
      id: m.id,
      order: m.order,
      monsterId: st?.monsterId,
      level: st?.level,
      name: m.name,
      isDead: m.isDead,
      isBoss: m.isBoss,
      monsterClass: db?.monsterClass,
      powerLevel: db?.plvl,
      attackType: db?.attack,
      buffs: m.buffs,
      buffEffects: m.buffEffects,
      hpPercent: m.hpRatio,
      hpAbsNow: st ? st.hpNow : FALLBACK_HP,
      hpMax: st ? st.hp : FALLBACK_HP,
      inferredMaxHP: st?.inferredMaxHP,
      finWeight: st ? st.finWeight : Infinity,
      resists: hasResists ? Object.fromEntries(RESIST_KEYS.map((k) => [k, db[k]])) : undefined,
      dbProfile: db || undefined,
      dbMaxHP: db?.maxHP,
    };
  });
}

function byOrder(view) {
  return [...(view || [])].sort((a, b) => a.order - b.order);
}

function aliveByOrder(view) {
  return byOrder(view).filter((m) => !m.isDead);
}

function monsterHpVars(view) {
  const alive = aliveByOrder(view);
  const pct = (r) => r * 100;
  return {
    soloMonsterHpPercent: alive.length === 1 ? pct(alive[0].hpPercent) : 100,
    lowestMonsterHpPercent: alive.length ? pct(Math.min(...alive.map((m) => m.hpPercent))) : 100,
    firstMonsterHpPercent: alive.length ? pct(alive[0].hpPercent) : 100,
  };
}

export function runBattleMonsterView(event = { type: EVENT_READ_VIEW }) {
  return battleMonsterViewEventHandlers[event?.type]?.(event) ?? EMPTY_MONSTER_VIEW;
}
