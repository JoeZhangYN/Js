import { OptionEvent, runOptionAutomation } from "../state/option.js";

const EVENT_EXPORT_TEXT = "exportText";
const EVENT_PARSE_IMPORT_TEXT = "parseImportText";
const EVENT_WRITE_OPTION = "writeOption";
const EVENT_CLEAR_OPTION = "clearOption";

const IMPORT_FORMAT_MESSAGE = Object.freeze({
  l0: "配置格式错误",
  l1: "配置格式錯誤",
  l2: "Invalid configuration format",
});
const SAVE_FAILURE_MESSAGE = Object.freeze({
  l0: "配置保存失败",
  l1: "配置保存失敗",
  l2: "Failed to save configuration",
});
const RESET_FAILURE_MESSAGE = Object.freeze({
  l0: "配置重置失败",
  l1: "配置重置失敗",
  l2: "Failed to reset configuration",
});

export const SettingsOptionCommandEvent = Object.freeze({
  EXPORT_TEXT: EVENT_EXPORT_TEXT,
  PARSE_IMPORT_TEXT: EVENT_PARSE_IMPORT_TEXT,
  WRITE_OPTION: EVENT_WRITE_OPTION,
  CLEAR_OPTION: EVENT_CLEAR_OPTION,
});

function commandResult(ok, event, message, extra = {}) {
  return {
    ok,
    type: event.type,
    ...(message ? { message } : {}),
    ...extra,
  };
}

function parseImportText(event) {
  const parsed = runOptionAutomation({ type: OptionEvent.PARSE_IMPORT_TEXT, text: event.text });
  if (parsed?.ok) return commandResult(true, event, null, { option: parsed.option });
  return commandResult(false, event, IMPORT_FORMAT_MESSAGE);
}

const settingsOptionCommandHandlers = Object.freeze({
  [EVENT_EXPORT_TEXT]: () => runOptionAutomation({ type: OptionEvent.EXPORT_TEXT }),
  [EVENT_PARSE_IMPORT_TEXT]: parseImportText,
  [EVENT_WRITE_OPTION]: (event) =>
    commandResult(
      Boolean(runOptionAutomation({ type: OptionEvent.WRITE, option: event.option })),
      event,
      SAVE_FAILURE_MESSAGE,
      { reload: true }
    ),
  [EVENT_CLEAR_OPTION]: (event) =>
    commandResult(
      Boolean(runOptionAutomation({ type: OptionEvent.CLEAR })),
      event,
      RESET_FAILURE_MESSAGE
    ),
});

export function runSettingsOptionCommand(event = { type: EVENT_EXPORT_TEXT }) {
  return settingsOptionCommandHandlers[event?.type]?.(event);
}
