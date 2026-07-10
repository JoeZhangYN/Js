import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";
import {
  CUSTOM_DICTIONARY_SCHEMA_VERSION,
  emptyCustomDictionary,
  mergeCustomDictionaries,
  normalizeCustomDictionary,
} from "./custom-dictionary-model.js";
import { toSimplified } from "./zh-convert.js";

export const CUSTOM_DICTIONARY_STORAGE_KEY = "HVAA:i18n:custom-dictionary:v1";
export const CUSTOM_DICTIONARY_FAILURE_KEY = "HVAA:lastCustomDictionaryFailure";

const EVENT_LIST = "list";
const EVENT_RESOLVE_FORWARD = "resolveForward";
const EVENT_RESOLVE_REVERSE = "resolveReverse";
const EVENT_IMPORT_TEXT = "importText";
const EVENT_EXPORT_TEXT = "exportText";
const EVENT_CLEAR = "clear";

export const CustomDictionaryEvent = Object.freeze({
  LIST: EVENT_LIST,
  RESOLVE_FORWARD: EVENT_RESOLVE_FORWARD,
  RESOLVE_REVERSE: EVENT_RESOLVE_REVERSE,
  IMPORT_TEXT: EVENT_IMPORT_TEXT,
  EXPORT_TEXT: EVENT_EXPORT_TEXT,
  CLEAR: EVENT_CLEAR,
});

export function createCustomDictionaryCapability(ports = {}) {
  const gmGet = ports.gmGetValue || globalThis.GM_getValue;
  const gmSet = ports.gmSetValue || globalThis.GM_setValue;
  const gmDelete = ports.gmDeleteValue || globalThis.GM_deleteValue;
  const localStorage = ports.localStorage || globalThis.localStorage;
  const warn =
    ports.warn ||
    ((...args) => runDiagnosticConsoleAutomation({ type: DiagnosticConsoleEvent.WARN, args }));
  let documentValue;

  function recordFailure(stage, error) {
    const failure = {
      capability: "customDictionary",
      stage,
      storageKey: CUSTOM_DICTIONARY_STORAGE_KEY,
      error: error?.message || String(error),
    };
    try {
      globalThis.sessionStorage?.setItem(CUSTOM_DICTIONARY_FAILURE_KEY, JSON.stringify(failure));
    } catch {
      // Dictionary behavior must not depend on diagnostic storage.
    }
    try {
      warn("[HVAA] custom dictionary failed", failure);
    } catch {
      // Dictionary behavior must not depend on diagnostic hooks.
    }
    return failure;
  }

  function load() {
    if (documentValue) return documentValue;
    try {
      const raw =
        typeof gmGet === "function"
          ? gmGet(CUSTOM_DICTIONARY_STORAGE_KEY)
          : localStorage?.getItem?.(CUSTOM_DICTIONARY_STORAGE_KEY);
      documentValue =
        raw == null || raw === "" ? emptyCustomDictionary() : normalizeCustomDictionary(raw);
    } catch (error) {
      recordFailure("load", error);
      documentValue = emptyCustomDictionary();
    }
    return documentValue;
  }

  function persist(next, stage) {
    try {
      if (typeof gmSet === "function") gmSet(CUSTOM_DICTIONARY_STORAGE_KEY, next);
      else if (typeof localStorage?.setItem === "function") {
        localStorage.setItem(CUSTOM_DICTIONARY_STORAGE_KEY, JSON.stringify(next));
      } else throw new Error("Custom dictionary storage adapter missing");
      documentValue = next;
      return { ok: true, document: next };
    } catch (error) {
      return { ok: false, reason: "storageWriteFailed", failure: recordFailure(stage, error) };
    }
  }

  function importText(text) {
    let incoming;
    try {
      incoming = normalizeCustomDictionary(text);
    } catch (error) {
      return { ok: false, reason: "invalidDocument", failure: recordFailure("import", error) };
    }
    return persist(mergeCustomDictionaries(load(), incoming), "importWrite");
  }

  function clear() {
    try {
      if (typeof gmDelete === "function") gmDelete(CUSTOM_DICTIONARY_STORAGE_KEY);
      else if (typeof localStorage?.removeItem === "function") {
        localStorage.removeItem(CUSTOM_DICTIONARY_STORAGE_KEY);
      } else throw new Error("Custom dictionary storage adapter missing");
      documentValue = emptyCustomDictionary();
      return { ok: true, document: documentValue };
    } catch (error) {
      return { ok: false, reason: "storageDeleteFailed", failure: recordFailure("clear", error) };
    }
  }

  return Object.freeze({
    run(event = { type: EVENT_LIST }) {
      switch (event?.type) {
        case EVENT_LIST:
          return {
            schemaVersion: CUSTOM_DICTIONARY_SCHEMA_VERSION,
            entries: load().entries.map((entry) => ({ ...entry })),
          };
        case EVENT_RESOLVE_FORWARD:
          return load().entries.find(
            (entry) => entry.group === event.group && entry.source === event.source
          )?.zhCN;
        case EVENT_RESOLVE_REVERSE:
          {
            const zhCN = toSimplified(String(event.zhCN || "").trim());
            const sources = new Set(
              load()
                .entries.filter(
                  (entry) => entry.group === event.group && toSimplified(entry.zhCN) === zhCN
                )
                .map((entry) => entry.source)
            );
            return sources.size === 1 ? [...sources][0] : undefined;
          }
        case EVENT_IMPORT_TEXT:
          return importText(event.text);
        case EVENT_EXPORT_TEXT:
          return JSON.stringify(load(), null, 2);
        case EVENT_CLEAR:
          return clear();
        default:
          return undefined;
      }
    },
  });
}

const currentCustomDictionary = createCustomDictionaryCapability();

export function runCustomDictionaryAutomation(event = { type: EVENT_LIST }) {
  return currentCustomDictionary.run(event);
}
