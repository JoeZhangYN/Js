import { TimeEvent, runTimeAutomation } from "../core/time.js";
import { parseScanResult, checkScanResultValidity } from "../data/monster-db.js";
import { MonsterCacheEvent, runMonsterCacheAutomation } from "../state/monster-cache.js";
import { MonsterDbStoreEvent, runMonsterDbStoreAutomation } from "../state/monster-db-store.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";

const EVENT_RECORD_LOG_ROW = "recordLogRow";

export const MonsterScanResultLearningEvent = Object.freeze({
  RECORD_LOG_ROW: EVENT_RECORD_LOG_ROW,
});

function makeDeps(deps) {
  return {
    checkScanResultValidity: deps.checkScanResultValidity || checkScanResultValidity,
    parseScanResult: deps.parseScanResult || parseScanResult,
    writeCachedProfile:
      deps.writeCachedProfile ||
      ((monsterId, info) =>
        runMonsterCacheAutomation({
          type: MonsterCacheEvent.WRITE_PROFILE,
          monsterId,
          info,
        })),
    storeProfile:
      deps.storeProfile ||
      ((info) => runMonsterDbStoreAutomation({ type: MonsterDbStoreEvent.PROFILE_WRITE, info })),
    storeHp:
      deps.storeHp ||
      ((monsterId, level, maxHP, lastUpdate) =>
        runMonsterDbStoreAutomation({
          type: MonsterDbStoreEvent.HP_WRITE,
          monsterId,
          level,
          maxHP,
          lastUpdate,
        })),
    readUtcDateKey:
      deps.readUtcDateKey || (() => runTimeAutomation({ type: TimeEvent.UTC_DATE_KEY })),
    readMonsterStatus:
      deps.readMonsterStatus ||
      (() => runMonsterStatusAutomation({ type: MonsterStatusEvent.READ_STATUS })),
  };
}

function statusForScan(info, deps) {
  return deps.readMonsterStatus().find((status) => status.name === info.monsterName);
}

function persistScanProfile(info, status, onStored, deps) {
  const profile = { ...info, monsterId: status.monsterId };
  Promise.resolve(deps.storeProfile(profile))
    .then(() => {
      deps.writeCachedProfile(profile.monsterId, profile);
      if (status.level != null && profile.maxHP > 0) {
        deps.storeHp(profile.monsterId, status.level, profile.maxHP, profile.lastUpdate);
      }
      onStored?.();
    })
    .catch(() => {});
}

function recordLogRow(event, deps) {
  const html = event.html;
  if (!html || !html.includes("Scanning")) return false;

  const info = deps.parseScanResult(html, deps.readUtcDateKey());
  if (!info) return false;

  const monsterMarkup = event.readMonsterMarkup?.(info.monsterName);
  if (!deps.checkScanResultValidity(monsterMarkup)) return false;

  const status = statusForScan(info, deps);
  if (!status || status.monsterId == null) return false;

  persistScanProfile(info, status, event.onStored, deps);
  return true;
}

const monsterScanResultEventHandlers = Object.freeze({
  [EVENT_RECORD_LOG_ROW]: (event, deps) => recordLogRow(event, makeDeps(deps)),
});

export function runMonsterScanResultLearning(event = { type: EVENT_RECORD_LOG_ROW }, deps = {}) {
  return monsterScanResultEventHandlers[event.type]?.(event, deps) || false;
}
