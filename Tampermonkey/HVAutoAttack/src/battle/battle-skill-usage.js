// Per-round physical skill usage ledger for "one time only skill" rules.
import { g } from "../state/store.js";

const EVENT_RESET_ROUND = "resetRound";
const EVENT_RECORD_USE = "recordUse";
const EVENT_READ_USAGE = "readUsage";
const SKILL_USAGE_CODES = Object.freeze(["OFC", "FRD", "T3", "T2", "T1"]);

export const BattleSkillUsageEvent = Object.freeze({
  RESET_ROUND: EVENT_RESET_ROUND,
  RECORD_USE: EVENT_RECORD_USE,
  READ_USAGE: EVENT_READ_USAGE,
});

function emptyUsage() {
  return Object.fromEntries(SKILL_USAGE_CODES.map((code) => [code, 0]));
}

function normalizeUsageCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? Math.trunc(count) : 0;
}

function normalizeUsage(value) {
  const source = value && typeof value === "object" ? value : {};
  return Object.fromEntries(
    SKILL_USAGE_CODES.map((code) => [code, normalizeUsageCount(source[code])])
  );
}

function isKnownUsageCode(code) {
  return SKILL_USAGE_CODES.includes(code);
}

function resetRound() {
  const usage = emptyUsage();
  g("skillOTOS", usage);
  return usage;
}

function readUsage() {
  return normalizeUsage(g("skillOTOS"));
}

function recordUse(code) {
  if (!isKnownUsageCode(code)) return readUsage();
  const usage = readUsage();
  usage[code] += 1;
  g("skillOTOS", usage);
  return usage;
}

const skillUsageEventHandlers = Object.freeze({
  [EVENT_RESET_ROUND]: () => resetRound(),
  [EVENT_RECORD_USE]: (event) => recordUse(event.code),
  [EVENT_READ_USAGE]: () => readUsage(),
});

export function runBattleSkillUsageAutomation(event = { type: EVENT_READ_USAGE }) {
  return skillUsageEventHandlers[event.type]?.(event) ?? null;
}
