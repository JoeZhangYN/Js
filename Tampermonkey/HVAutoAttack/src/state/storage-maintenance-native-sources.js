import { createBattleStorageMaintenanceSources } from "./storage-maintenance-battle-sources.js";
import { createRecordStorageMaintenanceSources } from "./storage-maintenance-record-sources.js";

export function createNativeStorageMaintenanceSources(policy, legacy, deps = {}) {
  return Object.freeze([
    ...createBattleStorageMaintenanceSources(policy, legacy, deps),
    ...createRecordStorageMaintenanceSources(policy, legacy, deps),
  ]);
}
