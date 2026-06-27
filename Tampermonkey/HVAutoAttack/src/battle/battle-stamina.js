// 战斗体力损失裁决：唯一入口 runBattleStaminaAutomation(event)。
import { _alert } from "../core/lang.js";
import { setAlarm } from "../alarm/alarm.js";
import { g } from "../state/store.js";
import { StaminaLossLogEvent, runStaminaLossLogAutomation } from "../state/stamina-loss-log.js";
import { BattlePauseEvent, runBattlePauseAutomation } from "./pause-automation.js";

const EVENT_ROUND_LOG_READY = "roundLogReady";

export const BattleStaminaEvent = Object.freeze({
  ROUND_LOG_READY: EVENT_ROUND_LOG_READY,
});

function parseLostStamina(text = "") {
  const match = text.match(/You lose (\d+) Stamina/);
  return match ? Number(match[1]) : 0;
}

function shouldPauseForLoss(lostStamina) {
  return lostStamina >= g("option").staminaLose;
}

function confirmContinue(confirm) {
  return confirm(
    1,
    "当前Stamina过低\n或Stamina损失过多\n是否继续？",
    "當前Stamina過低\n或Stamina損失過多\n是否繼續？",
    "Continue?\nYou either have too little Stamina or have lost too much"
  );
}

function handleRoundLogReady(text, deps) {
  const lostStamina = parseLostStamina(text);
  if (!lostStamina) return { lostStamina: 0, paused: false };

  runStaminaLossLogAutomation({ type: StaminaLossLogEvent.RECORD, amount: lostStamina });
  if (!shouldPauseForLoss(lostStamina)) return { lostStamina, paused: false };

  deps.setAlarm("Error");
  if (confirmContinue(deps.confirm)) return { lostStamina, paused: false };
  deps.pause();
  return { lostStamina, paused: true };
}

export function runBattleStaminaAutomation(
  event = { type: EVENT_ROUND_LOG_READY },
  deps = {
    setAlarm,
    confirm: _alert,
    pause: () => runBattlePauseAutomation({ type: BattlePauseEvent.PAUSE }),
  }
) {
  if (event.type === EVENT_ROUND_LOG_READY) return handleRoundLogReady(event.text, deps);
  return { lostStamina: 0, paused: false };
}
