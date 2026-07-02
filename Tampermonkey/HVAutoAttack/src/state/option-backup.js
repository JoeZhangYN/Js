import { getValue, setValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { OptionEvent, runOptionAutomation } from "./option.js";

const EVENT_READ = "read";
const EVENT_SAVE_CURRENT = "saveCurrent";
const EVENT_RESTORE = "restore";
const EVENT_DELETE = "delete";
const EVENT_HAS_CODE = "hasCode";
const EVENT_RENDER_LIST_ITEMS = "renderListItems";

export const OPTION_BACKUP_FAILURE_KEY = "HVAA:lastOptionBackupFailure";

export const OptionBackupEvent = Object.freeze({
  READ: EVENT_READ,
  SAVE_CURRENT: EVENT_SAVE_CURRENT,
  RESTORE: EVENT_RESTORE,
  DELETE: EVENT_DELETE,
  HAS_CODE: EVENT_HAS_CODE,
  RENDER_LIST_ITEMS: EVENT_RENDER_LIST_ITEMS,
});

function failureErrorText(error) {
  return error?.message || String(error);
}

function recordOptionBackupFailure(action, reason, detail = {}) {
  const evidence = {
    capability: "optionBackup",
    action,
    reason,
    ...detail,
  };
  try {
    globalThis.sessionStorage?.setItem(OPTION_BACKUP_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // Backup failure handling must not depend on diagnostic storage.
  }
  try {
    console.warn("[HVAA] option backup failed", evidence);
  } catch (_error) {
    // Console hooks are diagnostic only.
  }
  return evidence;
}

function normalizeOptionBackups(action, backups) {
  if (backups && typeof backups === "object" && !Array.isArray(backups)) return backups;
  recordOptionBackupFailure(action, "malformedBackupStore", {
    storeType: Array.isArray(backups) ? "array" : typeof backups,
  });
  return {};
}

function readOptionBackups() {
  return normalizeOptionBackups(EVENT_READ, getValue(STORAGE_KEYS.BACKUP, true) || {});
}

function persistOptionBackups(action, backups, code) {
  try {
    setValue(STORAGE_KEYS.BACKUP, backups);
    return true;
  } catch (error) {
    recordOptionBackupFailure(action, "writeFailed", {
      code,
      error: failureErrorText(error),
    });
    return false;
  }
}

function saveCurrentOptionBackup(code) {
  if (!code) return readOptionBackups();
  const backups = readOptionBackups();
  backups[code] = runOptionAutomation({ type: OptionEvent.READ });
  if (!persistOptionBackups(EVENT_SAVE_CURRENT, backups, code)) return false;
  return backups;
}

function restoreOptionBackup(code) {
  const backups = readOptionBackups();
  if (!code || !(code in backups)) return false;
  try {
    runOptionAutomation({ type: OptionEvent.WRITE, option: backups[code] });
    return true;
  } catch (error) {
    recordOptionBackupFailure(EVENT_RESTORE, "restoreFailed", {
      code,
      error: failureErrorText(error),
    });
    return false;
  }
}

function deleteOptionBackup(code) {
  const backups = readOptionBackups();
  if (!code || !(code in backups)) return false;
  delete backups[code];
  return persistOptionBackups(EVENT_DELETE, backups, code);
}

function hasOptionBackupCode(code) {
  return Boolean(code && code in readOptionBackups());
}

function renderOptionBackupListItems() {
  return Object.keys(readOptionBackups())
    .map((code) => `<li>${code}</li>`)
    .join("");
}

const optionBackupEventHandlers = Object.freeze({
  [EVENT_READ]: () => readOptionBackups(),
  [EVENT_SAVE_CURRENT]: (event) => saveCurrentOptionBackup(event.code),
  [EVENT_RESTORE]: (event) => restoreOptionBackup(event.code),
  [EVENT_DELETE]: (event) => deleteOptionBackup(event.code),
  [EVENT_HAS_CODE]: (event) => hasOptionBackupCode(event.code),
  [EVENT_RENDER_LIST_ITEMS]: () => renderOptionBackupListItems(),
});

export function runOptionBackupAutomation(event = { type: EVENT_READ }) {
  return optionBackupEventHandlers[event?.type]?.(event);
}
