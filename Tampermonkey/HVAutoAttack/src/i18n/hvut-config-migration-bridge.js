import { getHvutConfigCarryKeys } from "./hvut-config-migration.js";

window.HVAA_hvutConfigMigration = Object.freeze({
  carryKeys: getHvutConfigCarryKeys,
});
