import {
  NavigationEvent,
  NavigationReloadReason,
  runNavigationAutomation,
} from "../core/navigate.js";

export function reloadAfterIdleArenaBattle() {
  runNavigationAutomation({
    type: NavigationEvent.RELOAD_NOW,
    reason: NavigationReloadReason.PAGE_REFRESH,
  });
}
