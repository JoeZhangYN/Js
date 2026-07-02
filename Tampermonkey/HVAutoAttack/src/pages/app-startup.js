// App 启动态编排入口：composition root 只上报启动事件，不拼配置/版本/全局状态。
import { gE } from "../dom/query.js";
import { g } from "../state/store.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { _alert } from "../core/lang.js";
import { addStyle } from "../style/inject.js";
import { RiddleDatasetEvent, runRiddleDatasetAutomation } from "../state/riddle-dataset.js";
import { CdRuntimeEvent, runCdRuntimeAutomation } from "../state/cd-tracker.js";
import { AbilityAoeEvent, runAbilityAoeAutomation } from "./ability-page.js";

const EVENT_USERSCRIPT_START = "userscriptStart";
const EVENT_GAME_PAGE_READY = "gamePageReady";

export const AppStartupEvent = Object.freeze({
  USERSCRIPT_START: EVENT_USERSCRIPT_START,
  GAME_PAGE_READY: EVENT_GAME_PAGE_READY,
});

const USERSCRIPT_STARTUP_STEPS = [loadCdRuntimeState, registerRiddleDatasetExportMenu];
const GAME_PAGE_STARTUP_STEPS = [syncConfiguredStartupOption, warnDefaultFont, loadBattleLearningState];

const appStartupEventHandlers = Object.freeze({
  [EVENT_USERSCRIPT_START]: runUserscriptStartup,
  [EVENT_GAME_PAGE_READY]: runGamePageStartup,
});

function loadCdRuntimeState() {
  runCdRuntimeAutomation({ type: CdRuntimeEvent.LOAD });
  return true;
}

function registerRiddleDatasetExportMenu() {
  runRiddleDatasetAutomation({ type: RiddleDatasetEvent.REGISTER_EXPORT_MENU });
  return true;
}

function runUserscriptStartup() {
  for (const step of USERSCRIPT_STARTUP_STEPS) step();
  return true;
}

function syncOptionVersion() {
  g("version", GM_info ? GM_info.script.version.slice(0, 4) : "2.89");
  const startupOption = runOptionAutomation({
    type: OptionEvent.SYNC_STARTUP_OPTION,
    currentVersion: g("version"),
  });
  if (!startupOption.configured) return false;

  addStyle(startupOption.lang);
  if (startupOption.versionUpdated) {
    console.log(
      `[HVAA] 版本号 ${startupOption.previousVersion} → ${startupOption.currentVersion}（已静默对齐，未弹窗）`
    );
  }
  return true;
}

function syncConfiguredStartupOption() {
  if (syncOptionVersion()) return true;
  requestInitialConfig();
  return false;
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
  _alert(0, "请设置hvAutoAttack", "請設置hvAutoAttack", "Please config this script");
  gE(".hvAAButton").click();
}

function warnDefaultFont() {
  if (!gE('[class^="c5"],[class^="c4"]')) return true;
  _alert(
    0,
    "请设置字体：使用默认字体可能使某些功能失效。\n请在 HV 设置(Settings) → Style 里把界面字体设为非默认(如 Verdana / Arial)。",
    "請設置字體：使用默認字體可能使某些功能失效。\n請在 HV 設置(Settings) → Style 裡把界面字體設為非默認(如 Verdana / Arial)。",
    "Please set a font: the default font may break some features.\nIn HV Settings → Style, set the UI font to a non-default one (e.g. Verdana / Arial)."
  );
  return true;
}

function loadBattleLearningState() {
  globalThis.unsafeWindow = typeof unsafeWindow === "undefined" ? window : unsafeWindow;
  runAbilityAoeAutomation({ type: AbilityAoeEvent.LOAD_STORED_AOE });
  return true;
}

function runGamePageStartup() {
  for (const step of GAME_PAGE_STARTUP_STEPS) {
    if (!step()) return false;
  }
  return true;
}

export function runAppStartup(event = { type: EVENT_USERSCRIPT_START }) {
  return appStartupEventHandlers[event.type]?.(event) ?? false;
}
