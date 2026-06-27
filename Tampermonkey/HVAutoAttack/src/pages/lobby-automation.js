// 战斗外自动化编排入口：composition root 只调用本入口，不拼业务顺序。
import { g } from "../state/store.js";
import { time } from "../core/time.js";
import { StaminaEvent, runStaminaAutomation } from "../state/stamina.js";
import { IdleArenaEvent, runIdleArenaAutomation } from "../arena/idle-arena.js";
import { QuickSiteEvent, runQuickSiteAutomation } from "../arena/quick-site.js";
import { runRepair } from "../repair/repair-orchestrator.js";
import { EncounterEvent, runEncounterAutomation } from "./encounter.js";
import { AbilityAoeEvent, runAbilityAoeAutomation } from "./ability-page.js";
import { BattleRuntimeEvent, runBattleRuntimeAutomation } from "../battle/battle-runtime.js";

function syncLobbyDate() {
  g("dateNow", time(2));
}

function shouldStopForStamina() {
  return runStaminaAutomation({ type: StaminaEvent.SHOULD_STOP_LOBBY });
}

function runNextBattleAutomation() {
  if (g("option").repair) {
    runRepair();
  } else if (g("option").idleArena) {
    runIdleArenaAutomation({ type: IdleArenaEvent.SCHEDULE_NEXT_BATTLE });
  }
}

export async function runLobbyAutomation() {
  runBattleRuntimeAutomation({ type: BattleRuntimeEvent.CLEAR_SESSION });
  syncLobbyDate();
  runAbilityAoeAutomation({ type: AbilityAoeEvent.CAPTURE_ABILITY_PAGE });
  runQuickSiteAutomation({ type: QuickSiteEvent.LOBBY_READY, option: g("option") });
  if (g("option").encounter) {
    const encounterOutcome = await runEncounterAutomation({
      type: EncounterEvent.LOBBY_TICK,
      rerun: runLobbyAutomation,
    });
    if (encounterOutcome.claimed) return;
  }
  if (shouldStopForStamina()) return;
  runNextBattleAutomation();
}
