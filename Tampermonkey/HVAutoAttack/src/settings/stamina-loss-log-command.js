import { StaminaLossLogEvent, runStaminaLossLogAutomation } from "../state/stamina-loss-log.js";

const EVENT_CLEAR_CONFIRMATION_MESSAGE = "clearConfirmationMessage";
const EVENT_CLEAR = "clear";

export const SettingsStaminaLossLogCommandEvent = Object.freeze({
  CLEAR_CONFIRMATION_MESSAGE: EVENT_CLEAR_CONFIRMATION_MESSAGE,
  CLEAR: EVENT_CLEAR,
});

const settingsStaminaLossLogCommandHandlers = Object.freeze({
  [EVENT_CLEAR_CONFIRMATION_MESSAGE]: () =>
    runStaminaLossLogAutomation({ type: StaminaLossLogEvent.CLEAR_CONFIRMATION_MESSAGE }),
  [EVENT_CLEAR]: async () => ({
    ok: (await runStaminaLossLogAutomation({ type: StaminaLossLogEvent.CLEAR })) !== false,
    type: EVENT_CLEAR,
  }),
});

export function runSettingsStaminaLossLogCommand(
  event = { type: EVENT_CLEAR_CONFIRMATION_MESSAGE }
) {
  return settingsStaminaLossLogCommandHandlers[event?.type]?.(event);
}
