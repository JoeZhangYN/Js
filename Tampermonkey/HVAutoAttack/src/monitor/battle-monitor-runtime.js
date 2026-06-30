import { g } from "../state/store.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { BattleTurnEvent, runBattleTurnAutomation } from "../state/battle-turn.js";
import { BattleProgressEvent, runBattleProgressAutomation } from "../battle/battle-progress.js";
import {
  BattleActionSpeedEvent,
  runBattleActionSpeedAutomation,
} from "../battle/battle-action-speed.js";
import {
  BattleStartRuntimeEvent,
  runBattleStartRuntimeAutomation,
} from "../battle/battle-start-runtime.js";

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

function readArchiveContext(deps, progress = readBattleProgress(deps)) {
  return {
    recordEach: readOptionField(deps, "recordEach", false),
    roundNow: progress.roundNow,
    roundAll: progress.roundAll,
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

function readBattleProgress(deps) {
  if (deps.readBattleProgress) return deps.readBattleProgress();
  return runBattleProgressAutomation({ type: BattleProgressEvent.READ_CONTEXT });
}

function readRunSpeed(deps) {
  if (deps.readRunSpeed) return deps.readRunSpeed();
  return runBattleActionSpeedAutomation({ type: BattleActionSpeedEvent.READ_CURRENT });
}

function readAttackStatus(deps) {
  if (deps.readAttackStatus) return deps.readAttackStatus();
  return runBattleStartRuntimeAutomation({ type: BattleStartRuntimeEvent.READ_ATTACK_STATUS });
}

const runtimeContextHandlers = Object.freeze({
  [EVENT_REPORT_START_CONTEXT]: (deps) => {
    const progress = readBattleProgress(deps);
    return {
      recordEach: readOptionField(deps, "recordEach", false),
      roundType: progress.roundType,
      roundAll: progress.roundAll,
    };
  },
  [EVENT_ARCHIVE_CONTEXT]: (deps) => readArchiveContext(deps),
  [EVENT_DROP_COMPLETION_CONTEXT]: (deps) => {
    return {
      ...readArchiveContext(deps),
      dropMonitor: readOptionField(deps, "dropMonitor", false),
      dropQuality: readOptionField(deps, "dropQuality", 0),
    };
  },
  [EVENT_HUD_CONTEXT]: (deps) => {
    const progress = readBattleProgress(deps);
    return {
      attackStatus: readAttackStatus(deps),
      monsterAlive: progress.monsterAlive,
      monsterAll: progress.monsterAll,
      roundAll: progress.roundAll,
      roundNow: progress.roundNow,
      roundType: progress.roundType,
      runSpeed: readRunSpeed(deps),
      turn: readTurn(deps),
    };
  },
  [EVENT_USAGE_ACTION_CONTEXT]: (deps) => {
    const progress = readBattleProgress(deps);
    return {
      monsterAlive: progress.monsterAlive,
      turn: readTurn(deps),
      roundNow: progress.roundNow,
      roundAll: progress.roundAll,
    };
  },
  [EVENT_USAGE_COMPLETION_CONTEXT]: (deps) => {
    const progress = readBattleProgress(deps);
    return {
      ...readArchiveContext(deps, progress),
      recordUsage: readOptionField(deps, "recordUsage", false),
      monsterAll: progress.monsterAll,
      bossAll: progress.bossAll,
    };
  },
});

export function runBattleMonitorRuntime(event = { type: EVENT_ARCHIVE_CONTEXT }, deps = { g }) {
  return runtimeContextHandlers[event.type]?.(deps);
}
