// GM_* / localStorage 持久化能力。世界前缀由能力工厂闭包绑定，业务调用不接收 World。
import { CURRENT_WORLD_POLICY } from "../core/current-runtime.js";
import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";
import { writeDiagnosticSessionSnapshot } from "../core/diagnostic-evidence-journal.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import {
  measureStorageLogicalBytes,
  runStorageIoMetricsAutomation,
  StorageIoMetricsEvent,
} from "./storage-io-metrics.js";
import { StorageIdentity, StorageWriteOutcome } from "./storage-io-policy.js";
import { deleteStorageValue, writeCanonicalStorageValue } from "./storage-write-adapter.js";

export const STORAGE_READ_FAILURE_KEY = "HVAA:lastStorageReadFailure";

export function createStorageCapability({ prefix }, ports = {}) {
  const localStorageOf = () => ports.localStorage || window.localStorage;
  const recordIo =
    ports.recordIo ||
    ((event) => runStorageIoMetricsAutomation({ type: StorageIoMetricsEvent.RECORD, ...event }));
  const sourceIdentity = ports.sourceIdentity || prefix;
  const diagnostic =
    ports.warn ||
    ((...args) => runDiagnosticConsoleAutomation({ type: DiagnosticConsoleEvent.WARN, args }));

  function warnReadFailure(item, key, source, error) {
    const evidence = Object.assign(
      { capability: "storageRead", item, key, source },
      { error: error?.message || String(error) }
    );
    writeDiagnosticSessionSnapshot(STORAGE_READ_FAILURE_KEY, evidence);
    diagnostic("[HVAA] storage read failed", evidence);
  }

  function setValue(item, value) {
    const key = prefix + item;
    if (item === STORAGE_KEYS.OPTION && value && typeof value === "object" && !value.version) {
      diagnostic(
        "[HVAA] setValue('option') 写入缺 version 字段，疑似残缺 option 覆盖；应走 runOptionAutomation(event) 统一写入口:",
        value
      );
    }
    const gmSet = ports.gmSetValue || globalThis.GM_setValue;
    const gmGet = ports.gmGetValue || globalThis.GM_getValue;
    const logicalBytes = measureStorageLogicalBytes(key, value);
    try {
      const result = writeCanonicalStorageValue({
        key,
        value,
        gmSet,
        gmGet,
        localStorage: typeof gmSet === "function" ? null : localStorageOf(),
        onReadFailure: (source, error) => warnReadFailure(item, key, source, error),
      });
      recordIo({
        identity: StorageIdentity.WORLD_SMALL_VALUE,
        outcome: result.outcome,
        logicalBytes: measureStorageLogicalBytes(key, result.canonicalValue),
        sourceIdentity,
      });
      return result.outcome;
    } catch (error) {
      recordIo({
        identity: StorageIdentity.WORLD_SMALL_VALUE,
        outcome: StorageWriteOutcome.FAILED,
        logicalBytes,
        sourceIdentity,
      });
      throw error;
    }
  }

  function getValue(item, toJSON) {
    const key = prefix + item;
    const gmGet = ports.gmGetValue || globalThis.GM_getValue;
    if (typeof gmGet === "function") {
      try {
        const gmValue = gmGet(key);
        if (gmValue !== undefined) return gmValue;
      } catch (error) {
        warnReadFailure(item, key, "GM_getValue", error);
      }
    }
    try {
      const storage = localStorageOf();
      if (!(key in storage)) return null;
      const raw = storage[key];
      if (!toJSON) return raw;
      try {
        return JSON.parse(raw);
      } catch (error) {
        warnReadFailure(item, key, "localStorageJson", error);
        return null;
      }
    } catch (error) {
      warnReadFailure(item, key, "localStorage", error);
      return null;
    }
  }

  function delValue(item) {
    if (typeof item === "number") {
      const outcomes = [];
      if (item === 0) outcomes.push(delValue(STORAGE_KEYS.DISABLED));
      else if (item === 1) {
        outcomes.push(delValue(STORAGE_KEYS.ROUND_NOW));
        outcomes.push(delValue(STORAGE_KEYS.ROUND_ALL));
        outcomes.push(delValue(STORAGE_KEYS.MONSTER_STATUS));
      } else if (item === 2) {
        outcomes.push(delValue(STORAGE_KEYS.ROUND_TYPE));
        outcomes.push(delValue(STORAGE_KEYS.BATTLE_CODE));
        outcomes.push(delValue(0));
        outcomes.push(delValue(1));
      }
      return outcomes.includes(StorageWriteOutcome.DELETED)
        ? StorageWriteOutcome.DELETED
        : StorageWriteOutcome.SKIPPED_UNCHANGED;
    }
    const key = prefix + item;
    const gmDelete = ports.gmDeleteValue || globalThis.GM_deleteValue;
    const gmGet = ports.gmGetValue || globalThis.GM_getValue;
    const logicalBytes = measureStorageLogicalBytes(key, undefined);
    try {
      const outcome = deleteStorageValue({
        key,
        gmDelete,
        gmGet,
        localStorage: typeof gmDelete === "function" ? null : localStorageOf(),
        onReadFailure: (source, error) => warnReadFailure(item, key, source, error),
      });
      recordIo({
        identity: StorageIdentity.WORLD_SMALL_VALUE,
        outcome,
        logicalBytes,
        sourceIdentity,
      });
      return outcome;
    } catch (error) {
      recordIo({
        identity: StorageIdentity.WORLD_SMALL_VALUE,
        outcome: StorageWriteOutcome.FAILED,
        logicalBytes,
        sourceIdentity,
      });
      throw error;
    }
  }

  return Object.freeze({ setValue, getValue, delValue });
}

export const { setValue, getValue, delValue } = createStorageCapability(
  CURRENT_WORLD_POLICY.storage
);
