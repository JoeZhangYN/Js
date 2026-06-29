// Per-round physical skill usage ledger for "one time only skill" rules.
import { g } from "../state/store.js";

const EVENT_RESET_ROUND = "resetRound";
const EVENT_RECORD_USE = "recordUse";
const EVENT_READ_USAGE = "readUsage";

export const BattleSkillUsageEvent = Object.freeze({
  RESET_ROUND: EVENT_RESET_ROUND,
  RECORD_USE: EVENT_RECORD_USE,
  READ_USAGE: EVENT_READ_USAGE,
});

function emptyUsage() {
  return {
    OFC: 0,
    FRD: 0,
    T3: 0,
    T2: 0,
    T1: 0,
  };
}

function resetRound() {
  const usage = emptyUsage();
  g("skillOTOS", usage);
  return usage;
}

function readUsage() {
  return g("skillOTOS") || {};
}

function recordUse(code) {
  if (!code) return readUsage();
  const usage = { ...readUsage() };
  usage[code] = (usage[code] || 0) + 1;
  g("skillOTOS", usage);
  return usage;
}

export function runBattleSkillUsageAutomation(event = { type: EVENT_READ_USAGE }) {
  if (event.type === EVENT_RESET_ROUND) return resetRound();
  if (event.type === EVENT_RECORD_USE) return recordUse(event.code);
  if (event.type === EVENT_READ_USAGE) return readUsage();
  return null;
}
