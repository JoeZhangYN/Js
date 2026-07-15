import {
  buildLegacyHvutEquipData,
  migrateLegacyHvutMonsterLabLog,
} from "../i18n/hvut-config-migration.js";
import { hvutStorageBridge } from "../i18n/hvut-storage-bridge.js";
import { storageMaintenanceValueHash } from "./storage-maintenance-value.js";

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function verifiedHvutSource(policy, legacy, family, keys, readSource, normalize, deps) {
  const sourceId = `hvutDerived:${family}`;
  const bridge = deps.hvutBridge || hvutStorageBridge;
  return Object.freeze({
    sourceId,
    targetIdentity: `${policy.hvutDerived.dbName}:${family}`,
    readSource,
    normalize,
    writeTarget: async (value) => {
      const current = bridge.derivedGet(family, undefined);
      if (
        current !== undefined &&
        storageMaintenanceValueHash(current) !== storageMaintenanceValueHash(value)
      ) {
        const error = new Error(`HVUT derived target contains newer data: ${family}`);
        error.recovery = "retainLegacyAndReviewConflict";
        throw error;
      }
      if (current !== undefined) return;
      if (!(await bridge.derivedSet(family, value))) {
        throw new Error(`HVUT derived target write failed: ${family}`);
      }
    },
    readTarget: () => bridge.derivedGet(family),
    verifyTargetHash: (expected, target) => storageMaintenanceValueHash(target) === expected,
    removeSource: () => legacy.removeKeys(keys),
  });
}

export function createHvutStorageMaintenanceSources(policy, legacy, deps = {}) {
  const prefix = `${policy.hvut.namespace}_`;
  const key = (name) => `${prefix}${name}`;
  const equipKeys = [key("equipdata"), key("in_equipdata"), key("in_json")];
  const equip = verifiedHvutSource(
    policy,
    legacy,
    "equipdata",
    equipKeys,
    async () => {
      const canonical = await legacy.readKey(equipKeys[0]);
      if (canonical !== null && canonical !== undefined) return canonical;
      const first = await legacy.readKey(equipKeys[1]);
      const second = await legacy.readKey(equipKeys[2]);
      return buildLegacyHvutEquipData(first, second);
    },
    (value) => value,
    deps
  );
  const families = ["ml_log", "ss_log", "ab_level", "tr_level"].map((family) => {
    const keys = [key(family)];
    return verifiedHvutSource(
      policy,
      legacy,
      family,
      keys,
      () => legacy.readFirst(keys),
      (value) => {
        if (family === "ml_log") return migrateLegacyHvutMonsterLabLog(value) || value;
        if (family !== "ss_log" || policy.hvut.namespace !== "hvut") return value;
        const normalized = clone(value);
        for (const list of Object.values(normalized || {})) delete list?.["1x"];
        return normalized;
      },
      deps
    );
  });
  return Object.freeze([equip, ...families]);
}
