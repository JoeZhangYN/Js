// 单回合决策上下文入口：CD 记账、snapshot 收集、vitals 镜像和 debug invariant 统一在这里。
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { g } from "../state/store.js";
import { CdRuntimeEvent, runCdRuntimeAutomation } from "../state/cd-tracker.js";
import { collectSnapshot } from "./snapshot.js";
import { BattleProgressEvent, runBattleProgressAutomation } from "./battle-progress.js";
import {
  BattleSpiritToggleEvent,
  runBattleSpiritToggleAutomation,
} from "./battle-spirit-toggle.js";

function mirrorVitalsToRuntime(snap) {
  g("hp", snap.hp);
  g("mp", snap.mp);
  g("sp", snap.sp);
  g("oc", snap.oc);
}

function attachDecisionRuntime(snap) {
  const progress = runBattleProgressAutomation({ type: BattleProgressEvent.READ_CONTEXT });
  return Object.assign(snap, {
    monsterAlive: progress.monsterAlive,
    roundAll: progress.roundAll,
    roundNow: progress.roundNow,
    roundType: progress.roundType,
    lastSpiritToggleGlobalTurn: runBattleSpiritToggleAutomation({
      type: BattleSpiritToggleEvent.READ_LAST_TOGGLE,
    }),
  });
}

function assertNoDomRefs(snap) {
  const stack = [{ path: "snap", val: snap }];
  while (stack.length) {
    const { path, val } = stack.pop();
    if (val instanceof Element || val instanceof Node) {
      throw new Error(`[snapshot] BUG: ${path} 含 DOM 引用，违反铁律 A`);
    }
    if (val && typeof val === "object") {
      for (const k of Object.keys(val)) stack.push({ path: `${path}.${k}`, val: val[k] });
    }
  }
}

export function prepareBattleTurnContext() {
  runCdRuntimeAutomation({ type: CdRuntimeEvent.INCREMENT_TURN });
  runCdRuntimeAutomation({ type: CdRuntimeEvent.PERSIST });
  const battleRuleOptions = runOptionAutomation({ type: OptionEvent.READ_BATTLE_RULE_OPTIONS });
  const snap = collectSnapshot({
    learnIncomingBurst: !!battleRuleOptions?.burstControlSwitch,
  });
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
  return { snap, battleRuleOptions };
}
