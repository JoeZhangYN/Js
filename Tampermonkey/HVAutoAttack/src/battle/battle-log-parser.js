import {
  accumulateDamageByMonster,
  buildMonsterStatus,
  estimatePerMonsterDps,
  estimatePlayerIncomingDps,
  parseBattleLog,
  parseMonsterRoster,
} from "./log-parser.js";

const EVENT_PARSE_CURRENT_LOG = "parseCurrentLog";
const EVENT_ESTIMATE_PLAYER_INCOMING_DPS = "estimatePlayerIncomingDps";
const EVENT_ESTIMATE_PER_MONSTER_DPS = "estimatePerMonsterDps";
const EVENT_PARSE_MONSTER_ROSTER = "parseMonsterRoster";
const EVENT_BUILD_MONSTER_STATUS = "buildMonsterStatus";
const EVENT_ACCUMULATE_DAMAGE_BY_MONSTER = "accumulateDamageByMonster";

export const BattleLogParserEvent = Object.freeze({
  PARSE_CURRENT_LOG: EVENT_PARSE_CURRENT_LOG,
  ESTIMATE_PLAYER_INCOMING_DPS: EVENT_ESTIMATE_PLAYER_INCOMING_DPS,
  ESTIMATE_PER_MONSTER_DPS: EVENT_ESTIMATE_PER_MONSTER_DPS,
  PARSE_MONSTER_ROSTER: EVENT_PARSE_MONSTER_ROSTER,
  BUILD_MONSTER_STATUS: EVENT_BUILD_MONSTER_STATUS,
  ACCUMULATE_DAMAGE_BY_MONSTER: EVENT_ACCUMULATE_DAMAGE_BY_MONSTER,
});

const battleLogParserEventHandlers = Object.freeze({
  [EVENT_PARSE_CURRENT_LOG]: () => parseBattleLog(),
  [EVENT_ESTIMATE_PLAYER_INCOMING_DPS]: (event) =>
    estimatePlayerIncomingDps(event.events, event.turn),
  [EVENT_ESTIMATE_PER_MONSTER_DPS]: (event) => estimatePerMonsterDps(event.events, event.turn),
  [EVENT_PARSE_MONSTER_ROSTER]: (event) =>
    parseMonsterRoster(event.battleLogRows, event.monsterAll),
  [EVENT_BUILD_MONSTER_STATUS]: (event) => buildMonsterStatus(event.roster, event.fallbackHp),
  [EVENT_ACCUMULATE_DAMAGE_BY_MONSTER]: (event) => accumulateDamageByMonster(event.events),
});

export function runBattleLogParser(event = { type: EVENT_PARSE_CURRENT_LOG }) {
  return battleLogParserEventHandlers[event.type]?.(event);
}
