import { delValue, getValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";

const FAMILY_KEYS = Object.freeze({
  drop: Object.freeze({ current: STORAGE_KEYS.DROP, history: STORAGE_KEYS.DROP_OLD }),
  usage: Object.freeze({ current: STORAGE_KEYS.STATS, history: STORAGE_KEYS.STATS_OLD }),
});

export function createBattleRecordLegacyAdapter(deps = {}) {
  const read = deps.getValue || getValue;
  const remove = deps.delValue || delValue;

  function keys(family) {
    const selected = FAMILY_KEYS[family];
    if (!selected) throw new TypeError(`Unknown battle report family: ${family}`);
    return selected;
  }

  return Object.freeze({
    readRuntime() {
      return {
        code: read(STORAGE_KEYS.BATTLE_CODE),
        drop: read(STORAGE_KEYS.DROP, true),
        usage: read(STORAGE_KEYS.STATS, true),
      };
    },
    clearRuntime() {
      remove(STORAGE_KEYS.BATTLE_CODE);
      remove(STORAGE_KEYS.DROP);
      remove(STORAGE_KEYS.STATS);
    },
    readHistory(family) {
      return read(keys(family).history, true) || [];
    },
    clearHistory(family) {
      remove(keys(family).history);
    },
  });
}
