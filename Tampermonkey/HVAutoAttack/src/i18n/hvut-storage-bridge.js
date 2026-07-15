import { CURRENT_WORLD_POLICY } from "../core/current-runtime.js";
import { createHvutConfigStoreCapability } from "../state/hvut-config-store.js";
import {
  createHvutDerivedStoreCapability,
  HvutDerivedStoreEvent,
} from "../state/hvut-derived-store.js";
import { StorageWriteOutcome } from "../state/storage-io-policy.js";

export const HVUT_DERIVED_FAMILIES = Object.freeze([
  "equipdata",
  "ml_log",
  "ss_log",
  "ab_level",
  "tr_level",
]);

export function createHvutStorageBridge(worldPolicy, deps = {}) {
  const sourceIdentity = worldPolicy.auditIdentity;
  const config =
    deps.config ||
    createHvutConfigStoreCapability(
      { namespace: worldPolicy.hvut.namespace, sourceIdentity },
      deps
    );
  const persistentConfig =
    worldPolicy.hvut.namespace === "hvut"
      ? config
      : deps.persistentConfig ||
        createHvutConfigStoreCapability(
          { namespace: "hvut", sourceIdentity: `${sourceIdentity}:persistentConfig` },
          deps
        );
  const derived =
    deps.derived ||
    createHvutDerivedStoreCapability(
      {
        dbName: worldPolicy.hvutDerived.dbName,
        sourceIdentity,
        families: HVUT_DERIVED_FAMILIES,
      },
      {
        indexedDb: deps.indexedDb,
        recordIo: deps.recordIo,
        legacyRead: (family) => config.read(family),
      }
    );
  const known = (family) => HVUT_DERIVED_FAMILIES.includes(family);
  const configFor = (scope) => (scope === "persistent" ? persistentConfig : config);
  return Object.freeze({
    hydrate: () => derived.run({ type: HvutDerivedStoreEvent.HYDRATE }),
    configGet: (key, fallback, scope) => configFor(scope).read(key, fallback),
    configSet: (key, value, scope) =>
      known(key) ? false : configFor(scope).write(key, value) !== StorageWriteOutcome.FAILED,
    configDelete: (key, scope) =>
      known(key) ? false : configFor(scope).remove(key) !== StorageWriteOutcome.FAILED,
    derivedGet: (family, fallback) =>
      known(family)
        ? (derived.run({ type: HvutDerivedStoreEvent.READ, family, fallback }) ?? fallback)
        : fallback,
    derivedSet: async (family, value) =>
      known(family) &&
      (await derived.run({ type: HvutDerivedStoreEvent.WRITE, family, value })).outcome !==
        StorageWriteOutcome.FAILED,
    derivedDelete: async (family, fallback) =>
      known(family) &&
      (await derived.run({ type: HvutDerivedStoreEvent.WRITE, family, value: fallback })).outcome !==
        StorageWriteOutcome.FAILED,
  });
}

export const hvutStorageBridge = createHvutStorageBridge(CURRENT_WORLD_POLICY);

Object.defineProperty(window, "HVAA_hvutStorage", {
  configurable: false,
  enumerable: false,
  writable: false,
  value: hvutStorageBridge,
});

export function initializeHvutStorageBridge() {
  return hvutStorageBridge.hydrate();
}
