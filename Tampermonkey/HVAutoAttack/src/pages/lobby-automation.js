// 战斗外自动化编排入口：composition root 只调用本入口，不拼业务顺序。
import { delValue } from "../state/storage.js";
import { g } from "../state/store.js";
import { time } from "../core/time.js";
import { readStaminaValue } from "../state/stamina.js";
import { IdleArenaEvent, runIdleArenaAutomation } from "../arena/idle-arena.js";
import { quickSite } from "../arena/quick-site.js";
import { runRepair } from "../repair/repair-orchestrator.js";
import { EncounterEvent, runEncounterAutomation } from "./encounter.js";
import { AbilityAoeEvent, runAbilityAoeAutomation } from "./ability-page.js";

let scheduledLobbyTick = null;

function syncLobbyDate() {
  g("dateNow", time(2));
}

function shouldStopForStamina() {
  return !g("option").restoreStamina && readStaminaValue() <= g("option").staminaLow;
}

function runNextBattleAutomation() {
  if (g("option").repair) {
    runRepair();
  } else if (g("option").idleArena) {
    runIdleArenaAutomation({ type: IdleArenaEvent.SCHEDULE_NEXT_BATTLE });
  }
}

function scheduleNextLobbyAutomation(delayMs) {
  if (!Number.isFinite(delayMs) || delayMs <= 0) return;
  if (scheduledLobbyTick) clearTimeout(scheduledLobbyTick);
  scheduledLobbyTick = setTimeout(() => {
    scheduledLobbyTick = null;
    runLobbyAutomation();
  }, delayMs);
}

export async function runLobbyAutomation() {
  delValue(2);
  syncLobbyDate();
  runAbilityAoeAutomation({ type: AbilityAoeEvent.CAPTURE_ABILITY_PAGE });
  if (g("option").quickSite) quickSite();
  if (g("option").encounter) {
    const encounterOutcome = await runEncounterAutomation({
      type: EncounterEvent.LOBBY_TICK,
    });
    scheduleNextLobbyAutomation(encounterOutcome.nextCheckMs);
    if (encounterOutcome.claimed) return;
  }
  if (shouldStopForStamina()) return;
  runNextBattleAutomation();
}
