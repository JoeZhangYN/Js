import { getValue, setValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { readOption, writeOption } from "./option.js";

const EVENT_READ = "read";
const EVENT_SAVE_CURRENT = "saveCurrent";
const EVENT_RESTORE = "restore";
const EVENT_DELETE = "delete";

export const OptionBackupEvent = Object.freeze({
  READ: EVENT_READ,
  SAVE_CURRENT: EVENT_SAVE_CURRENT,
  RESTORE: EVENT_RESTORE,
  DELETE: EVENT_DELETE,
});

function readOptionBackups() {
  return getValue(STORAGE_KEYS.BACKUP, true) || {};
}

function saveCurrentOptionBackup(code) {
  if (!code) return readOptionBackups();
  const backups = readOptionBackups();
  backups[code] = readOption();
  setValue(STORAGE_KEYS.BACKUP, backups);
  return backups;
}

function restoreOptionBackup(code) {
  const backups = readOptionBackups();
  if (!code || !(code in backups)) return false;
  writeOption(backups[code]);
  return true;
}

function deleteOptionBackup(code) {
  const backups = readOptionBackups();
  if (!code || !(code in backups)) return false;
  delete backups[code];
  setValue(STORAGE_KEYS.BACKUP, backups);
  return true;
}

export function runOptionBackupAutomation(event = { type: EVENT_READ }) {
  if (event.type === EVENT_READ) return readOptionBackups();
  if (event.type === EVENT_SAVE_CURRENT) return saveCurrentOptionBackup(event.code);
  if (event.type === EVENT_RESTORE) return restoreOptionBackup(event.code);
  if (event.type === EVENT_DELETE) return deleteOptionBackup(event.code);
  return undefined;
}
