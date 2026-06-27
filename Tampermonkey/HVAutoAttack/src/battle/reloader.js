// 战斗动作事件桥：eventStart / eventEnd 虚拟节点 + 回合切换 + post 拉新数据。
// 页面 API 桥脚本安装已收口到 battle-api-bridge。
// file-size-gate: exempt phase-4-monolith
import { gE, cE } from "../dom/query.js";
import {
  BattleMonitorEvent,
  runBattleMonitorAutomation,
} from "../monitor/battle-monitor-automation.js";
import { BattleActionDelayEvent, runBattleActionDelayAutomation } from "./battle-action-delay.js";
import { BattleActionEndEvent, runBattleActionEndAutomation } from "./battle-action-end.js";
import { BattleApiBridgeEvent, runBattleApiBridgeAutomation } from "./battle-api-bridge.js";

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
    runBattleActionEndAutomation({ type: BattleActionEndEvent.ACTION_ENDED });
  };
  gE("body").appendChild(eventEnd);
  runBattleApiBridgeAutomation({ type: BattleApiBridgeEvent.INSTALL });
}
