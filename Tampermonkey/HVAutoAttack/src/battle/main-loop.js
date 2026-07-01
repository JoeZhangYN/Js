// 战斗回合决策编排。
// runBattleTurnAutomation() 只负责当前回合顶层骨架；前置副作用和行动规则顺序各自收敛在
// runBattleTurnPrelude() / runBattleActionDecision()，避免本入口拆解运行时事实或 action runner 协议。
// file-size-gate: exempt phase-5b-mainloop
import { BattleTurnContextEvent, runBattleTurnContext } from "./turn-context.js";
import { BattlePauseEvent, runBattlePauseAutomation } from "./pause-automation.js";
import { BattleActionDecisionEvent, runBattleActionDecision } from "./battle-action-decision.js";
import { BattleTurnPreludeEvent, runBattleTurnPrelude } from "./battle-turn-prelude.js";
import {
  BattleTurnWorkflowEvidenceEvent,
  runBattleTurnWorkflowEvidence,
} from "./battle-turn-workflow-evidence.js";

const EVENT_RUN_CURRENT_TURN = "runCurrentTurn";

export const BattleTurnWorkflowEvent = Object.freeze({
  RUN_CURRENT_TURN: EVENT_RUN_CURRENT_TURN,
});

const battleTurnWorkflowEventHandlers = Object.freeze({
  [EVENT_RUN_CURRENT_TURN]: runCurrentBattleTurn,
});

function recordTurnWorkflowStage(stage, detail) {
  runBattleTurnWorkflowEvidence({
    type: BattleTurnWorkflowEvidenceEvent.RECORD_STAGE,
    stage,
    detail,
  });
}

function runCurrentBattleTurn() {
  recordTurnWorkflowStage("started");
  try {
    if (runBattlePauseAutomation({ type: BattlePauseEvent.RENDER_IF_PAUSED })) {
      recordTurnWorkflowStage("paused", { reason: "renderIfPaused" });
      return;
    }

    const prelude = runBattleTurnPrelude({ type: BattleTurnPreludeEvent.PREPARE_CURRENT_TURN });
    recordTurnWorkflowStage("preludePrepared", {
      hasBattleLogTelemetry: Boolean(prelude?.battleLogTelemetry),
    });
    const context = runBattleTurnContext({
      type: BattleTurnContextEvent.PREPARE,
      logTelemetry: prelude?.battleLogTelemetry,
    });
    recordTurnWorkflowStage("contextPrepared", {
      hasContext: Boolean(context),
      hasSnap: Boolean(context?.snap),
      hasActionOptions: Boolean(context?.actionOptions),
    });
    const acted = runBattleActionDecision({
      type: BattleActionDecisionEvent.DECIDE,
      context,
    });
    recordTurnWorkflowStage("decisionCompleted", { acted: Boolean(acted) });
  } catch (error) {
    recordTurnWorkflowStage("failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export function runBattleTurnAutomation(event = { type: EVENT_RUN_CURRENT_TURN }) {
  const handler = battleTurnWorkflowEventHandlers[event?.type];
  if (!handler) {
    recordTurnWorkflowStage("rejected", { eventType: event?.type ?? null });
    return false;
  }
  return handler(event);
}
