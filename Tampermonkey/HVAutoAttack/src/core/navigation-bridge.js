import {
  NavigationEvent,
  NavigationRedirectReason,
  NavigationReloadReason,
  runNavigationAutomation,
} from "./navigate.js";

function reloadCurrentPage(reason, detail) {
  return runNavigationAutomation({
    type: NavigationEvent.RELOAD_NOW,
    reason,
    detail,
  });
}

function openUrl(url, reason, newTab = false) {
  return runNavigationAutomation({
    type: NavigationEvent.OPEN_URL,
    url,
    reason,
    newTab,
  });
}

function installNavigationBridge(target) {
  if (!target) return;
  target.HVAA_navigation = Object.freeze({
    RedirectReason: NavigationRedirectReason,
    ReloadReason: NavigationReloadReason,
    openUrl,
    reloadCurrentPage,
  });
}

if (typeof window !== "undefined") installNavigationBridge(window);
if (typeof unsafeWindow !== "undefined") installNavigationBridge(unsafeWindow);
