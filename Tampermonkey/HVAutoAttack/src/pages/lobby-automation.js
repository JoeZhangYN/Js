// 战斗外自动化编排入口：composition root 只调用本入口，不拼业务顺序。
import { delValue } from "../state/storage.js";
import { g } from "../state/store.js";
import { time } from "../core/time.js";
import { readStaminaValue } from "../state/stamina.js";
import { IdleArenaEvent, runIdleArenaAutomation } from "../arena/idle-arena.js";
import { quickSite } from "../arena/quick-site.js";
import { runRepair } from "../repair/repair-orchestrator.js";
import { EncounterEvent, runEncounterAutomation } from "./encounter.js";
import { parseAbilityPage } from "./ability-page.js";

function syncLobbyDate() {
  g("dateNow", time(2));
}

function runAbilityPageCapture() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("s") === "Character" && params.get("ss") === "ab") {
    parseAbilityPage();
  }
}

function shouldStopForStamina() {
  return (
    !g("option").restoreStamina &&
    readStaminaValue() <= g("option").staminaLow
  );
}

function runNextBattleAutomation() {
  if (g("option").repair) {
    runRepair();
  } else if (g("option").idleArena) {
    runIdleArenaAutomation({ type: IdleArenaEvent.SCHEDULE_NEXT_BATTLE });
  }
}

export function runLobbyAutomation() {
  delValue(2);
  syncLobbyDate();
  runAbilityPageCapture();
  if (g("option").quickSite) quickSite();
  if (g("option").encounter) {
    runEncounterAutomation({ type: EncounterEvent.LOBBY_TICK });
  }
  if (shouldStopForStamina()) return;
  runNextBattleAutomation();
}
