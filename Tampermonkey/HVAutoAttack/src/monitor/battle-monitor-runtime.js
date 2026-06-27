import { g } from "../state/store.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";

const EVENT_REPORT_START_CONTEXT = "reportStartContext";
const EVENT_ARCHIVE_CONTEXT = "archiveContext";
const EVENT_USAGE_ACTION_CONTEXT = "usageActionContext";
const EVENT_USAGE_COMPLETION_CONTEXT = "usageCompletionContext";

export const BattleMonitorRuntimeEvent = Object.freeze({
  REPORT_START_CONTEXT: EVENT_REPORT_START_CONTEXT,
  ARCHIVE_CONTEXT: EVENT_ARCHIVE_CONTEXT,
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

export function runBattleMonitorRuntime(event = { type: EVENT_ARCHIVE_CONTEXT }, deps = { g }) {
  if (event.type === EVENT_REPORT_START_CONTEXT) {
    return {
      recordEach: readOptionField(deps, "recordEach", false),
      roundType: deps.g("roundType"),
      roundAll: deps.g("roundAll"),
    };
  }
  if (event.type === EVENT_ARCHIVE_CONTEXT) return readArchiveContext(deps);
  if (event.type === EVENT_USAGE_ACTION_CONTEXT) {
    return {
      monsterAlive: deps.g("monsterAlive"),
      turn: deps.g("turn"),
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
