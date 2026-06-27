// 入口路由：识别页面 (e-hentai redirect / lobby / riddle / battle) 并分派。
// file-size-gate: exempt phase-4-init
import { gE } from "../dom/query.js";
import { setValue, getValue } from "../state/storage.js";
import { g } from "../state/store.js";
import { _alert } from "../core/lang.js";
import { scheduleReload } from "../core/navigate.js";
import { addStyle } from "../style/inject.js";
import { registerExportMenu } from "../state/riddle-dataset.js";
import { runCrossSiteEncounterNavigation } from "./cross-site-encounter-navigation.js";
import { runEquipmentViewAutomation } from "./equipment-view-automation.js";
import { runRiddleAutomation } from "./riddle-automation.js";
import { runLobbyAutomation } from "./lobby-automation.js";
import { runBattleAutomation } from "../battle/battle-automation.js";
import { loadCdState } from "../state/cd-tracker.js";
import { setupPageRefresh } from "../alarm/page-refresh.js";
import { detectPageKind, PageKind } from "./page-kind.js";

export function init() {
  // Phase 5b-1: 启动时加载 globalTurn / skillLastUsed 持久化数据
  loadCdState();
  // P6: 注册 GM 菜单「导出答题备份」（全局可用，规避挂机后台下载失效）
  registerExportMenu();
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
  g("version", GM_info ? GM_info.script.version.slice(0, 4) : "2.89");
  if (getValue("option")) {
    g("option", getValue("option", true));
    g("lang", g("option").lang || "0");
    addStyle(g("lang"));
    if (g("option").version !== g("version")) {
      // [v10.0.1] 版本更新弹窗已禁用（用户要求不弹）：静默对齐版本号 + 持久化，
      // 避免每次刷新重复触发。新版若新增配置项，由各 getOption(key, default) 兜底。
      console.log(
        `[HVAA] 版本号 ${g("option").version} → ${g("version")}（已静默对齐，未弹窗）`
      );
      g("option").version = g("version");
      setValue("option", g("option"));
    }
  } else {
    g(
      "lang",
      window.prompt(
        "请输入以下语言代码对应的数字\nPlease put in the number of your preferred language (0, 1 or 2)\n0.简体中文\n1.繁體中文\n2.English",
        0
      ) || 2
    );
    addStyle(g("lang"));
    _alert(
      0,
      "请设置hvAutoAttack",
      "請設置hvAutoAttack",
      "Please config this script"
    );
    gE(".hvAAButton").click();
    return;
  }
  // 移动端长时间挂机防卡死：absolute 时钟级 reload，与 reloader.delayReload（action idle 计时）正交
  setupPageRefresh(g("option"));
  if (gE('[class^="c5"],[class^="c4"]')) {
    // 旧版会跳 dodying README 字体说明；改为内联提示，不再外链导航。
    _alert(
      0,
      "请设置字体：使用默认字体可能使某些功能失效。\n请在 HV 设置(Settings) → Style 里把界面字体设为非默认(如 Verdana / Arial)。",
      "請設置字體：使用默認字體可能使某些功能失效。\n請在 HV 設置(Settings) → Style 裡把界面字體設為非默認(如 Verdana / Arial)。",
      "Please set a font: the default font may break some features.\nIn HV Settings → Style, set the UI font to a non-default one (e.g. Verdana / Arial)."
    );
  }
  unsafeWindow = typeof unsafeWindow === "undefined" ? window : unsafeWindow;
  g("spellAoe", getValue("spellAoe", true) || {});
  console.log("[AoE] 启动加载 spellAoe:", JSON.stringify(g("spellAoe")));
  if (kind === PageKind.RIDDLE) {
    runRiddleAutomation();
  } else if (kind === PageKind.BATTLE) {
    runBattleAutomation();
  } else {
    runLobbyAutomation();
  }
}
