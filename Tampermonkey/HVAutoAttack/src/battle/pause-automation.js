// 战斗暂停编排入口：暂停、暂停中显示、继续恢复统一从这里进入。
import { gE } from "../dom/query.js";
import { setValue, getValue, delValue } from "../state/storage.js";
import { _alert } from "../core/lang.js";

const EVENT_RENDER_PAUSED = "renderPaused";
const EVENT_RENDER_IF_PAUSED = "renderIfPaused";
const EVENT_PAUSE = "pause";
const EVENT_TOGGLE = "toggle";

export const BattlePauseEvent = Object.freeze({
  RENDER_PAUSED: EVENT_RENDER_PAUSED,
  RENDER_IF_PAUSED: EVENT_RENDER_IF_PAUSED,
  PAUSE: EVENT_PAUSE,
  TOGGLE: EVENT_TOGGLE,
});

function setPauseButtonText(text) {
  if (gE(".pauseChange")) gE(".pauseChange").innerHTML = text;
}

function renderPaused() {
  document.title = _alert(
    -1,
    "hvAutoAttack暂停中",
    "hvAutoAttack暫停中",
    "hvAutoAttack Paused"
  );
  setPauseButtonText("<l0>继续</l0><l1>繼續</l1><l2>Continue</l2>");
}

function pauseBattle() {
  setPauseButtonText("<l0>继续</l0><l1>繼續</l1><l2>Continue</l2>");
  setValue("disabled", true);
}

function resumeBattle(resume) {
  setPauseButtonText("<l0>暂停</l0><l1>暫停</l1><l2>Pause</l2>");
  delValue(0);
  resume?.();
}

export function runBattlePauseAutomation(
  event = { type: EVENT_PAUSE },
  deps = {}
) {
  if (event.type === EVENT_RENDER_PAUSED) {
    renderPaused();
    return true;
  }
  if (event.type === EVENT_RENDER_IF_PAUSED) {
    if (!getValue("disabled")) return false;
    renderPaused();
    return true;
  }
  if (event.type === EVENT_TOGGLE) {
    if (getValue("disabled")) {
      resumeBattle(deps.resume);
    } else {
      pauseBattle();
    }
    return true;
  }
  if (event.type === EVENT_PAUSE) {
    pauseBattle();
    return true;
  }
  return false;
}
