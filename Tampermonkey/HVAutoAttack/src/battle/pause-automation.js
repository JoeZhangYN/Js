// 战斗暂停编排入口：暂停、暂停中显示、继续恢复统一从这里进入。
import { gE } from "../dom/query.js";
import { setValue, getValue, delValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { _alert } from "../core/lang.js";
import { BattlePauseEvidenceEvent, runBattlePauseEvidence } from "./battle-pause-evidence.js";

const EVENT_RENDER_PAUSED = "renderPaused";
const EVENT_RENDER_IF_PAUSED = "renderIfPaused";
const EVENT_PAUSE = "pause";
const EVENT_TOGGLE = "toggle";
const EVENT_UNKNOWN_PAUSE = "unknownPauseEvent";

export const BattlePauseEvent = Object.freeze({
  RENDER_PAUSED: EVENT_RENDER_PAUSED,
  RENDER_IF_PAUSED: EVENT_RENDER_IF_PAUSED,
  PAUSE: EVENT_PAUSE,
  TOGGLE: EVENT_TOGGLE,
});

const battlePauseEventHandlers = Object.freeze({
  [EVENT_RENDER_PAUSED]: () => handleRenderPaused(),
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
}

function pauseBattle() {
  setPauseButtonText("<l0>继续</l0><l1>繼續</l1><l2>Continue</l2>");
  setValue(STORAGE_KEYS.DISABLED, true);
}

function recordPauseState(state, reason, detail) {
  runBattlePauseEvidence({
    type: BattlePauseEvidenceEvent.RECORD_STATE,
    state,
    reason,
    detail,
  });
}

function resumeBattle(resume) {
  setPauseButtonText("<l0>暂停</l0><l1>暫停</l1><l2>Pause</l2>");
  delValue(0);
  recordPauseState("resumed", "toggle");
  resume?.();
}

function handleRenderPaused() {
  renderPaused();
  return true;
}

function handleRenderIfPaused() {
  if (!getValue(STORAGE_KEYS.DISABLED)) return false;
  renderPaused();
  return true;
}

function handleToggle(deps) {
  if (getValue(STORAGE_KEYS.DISABLED)) {
    resumeBattle(deps.resume);
  } else {
    pauseBattle();
    recordPauseState("paused", "toggle");
  }
  return true;
}

function handlePause(event) {
  pauseBattle();
  recordPauseState("paused", event.reason || EVENT_PAUSE, event.detail);
  return true;
}

function rejectUnknownPauseEvent(event) {
  recordPauseState("rejected", EVENT_UNKNOWN_PAUSE, { eventType: event?.type ?? null });
  return false;
}

export function runBattlePauseAutomation(event = { type: EVENT_PAUSE }, deps = {}) {
  return battlePauseEventHandlers[event?.type]?.(event, deps) ?? rejectUnknownPauseEvent(event);
}
