// 单回合决策上下文入口：CD 记账、snapshot 收集、vitals 镜像和 debug invariant 统一在这里。
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { g } from "../state/store.js";
import { CdRuntimeEvent, runCdRuntimeAutomation } from "../state/cd-tracker.js";
import { collectSnapshot, assertNoDomRefs } from "./snapshot.js";

function mirrorVitalsToRuntime(snap) {
  g("hp", snap.hp);
  g("mp", snap.mp);
  g("sp", snap.sp);
  g("oc", snap.oc);
}

export function prepareBattleTurnContext() {
  runCdRuntimeAutomation({ type: CdRuntimeEvent.INCREMENT_TURN });
  runCdRuntimeAutomation({ type: CdRuntimeEvent.PERSIST });
  const snap = collectSnapshot();
  mirrorVitalsToRuntime(snap);
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
