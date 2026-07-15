// Tests historically read diagnostics through sessionStorage. Production hot-path diagnostics are now
// memory-first, so this test-only facade exposes the unified read view without creating disk writes.
import { diagnosticEvidenceMemoryStorage } from "../src/core/diagnostic-evidence-journal.js";
import { beforeEach } from "vitest";
import { createTestIndexedDb } from "./fake-indexeddb.js";

const testIndexedDb = createTestIndexedDb();
globalThis.indexedDB = testIndexedDb;
beforeEach(() => testIndexedDb.clearAll());

const nativeSessionStorage = window.sessionStorage;
const diagnosticSessionFacade = {
  getItem(key) {
    return nativeSessionStorage.getItem(key) ?? diagnosticEvidenceMemoryStorage.getItem(key);
  },
  setItem(key, value) {
    return nativeSessionStorage.setItem(key, value);
  },
  removeItem(key) {
    diagnosticEvidenceMemoryStorage.removeItem(key);
    return nativeSessionStorage.removeItem(key);
  },
  clear() {
    diagnosticEvidenceMemoryStorage.clear();
    return nativeSessionStorage.clear();
  },
  key(index) {
    return nativeSessionStorage.key(index);
  },
  get length() {
    return nativeSessionStorage.length;
  },
};

const observableSessionStorage = new Proxy(diagnosticSessionFacade, {
  get(target, property, receiver) {
    if (Reflect.has(target, property)) return Reflect.get(target, property, receiver);
    return nativeSessionStorage[property];
  },
  set(target, property, value, receiver) {
    if (Reflect.has(target, property)) return Reflect.set(target, property, value, receiver);
    nativeSessionStorage[property] = value;
    return true;
  },
});

Object.defineProperty(window, "sessionStorage", {
  configurable: true,
  value: observableSessionStorage,
});
