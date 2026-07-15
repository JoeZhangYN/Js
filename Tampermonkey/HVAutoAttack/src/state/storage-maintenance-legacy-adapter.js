function legacyApi(name, modernName) {
  const legacy = globalThis[name];
  if (typeof legacy === "function") return (...args) => legacy(...args);
  const modern = globalThis.GM?.[modernName];
  if (typeof modern === "function") return (...args) => modern.call(globalThis.GM, ...args);
  return null;
}

function parseLocalValue(raw) {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function createStorageMaintenanceLegacyAdapter(deps = {}) {
  const gmGet = deps.gmGet || legacyApi("GM_getValue", "getValue");
  const gmDelete = deps.gmDelete || legacyApi("GM_deleteValue", "deleteValue");
  const local = deps.localStorage || globalThis.localStorage;

  async function readKey(key) {
    if (gmGet) {
      const value = await gmGet(key);
      if (value !== undefined && value !== null) return value;
    }
    return parseLocalValue(local?.getItem?.(key) ?? null);
  }

  async function readFirst(keys) {
    for (const key of keys) {
      const value = await readKey(key);
      if (value !== null && value !== undefined) return value;
    }
    return null;
  }

  async function removeKeys(keys) {
    for (const key of keys) {
      if (gmDelete) await gmDelete(key);
      local?.removeItem?.(key);
    }
    return true;
  }

  return Object.freeze({ readKey, readFirst, removeKeys });
}
