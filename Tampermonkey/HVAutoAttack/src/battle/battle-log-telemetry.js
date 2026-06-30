import { estimatePerMonsterDps, estimatePlayerIncomingDps, parseBattleLog } from "./log-parser.js";

const EVENT_READ_CURRENT = "readCurrent";

export const BattleLogTelemetryEvent = Object.freeze({
  READ_CURRENT: EVENT_READ_CURRENT,
});

const EMPTY_BATTLE_LOG_TELEMETRY = Object.freeze({
  battleLog: [],
  playerIncomingDps: {
    total: 0,
    perTurn: 0,
    p50: 0,
    p95: 0,
    hitsPerTurn: 0,
    perTurnP95: 0,
    sampleCount: 0,
  },
  monsterDpsByName: {},
});

const battleLogTelemetryEventHandlers = Object.freeze({
  [EVENT_READ_CURRENT]: (event) => readCurrentTelemetry(event.turn),
});

function readCurrentTelemetry(turn) {
  const battleLog = parseBattleLog();
  return {
    battleLog,
    playerIncomingDps: estimatePlayerIncomingDps(battleLog, turn),
    monsterDpsByName: estimatePerMonsterDps(battleLog, turn),
  };
}

export function runBattleLogTelemetry(event = { type: EVENT_READ_CURRENT }) {
  return battleLogTelemetryEventHandlers[event.type]?.(event) ?? EMPTY_BATTLE_LOG_TELEMETRY;
}
