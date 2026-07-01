// 页面导航副作用：唯一对外入口 runNavigationAutomation(event)。
import { installExternalUnloadAudit, reportPreviousNavigationAudit } from "./navigation-audit.js";
import { recordNavigationDecisionSafely, writeNavigationAuditSafely } from "./navigation-recording.js";
import { NavigationRedirectReason, NavigationReloadReason, NavigationWindowReason } from "./navigation-reasons.js";

const EVENT_RELOAD_NOW = "reloadNow", EVENT_SCHEDULE_RELOAD = "scheduleReload", EVENT_OPEN_URL = "openUrl", EVENT_OPEN_WINDOW = "openWindow";

export const NavigationEvent = Object.freeze({ RELOAD_NOW: EVENT_RELOAD_NOW, SCHEDULE_RELOAD: EVENT_SCHEDULE_RELOAD, OPEN_URL: EVENT_OPEN_URL, OPEN_WINDOW: EVENT_OPEN_WINDOW });

const RELOAD_REASONS = new Set(Object.values(NavigationReloadReason));

const REDIRECT_REASONS = new Set(Object.values(NavigationRedirectReason));

const WINDOW_REASONS = new Set(Object.values(NavigationWindowReason));
const RELOAD_RETRY_DELAY_MS = 5000;
const CAUSE_NAVIGATION_EFFECT_FAILED = "navigationEffectFailed";

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
  try {
    window.location.href = window.location;
  } catch (error) {
    recordNavigationDecisionSafely("rejected", { type: EVENT_RELOAD_NOW, reason }, {
      cause: CAUSE_NAVIGATION_EFFECT_FAILED,
      attempt,
      detail,
      error: error?.message || String(error),
    });
    writeNavigationAuditSafely("reloadFailed", {
      reason,
      attempt,
      retryDelayMs: RELOAD_RETRY_DELAY_MS,
      detail,
      error: error?.message || String(error),
    });
    return false;
  }
  setTimeout(() => goto(reason, detail, attempt + 1), RELOAD_RETRY_DELAY_MS);
  return true;
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

function openNavigationTarget(event, openArgs, detail, auditKind, failedAuditKind) {
  try {
    const openedWindow = window.open(...openArgs);
    const resultDetail = { ...detail, opened: Boolean(openedWindow) };
    recordNavigationDecisionSafely(
      openedWindow ? "accepted" : "rejected",
      event,
      openedWindow ? resultDetail : { ...resultDetail, cause: "windowOpenBlocked" }
    );
    writeNavigationAuditSafely(auditKind, { reason: event.reason, ...resultDetail });
    return openedWindow;
  } catch (error) {
    const failureDetail = {
      ...detail,
      opened: false,
      cause: CAUSE_NAVIGATION_EFFECT_FAILED,
      error: error?.message || String(error),
    };
    recordNavigationDecisionSafely("rejected", event, failureDetail);
    writeNavigationAuditSafely(failedAuditKind, { reason: event.reason, ...failureDetail });
    return false;
  }
}

/**
 * 打开 URL。
 * @param {string} url
 * @param {boolean=} newTab true -> 新标签
 */
function openUrl(url, newTab, reason) {
  return Boolean(
    openNavigationTarget(
      { type: EVENT_OPEN_URL, reason },
      [url, newTab ? "_blank" : "_self"],
      { url, newTab: Boolean(newTab) },
      "navigate",
      "navigateFailed"
    )
  );
}

function openWindow(url, name, features, reason) {
  return openNavigationTarget(
    { type: EVENT_OPEN_WINDOW, reason },
    [url, name, features],
    { url, name, features },
    "openWindow",
    "openWindowFailed"
  );
}

const navigationEventHandlers = Object.freeze({
  [EVENT_RELOAD_NOW]: (event) => {
    if (!isReloadReasonAllowed(event)) {
      recordNavigationDecisionSafely("rejected", event, { cause: "reloadReasonNotAllowed" });
      return false;
    }
    return goto(event.reason, event.detail);
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

export { NavigationRedirectReason, NavigationReloadReason, NavigationWindowReason };
