// 页面导航副作用：唯一对外入口 runNavigationAutomation(event)。
import {
  installExternalUnloadAudit,
  reportPreviousNavigationAudit,
  writeNavigationAudit,
} from "./navigation-audit.js";

const EVENT_RELOAD_NOW = "reloadNow";
const EVENT_SCHEDULE_RELOAD = "scheduleReload";
const EVENT_OPEN_URL = "openUrl";
const EVENT_OPEN_WINDOW = "openWindow";

export const NavigationEvent = Object.freeze({
  RELOAD_NOW: EVENT_RELOAD_NOW,
  SCHEDULE_RELOAD: EVENT_SCHEDULE_RELOAD,
  OPEN_URL: EVENT_OPEN_URL,
  OPEN_WINDOW: EVENT_OPEN_WINDOW,
});

export const NavigationReloadReason = Object.freeze({
  ACTION_WATCHDOG: "actionWatchdog",
  BATTLE_HASH_CLEANUP: "battleHashCleanup",
  BATTLE_API_RESPONSE: "battleApiResponse",
  BATTLE_VICTORY: "battleVictory",
  FLEE_CONFIRMATION: "fleeConfirmation",
  KILL_BUG_RECOVERY: "killBugRecovery",
  MONSTER_STATUS_REPAIR: "monsterStatusRepair",
  PAGE_REFRESH: "pageRefresh",
  RIDDLE_POST_RESULT: "riddlePostResult",
  SETTINGS_CHANGE: "settingsChange",
  STAMINA_RECOVERY: "staminaRecovery",
  UNKNOWN_PAGE_REFRESH: "unknownPageRefresh",
  HV_UTILS_ABILITY_UNLOCK: "hvUtilsAbilityUnlock",
  HV_UTILS_CONFIG_SAVE: "hvUtilsConfigSave",
  HV_UTILS_MAIL_LOG_RESET: "hvUtilsMailLogReset",
  HV_UTILS_MONSTER_LAB_FORCE_UPDATE: "hvUtilsMonsterLabForceUpdate",
  HV_UTILS_MONSTER_LAB_LOG_RESET: "hvUtilsMonsterLabLogReset",
  HV_UTILS_PERSONA_DYNJS: "hvUtilsPersonaDynjs",
  HV_UTILS_TRAINING_NOTIFICATION: "hvUtilsTrainingNotification",
});

const RELOAD_REASONS = new Set(Object.values(NavigationReloadReason));

export const NavigationRedirectReason = Object.freeze({
  CROSS_SITE_ENCOUNTER: "crossSiteEncounter",
  ENCOUNTER_ENTRY: "encounterEntry",
  HV_UTILS_CHARACTER_SETTINGS: "hvUtilsCharacterSettings",
  HV_UTILS_DISABLE: "hvUtilsDisable",
  HV_UTILS_EQUIP_POPUP: "hvUtilsEquipPopup",
  HV_UTILS_MAIL_PAGE: "hvUtilsMailPage",
});

const REDIRECT_REASONS = new Set(Object.values(NavigationRedirectReason));

reportPreviousNavigationAudit();
installExternalUnloadAudit();

/** 重定向当前页面（带 5s 后重试）。 */
function goto(reason, detail) {
  writeNavigationAudit("reload", { reason, detail });
  window.location.href = window.location;
  setTimeout(() => goto(reason, detail), 5000);
}

function isReloadReasonAllowed(event) {
  return RELOAD_REASONS.has(event.reason);
}

function isRedirectReasonAllowed(event) {
  return REDIRECT_REASONS.has(event.reason);
}

function normalizeReloadDelayMs(event) {
  let delayMs;
  if (typeof event.milliseconds !== "undefined") delayMs = Number(event.milliseconds);
  else if (typeof event.seconds !== "undefined") delayMs = Number(event.seconds) * 1000;
  else if (typeof event.minutes !== "undefined") delayMs = Number(event.minutes) * 60 * 1000;
  else return false;
  return Number.isFinite(delayMs) && delayMs > 0 ? delayMs : false;
}

/**
 * 延时重载页面。
 * @returns {number} setTimeout 句柄（供 clearTimeout 取消，如 reloader 回合结束取消 delayReload）
 */
function scheduleReload(event) {
  if (!isReloadReasonAllowed(event)) return false;
  const delayMs = normalizeReloadDelayMs(event);
  if (!delayMs) return false;
  return setTimeout(() => goto(event.reason), delayMs);
}

/**
 * 打开 URL。
 * @param {string} url
 * @param {boolean=} newTab true -> 新标签
 */
function openUrl(url, newTab, reason) {
  writeNavigationAudit("navigate", { reason, url, newTab: Boolean(newTab) });
  window.open(url, newTab ? "_blank" : "_self");
}

function openWindow(url, name, features) {
  return window.open(url, name, features);
}

const navigationEventHandlers = Object.freeze({
  [EVENT_RELOAD_NOW]: (event) => {
    if (!isReloadReasonAllowed(event)) return false;
    goto(event.reason, event.detail);
    return true;
  },
  [EVENT_SCHEDULE_RELOAD]: (event) => scheduleReload(event),
  [EVENT_OPEN_URL]: (event) => {
    if (!isRedirectReasonAllowed(event)) return false;
    openUrl(event.url, event.newTab, event.reason);
    return true;
  },
  [EVENT_OPEN_WINDOW]: (event) => openWindow(event.url, event.name, event.features),
});

export function runNavigationAutomation(event = { type: EVENT_RELOAD_NOW }) {
  return navigationEventHandlers[event.type]?.(event) ?? false;
}
