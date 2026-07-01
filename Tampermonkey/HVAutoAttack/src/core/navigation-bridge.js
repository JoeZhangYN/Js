import {
  NavigationEvent,
  NavigationRedirectReason,
  NavigationReloadReason,
  runNavigationAutomation,
} from "./navigate.js";

function reloadCurrentPage(reason) {
  return runNavigationAutomation({
    type: NavigationEvent.RELOAD_NOW,
    reason,
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

if (typeof window !== "undefined") {
  window.HVAA_navigation = Object.freeze({
    RedirectReason: NavigationRedirectReason,
    ReloadReason: NavigationReloadReason,
    openUrl,
    reloadCurrentPage,
  });
}
