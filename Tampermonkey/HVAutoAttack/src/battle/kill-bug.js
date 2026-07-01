// HV 战斗 bug 检测：连续相同战斗代码超阈值则重载。
import { gE } from "../dom/query.js";
import {
  NavigationEvent,
  NavigationReloadReason,
  runNavigationAutomation,
} from "../core/navigate.js";

const EVENT_RECOVER = "recover";
const KILL_BUG_RELOAD_DELAY_MS = 700;
const KILL_BUG_PATTERN =
  /(Slot is currently not usable)|(Item does not exist)|(Inventory slot is empty)|(You do not have a powerup gem)/;

export const BattleKillBugRecoveryEvent = Object.freeze({
  RECOVER: EVENT_RECOVER,
});

const battleKillBugRecoveryEventHandlers = Object.freeze({
  [EVENT_RECOVER]: () => recoverKillBug(),
});

function recoverKillBug() {
  // 在 HentaiVerse 发生导致 turn 损失的 bug 时发出警告并移除问题元素: https://ehwiki.org/wiki/HentaiVerse_Bugs_%26_Errors#Combat
  const bugLog = gE('#textlog > tbody > tr > td[class="tlb"]', "all");
  for (let i = 0; i < bugLog.length; i++) {
    const matchedText = bugLog[i].textContent.match(KILL_BUG_PATTERN)?.[0];
    if (matchedText) {
      bugLog[i].className = "tlbWARN";
      setTimeout(() => {
        // 间隔时间以避免持续刷新
        runNavigationAutomation({
          type: NavigationEvent.RELOAD_NOW,
          reason: NavigationReloadReason.KILL_BUG_RECOVERY,
          detail: { source: "battleKillBugRecovery", matchedText },
        }); // 刷新移除问题元素
      }, KILL_BUG_RELOAD_DELAY_MS);
    } else {
      bugLog[i].className = "tlbQRA";
    }
  }
}

export function runBattleKillBugRecovery(event = { type: EVENT_RECOVER }) {
  return battleKillBugRecoveryEventHandlers[event.type]?.(event) ?? false;
}
