import { estimatePerMonsterDps, estimatePlayerIncomingDps, parseBattleLog } from "./log-parser.js";

const EVENT_READ_CURRENT = "readCurrent";

export const BattleLogTelemetryEvent = Object.freeze({
  READ_CURRENT: EVENT_READ_CURRENT,
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
  if (event.type === EVENT_READ_CURRENT) return readCurrentTelemetry(event.turn);
  return {
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
  };
}
