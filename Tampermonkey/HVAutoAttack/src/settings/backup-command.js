import { OptionBackupEvent, runOptionBackupAutomation } from "../state/option-backup.js";

const EVENT_RENDER_LIST_ITEMS = "renderListItems";
const EVENT_HAS_CODE = "hasCode";
const EVENT_SAVE_CURRENT = "saveCurrent";
const EVENT_DELETE = "delete";
const EVENT_RESTORE = "restore";

const BACKUP_FAILURE_MESSAGE = Object.freeze({
  l0: "配置备份失败",
  l1: "配置備份失敗",
  l2: "Failed to backup configuration",
});
const DELETE_FAILURE_MESSAGE = Object.freeze({
  l0: "配置备份删除失败",
  l1: "配置備份刪除失敗",
  l2: "Failed to delete backup",
});
const RESTORE_FAILURE_MESSAGE = Object.freeze({
  l0: "配置还原失败",
  l1: "配置還原失敗",
  l2: "Failed to restore backup",
});

export const SettingsBackupCommandEvent = Object.freeze({
  RENDER_LIST_ITEMS: EVENT_RENDER_LIST_ITEMS,
  HAS_CODE: EVENT_HAS_CODE,
  SAVE_CURRENT: EVENT_SAVE_CURRENT,
  DELETE: EVENT_DELETE,
  RESTORE: EVENT_RESTORE,
});

function result(ok, event, message) {
  return {
    ok,
    type: event.type,
    code: event.code,
    ...(message ? { message } : {}),
  };
}

const settingsBackupCommandHandlers = Object.freeze({
  [EVENT_RENDER_LIST_ITEMS]: () =>
    runOptionBackupAutomation({ type: OptionBackupEvent.RENDER_LIST_ITEMS }),
  [EVENT_HAS_CODE]: (event) =>
    runOptionBackupAutomation({ type: OptionBackupEvent.HAS_CODE, code: event.code }),
  [EVENT_SAVE_CURRENT]: (event) =>
    result(
      Boolean(
        runOptionBackupAutomation({ type: OptionBackupEvent.SAVE_CURRENT, code: event.code })
      ),
      event,
      BACKUP_FAILURE_MESSAGE
    ),
  [EVENT_DELETE]: (event) =>
    result(
      Boolean(runOptionBackupAutomation({ type: OptionBackupEvent.DELETE, code: event.code })),
      event,
      DELETE_FAILURE_MESSAGE
    ),
  [EVENT_RESTORE]: (event) =>
    result(
      Boolean(runOptionBackupAutomation({ type: OptionBackupEvent.RESTORE, code: event.code })),
      event,
      RESTORE_FAILURE_MESSAGE
    ),
});

export function runSettingsBackupCommand(event = { type: EVENT_RENDER_LIST_ITEMS }) {
  return settingsBackupCommandHandlers[event?.type]?.(event);
}
