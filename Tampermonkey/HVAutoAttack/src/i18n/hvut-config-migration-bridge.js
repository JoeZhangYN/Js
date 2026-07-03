import {
  getHvutConfigCarryKeys,
  getHvutConfigNamespace,
  normalizeHvutConfigSettings,
} from "./hvut-config-migration.js";

window.HVAA_hvutConfigMigration = Object.freeze({
  carryKeys: getHvutConfigCarryKeys,
  namespace: getHvutConfigNamespace,
  normalizeSettings: normalizeHvutConfigSettings,
});
