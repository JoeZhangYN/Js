const COMMON_CARRY_KEYS = Object.freeze(["equipset", "ch_style", "se_settings", "ss_log", "ml_log"]);
const PERSISTENT_CARRY_KEYS = Object.freeze(["equipnames", ...COMMON_CARRY_KEYS]);

function cloneConfigValue(value) {
  return JSON.parse(JSON.stringify(value));
}

export function getHvutConfigNamespace(segment) {
  return segment?.isIsekai ? "hvuti" : "hvut";
}

export function getHvutConfigCarryKeys(segment) {
  return segment?.isIsekai ? [...COMMON_CARRY_KEYS] : [...PERSISTENT_CARRY_KEYS];
}

export function migrateLegacyHvutMonsterLabLog(mlLog) {
  if (!mlLog || mlLog[0]) return null;
  const migrated = cloneConfigValue(mlLog);
  migrated[0] = { version: 1 };
  migrated.forEach((log, index) => {
    if (!log || index === 0) return;
    log.pa = log.pa.map((entry) => [entry.value, entry.to]);
    log.er = log.er.map((entry) => [entry.value, entry.to]);
    log.ct = log.ct.map((entry) => [entry.value, entry.to, entry.max]);
    log.gifts = log.gift;
    log.gifts.push(...log.gifts.splice(28, 6, ...log.gifts.splice(40, 5)));
    delete log.gift;
    delete log.selected;
  });
  return migrated;
}

export function normalizeHvutConfigSettings(settings, defaults) {
  const normalized = { ...(settings || {}) };
  const defaultSettings = defaults || {};
  const equipCode = normalized.equipCode;
  if (typeof equipCode === "string") {
    normalized.equipCode = cloneConfigValue(defaultSettings.equipCode);
    normalized.equipCode.EQUIP = equipCode;
  }
  for (const key of Object.keys(normalized)) {
    if (!(key in defaultSettings)) {
      delete normalized[key];
    }
  }
  for (const [key, value] of Object.entries(defaultSettings)) {
    if (!(key in normalized)) {
      normalized[key] = cloneConfigValue(value);
    }
  }
  return normalized;
}
