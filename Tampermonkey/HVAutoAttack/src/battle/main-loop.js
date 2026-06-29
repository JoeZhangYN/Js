// 战斗回合决策编排。
// Phase 5b 编排倒置：runBattleTurnAutomation() 只依赖 BATTLE_RULES + runRules 两个抽象，16 个 step 的具体实现
// 全在 battle/rules/（组合根）。拆桥 gate scripts/check-mainloop-imports.mjs 禁止本文件回退
// import step 实现，强制新增/调整 step 走 battle/rules/index.js。
// 保留的 import 仅 pre-step 必执行项（monitor/bug guard/monster status）+ 基础设施。
// file-size-gate: exempt phase-5b-mainloop
import { OptionEvent, runOptionAutomation } from "../state/option.js";
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
import { runRules } from "./step-runner.js";
import { BATTLE_RULES } from "./rules/index.js";
import { prepareBattleTurnContext } from "./turn-context.js";
import { BattlePauseEvent, runBattlePauseAutomation } from "./pause-automation.js";

export function runBattleTurnAutomation() {
  if (runBattlePauseAutomation({ type: BattlePauseEvent.RENDER_IF_PAUSED })) return;

  runMonsterStatusAutomation({ type: MonsterStatusEvent.ENSURE_READY });
  runBattleTurnRuntime({ type: BattleTurnEvent.TURN_STARTED });
  runBattleMonitorAutomation({ type: BattleMonitorEvent.HUD_REFRESH });
  killBug();
  runMonsterStatusAutomation({ type: MonsterStatusEvent.UPDATE_HP });

  const snap = prepareBattleTurnContext();

  // 编排倒置：遍历 BATTLE_RULES（when 门控 → PURE decide → dispatch），某 rule act 即停止后续。
  // 替代原 runSteps([...18 内联闭包...]) —— 行动决策链现声明在 battle/rules/index.js。
  runRules(BATTLE_RULES, snap, runOptionAutomation({ type: OptionEvent.READ_BATTLE_RULE_OPTIONS }));
}
