import { g } from "../state/store.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { BattleTurnEvent, runBattleTurnAutomation } from "../state/battle-turn.js";

const EVENT_REPORT_START_CONTEXT = "reportStartContext";
const EVENT_ARCHIVE_CONTEXT = "archiveContext";
const EVENT_DROP_COMPLETION_CONTEXT = "dropCompletionContext";
const EVENT_HUD_CONTEXT = "hudContext";
const EVENT_USAGE_ACTION_CONTEXT = "usageActionContext";
const EVENT_USAGE_COMPLETION_CONTEXT = "usageCompletionContext";

export const BattleMonitorRuntimeEvent = Object.freeze({
  REPORT_START_CONTEXT: EVENT_REPORT_START_CONTEXT,
  ARCHIVE_CONTEXT: EVENT_ARCHIVE_CONTEXT,
  DROP_COMPLETION_CONTEXT: EVENT_DROP_COMPLETION_CONTEXT,
  HUD_CONTEXT: EVENT_HUD_CONTEXT,
  USAGE_ACTION_CONTEXT: EVENT_USAGE_ACTION_CONTEXT,
  USAGE_COMPLETION_CONTEXT: EVENT_USAGE_COMPLETION_CONTEXT,
});

function readArchiveContext(deps) {
  return {
    recordEach: readOptionField(deps, "recordEach", false),
    roundNow: deps.g("roundNow"),
    roundAll: deps.g("roundAll"),
  };
}

function readOptionField(deps, key, fallback) {
  if (deps.readOptionField) return deps.readOptionField(key, fallback);
  return runOptionAutomation({ type: OptionEvent.READ_FIELD, key, fallback });
}

function readTurn(deps) {
  if (deps.readTurn) return deps.readTurn();
  return runBattleTurnAutomation({ type: BattleTurnEvent.READ_CURRENT });
}

export function runBattleMonitorRuntime(event = { type: EVENT_ARCHIVE_CONTEXT }, deps = { g }) {
  if (event.type === EVENT_REPORT_START_CONTEXT) {
    return {
      recordEach: readOptionField(deps, "recordEach", false),
      roundType: deps.g("roundType"),
      roundAll: deps.g("roundAll"),
    };
  }
  if (event.type === EVENT_ARCHIVE_CONTEXT) return readArchiveContext(deps);
  if (event.type === EVENT_DROP_COMPLETION_CONTEXT) {
    return {
      ...readArchiveContext(deps),
      dropMonitor: readOptionField(deps, "dropMonitor", false),
      dropQuality: readOptionField(deps, "dropQuality", 0),
    };
  }
  if (event.type === EVENT_HUD_CONTEXT) {
    return {
      attackStatus: deps.g("attackStatus"),
      monsterAlive: deps.g("monsterAlive"),
      monsterAll: deps.g("monsterAll"),
      roundAll: deps.g("roundAll"),
      roundNow: deps.g("roundNow"),
      roundType: deps.g("roundType"),
      runSpeed: deps.g("runSpeed"),
      turn: readTurn(deps),
    };
  }
  if (event.type === EVENT_USAGE_ACTION_CONTEXT) {
    return {
      monsterAlive: deps.g("monsterAlive"),
      turn: readTurn(deps),
      roundNow: deps.g("roundNow"),
      roundAll: deps.g("roundAll"),
    };
  }
  if (event.type === EVENT_USAGE_COMPLETION_CONTEXT) {
    return {
      ...readArchiveContext(deps),
      recordUsage: readOptionField(deps, "recordUsage", false),
      monsterAll: deps.g("monsterAll"),
      bossAll: deps.g("bossAll"),
    };
  }
  return undefined;
}
