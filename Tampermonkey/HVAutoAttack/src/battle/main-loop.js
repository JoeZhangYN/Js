// 主循环 + 暂停切换。
// Phase 5b 编排倒置：main() 只依赖 BATTLE_RULES + runRules 两个抽象，16 个 step 的具体实现
// 全在 battle/rules/（组合根）。拆桥 gate scripts/check-mainloop-imports.mjs 禁止本文件回退
// import step 实现，强制新增/调整 step 走 battle/rules/index.js。
// 保留的 import 仅 pre-step 必执行项（monitor/bug guard/monster status）+ 基础设施（snapshot/cd-tracker）。
// file-size-gate: exempt phase-5b-mainloop
import { gE } from "../dom/query.js";
import { getValue, delValue } from "../state/storage.js";
import { g } from "../state/store.js";
import { _alert } from "../core/lang.js";
import {
  BattleMonitorEvent,
  runBattleMonitorAutomation,
} from "../monitor/battle-monitor-automation.js";
import { killBug } from "./kill-bug.js";
import {
  MonsterStatusEvent,
  runMonsterStatusAutomation,
} from "./monster-status-automation.js";
import { runRules } from "./step-runner.js";
import { BATTLE_RULES } from "./rules/index.js";
import { prepareBattleTurnContext } from "./turn-context.js";
import { pauseScript } from "./pause-control.js";

export function main() {
  if (getValue("disabled")) {
    document.title = _alert(
      -1,
      "hvAutoAttack暂停中",
      "hvAutoAttack暫停中",
      "hvAutoAttack Paused"
    );
    gE("#hvAABox2>button").innerHTML =
      "<l0>继续</l0><l1>繼續</l1><l2>Continue</l2>";
    return;
  }

  runMonsterStatusAutomation({ type: MonsterStatusEvent.ENSURE_READY });
  g("turn", g("turn") + 1);
  runBattleMonitorAutomation({ type: BattleMonitorEvent.HUD_REFRESH });
  killBug();
  runMonsterStatusAutomation({ type: MonsterStatusEvent.UPDATE_HP });

  const snap = prepareBattleTurnContext();

  // 编排倒置：遍历 BATTLE_RULES（when 门控 → PURE decide → dispatch），某 rule act 即停止后续。
  // 替代原 runSteps([...18 内联闭包...]) —— 行动决策链现声明在 battle/rules/index.js。
  runRules(BATTLE_RULES, snap, g("option"));
}

export function pauseChange() {
  if (getValue("disabled")) {
    if (gE(".pauseChange"))
      gE(".pauseChange").innerHTML =
        "<l0>暂停</l0><l1>暫停</l1><l2>Pause</l2>";
    delValue(0);
    main();
  } else {
    pauseScript();
  }
}
