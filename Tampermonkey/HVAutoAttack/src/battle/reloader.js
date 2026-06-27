// 战斗动作事件桥：eventStart / eventEnd 虚拟节点 + 回合切换 + post 拉新数据。
// 页面 API 桥脚本安装已收口到 battle-api-bridge。
// file-size-gate: exempt phase-4-monolith
import { gE, cE } from "../dom/query.js";
import { BattleActionEndEvent, runBattleActionEndAutomation } from "./battle-action-end.js";
import { BattleActionStartEvent, runBattleActionStartAutomation } from "./battle-action-start.js";
import { BattleApiBridgeEvent, runBattleApiBridgeAutomation } from "./battle-api-bridge.js";

export function installBattleActionEventBridge() {
  const eventStart = cE("a");
  eventStart.id = "eventStart";
  eventStart.onclick = function () {
    runBattleActionStartAutomation({ type: BattleActionStartEvent.ACTION_STARTED });
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
