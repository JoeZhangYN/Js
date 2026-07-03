import { getHvutConfigCarryKeys, getHvutConfigNamespace } from "./hvut-config-migration.js";

window.HVAA_hvutConfigMigration = Object.freeze({
  carryKeys: getHvutConfigCarryKeys,
  namespace: getHvutConfigNamespace,
});
