function request(result) {
  const value = { result, error: null, onsuccess: null, onerror: null };
  queueMicrotask(() => value.onsuccess?.());
  return value;
}

export function createTestIndexedDb() {
  const databases = new Map();
  const operations = { puts: 0, deletes: 0, clears: 0 };

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
              count: () => request(store.size),
              put(value, key) {
                store.set(key, value);
                operations.puts += 1;
                return request(key);
              },
              delete(key) {
                store.delete(key);
                operations.deletes += 1;
                return request(undefined);
              },
              clear() {
                store.clear();
                operations.clears += 1;
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
    operations,
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
