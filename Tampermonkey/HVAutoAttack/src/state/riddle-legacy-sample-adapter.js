// Compatibility-only boundary for retired RMA `saved_*` values.
// Normal sample capture/export never imports this adapter; only the confirmed migrator may read/delete.
function legacyApi(name, modernName) {
  const legacy = globalThis[name];
  if (typeof legacy === "function") return (...args) => legacy(...args);
  const modern = globalThis.GM?.[modernName];
  if (typeof modern === "function") return (...args) => modern.call(globalThis.GM, ...args);
  return null;
}

export function createRiddleLegacySampleAdapter() {
  async function listKeys() {
    const list = legacyApi("GM_listValues", "listValues");
    if (!list) throw new Error("legacy sample listing is unavailable");
    const keys = await list();
    return (keys || []).filter((key) => key.startsWith("saved_")).sort();
  }

  async function read(sourceKey) {
    const get = legacyApi("GM_getValue", "getValue");
    if (!get) throw new Error("legacy sample reading is unavailable");
    return (await get(sourceKey)) ?? null;
  }

  async function remove(sourceKey) {
    const removeValue = legacyApi("GM_deleteValue", "deleteValue");
    if (!removeValue) throw new Error("legacy sample deletion is unavailable");
    await removeValue(sourceKey);
    return true;
  }

  return Object.freeze({ listKeys, read, remove });
}
