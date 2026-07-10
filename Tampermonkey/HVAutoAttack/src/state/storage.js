// GM_* / localStorage 持久化能力。世界前缀由能力工厂闭包绑定，业务调用不接收 World。
import { CURRENT_WORLD_POLICY } from "../core/current-runtime.js";
import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";
import { STORAGE_KEYS } from "./persist-keys.js";

export const STORAGE_READ_FAILURE_KEY = "HVAA:lastStorageReadFailure";

function errorText(error) {
  return error?.message || String(error);
}

export function createStorageCapability({ prefix }, ports = {}) {
  const localStorageOf = () => ports.localStorage || window.localStorage;
  const diagnostic =
    ports.warn ||
    ((...args) => runDiagnosticConsoleAutomation({ type: DiagnosticConsoleEvent.WARN, args }));

  function warnReadFailure(item, key, source, error) {
    const evidence = { capability: "storageRead", item, key, source, error: errorText(error) };
    try {
      globalThis.sessionStorage?.setItem(STORAGE_READ_FAILURE_KEY, JSON.stringify(evidence));
    } catch {
      // Read fallback must not depend on diagnostic storage.
    }
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
    if (typeof gmSet === "function") gmSet(key, value);
    else localStorageOf()[key] = typeof value === "string" ? value : JSON.stringify(value);
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
      if (item === 0) delValue(STORAGE_KEYS.DISABLED);
      else if (item === 1) {
        delValue(STORAGE_KEYS.ROUND_NOW);
        delValue(STORAGE_KEYS.ROUND_ALL);
        delValue(STORAGE_KEYS.MONSTER_STATUS);
      } else if (item === 2) {
        delValue(STORAGE_KEYS.ROUND_TYPE);
        delValue(STORAGE_KEYS.BATTLE_CODE);
        delValue(0);
        delValue(1);
      }
      return;
    }
    const key = prefix + item;
    const gmDelete = ports.gmDeleteValue || globalThis.GM_deleteValue;
    if (typeof gmDelete === "function") gmDelete(key);
    else localStorageOf().removeItem(key);
  }

  return Object.freeze({ setValue, getValue, delValue });
}

const currentStorage = createStorageCapability(CURRENT_WORLD_POLICY.storage);
export const setValue = currentStorage.setValue;
export const getValue = currentStorage.getValue;
export const delValue = currentStorage.delValue;
