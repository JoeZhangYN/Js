// 战斗体力损失裁决：唯一入口 runBattleStaminaAutomation(event)。
import { _alert } from "../core/lang.js";
import { AlarmEvent, runAlarmAutomation } from "../alarm/alarm.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { StaminaLossLogEvent, runStaminaLossLogAutomation } from "../state/stamina-loss-log.js";
import { BattlePauseEvent, runBattlePauseAutomation } from "./pause-automation.js";

const EVENT_ROUND_LOG_READY = "roundLogReady";
const STAMINA_LOSS_THRESHOLD_OPTION_KEY = "staminaLose";
const DEFAULT_STAMINA_LOSS_THRESHOLD = Number.POSITIVE_INFINITY;

export const BattleStaminaEvent = Object.freeze({
  ROUND_LOG_READY: EVENT_ROUND_LOG_READY,
});

const battleStaminaEventHandlers = Object.freeze({
  [EVENT_ROUND_LOG_READY]: (event, deps) => handleRoundLogReady(event.text, deps),
});

function parseLostStamina(text = "") {
  const match = text.match(/You lose (\d+) Stamina/);
  return match ? Number(match[1]) : 0;
}

function readStaminaLossThreshold() {
  const value = Number(
    runOptionAutomation({
      type: OptionEvent.READ_FIELD,
      key: STAMINA_LOSS_THRESHOLD_OPTION_KEY,
      fallback: DEFAULT_STAMINA_LOSS_THRESHOLD,
    })
  );
  return Number.isFinite(value) ? value : DEFAULT_STAMINA_LOSS_THRESHOLD;
}

function shouldPauseForLoss(lostStamina) {
  return lostStamina >= readStaminaLossThreshold();
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

  deps.triggerAlarm("Error");
  if (confirmContinue(deps.confirm)) return { lostStamina, paused: false };
  deps.pause({ lostStamina });
  return { lostStamina, paused: true };
}

export function runBattleStaminaAutomation(
  event = { type: EVENT_ROUND_LOG_READY },
  deps = {
    triggerAlarm: (kind) => runAlarmAutomation({ type: AlarmEvent.TRIGGER, kind }),
    confirm: _alert,
    pause: (detail) =>
      runBattlePauseAutomation({ type: BattlePauseEvent.PAUSE, reason: "staminaLoss", detail }),
  }
) {
  return battleStaminaEventHandlers[event?.type]?.(event, deps) ?? {
    lostStamina: 0,
    paused: false,
  };
}
