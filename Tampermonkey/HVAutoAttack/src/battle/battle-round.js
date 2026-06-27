// 战斗轮次状态：唯一入口 runBattleRoundAutomation(event)。
import { getValue, setValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { g } from "../state/store.js";

const EVENT_READ_TYPE = "readType";
const EVENT_RECORD_TYPE = "recordType";
const EVENT_RECORD_COUNT = "recordCount";
const EVENT_RECORD_COUNT_FROM_INITIALIZATION = "recordCountFromInitialization";
const EVENT_RECORD_SINGLE_ROUND = "recordSingleRound";
const EVENT_SYNC_RUNTIME = "syncRuntime";
const EVENT_CLASSIFY_TYPE = "classifyType";
const EVENT_RECORD_DEBUG_FIELDS = "recordDebugFields";

export const BattleRoundEvent = Object.freeze({
  READ_TYPE: EVENT_READ_TYPE,
  RECORD_TYPE: EVENT_RECORD_TYPE,
  RECORD_COUNT: EVENT_RECORD_COUNT,
  RECORD_COUNT_FROM_INITIALIZATION: EVENT_RECORD_COUNT_FROM_INITIALIZATION,
  RECORD_SINGLE_ROUND: EVENT_RECORD_SINGLE_ROUND,
  SYNC_RUNTIME: EVENT_SYNC_RUNTIME,
  CLASSIFY_TYPE: EVENT_CLASSIFY_TYPE,
  RECORD_DEBUG_FIELDS: EVENT_RECORD_DEBUG_FIELDS,
});

function readType() {
  return getValue(STORAGE_KEYS.ROUND_TYPE);
}

function classifyType(initializingText = "") {
  if (!initializingText.match(/^Initializing/)) return "";
  const arenaMatch =
    initializingText.match(/^Initializing arena challenge/) && initializingText.match(/\d+/);
  if (arenaMatch && arenaMatch[0] * 1 <= 35) return "ar";
  if (arenaMatch && arenaMatch[0] * 1 >= 105) return "rb";
  if (initializingText.match(/^Initializing random encounter/)) return "ba";
  if (initializingText.match(/^Initializing Item World/)) return "iw";
  if (initializingText.match(/^Initializing Grindfest/)) return "gr";
  if (initializingText.match(/^Initializing The Tower/)) return "tw";
  return "";
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

function recordCountFromInitialization(initializingText = "", roundType = "") {
  const round = initializingText.match(/\(Round (\d+) \/ (\d+)\)/);
  if (roundType !== "ba" && round !== null) {
    return recordCount(Number(round[1]), Number(round[2]));
  }
  return recordCount(1, 1);
}

function syncRuntime() {
  const roundNow = getValue(STORAGE_KEYS.ROUND_NOW) * 1;
  const roundAll = getValue(STORAGE_KEYS.ROUND_ALL) * 1;
  g("roundNow", roundNow);
  g("roundAll", roundAll);
  g("roundLeft", roundAll - roundNow);
  return { roundNow, roundAll, roundLeft: roundAll - roundNow };
}

function recordDebugFields(fields = []) {
  const values = Object.fromEntries(
    fields.map((field) => [field.name, field.value || field.placeholder])
  );
  if (values.roundType !== undefined) recordType(values.roundType);
  if (values.roundNow !== undefined || values.roundAll !== undefined) {
    recordCount(values.roundNow, values.roundAll);
  }
  return values;
}

export function runBattleRoundAutomation(event = { type: EVENT_SYNC_RUNTIME }) {
  if (event.type === EVENT_READ_TYPE) return readType();
  if (event.type === EVENT_CLASSIFY_TYPE) return classifyType(event.initializingText);
  if (event.type === EVENT_RECORD_TYPE) return recordType(event.roundType);
  if (event.type === EVENT_RECORD_COUNT) return recordCount(event.roundNow, event.roundAll);
  if (event.type === EVENT_RECORD_COUNT_FROM_INITIALIZATION) {
    return recordCountFromInitialization(event.initializingText, event.roundType);
  }
  if (event.type === EVENT_RECORD_SINGLE_ROUND) return recordCount(1, 1);
  if (event.type === EVENT_SYNC_RUNTIME) return syncRuntime();
  if (event.type === EVENT_RECORD_DEBUG_FIELDS) return recordDebugFields(event.fields);
  return null;
}
