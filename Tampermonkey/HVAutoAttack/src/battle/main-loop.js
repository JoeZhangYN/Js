// 战斗回合决策编排。
// runBattleTurnAutomation() 只负责当前回合顶层骨架；前置副作用和行动规则顺序各自收敛在
// runBattleTurnPrelude() / runBattleActionDecision()，避免本入口拆解运行时事实或 action runner 协议。
// file-size-gate: exempt phase-5b-mainloop
import { prepareBattleTurnContext } from "./turn-context.js";
import { BattlePauseEvent, runBattlePauseAutomation } from "./pause-automation.js";
import { BattleActionDecisionEvent, runBattleActionDecision } from "./battle-action-decision.js";
import { BattleTurnPreludeEvent, runBattleTurnPrelude } from "./battle-turn-prelude.js";

export function runBattleTurnAutomation() {
  if (runBattlePauseAutomation({ type: BattlePauseEvent.RENDER_IF_PAUSED })) return;

  const prelude = runBattleTurnPrelude({ type: BattleTurnPreludeEvent.PREPARE_CURRENT_TURN });
  runBattleActionDecision({
    type: BattleActionDecisionEvent.DECIDE,
    context: prepareBattleTurnContext({ logTelemetry: prelude?.battleLogTelemetry }),
  });
}
