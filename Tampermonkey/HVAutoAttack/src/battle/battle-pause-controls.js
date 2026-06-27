import { cE, gE } from "../dom/query.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { runBattleTurnAutomation } from "./main-loop.js";
import { BattlePauseEvent, runBattlePauseAutomation } from "./pause-automation.js";

const EVENT_INSTALL = "install";

export const BattlePauseControlsEvent = Object.freeze({
  INSTALL: EVENT_INSTALL,
});

function togglePause(deps) {
  deps.runPauseToggle({ resume: deps.resume });
}

function installPauseButton(box, deps) {
  const button = box.appendChild(deps.createElement("button"));
  button.innerHTML = "<l0>暂停</l0><l1>暫停</l1><l2>Pause</l2>";
  button.className = "pauseChange";
  button.onclick = () => togglePause(deps);
}

function installPauseHotkey(option, deps) {
  deps.document.addEventListener(
    "keydown",
    (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === option.pauseHotkeyKey) togglePause(deps);
    },
    false
  );
}

function installControls(deps) {
  const option = deps.readOption();
  const box = deps.query("#battle_main").appendChild(deps.createElement("div"));
  box.id = "hvAABox2";
  if (option.pauseButton) installPauseButton(box, deps);
  if (option.pauseHotkey) installPauseHotkey(option, deps);
  return true;
}

export function runBattlePauseControlsAutomation(
  event = { type: EVENT_INSTALL },
  deps = {
    document,
    query: gE,
    createElement: cE,
    readOption: () => runOptionAutomation({ type: OptionEvent.READ }) || {},
    runPauseToggle: (toggleDeps) =>
      runBattlePauseAutomation({ type: BattlePauseEvent.TOGGLE }, toggleDeps),
    resume: runBattleTurnAutomation,
  }
) {
  if (event.type === EVENT_INSTALL) return installControls(deps);
  return false;
}
