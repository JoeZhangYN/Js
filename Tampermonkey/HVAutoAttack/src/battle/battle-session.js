import { runBattleSessionCheckpointAutomation } from "../state/battle-session-checkpoint.js";
import { g } from "../state/store.js";
import { recordBattleSessionFailure } from "./battle-session-failure.js";
import { classifyBattleRoundType } from "./battle-session-state.js";
import { createBattleSessionId, readBattleSession } from "./battle-session-store.js";
import {
  readBattleSessionContext,
  recordSessionProgress,
  startOrResumeBattleSession,
  terminateBattleSession,
} from "./battle-session-lifecycle.js";
import {
  readBattleSessionDebugFields,
  recordBattleSessionDebugFields,
} from "./battle-session-debug.js";

const EVENT_START_OR_RESUME = "startOrResume";
const EVENT_RECORD_START_PROGRESS = "recordStartProgress";
const EVENT_RECORD_PROGRESS = "recordProgress";
const EVENT_READ_SNAPSHOT = "readSnapshot";
const EVENT_READ_CONTEXT = "readContext";
const EVENT_SYNC_RUNTIME = "syncRuntime";
const EVENT_MARK_TERMINAL = "markTerminal";
const EVENT_CLASSIFY_TYPE = "classifyType";
const EVENT_RECORD_DEBUG_FIELDS = "recordDebugFields";
const EVENT_READ_DEBUG_FIELDS = "readDebugFields";

export const BattleSessionEvent = Object.freeze({
  START_OR_RESUME: EVENT_START_OR_RESUME,
  RECORD_START_PROGRESS: EVENT_RECORD_START_PROGRESS,
  RECORD_PROGRESS: EVENT_RECORD_PROGRESS,
  READ_SNAPSHOT: EVENT_READ_SNAPSHOT,
  READ_CONTEXT: EVENT_READ_CONTEXT,
  SYNC_RUNTIME: EVENT_SYNC_RUNTIME,
  MARK_TERMINAL: EVENT_MARK_TERMINAL,
  CLASSIFY_TYPE: EVENT_CLASSIFY_TYPE,
  RECORD_DEBUG_FIELDS: EVENT_RECORD_DEBUG_FIELDS,
  READ_DEBUG_FIELDS: EVENT_READ_DEBUG_FIELDS,
});

function syncRuntime(deps) {
  const context = readBattleSessionContext(deps);
  if (!context) return null;
  deps.runtime("roundNow", context.roundNow);
  deps.runtime("roundAll", context.roundAll);
  deps.runtime("roundLeft", context.roundAll - context.roundNow);
  return context;
}

const handlers = Object.freeze({
  [EVENT_START_OR_RESUME]: startOrResumeBattleSession,
  [EVENT_RECORD_START_PROGRESS]: (event, deps) => recordSessionProgress(event, deps, true),
  [EVENT_RECORD_PROGRESS]: (event, deps) => recordSessionProgress(event, deps),
  [EVENT_READ_SNAPSHOT]: (event, deps) => readBattleSession(deps).snapshot,
  [EVENT_READ_CONTEXT]: (event, deps) => readBattleSessionContext(deps),
  [EVENT_SYNC_RUNTIME]: (event, deps) => syncRuntime(deps),
  [EVENT_MARK_TERMINAL]: terminateBattleSession,
  [EVENT_CLASSIFY_TYPE]: (event) => classifyBattleRoundType(event.initializingText),
  [EVENT_RECORD_DEBUG_FIELDS]: recordBattleSessionDebugFields,
  [EVENT_READ_DEBUG_FIELDS]: (event, deps) => readBattleSessionDebugFields(deps),
});

export function runBattleSessionAutomation(
  event = { type: EVENT_READ_SNAPSHOT },
  deps = {
    checkpoint: runBattleSessionCheckpointAutomation,
    createSessionId: createBattleSessionId,
    runtime: g,
    fail: recordBattleSessionFailure,
  }
) {
  return handlers[event?.type]?.(event, deps) ?? null;
}
