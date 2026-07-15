function request(result) {
  const value = { result, error: null, onsuccess: null, onerror: null };
  queueMicrotask(() => value.onsuccess?.());
  return value;
}

export function createTestIndexedDb() {
  const databases = new Map();

  function database(name) {
    if (!databases.has(name)) databases.set(name, new Map());
    const stores = databases.get(name);
    const ensureStore = (storeName) => {
      if (!stores.has(storeName)) stores.set(storeName, new Map());
      return stores.get(storeName);
    };
    return {
      objectStoreNames: { contains: (storeName) => stores.has(storeName) },
      createObjectStore: (storeName) => ensureStore(storeName),
      transaction(storeNames) {
        const selectedName = Array.isArray(storeNames) ? storeNames[0] : storeNames;
        const tx = {
          error: null,
          oncomplete: null,
          onerror: null,
          onabort: null,
          objectStore(storeName = selectedName) {
            const store = ensureStore(storeName);
            return {
              get: (key) => request(store.get(key)),
              getAll: () => request([...store.values()]),
              put(value, key) {
                store.set(key, value);
                return request(key);
              },
              delete(key) {
                store.delete(key);
                return request(undefined);
              },
              clear() {
                store.clear();
                return request(undefined);
              },
            };
          },
        };
        queueMicrotask(() => queueMicrotask(() => tx.oncomplete?.()));
        return tx;
      },
    };
  }

  return {
    clearAll() {
      for (const stores of databases.values()) stores.clear();
    },
    databases,
    open(name) {
      const value = {
        result: database(name),
        error: null,
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
      };
      queueMicrotask(() => {
        value.onupgradeneeded?.();
        value.onsuccess?.();
      });
      return value;
    },
  };
}
