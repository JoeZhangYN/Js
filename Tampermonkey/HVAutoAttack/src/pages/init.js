// 入口路由：识别页面 (e-hentai redirect / lobby / riddle / battle) 并分派。
// file-size-gate: exempt phase-4-init
import { scheduleReload } from "../core/navigate.js";
import { AppStartupEvent, runAppStartup } from "./app-startup.js";
import { runCrossSiteEncounterNavigation } from "./cross-site-encounter-navigation.js";
import { runEquipmentViewAutomation } from "./equipment-view-automation.js";
import { runRiddleAutomation } from "./riddle-automation.js";
import { runLobbyAutomation } from "./lobby-automation.js";
import { runBattleAutomation } from "../battle/battle-automation.js";
import { detectPageKind, PageKind } from "./page-kind.js";

export function init() {
  runAppStartup({ type: AppStartupEvent.USERSCRIPT_START });
  // 页面类型单一判定（page-kind SOT，替代散落 ad-hoc 哨兵检测）。页面进入后 DOM 稳定，算一次复用。
  const kind = detectPageKind();
  runEquipmentViewAutomation(kind);
  if (runCrossSiteEncounterNavigation(kind)) return;
  // 兜底：非 RIDDLE/BATTLE/LOBBY 游戏页（SHOWEQUIP 独立页 / UNKNOWN 未加载）→ 延时重载（等价原
  // `!gE("#navbar,#riddlecounter,#textlog")`，依赖 showequip 页无 navbar——见 page-kind.js 设计）。
  if (
    kind !== PageKind.RIDDLE &&
    kind !== PageKind.BATTLE &&
    kind !== PageKind.LOBBY
  ) {
    scheduleReload(5 * 60);
    return;
  }
  if (!runAppStartup({ type: AppStartupEvent.GAME_PAGE_READY })) return;
  if (kind === PageKind.RIDDLE) {
    runRiddleAutomation();
  } else if (kind === PageKind.BATTLE) {
    runBattleAutomation();
  } else {
    runLobbyAutomation();
  }
}
