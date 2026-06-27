// 战斗外自动化编排入口：composition root 只调用本入口，不拼业务顺序。
import { g } from "../state/store.js";
import { DayRecordEvent, runDayRecordAutomation } from "../state/day-record.js";
import { StaminaEvent, runStaminaAutomation } from "../state/stamina.js";
import { IdleArenaEvent, runIdleArenaAutomation } from "../arena/idle-arena.js";
import { QuickSiteEvent, runQuickSiteAutomation } from "../arena/quick-site.js";
import { RepairEvent, runRepairAutomation } from "../repair/repair-orchestrator.js";
import { EncounterEvent, runEncounterAutomation } from "./encounter.js";
import { AbilityAoeEvent, runAbilityAoeAutomation } from "./ability-page.js";
import { BattleRuntimeEvent, runBattleRuntimeAutomation } from "../battle/battle-runtime.js";

const EVENT_PAGE_READY = "pageReady";

export const LobbyEvent = Object.freeze({
  PAGE_READY: EVENT_PAGE_READY,
});

function shouldStopForStamina() {
  return runStaminaAutomation({ type: StaminaEvent.SHOULD_STOP_LOBBY });
}

function runNextBattleAutomation() {
  if (g("option").repair) {
    runRepairAutomation({ type: RepairEvent.START });
  } else if (g("option").idleArena) {
    runIdleArenaAutomation({ type: IdleArenaEvent.SCHEDULE_NEXT_BATTLE });
  }
}

export async function runLobbyAutomation(event = { type: EVENT_PAGE_READY }) {
  if (event.type !== EVENT_PAGE_READY) return undefined;
  runBattleRuntimeAutomation({ type: BattleRuntimeEvent.CLEAR_SESSION });
  runDayRecordAutomation({ type: DayRecordEvent.SYNC_UTC_DATE });
  runAbilityAoeAutomation({ type: AbilityAoeEvent.CAPTURE_ABILITY_PAGE });
  runQuickSiteAutomation({ type: QuickSiteEvent.LOBBY_READY, option: g("option") });
  if (g("option").encounter) {
    const encounterOutcome = await runEncounterAutomation({
      type: EncounterEvent.LOBBY_TICK,
      rerun: () => runLobbyAutomation({ type: EVENT_PAGE_READY }),
    });
    if (encounterOutcome.claimed) return;
  }
  if (shouldStopForStamina()) return;
  runNextBattleAutomation();
}
