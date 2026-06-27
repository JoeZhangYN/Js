// App 启动态编排入口：composition root 只上报启动事件，不拼配置/版本/全局状态。
import { gE } from "../dom/query.js";
import { setValue, getValue } from "../state/storage.js";
import { g } from "../state/store.js";
import { _alert } from "../core/lang.js";
import { addStyle } from "../style/inject.js";
import { registerExportMenu } from "../state/riddle-dataset.js";
import { loadCdState } from "../state/cd-tracker.js";
import { setupPageRefresh } from "../alarm/page-refresh.js";

const EVENT_USERSCRIPT_START = "userscriptStart";
const EVENT_GAME_PAGE_READY = "gamePageReady";

export const AppStartupEvent = Object.freeze({
  USERSCRIPT_START: EVENT_USERSCRIPT_START,
  GAME_PAGE_READY: EVENT_GAME_PAGE_READY,
});

function loadGlobalStartupState() {
  loadCdState();
  registerExportMenu();
}

function syncOptionVersion() {
  g("version", GM_info ? GM_info.script.version.slice(0, 4) : "2.89");
  const option = getValue("option", true);
  if (!option) return false;

  g("option", option);
  g("lang", g("option").lang || "0");
  addStyle(g("lang"));
  if (g("option").version !== g("version")) {
    console.log(
      `[HVAA] 版本号 ${g("option").version} → ${g("version")}（已静默对齐，未弹窗）`
    );
    g("option").version = g("version");
    setValue("option", g("option"));
  }
  return true;
}

function requestInitialConfig() {
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
}

function warnDefaultFont() {
  if (!gE('[class^="c5"],[class^="c4"]')) return;
  _alert(
    0,
    "请设置字体：使用默认字体可能使某些功能失效。\n请在 HV 设置(Settings) → Style 里把界面字体设为非默认(如 Verdana / Arial)。",
    "請設置字體：使用默認字體可能使某些功能失效。\n請在 HV 設置(Settings) → Style 裡把界面字體設為非默認(如 Verdana / Arial)。",
    "Please set a font: the default font may break some features.\nIn HV Settings → Style, set the UI font to a non-default one (e.g. Verdana / Arial)."
  );
}

function loadBattleLearningState() {
  unsafeWindow = typeof unsafeWindow === "undefined" ? window : unsafeWindow;
  g("spellAoe", getValue("spellAoe", true) || {});
  console.log("[AoE] 启动加载 spellAoe:", JSON.stringify(g("spellAoe")));
}

function runGamePageStartup() {
  if (!syncOptionVersion()) {
    requestInitialConfig();
    return false;
  }
  setupPageRefresh(g("option"));
  warnDefaultFont();
  loadBattleLearningState();
  return true;
}

export function runAppStartup(event = { type: EVENT_USERSCRIPT_START }) {
  if (event.type === EVENT_USERSCRIPT_START) {
    loadGlobalStartupState();
    return true;
  }
  if (event.type === EVENT_GAME_PAGE_READY) {
    return runGamePageStartup();
  }
  return true;
}
