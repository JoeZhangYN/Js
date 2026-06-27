// 战斗轮次状态：唯一入口 runBattleRoundAutomation(event)。
import { getValue, setValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { g } from "../state/store.js";

const EVENT_READ_TYPE = "readType";
const EVENT_RECORD_TYPE = "recordType";
const EVENT_RECORD_COUNT = "recordCount";
const EVENT_RECORD_SINGLE_ROUND = "recordSingleRound";
const EVENT_SYNC_RUNTIME = "syncRuntime";

export const BattleRoundEvent = Object.freeze({
  READ_TYPE: EVENT_READ_TYPE,
  RECORD_TYPE: EVENT_RECORD_TYPE,
  RECORD_COUNT: EVENT_RECORD_COUNT,
  RECORD_SINGLE_ROUND: EVENT_RECORD_SINGLE_ROUND,
  SYNC_RUNTIME: EVENT_SYNC_RUNTIME,
});

function readType() {
  return getValue(STORAGE_KEYS.ROUND_TYPE);
}

function recordType(roundType) {
  setValue(STORAGE_KEYS.ROUND_TYPE, roundType);
  return roundType;
}

function recordCount(roundNow, roundAll) {
  setValue(STORAGE_KEYS.ROUND_NOW, roundNow);
  setValue(STORAGE_KEYS.ROUND_ALL, roundAll);
  return { roundNow, roundAll };
}

function syncRuntime() {
  const roundNow = getValue(STORAGE_KEYS.ROUND_NOW) * 1;
  const roundAll = getValue(STORAGE_KEYS.ROUND_ALL) * 1;
  g("roundNow", roundNow);
  g("roundAll", roundAll);
  g("roundLeft", roundAll - roundNow);
  return { roundNow, roundAll, roundLeft: roundAll - roundNow };
}

export function runBattleRoundAutomation(event = { type: EVENT_SYNC_RUNTIME }) {
  if (event.type === EVENT_READ_TYPE) return readType();
  if (event.type === EVENT_RECORD_TYPE) return recordType(event.roundType);
  if (event.type === EVENT_RECORD_COUNT) return recordCount(event.roundNow, event.roundAll);
  if (event.type === EVENT_RECORD_SINGLE_ROUND) return recordCount(1, 1);
  if (event.type === EVENT_SYNC_RUNTIME) return syncRuntime();
  return null;
}
