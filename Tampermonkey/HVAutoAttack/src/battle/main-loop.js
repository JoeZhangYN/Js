// 战斗回合决策编排。
// runBattleTurnAutomation() 只负责回合前置事件和上下文准备；行动规则顺序收敛在
// runBattleActionDecision()，避免本入口拆解行动决策上下文或重新拼装 runner 协议。
// 保留的 import 仅 pre-step 必执行项（monitor/bug guard/monster status）+ 基础设施。
// file-size-gate: exempt phase-5b-mainloop
import {
  BattleTurnEvent,
  runBattleTurnAutomation as runBattleTurnRuntime,
} from "../state/battle-turn.js";
import {
  BattleMonitorEvent,
  runBattleMonitorAutomation,
} from "../monitor/battle-monitor-automation.js";
import { killBug } from "./kill-bug.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";
import { prepareBattleTurnContext } from "./turn-context.js";
import { BattlePauseEvent, runBattlePauseAutomation } from "./pause-automation.js";
import { runBattleActionDecision } from "./battle-action-decision.js";

export function runBattleTurnAutomation() {
  if (runBattlePauseAutomation({ type: BattlePauseEvent.RENDER_IF_PAUSED })) return;

  runMonsterStatusAutomation({ type: MonsterStatusEvent.ENSURE_READY });
  runBattleTurnRuntime({ type: BattleTurnEvent.TURN_STARTED });
  runBattleMonitorAutomation({ type: BattleMonitorEvent.HUD_REFRESH });
  killBug();
  runMonsterStatusAutomation({ type: MonsterStatusEvent.UPDATE_HP });

  runBattleActionDecision(prepareBattleTurnContext());
}
