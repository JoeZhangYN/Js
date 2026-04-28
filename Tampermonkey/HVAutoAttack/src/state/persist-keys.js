// GM_* 持久化 key 单 SOT。新增 key 在此一处声明。
// 此模块在 Phase 2 引入但 Phase 4-5 才完全启用——当前 src/main.js 仍用字面量字符串调 setValue/getValue。

export const STORAGE_KEYS = Object.freeze({
  OPTION: "option",
  SPELL_AOE: "spellAoe",
  DROP: "drop",
  USAGE: "usage",
  USAGE2: "usage2",
  STATS: "stats",
  STATS_OLD: "statsOld",
  DISABLED: "disabled",
  BATTLE_CODE: "battleCode",
  ROUND_TYPE: "roundType",
  ROUND_NOW: "roundNow",
  ROUND_ALL: "roundAll",
  MONSTER_STATUS: "monsterStatus",
  ENCOUNTER: "encounter",
  LAST_ENCOUNTER: "lastEncounter",
  URL: "url",
  BACKUP: "backup",
  // Phase 6 新增：
  GLOBAL_TURN: "globalTurn",
  SKILL_LAST_USED: "skillLastUsed",
});
