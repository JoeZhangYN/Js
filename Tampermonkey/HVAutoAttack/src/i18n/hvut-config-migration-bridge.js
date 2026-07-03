import {
  getHvutConfigCarryKeys,
  getHvutConfigNamespace,
  migrateLegacyHvutMonsterLabLog,
  normalizeHvutConfigSettings,
} from "./hvut-config-migration.js";

window.HVAA_hvutConfigMigration = Object.freeze({
  carryKeys: getHvutConfigCarryKeys,
  migrateMonsterLabLog: migrateLegacyHvutMonsterLabLog,
  namespace: getHvutConfigNamespace,
  normalizeSettings: normalizeHvutConfigSettings,
});
