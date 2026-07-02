// 战斗轮次状态：唯一入口 runBattleRoundAutomation(event)。
import { getValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { g } from "../state/store.js";
import { persistBattleRoundValue } from "./battle-round-failure.js";
import { roundRuntime } from "./battle-round-runtime.js";

const EVENT_READ_TYPE = "readType";
const EVENT_RECORD_TYPE = "recordType";
const EVENT_RECORD_COUNT = "recordCount";
const EVENT_RECORD_COUNT_FROM_INITIALIZATION = "recordCountFromInitialization";
const EVENT_RECORD_SINGLE_ROUND = "recordSingleRound";
const EVENT_RECORD_START_COUNT = "recordStartCount";
const EVENT_SYNC_RUNTIME = "syncRuntime";
const EVENT_CLASSIFY_TYPE = "classifyType";
const EVENT_RECORD_START_CONTEXT = "recordStartContext";
const EVENT_RECORD_DEBUG_FIELDS = "recordDebugFields";
const EVENT_READ_DEBUG_FIELDS = "readDebugFields";
const EVENT_READ_RUNTIME = "readRuntime";

export const BattleRoundEvent = Object.freeze({
  READ_TYPE: EVENT_READ_TYPE,
  RECORD_TYPE: EVENT_RECORD_TYPE,
  RECORD_COUNT: EVENT_RECORD_COUNT,
  RECORD_COUNT_FROM_INITIALIZATION: EVENT_RECORD_COUNT_FROM_INITIALIZATION,
  RECORD_SINGLE_ROUND: EVENT_RECORD_SINGLE_ROUND,
  RECORD_START_COUNT: EVENT_RECORD_START_COUNT,
  SYNC_RUNTIME: EVENT_SYNC_RUNTIME,
  CLASSIFY_TYPE: EVENT_CLASSIFY_TYPE,
  RECORD_START_CONTEXT: EVENT_RECORD_START_CONTEXT,
  RECORD_DEBUG_FIELDS: EVENT_RECORD_DEBUG_FIELDS,
  READ_DEBUG_FIELDS: EVENT_READ_DEBUG_FIELDS,
  READ_RUNTIME: EVENT_READ_RUNTIME,
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

function isInitializationText(initializingText = "") {
  return /^Initializing/.test(initializingText);
}

function recordType(roundType) {
  if (!persistBattleRoundValue("record-type", STORAGE_KEYS.ROUND_TYPE, roundType)) return false;
  return roundType;
}

function recordStartContext(initializingText = "") {
  const persistedRoundType = readType();
  if (persistedRoundType) {
    return {
      initialized: isInitializationText(initializingText),
      roundType: persistedRoundType,
      randomEncounterStarted: false,
    };
  }
  const roundType = recordType(classifyType(initializingText));
  if (roundType === false) {
    return {
      initialized: isInitializationText(initializingText),
      roundType: "",
      randomEncounterStarted: false,
      reason: "roundPersistenceFailed",
    };
  }
  return {
    initialized: isInitializationText(initializingText),
    roundType,
    randomEncounterStarted: roundType === "ba",
  };
}

function recordCount(roundNow, roundAll) {
  const runtime = roundRuntime(roundNow, roundAll);
  if (!persistBattleRoundValue("record-count-now", STORAGE_KEYS.ROUND_NOW, runtime.roundNow)) {
    return false;
  }
  if (!persistBattleRoundValue("record-count-all", STORAGE_KEYS.ROUND_ALL, runtime.roundAll)) {
    return false;
  }
  return { roundNow: runtime.roundNow, roundAll: runtime.roundAll };
}

function recordCountFromInitialization(initializingText = "", roundType = "") {
  const round = initializingText.match(/\(Round (\d+) \/ (\d+)\)/);
  if (roundType !== "ba" && round !== null) {
    return recordCount(Number(round[1]), Number(round[2]));
  }
  return recordCount(1, 1);
}

function recordStartCount(event) {
  if (event.initialized) {
    return recordCountFromInitialization(event.initializingText, event.roundType);
  }
  if (event.repaired) return recordCount(1, 1);
  return null;
}

function syncRuntime() {
  const runtime = roundRuntime(getValue(STORAGE_KEYS.ROUND_NOW), getValue(STORAGE_KEYS.ROUND_ALL));
  g("roundNow", runtime.roundNow);
  g("roundAll", runtime.roundAll);
  g("roundLeft", runtime.roundLeft);
  return readRuntime();
}

function readRuntime() {
  return roundRuntime(g("roundNow"), g("roundAll"));
}

function recordDebugFields(fields = []) {
  const values = Object.fromEntries(
    fields.map((field) => [field.name, field.value || field.placeholder])
  );
  if (values.roundType !== undefined && recordType(values.roundType) === false) return false;
  if (values.roundNow !== undefined || values.roundAll !== undefined) {
    if (recordCount(values.roundNow, values.roundAll) === false) return false;
  }
  return values;
}

function readDebugFields() {
  return {
    roundType: getValue(STORAGE_KEYS.ROUND_TYPE),
    roundNow: getValue(STORAGE_KEYS.ROUND_NOW),
    roundAll: getValue(STORAGE_KEYS.ROUND_ALL),
  };
}

const battleRoundEventHandlers = Object.freeze({
  [EVENT_READ_TYPE]: () => readType(),
  [EVENT_CLASSIFY_TYPE]: (event) => classifyType(event.initializingText),
  [EVENT_RECORD_START_CONTEXT]: (event) => recordStartContext(event.initializingText),
  [EVENT_RECORD_TYPE]: (event) => recordType(event.roundType),
  [EVENT_RECORD_COUNT]: (event) => recordCount(event.roundNow, event.roundAll),
  [EVENT_RECORD_COUNT_FROM_INITIALIZATION]: (event) =>
    recordCountFromInitialization(event.initializingText, event.roundType),
  [EVENT_RECORD_START_COUNT]: (event) => recordStartCount(event),
  [EVENT_RECORD_SINGLE_ROUND]: () => recordCount(1, 1),
  [EVENT_SYNC_RUNTIME]: () => syncRuntime(),
  [EVENT_READ_RUNTIME]: () => readRuntime(),
  [EVENT_RECORD_DEBUG_FIELDS]: (event) => recordDebugFields(event.fields),
  [EVENT_READ_DEBUG_FIELDS]: () => readDebugFields(),
});

export function runBattleRoundAutomation(event = { type: EVENT_SYNC_RUNTIME }) {
  return battleRoundEventHandlers[event?.type]?.(event) ?? null;
}
