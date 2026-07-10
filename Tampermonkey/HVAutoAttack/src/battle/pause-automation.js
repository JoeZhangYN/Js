// 战斗暂停编排入口：暂停、暂停中显示、继续恢复统一从这里进入。
import { gE } from "../dom/query.js";
import { setValue, getValue, delValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { _alert } from "../core/lang.js";
import { BattlePauseEvidenceEvent, runBattlePauseEvidence } from "./battle-pause-evidence.js";
import { recordBattleUtilityAdverse } from "./battle-utility-adverse.js";

const EVENT_RENDER_PAUSED = "renderPaused";
const EVENT_RENDER_IF_PAUSED = "renderIfPaused";
const EVENT_PAUSE = "pause";
const EVENT_TOGGLE = "toggle";
const EVENT_UNKNOWN_PAUSE = "unknownPauseEvent";
const EMERGENCY_PAUSE_SESSION_KEY = "HVAA:emergencyBattlePause";
let emergencyPauseMemory = null;
let emergencyPauseMemoryOnly = false;

export const BattlePauseEvent = Object.freeze({
  RENDER_PAUSED: EVENT_RENDER_PAUSED,
  RENDER_IF_PAUSED: EVENT_RENDER_IF_PAUSED,
  PAUSE: EVENT_PAUSE,
  TOGGLE: EVENT_TOGGLE,
});

const battlePauseEventHandlers = Object.freeze({
  [EVENT_RENDER_PAUSED]: () => renderPaused(),
  [EVENT_RENDER_IF_PAUSED]: () => handleRenderIfPaused(),
  [EVENT_TOGGLE]: (_event, deps) => handleToggle(deps),
  [EVENT_PAUSE]: (event) => handlePause(event),
});

function setPauseButtonText(text) {
  if (gE(".pauseChange")) gE(".pauseChange").innerHTML = text;
}

function renderPaused() {
  document.title = _alert(-1, "hvAutoAttack暂停中", "hvAutoAttack暫停中", "hvAutoAttack Paused");
  setPauseButtonText("<l0>继续</l0><l1>繼續</l1><l2>Continue</l2>");
  return true;
}

const errorText = (error) => error?.message || String(error);

function persistEmergencyPause(event, primaryError) {
  const emergency = {
    reason: event.reason || EVENT_PAUSE,
    detail: event.detail,
    primaryError: errorText(primaryError),
    at: new Date().toISOString(),
  };
  emergencyPauseMemory = emergency;
  try {
    sessionStorage.setItem(EMERGENCY_PAUSE_SESSION_KEY, JSON.stringify(emergency));
    emergencyPauseMemoryOnly = false;
    return { ok: true, scope: "tabSession", emergency };
  } catch (error) {
    emergencyPauseMemoryOnly = true;
    return { ok: true, scope: "runtimeMemory", emergency, storageError: errorText(error) };
  }
}

function readEmergencyPause() {
  if (emergencyPauseMemoryOnly) return emergencyPauseMemory;
  try {
    const raw = sessionStorage.getItem(EMERGENCY_PAUSE_SESSION_KEY);
    if (!raw) {
      emergencyPauseMemory = null;
      return null;
    }
    emergencyPauseMemory = JSON.parse(raw);
  } catch {
    // Runtime memory remains authoritative when session storage is unavailable.
  }
  return emergencyPauseMemory;
}

function clearEmergencyPause() {
  emergencyPauseMemory = null;
  emergencyPauseMemoryOnly = false;
  try {
    sessionStorage.removeItem(EMERGENCY_PAUSE_SESSION_KEY);
    return { ok: true, scope: "tabSession" };
  } catch (error) {
    return { ok: true, scope: "runtimeMemory", storageError: errorText(error) };
  }
}

function readPauseState() {
  return {
    persistent: Boolean(getValue(STORAGE_KEYS.DISABLED)),
    emergency: readEmergencyPause(),
  };
}

function pauseBattle(event) {
  try {
    setValue(STORAGE_KEYS.DISABLED, true);
  } catch (error) {
    const emergency = persistEmergencyPause(event, error);
    setPauseButtonText("<l0>继续</l0><l1>繼續</l1><l2>Continue</l2>");
    return { ok: true, degraded: true, primaryError: errorText(error), emergency };
  }
  setPauseButtonText("<l0>继续</l0><l1>繼續</l1><l2>Continue</l2>");
  return { ok: true, degraded: false };
}

function recordPauseState(state, reason, detail) {
  runBattlePauseEvidence({
    type: BattlePauseEvidenceEvent.RECORD_STATE,
    state,
    reason,
    detail,
  });
}

function resumeBattle(resume, pauseState) {
  if (pauseState.persistent) {
    try {
      delValue(0);
    } catch (error) {
      recordPauseState("failed", "pauseResumePersistenceFailed", {
        error: errorText(error),
      });
      return false;
    }
  }
  const emergency = clearEmergencyPause();
  setPauseButtonText("<l0>暂停</l0><l1>暫停</l1><l2>Pause</l2>");
  recordPauseState("resumed", "toggle", { emergency });
  resume?.();
  return true;
}

function handleRenderIfPaused() {
  const pauseState = readPauseState();
  if (!pauseState.persistent && !pauseState.emergency) return false;
  renderPaused();
  return true;
}

function handleToggle(deps) {
  const pauseState = readPauseState();
  if (pauseState.persistent || pauseState.emergency) {
    return resumeBattle(deps.resume, pauseState);
  }
  const pause = pauseBattle({ reason: "toggle" });
  recordBattleUtilityAdverse("pause");
  recordPauseState("paused", "toggle", pause.degraded ? { persistence: pause } : undefined);
  return true;
}

function handlePause(event) {
  const pause = pauseBattle(event);
  recordBattleUtilityAdverse("pause");
  recordPauseState("paused", event.reason || EVENT_PAUSE, {
    ...event.detail,
    ...(pause.degraded ? { persistence: pause } : {}),
  });
  return true;
}

function rejectUnknownPauseEvent(event) {
  recordPauseState("rejected", EVENT_UNKNOWN_PAUSE, { eventType: event?.type ?? null });
  return false;
}

export function runBattlePauseAutomation(event = { type: EVENT_PAUSE }, deps = {}) {
  return battlePauseEventHandlers[event?.type]?.(event, deps) ?? rejectUnknownPauseEvent(event);
}
