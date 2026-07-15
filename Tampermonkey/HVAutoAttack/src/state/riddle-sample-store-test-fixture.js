export function makeRiddleSampleFakeIndexedDb() {
  const stores = new Map();
  const ensureStore = (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    return stores.get(name);
  };
  const request = (result) => {
    const value = { result, onsuccess: null, onerror: null };
    queueMicrotask(() => value.onsuccess?.());
    return value;
  };
  const db = {
    objectStoreNames: { contains: (name) => stores.has(name) },
    createObjectStore: (name) => ensureStore(name),
    transaction: (_names) => {
      const tx = {
        error: null,
        oncomplete: null,
        onerror: null,
        onabort: null,
        objectStore: (name) => {
          const store = ensureStore(name);
          return {
            get: (key) => request(store.get(key)),
            getAll: () => request([...store.values()]),
            put: (value, key) => {
              store.set(key, value);
              return request(key);
            },
            delete: (key) => {
              store.delete(key);
              return request(undefined);
            },
          };
        },
      };
      setTimeout(() => tx.oncomplete?.(), 0);
      return tx;
    },
  };
  return {
    stores,
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
