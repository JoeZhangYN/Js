// 单回合决策上下文入口：CD 记账、snapshot 收集、vitals 镜像和 debug invariant 统一在这里。
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { g } from "../state/store.js";
import { CdRuntimeEvent, runCdRuntimeAutomation } from "../state/cd-tracker.js";
import { collectSnapshot, assertNoDomRefs } from "./snapshot.js";
import { BattleRoundEvent, runBattleRoundAutomation } from "./battle-round.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";

function mirrorVitalsToRuntime(snap) {
  g("hp", snap.hp);
  g("mp", snap.mp);
  g("sp", snap.sp);
  g("oc", snap.oc);
}

function attachDecisionRuntime(snap) {
  const round = runBattleRoundAutomation({ type: BattleRoundEvent.READ_RUNTIME });
  const combatants = runMonsterStatusAutomation({
    type: MonsterStatusEvent.READ_COMBATANT_COUNTS,
  });
  return Object.assign(snap, {
    monsterAlive: combatants.monsterAlive,
    roundAll: round.roundAll,
    roundNow: round.roundNow,
    roundType: runBattleRoundAutomation({ type: BattleRoundEvent.READ_TYPE }),
    lastSpiritToggleGlobalTurn: g("lastSpiritToggleGlobalTurn"),
  });
}

export function prepareBattleTurnContext() {
  runCdRuntimeAutomation({ type: CdRuntimeEvent.INCREMENT_TURN });
  runCdRuntimeAutomation({ type: CdRuntimeEvent.PERSIST });
  const snap = collectSnapshot();
  mirrorVitalsToRuntime(snap);
  attachDecisionRuntime(snap);
  if (
    runOptionAutomation({
      type: OptionEvent.READ_FIELD,
      key: "debugSnapshot",
      fallback: false,
    })
  ) {
    assertNoDomRefs(snap);
  }
  return snap;
}
