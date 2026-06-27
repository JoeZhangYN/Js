import { getValue, setValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { readOption, writeOption } from "./option.js";

export function readOptionBackups() {
  return getValue(STORAGE_KEYS.BACKUP, true) || {};
}

export function saveCurrentOptionBackup(code) {
  if (!code) return readOptionBackups();
  const backups = readOptionBackups();
  backups[code] = readOption();
  setValue(STORAGE_KEYS.BACKUP, backups);
  return backups;
}

export function restoreOptionBackup(code) {
  const backups = readOptionBackups();
  if (!code || !(code in backups)) return false;
  writeOption(backups[code]);
  return true;
}

export function deleteOptionBackup(code) {
  const backups = readOptionBackups();
  if (!code || !(code in backups)) return false;
  delete backups[code];
  setValue(STORAGE_KEYS.BACKUP, backups);
  return true;
}
