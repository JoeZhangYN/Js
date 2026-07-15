import { CURRENT_WORLD_POLICY } from "../core/current-runtime.js";
import { createHvutStorageMaintenanceSources } from "./storage-maintenance-hvut-sources.js";
import { createStorageMaintenanceLegacyAdapter } from "./storage-maintenance-legacy-adapter.js";
import { createNativeStorageMaintenanceSources } from "./storage-maintenance-native-sources.js";
import { createStorageMaintenanceReceiptAdapter } from "./storage-maintenance-receipt-indexeddb.js";

export function createCurrentStorageMaintenanceAuthority(deps = {}) {
  const policy = deps.worldPolicy || CURRENT_WORLD_POLICY;
  const legacy = deps.legacy || createStorageMaintenanceLegacyAdapter(deps);
  const receipts =
    deps.receipts ||
    createStorageMaintenanceReceiptAdapter({
      indexedDb: deps.indexedDb || globalThis.indexedDB,
      dbName: policy.storageMaintenance.dbName,
    });
  const sources = Object.freeze([
    ...createNativeStorageMaintenanceSources(policy, legacy, deps),
    ...createHvutStorageMaintenanceSources(policy, legacy, deps),
  ]);
  return Object.freeze({ policy, receipts, sources });
}
