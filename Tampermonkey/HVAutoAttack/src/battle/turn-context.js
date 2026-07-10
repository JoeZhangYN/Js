// 单回合决策上下文入口：CD 记账、snapshot 收集、vitals 镜像和 debug invariant 统一在这里。
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { CdRuntimeEvent, runCdRuntimeAutomation } from "../state/cd-tracker.js";
import { BattleSnapshotEvent, runBattleSnapshot } from "./snapshot.js";
import { BattleDecisionRuntimeEvent, runBattleDecisionRuntime } from "./battle-decision-runtime.js";
import { BattlePlayerVitalsEvent, runBattlePlayerVitals } from "./battle-player-vitals.js";
import {
  UtilityWeightLearningEvent,
  runUtilityWeightLearning,
} from "../state/utility-weight-learner.js";

const EVENT_PREPARE = "prepare";

export const BattleTurnContextEvent = Object.freeze({
  PREPARE: EVENT_PREPARE,
});

function attachDecisionRuntime(snap) {
  return Object.assign(
    snap,
    runBattleDecisionRuntime({ type: BattleDecisionRuntimeEvent.READ_CURRENT })
  );
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

function prepareBattleTurnContext(event = {}) {
  runCdRuntimeAutomation({ type: CdRuntimeEvent.INCREMENT_TURN });
  runCdRuntimeAutomation({ type: CdRuntimeEvent.PERSIST });
  const actionOptions = {
    ...runOptionAutomation({ type: OptionEvent.READ_BATTLE_ACTION_OPTIONS }),
    skillUtilityMultipliers: runUtilityWeightLearning({
      type: UtilityWeightLearningEvent.READ_MULTIPLIERS,
    }),
  };
  const snap = runBattleSnapshot({
    type: BattleSnapshotEvent.READ_CURRENT,
    learnIncomingBurst: !!actionOptions?.burstControlSwitch,
    logTelemetry: event.logTelemetry,
  });
  runBattlePlayerVitals({ type: BattlePlayerVitalsEvent.MIRROR_RUNTIME, vitals: snap });
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
  return { snap, actionOptions };
}

const battleTurnContextEventHandlers = Object.freeze({
  [EVENT_PREPARE]: prepareBattleTurnContext,
});

export function runBattleTurnContext(event = { type: EVENT_PREPARE }) {
  return battleTurnContextEventHandlers[event?.type]?.(event);
}
