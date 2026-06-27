// 战斗页自动化编排入口：composition root 只调用本入口。
import { gE, cE } from "../dom/query.js";
import { g } from "../state/store.js";
import { time } from "../core/time.js";
import { reloader } from "./reloader.js";
import { BattleRoundStartEvent, runBattleRoundStartAutomation } from "./new-round.js";
import { runBattleTurnAutomation } from "./main-loop.js";
import { BattlePauseEvent, runBattlePauseAutomation } from "./pause-automation.js";
import {
  MonsterKnowledgeEvent,
  runMonsterKnowledgeAutomation,
} from "./monster-knowledge-automation.js";
import {
  BattleMonitorEvent,
  runBattleMonitorAutomation,
} from "../monitor/battle-monitor-automation.js";

function setupPauseControls() {
  const box2 = gE("#battle_main").appendChild(cE("div"));
  box2.id = "hvAABox2";
  if (g("option").pauseButton) {
    const button = box2.appendChild(cE("button"));
    button.innerHTML = "<l0>暂停</l0><l1>暫停</l1><l2>Pause</l2>";
    button.className = "pauseChange";
    button.onclick = function () {
      runBattlePauseAutomation({ type: BattlePauseEvent.TOGGLE }, { resume: runBattleTurnAutomation });
    };
  }
  if (g("option").pauseHotkey) {
    document.addEventListener(
      "keydown",
      (e) => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
          return;
        }
        if (e.key === g("option").pauseHotkeyKey) {
          runBattlePauseAutomation({ type: BattlePauseEvent.TOGGLE }, { resume: runBattleTurnAutomation });
        }
      },
      false
    );
  }
}

function initBattleRuntime() {
  g("attackStatus", g("option").attackStatus);
  g("timeNow", time(0));
  g("runSpeed", 1);
}

function setupMonsterKnowledge() {
  runMonsterKnowledgeAutomation({ type: MonsterKnowledgeEvent.BATTLE_STARTED });
}

function setupBattleMonitor() {
  runBattleMonitorAutomation({ type: BattleMonitorEvent.BATTLE_STARTED });
}

export function runBattleAutomation() {
  setupPauseControls();
  reloader();
  initBattleRuntime();
  runBattleRoundStartAutomation({ type: BattleRoundStartEvent.ROUND_STARTED });
  setupMonsterKnowledge();
  setupBattleMonitor();
  runBattleTurnAutomation();
}
