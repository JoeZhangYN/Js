// 战斗会话运行态：唯一入口 runBattleRuntimeAutomation(event)。
import { clearPersistedBattleSession } from "./battle-runtime-failure.js";

const EVENT_CLEAR_SESSION = "clearSession";

export const BattleRuntimeEvent = Object.freeze({
  CLEAR_SESSION: EVENT_CLEAR_SESSION,
});

function clearSession() {
  return clearPersistedBattleSession();
}

const battleRuntimeEventHandlers = Object.freeze({
  [EVENT_CLEAR_SESSION]: clearSession,
});

export function runBattleRuntimeAutomation(event = { type: EVENT_CLEAR_SESSION }) {
  return battleRuntimeEventHandlers[event?.type]?.(event) ?? false;
}
