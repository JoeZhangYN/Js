import {
  NavigationEvent,
  NavigationReloadReason,
  runNavigationAutomation,
} from "../core/navigate.js";
import { recordBattleUtilityAdverse } from "./battle-utility-adverse.js";

const EVENT_RELOAD = "reload";

export const MonsterStatusRecoveryEvent = Object.freeze({ RELOAD: EVENT_RELOAD });

const recoveryHandlers = Object.freeze({
  [EVENT_RELOAD]: (event) => {
    recordBattleUtilityAdverse("recovery");
    return runNavigationAutomation({
      type: NavigationEvent.RELOAD_NOW,
      reason: NavigationReloadReason.MONSTER_STATUS_REPAIR,
      detail: event.detail,
    });
  },
});

export function runMonsterStatusRecovery(event = { type: EVENT_RELOAD }) {
  return recoveryHandlers[event?.type]?.(event) ?? false;
}
