// 战斗动作事件桥：eventStart / eventEnd 虚拟节点 + 回合切换 + post 拉新数据。
// 页面 API 桥脚本安装已收口到 battle-api-bridge。
// file-size-gate: exempt phase-4-monolith
import { gE, cE } from "../dom/query.js";
import { g } from "../state/store.js";
import { post } from "../dom/http.js";
import {
  BattleMonitorEvent,
  runBattleMonitorAutomation,
} from "../monitor/battle-monitor-automation.js";
import { RiddleEvent, runRiddleAutomation } from "../pages/riddle-automation.js";
import {
  BattleCompletionEvent,
  BattleCompletionOutcome,
  runBattleCompletionAutomation,
} from "./battle-completion.js";
import { BattleActionDelayEvent, runBattleActionDelayAutomation } from "./battle-action-delay.js";
import { BattleApiBridgeEvent, runBattleApiBridgeAutomation } from "./battle-api-bridge.js";
import { BattleActionSpeedEvent, runBattleActionSpeedAutomation } from "./battle-action-speed.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";
import { BattleRoundStartEvent, runBattleRoundStartAutomation } from "./new-round.js";
import { runBattleTurnAutomation } from "./main-loop.js";

export function installBattleActionEventBridge() {
  const eventStart = cE("a");
  eventStart.id = "eventStart";
  eventStart.onclick = function () {
    runBattleActionDelayAutomation({ type: BattleActionDelayEvent.ACTION_STARTED });
    runBattleMonitorAutomation({ type: BattleMonitorEvent.ACTION_STARTED });
  };
  gE("body").appendChild(eventStart);
  const eventEnd = cE("a");
  eventEnd.id = "eventEnd";
  eventEnd.onclick = function () {
    runBattleActionSpeedAutomation({ type: BattleActionSpeedEvent.ACTION_ENDED });
    runBattleActionDelayAutomation({ type: BattleActionDelayEvent.ACTION_ENDED });
    runMonsterStatusAutomation({ type: MonsterStatusEvent.REFRESH_COMBATANT_COUNTS });
    runBattleMonitorAutomation({ type: BattleMonitorEvent.ACTION_ENDED });
    if (gE("#btcp")) {
      runBattleMonitorAutomation({
        type: BattleMonitorEvent.COMPLETION_REACHED,
      });
      const completion = runBattleCompletionAutomation({
        type: BattleCompletionEvent.COMPLETION_REACHED,
      });
      if (completion.outcome === BattleCompletionOutcome.NEXT_ROUND) {
        // Next Round
        gE("#pane_completion").removeChild(gE("#btcp"));
        post(window.location.href, (data) => {
          if (
            runRiddleAutomation({
              type: RiddleEvent.BATTLE_POST_RESULT,
              data,
            })
          )
            return;
          gE("#battle_main").replaceChild(gE("#battle_right", data), gE("#battle_right"));
          gE("#battle_main").replaceChild(gE("#battle_left", data), gE("#battle_left"));
          unsafeWindow.battle = new unsafeWindow.Battle();
          unsafeWindow.battle.clear_infopane();
          runBattleRoundStartAutomation({ type: BattleRoundStartEvent.ROUND_STARTED });
          runBattleTurnAutomation();
        });
      }
    } else {
      runBattleTurnAutomation();
    }
  };
  gE("body").appendChild(eventEnd);
  runBattleApiBridgeAutomation({ type: BattleApiBridgeEvent.INSTALL });
}
