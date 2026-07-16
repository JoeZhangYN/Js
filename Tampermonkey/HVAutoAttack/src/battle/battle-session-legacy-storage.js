import { delValue } from "../state/storage.js";

const LEGACY_BATTLE_ROUND_KEYS = Object.freeze(["roundType", "roundNow", "roundAll"]);

export function retireLegacyBattleRoundStorage() {
  return LEGACY_BATTLE_ROUND_KEYS.map((key) => delValue(key));
}
