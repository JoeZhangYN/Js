// HV 战斗 bug 检测：连续相同战斗代码超阈值则重载。
import { gE } from "../dom/query.js";
import {
  NavigationEvent,
  NavigationReloadReason,
  runNavigationAutomation,
} from "../core/navigate.js";
import { BattleKillBugEvidenceEvent, runBattleKillBugEvidence } from "./kill-bug-evidence.js";
import { recordBattleUtilityAdverse } from "./battle-utility-adverse.js";

const EVENT_RECOVER = "recover";
const EVENT_UNKNOWN_KILL_BUG = "unknownKillBugRecoveryEvent";
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
  const matchedTexts = [];
  for (let i = 0; i < bugLog.length; i++) {
    const matchedText = bugLog[i].textContent.match(KILL_BUG_PATTERN)?.[0];
    if (matchedText) {
      matchedTexts.push(matchedText);
      bugLog[i].className = "tlbWARN";
      setTimeout(() => {
        reloadForKillBug(matchedText);
      }, KILL_BUG_RELOAD_DELAY_MS);
    } else {
      bugLog[i].className = "tlbQRA";
    }
  }
  const scheduledReload = matchedTexts.length > 0;
  recordKillBugRecovery(scheduledReload ? "scheduledReload" : "notMatched", {
    matchedTexts,
    scannedRows: bugLog.length,
    delayMs: scheduledReload ? KILL_BUG_RELOAD_DELAY_MS : null,
  });
  return scheduledReload;
}

function reloadForKillBug(matchedText) {
  const detail = { source: "battleKillBugRecovery", matchedText };
  try {
    recordBattleUtilityAdverse("recovery");
    recordKillBugRecovery("reloadAttempted", {
      ...detail,
      navigationResult: runNavigationAutomation({
        type: NavigationEvent.RELOAD_NOW,
        reason: NavigationReloadReason.KILL_BUG_RECOVERY,
        detail,
      }),
    });
  } catch (error) {
    recordKillBugRecovery("reloadAttempted", {
      ...detail,
      navigationResult: false,
      navigationError: error?.message || String(error),
    });
  }
}

function recordKillBugRecovery(result, detail, reason = EVENT_RECOVER) {
  runBattleKillBugEvidence({
    type: BattleKillBugEvidenceEvent.RECORD_RECOVERY,
    result,
    reason,
    detail,
  });
}

function rejectUnknownKillBugEvent(event) {
  recordKillBugRecovery("rejected", { eventType: event?.type ?? null }, EVENT_UNKNOWN_KILL_BUG);
  return false;
}

export function runBattleKillBugRecovery(event = { type: EVENT_RECOVER }) {
  return (
    battleKillBugRecoveryEventHandlers[event?.type]?.(event) ?? rejectUnknownKillBugEvent(event)
  );
}
