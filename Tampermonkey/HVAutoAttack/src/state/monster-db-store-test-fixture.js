import { vi } from "vitest";

export function makeFakeIndexedDb() {
  function request(result) {
    const value = { result, error: null, onsuccess: null, onerror: null };
    queueMicrotask(() => value.onsuccess?.());
    return value;
  }
  const stores = new Map();
  const objectStoreNames = {
    contains: (name) => stores.has(name),
  };
  const ensureStore = (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    return stores.get(name);
  };
  const db = {
    objectStoreNames,
    createObjectStore: (name) => ensureStore(name),
    deleteObjectStore: (name) => stores.delete(name),
    transaction: (storeName) => {
      const tx = {
        oncomplete: null,
        onerror: null,
        onabort: null,
        objectStore: () => {
          const store = ensureStore(storeName);
          return {
            get: (key) => request(store.get(key)),
            getAll: () => request([...store.values()]),
            put: (value, key) => {
              store.set(key, value);
              return request(undefined);
            },
            count: () => request(store.size),
          };
        },
      };
      setTimeout(() => tx.oncomplete?.(), 0);
      return tx;
    },
  };
  return {
    open: () => {
      const req = {
        result: db,
        error: null,
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
      };
      setTimeout(() => {
        req.onupgradeneeded?.();
        req.onsuccess?.();
      }, 0);
      return req;
    },
  };
}

export async function loadStoreWithIndexedDb(indexedDb) {
  vi.resetModules();
  globalThis.indexedDB = indexedDb;
  return import("./monster-db-store.js");
}
