// 兼容桥：暂停业务已收敛到 pause-automation。
import {
  BattlePauseEvent,
  runBattlePauseAutomation,
} from "./pause-automation.js";

/** @deprecated use runBattlePauseAutomation({ type: BattlePauseEvent.PAUSE }) */
export function pauseScript() {
  runBattlePauseAutomation({ type: BattlePauseEvent.PAUSE });
}
