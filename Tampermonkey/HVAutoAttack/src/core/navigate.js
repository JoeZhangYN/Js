// 页面导航副作用：唯一对外入口 runNavigationAutomation(event)。
import { installExternalUnloadAudit, reportPreviousNavigationAudit } from "./navigation-audit.js";
import {
  recordNavigationDecisionSafely,
  writeNavigationAuditSafely,
} from "./navigation-recording.js";

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
  BATTLE_API_CALLBACK_FALLBACK: "battleApiCallbackFallback",
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

export const NavigationWindowReason = Object.freeze({ RIDDLE_POPUP: "riddlePopup" });

const WINDOW_REASONS = new Set(Object.values(NavigationWindowReason));
const RELOAD_RETRY_DELAY_MS = 5000;

reportPreviousNavigationAudit();
installExternalUnloadAudit();

function goto(reason, detail, attempt = 1) {
  const reloadEvidence = { attempt, retryDelayMs: RELOAD_RETRY_DELAY_MS, detail };
  recordNavigationDecisionSafely("accepted", { type: EVENT_RELOAD_NOW, reason }, reloadEvidence);
  writeNavigationAuditSafely("reload", {
    reason,
    attempt,
    retryDelayMs: RELOAD_RETRY_DELAY_MS,
    detail,
  });
  window.location.href = window.location;
  setTimeout(() => goto(reason, detail, attempt + 1), RELOAD_RETRY_DELAY_MS);
}

const isReloadReasonAllowed = (event) => RELOAD_REASONS.has(event.reason);
const isRedirectReasonAllowed = (event) => REDIRECT_REASONS.has(event.reason);
const isWindowReasonAllowed = (event) => WINDOW_REASONS.has(event.reason);

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
  if (!isReloadReasonAllowed(event)) {
    recordNavigationDecisionSafely("rejected", event, { cause: "reloadReasonNotAllowed" });
    return false;
  }
  const delayMs = normalizeReloadDelayMs(event);
  if (!delayMs) {
    recordNavigationDecisionSafely("rejected", event, { cause: "invalidReloadDelay" });
    return false;
  }
  recordNavigationDecisionSafely("accepted", event, { delayMs, detail: event.detail });
  return setTimeout(() => goto(event.reason, event.detail), delayMs);
}

/**
 * 打开 URL。
 * @param {string} url
 * @param {boolean=} newTab true -> 新标签
 */
function openUrl(url, newTab, reason) {
  const openedWindow = window.open(url, newTab ? "_blank" : "_self");
  const detail = { url, newTab: Boolean(newTab), opened: Boolean(openedWindow) };
  recordNavigationDecisionSafely(
    openedWindow ? "accepted" : "rejected",
    { type: EVENT_OPEN_URL, reason },
    openedWindow ? detail : { ...detail, cause: "windowOpenBlocked" }
  );
  writeNavigationAuditSafely("navigate", { reason, ...detail });
  return Boolean(openedWindow);
}

function openWindow(url, name, features, reason) {
  const openedWindow = window.open(url, name, features);
  const detail = { url, name, features, opened: Boolean(openedWindow) };
  recordNavigationDecisionSafely(
    openedWindow ? "accepted" : "rejected",
    { type: EVENT_OPEN_WINDOW, reason },
    openedWindow ? detail : { ...detail, cause: "windowOpenBlocked" }
  );
  writeNavigationAuditSafely("openWindow", { reason, ...detail });
  return openedWindow;
}

const navigationEventHandlers = Object.freeze({
  [EVENT_RELOAD_NOW]: (event) => {
    if (!isReloadReasonAllowed(event)) {
      recordNavigationDecisionSafely("rejected", event, { cause: "reloadReasonNotAllowed" });
      return false;
    }
    goto(event.reason, event.detail);
    return true;
  },
  [EVENT_SCHEDULE_RELOAD]: (event) => scheduleReload(event),
  [EVENT_OPEN_URL]: (event) => {
    if (!isRedirectReasonAllowed(event)) {
      recordNavigationDecisionSafely("rejected", event, {
        cause: "redirectReasonNotAllowed",
        url: event.url,
      });
      return false;
    }
    return openUrl(event.url, event.newTab, event.reason);
  },
  [EVENT_OPEN_WINDOW]: (event) => {
    if (!isWindowReasonAllowed(event)) {
      recordNavigationDecisionSafely("rejected", event, {
        cause: "windowReasonNotAllowed",
        url: event.url,
      });
      return false;
    }
    return openWindow(event.url, event.name, event.features, event.reason);
  },
});

export function runNavigationAutomation(event = { type: EVENT_RELOAD_NOW }) {
  const handler = navigationEventHandlers[event?.type];
  if (!handler) {
    recordNavigationDecisionSafely("rejected", event, { cause: "unknownNavigationEvent" });
    return false;
  }
  return handler(event);
}
