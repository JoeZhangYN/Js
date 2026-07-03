import {
  getHvutConfigCarryKeys,
  getHvutConfigNamespace,
  migrateLegacyHvutMonsterLabLog,
  normalizeLegacyHvutPrices,
  normalizeHvutConfigSettings,
} from "./hvut-config-migration.js";

window.HVAA_hvutConfigMigration = Object.freeze({
  carryKeys: getHvutConfigCarryKeys,
  migrateMonsterLabLog: migrateLegacyHvutMonsterLabLog,
  namespace: getHvutConfigNamespace,
  normalizePrices: normalizeLegacyHvutPrices,
  normalizeSettings: normalizeHvutConfigSettings,
});
