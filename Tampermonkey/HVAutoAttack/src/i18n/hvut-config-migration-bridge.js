import {
  buildLegacyHvutEquipData,
  getHvutConfigCarryKeys,
  migrateLegacyHvutMonsterLabLog,
  normalizeLegacyHvutEquipCode,
  normalizeLegacyHvutPrices,
  normalizeHvutConfigSettings,
} from "./hvut-config-migration.js";

window.HVAA_hvutConfigMigration = Object.freeze({
  buildEquipData: buildLegacyHvutEquipData,
  carryKeys: getHvutConfigCarryKeys,
  migrateMonsterLabLog: migrateLegacyHvutMonsterLabLog,
  normalizeEquipCode: normalizeLegacyHvutEquipCode,
  normalizePrices: normalizeLegacyHvutPrices,
  normalizeSettings: normalizeHvutConfigSettings,
});
