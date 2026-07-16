// App 启动态编排入口：composition root 只上报启动事件，不拼配置/版本/全局状态。
import { gE } from "../dom/query.js";
import { g } from "../state/store.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { _alert, UserFeedbackEvent, runUserFeedbackAutomation } from "../core/lang.js";
import { addStyle } from "../style/inject.js";
import { RiddleDatasetEvent, runRiddleDatasetAutomation } from "../state/riddle-dataset.js";
import {
  runStorageMaintenanceAutomation,
  StorageMaintenanceEvent,
} from "../state/storage-maintenance.js";
import { CdRuntimeEvent, runCdRuntimeAutomation } from "../state/cd-tracker.js";
import { AbilityAoeEvent, runAbilityAoeAutomation } from "./ability-page.js";
import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";
import { retireLegacyBattleRoundStorage } from "../battle/battle-session-legacy-storage.js";
import { INITIAL_LANGUAGE_PROMPT } from "./app-startup-copy.js";

export const APP_STARTUP_FAILURE_KEY = "HVAA:lastAppStartupFailure";

export const AppStartupEvent = Object.freeze({
  USERSCRIPT_START: "userscriptStart",
  GAME_PAGE_READY: "gamePageReady",
});

const USERSCRIPT_STARTUP_STEPS = [
  ["retireLegacyBattleRoundStorage", retireLegacyBattleRoundStorage],
  ["loadCdRuntimeState", loadCdRuntimeState],
  ["registerStorageMenus", registerStorageMenus],
];
const GAME_PAGE_STARTUP_STEPS = [
  ["syncConfiguredStartupOption", syncConfiguredStartupOption],
  ["warnDefaultFont", warnDefaultFont],
  ["loadBattleLearningState", loadBattleLearningState],
];

const appStartupEventHandlers = Object.freeze({
  [AppStartupEvent.USERSCRIPT_START]: runUserscriptStartup,
  [AppStartupEvent.GAME_PAGE_READY]: runGamePageStartup,
});

function recordAppStartupFailure(stage, reason, detail = {}) {
  const evidence = {
    capability: "appStartup",
    stage,
    reason,
    ...detail,
  };
  try {
    globalThis.sessionStorage?.setItem(APP_STARTUP_FAILURE_KEY, JSON.stringify(evidence));
  } catch {
    // Startup failure handling must not depend on diagnostic storage.
  }
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: ["[HVAA] app startup failed", evidence],
  });
  return evidence;
}

function runStartupStep(stage, step) {
  try {
    return step();
  } catch (error) {
    recordAppStartupFailure(stage, "stepException", { error: error?.message || String(error) });
    return false;
  }
}

function loadCdRuntimeState() {
  runCdRuntimeAutomation({ type: CdRuntimeEvent.LOAD });
  return true;
}

function registerStorageMenus() {
  runRiddleDatasetAutomation({ type: RiddleDatasetEvent.REGISTER_EXPORT_MENU });
  runStorageMaintenanceAutomation({ type: StorageMaintenanceEvent.REGISTER_MENU });
  return true;
}

function runUserscriptStartup() {
  for (const [stage, step] of USERSCRIPT_STARTUP_STEPS) {
    if (!runStartupStep(stage, step)) return false;
  }
  return true;
}

function syncOptionVersion() {
  const scriptVersion =
    typeof GM_info !== "undefined" && GM_info ? GM_info.script.version.slice(0, 4) : "2.89";
  g("version", scriptVersion);
  const startupOption = runOptionAutomation({
    type: OptionEvent.SYNC_STARTUP_OPTION,
    currentVersion: g("version"),
  });
  if (!startupOption.configured) return false;

  addStyle(startupOption.lang);
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
    runUserFeedbackAutomation({
      type: UserFeedbackEvent.PROMPT,
      copy: { l0: INITIAL_LANGUAGE_PROMPT },
      defaultValue: 0,
    }) || 2
  );
  addStyle(g("lang"));
  _alert(0, "请设置hvAutoAttack", "請設置hvAutoAttack", "Please config this script");
  const button = gE(".hvAAButton");
  if (!button || typeof button.click !== "function") {
    recordAppStartupFailure("requestInitialConfig", "missingConfigButton");
    return false;
  }
  try {
    button.click();
  } catch (error) {
    recordAppStartupFailure("requestInitialConfig", "configButtonClickFailed", {
      error: error?.message || String(error),
    });
  }
  return false;
}

function warnDefaultFont() {
  if (!gE('[class^="c5"],[class^="c4"]')) return true;
  try {
    _alert(
      0,
      "请设置字体：使用默认字体可能使某些功能失效。\n请在 HV 设置(Settings) → Style 里把界面字体设为非默认(如 Verdana / Arial)。",
      "請設置字體：使用默認字體可能使某些功能失效。\n請在 HV 設置(Settings) → Style 裡把界面字體設為非默認(如 Verdana / Arial)。",
      "Please set a font: the default font may break some features.\nIn HV Settings → Style, set the UI font to a non-default one (e.g. Verdana / Arial)."
    );
  } catch (error) {
    recordAppStartupFailure("warnDefaultFont", "warningFailed", {
      error: error?.message || String(error),
    });
  }
  return true;
}

function loadBattleLearningState() {
  globalThis.unsafeWindow = typeof unsafeWindow === "undefined" ? window : unsafeWindow;
  runAbilityAoeAutomation({ type: AbilityAoeEvent.LOAD_STORED_AOE });
  return true;
}

function runGamePageStartup() {
  for (const [stage, step] of GAME_PAGE_STARTUP_STEPS) {
    if (!runStartupStep(stage, step)) return false;
  }
  return true;
}

export function runAppStartup(event = { type: AppStartupEvent.USERSCRIPT_START }) {
  return appStartupEventHandlers[event?.type]?.(event) ?? false;
}
