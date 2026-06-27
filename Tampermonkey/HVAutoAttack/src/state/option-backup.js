import { getValue, setValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { OptionEvent, runOptionAutomation } from "./option.js";

const EVENT_READ = "read";
const EVENT_SAVE_CURRENT = "saveCurrent";
const EVENT_RESTORE = "restore";
const EVENT_DELETE = "delete";
const EVENT_HAS_CODE = "hasCode";
const EVENT_RENDER_LIST_ITEMS = "renderListItems";

export const OptionBackupEvent = Object.freeze({
  READ: EVENT_READ,
  SAVE_CURRENT: EVENT_SAVE_CURRENT,
  RESTORE: EVENT_RESTORE,
  DELETE: EVENT_DELETE,
  HAS_CODE: EVENT_HAS_CODE,
  RENDER_LIST_ITEMS: EVENT_RENDER_LIST_ITEMS,
});

function readOptionBackups() {
  return getValue(STORAGE_KEYS.BACKUP, true) || {};
}

function saveCurrentOptionBackup(code) {
  if (!code) return readOptionBackups();
  const backups = readOptionBackups();
  backups[code] = runOptionAutomation({ type: OptionEvent.READ });
  setValue(STORAGE_KEYS.BACKUP, backups);
  return backups;
}

function restoreOptionBackup(code) {
  const backups = readOptionBackups();
  if (!code || !(code in backups)) return false;
  runOptionAutomation({ type: OptionEvent.WRITE, option: backups[code] });
  return true;
}

function deleteOptionBackup(code) {
  const backups = readOptionBackups();
  if (!code || !(code in backups)) return false;
  delete backups[code];
  setValue(STORAGE_KEYS.BACKUP, backups);
  return true;
}

function hasOptionBackupCode(code) {
  return Boolean(code && code in readOptionBackups());
}

function renderOptionBackupListItems() {
  return Object.keys(readOptionBackups())
    .map((code) => `<li>${code}</li>`)
    .join("");
}

export function runOptionBackupAutomation(event = { type: EVENT_READ }) {
  if (event.type === EVENT_READ) return readOptionBackups();
  if (event.type === EVENT_SAVE_CURRENT) return saveCurrentOptionBackup(event.code);
  if (event.type === EVENT_RESTORE) return restoreOptionBackup(event.code);
  if (event.type === EVENT_DELETE) return deleteOptionBackup(event.code);
  if (event.type === EVENT_HAS_CODE) return hasOptionBackupCode(event.code);
  if (event.type === EVENT_RENDER_LIST_ITEMS) return renderOptionBackupListItems();
  return undefined;
}
