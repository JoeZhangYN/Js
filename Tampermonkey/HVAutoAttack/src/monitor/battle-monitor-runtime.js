import { g } from "../state/store.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { BattleTurnEvent, runBattleTurnAutomation } from "../state/battle-turn.js";
import { BattleRoundEvent, runBattleRoundAutomation } from "../battle/battle-round.js";
import {
  MonsterStatusEvent,
  runMonsterStatusAutomation,
} from "../battle/monster-status-automation.js";
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

function readArchiveContext(deps) {
  const round = readRoundRuntime(deps);
  return {
    recordEach: readOptionField(deps, "recordEach", false),
    roundNow: round.roundNow,
    roundAll: round.roundAll,
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

function readRoundRuntime(deps) {
  if (deps.readRoundRuntime) return deps.readRoundRuntime();
  return runBattleRoundAutomation({ type: BattleRoundEvent.READ_RUNTIME });
}

function readRoundType(deps) {
  if (deps.readRoundType) return deps.readRoundType();
  return runBattleRoundAutomation({ type: BattleRoundEvent.READ_TYPE });
}

function readCombatantCounts(deps) {
  if (deps.readCombatantCounts) return deps.readCombatantCounts();
  return runMonsterStatusAutomation({ type: MonsterStatusEvent.READ_COMBATANT_COUNTS });
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
    const round = readRoundRuntime(deps);
    return {
      recordEach: readOptionField(deps, "recordEach", false),
      roundType: readRoundType(deps),
      roundAll: round.roundAll,
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
    const combatants = readCombatantCounts(deps);
    const round = readRoundRuntime(deps);
    return {
      attackStatus: readAttackStatus(deps),
      monsterAlive: combatants.monsterAlive,
      monsterAll: combatants.monsterAll,
      roundAll: round.roundAll,
      roundNow: round.roundNow,
      roundType: readRoundType(deps),
      runSpeed: readRunSpeed(deps),
      turn: readTurn(deps),
    };
  },
  [EVENT_USAGE_ACTION_CONTEXT]: (deps) => {
    const combatants = readCombatantCounts(deps);
    const round = readRoundRuntime(deps);
    return {
      monsterAlive: combatants.monsterAlive,
      turn: readTurn(deps),
      roundNow: round.roundNow,
      roundAll: round.roundAll,
    };
  },
  [EVENT_USAGE_COMPLETION_CONTEXT]: (deps) => {
    const combatants = readCombatantCounts(deps);
    return {
      ...readArchiveContext(deps),
      recordUsage: readOptionField(deps, "recordUsage", false),
      monsterAll: combatants.monsterAll,
      bossAll: combatants.bossAll,
    };
  },
});

export function runBattleMonitorRuntime(event = { type: EVENT_ARCHIVE_CONTEXT }, deps = { g }) {
  return runtimeContextHandlers[event.type]?.(deps);
}
