import { g } from "../state/store.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { BattleTurnEvent, runBattleTurnAutomation } from "../state/battle-turn.js";
import { BattleRoundEvent, runBattleRoundAutomation } from "../battle/battle-round.js";
import {
  MonsterStatusEvent,
  runMonsterStatusAutomation,
} from "../battle/monster-status-automation.js";

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

export function runBattleMonitorRuntime(event = { type: EVENT_ARCHIVE_CONTEXT }, deps = { g }) {
  if (event.type === EVENT_REPORT_START_CONTEXT) {
    const round = readRoundRuntime(deps);
    return {
      recordEach: readOptionField(deps, "recordEach", false),
      roundType: readRoundType(deps),
      roundAll: round.roundAll,
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
    const combatants = readCombatantCounts(deps);
    const round = readRoundRuntime(deps);
    return {
      attackStatus: deps.g("attackStatus"),
      monsterAlive: combatants.monsterAlive,
      monsterAll: combatants.monsterAll,
      roundAll: round.roundAll,
      roundNow: round.roundNow,
      roundType: readRoundType(deps),
      runSpeed: deps.g("runSpeed"),
      turn: readTurn(deps),
    };
  }
  if (event.type === EVENT_USAGE_ACTION_CONTEXT) {
    const combatants = readCombatantCounts(deps);
    const round = readRoundRuntime(deps);
    return {
      monsterAlive: combatants.monsterAlive,
      turn: readTurn(deps),
      roundNow: round.roundNow,
      roundAll: round.roundAll,
    };
  }
  if (event.type === EVENT_USAGE_COMPLETION_CONTEXT) {
    const combatants = readCombatantCounts(deps);
    return {
      ...readArchiveContext(deps),
      recordUsage: readOptionField(deps, "recordUsage", false),
      monsterAll: combatants.monsterAll,
      bossAll: combatants.bossAll,
    };
  }
  return undefined;
}
