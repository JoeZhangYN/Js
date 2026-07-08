// 自学 safetyPad（F 方案 PoC）：1D 网格线搜索替代完整 BO。
// 每"回合"末尾记录本回合用药数 → 当前 pad bucket 累积；样本 ≥ MIN 后比对邻居 bucket 取低 mean → 走 gradient。
//
// 简化合理性：safetyPad 是 1D 凸目标（药量随 pad 单调，死亡概率随 pad 反向单调）→ 局部线搜索即可收敛。
// 未做 GP / Thompson Sampling：当前问题状态空间小，过设计反不利。
//
// file-size-gate: exempt phase-poc-autotune
import { setValue, getValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { g } from "./store.js";
import { OptionEvent, runOptionAutomation } from "./option.js";
import { BattleTurnEvent, runBattleTurnAutomation } from "./battle-turn.js";

const PAD_GRID = [1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 2.0];
const MIN_OBSERVATIONS = 5;
const EVENT_READ_PAD = "readPad";
const EVENT_RECORD_BATTLE = "recordBattle";
const EVENT_RECORD_POTION_USE = "recordPotionUse";
const EVENT_ROUND_STARTED = "roundStarted";
const EVENT_RESET = "reset";
const EVENT_READ_STATUS = "readStatus";

export const AUTO_TUNE_FAILURE_KEY = "HVAA:lastAutoTuneFailure";

export const AutoTuneEvent = Object.freeze({
  READ_PAD: EVENT_READ_PAD,
  RECORD_BATTLE: EVENT_RECORD_BATTLE,
  RECORD_POTION_USE: EVENT_RECORD_POTION_USE,
  ROUND_STARTED: EVENT_ROUND_STARTED,
  RESET: EVENT_RESET,
  READ_STATUS: EVENT_READ_STATUS,
});

function isAutoTuneEnabled() {
  return Boolean(
    runOptionAutomation({ type: OptionEvent.READ_FIELD, key: "autoTune", fallback: false })
  );
}

function recordAutoTuneFailure(stage, storageKey, error) {
  const evidence = {
    capability: "autoTune",
    stage,
    storageKey,
    failure: { kind: "storageWrite", error: error?.message || String(error) },
  };
  try {
    sessionStorage.setItem(AUTO_TUNE_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // Auto-tune evidence is diagnostic only; battle flow must keep running.
  }
  try {
    console.warn("[HVAA] auto-tune persistence failed", evidence);
  } catch (_error) {
    // Console hooks are diagnostic only.
  }
  return evidence;
}

function persistAutoTuneValue(stage, storageKey, value) {
  try {
    setValue(storageKey, value);
    return true;
  } catch (error) {
    recordAutoTuneFailure(stage, storageKey, error);
    return false;
  }
}

/** 当前 safetyPad 值（持久化）。默认 1.3 = grid 中心。 */
function getCurrentPad() {
  const p = parseFloat(getValue(STORAGE_KEYS.AUTO_TUNE_PAD));
  return isNaN(p) ? 1.3 : p;
}

/** UI 重置按钮调用：清掉历史 + 复位 1.3。 */
function resetAutoTune() {
  const padPersisted = persistAutoTuneValue("reset-pad", STORAGE_KEYS.AUTO_TUNE_PAD, 1.3);
  const historyPersisted = persistAutoTuneValue(
    "reset-history",
    STORAGE_KEYS.AUTO_TUNE_HISTORY,
    {}
  );
  return padPersisted && historyPersisted;
}

/** UI 显示用：返回当前 history 摘要 + 当前 pad。 */
function getAutoTuneStatus() {
  const history = getValue(STORAGE_KEYS.AUTO_TUNE_HISTORY, true) || {};
  return {
    currentPad: getCurrentPad(),
    history: Object.entries(history)
      .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
      .map(([pad, stats]) => ({
        pad: parseFloat(pad),
        n: stats.n,
        meanPotions: stats.n > 0 ? stats.sumPotions / stats.n : 0,
      })),
  };
}

/**
 * 一轮战斗末尾调用，记录观测 + 触发 gradient step。
 * @param {number} potionsUsed 本轮用药数
 */
function observeBattle(potionsUsed) {
  const pad = getCurrentPad();
  const history = getValue(STORAGE_KEYS.AUTO_TUNE_HISTORY, true) || {};
  const key = pad.toFixed(2);
  if (!history[key]) history[key] = { n: 0, sumPotions: 0 };
  history[key].n += 1;
  history[key].sumPotions += potionsUsed;
  if (!persistAutoTuneValue("record-history", STORAGE_KEYS.AUTO_TUNE_HISTORY, history)) {
    return false;
  }
  return maybeStep(history, pad, key);
}

function recordPotionUse() {
  if (isAutoTuneEnabled()) {
    g("autoTunePotionCount", (g("autoTunePotionCount") || 0) + 1);
  }
}

function recordRoundStarted() {
  if (isAutoTuneEnabled() && runBattleTurnAutomation({ type: BattleTurnEvent.READ_CURRENT }) > 0) {
    observeBattle(g("autoTunePotionCount") || 0);
  }
  g("autoTunePotionCount", 0);
}

function maybeStep(history, pad, key) {
  const cur = history[key];
  if (cur.n < MIN_OBSERVATIONS) return true;

  const padNum = parseFloat(pad.toFixed(2));
  const idx = PAD_GRID.indexOf(padNum);
  if (idx < 0) {
    return persistAutoTuneValue("restore-grid-pad", STORAGE_KEYS.AUTO_TUNE_PAD, 1.3);
  }

  const lowerKey = idx > 0 ? PAD_GRID[idx - 1].toFixed(2) : null;
  const upperKey = idx < PAD_GRID.length - 1 ? PAD_GRID[idx + 1].toFixed(2) : null;

  // 探索：未访问的邻居优先（确保 line search 覆盖）
  if (lowerKey && !history[lowerKey]) {
    const persisted = persistAutoTuneValue(
      "explore-lower-pad",
      STORAGE_KEYS.AUTO_TUNE_PAD,
      parseFloat(lowerKey)
    );
    if (persisted) console.log(`[auto-tune] explore ${pad} → ${lowerKey}`);
    return persisted;
  }
  if (upperKey && !history[upperKey]) {
    const persisted = persistAutoTuneValue(
      "explore-upper-pad",
      STORAGE_KEYS.AUTO_TUNE_PAD,
      parseFloat(upperKey)
    );
    if (persisted) console.log(`[auto-tune] explore ${pad} → ${upperKey}`);
    return persisted;
  }

  // 利用：邻居都有数据 → 比 mean potion，下降梯度
  const meanCur = cur.sumPotions / cur.n;
  const meanL =
    lowerKey && history[lowerKey].n >= MIN_OBSERVATIONS
      ? history[lowerKey].sumPotions / history[lowerKey].n
      : Infinity;
  const meanU =
    upperKey && history[upperKey].n >= MIN_OBSERVATIONS
      ? history[upperKey].sumPotions / history[upperKey].n
      : Infinity;

  let next = padNum;
  // 容差 5% 防抖动
  if (meanL < meanCur * 0.95 && meanL <= meanU) next = parseFloat(lowerKey);
  else if (meanU < meanCur * 0.95 && meanU <= meanL) next = parseFloat(upperKey);

  if (next !== padNum) {
    const persisted = persistAutoTuneValue("step-pad", STORAGE_KEYS.AUTO_TUNE_PAD, next);
    if (!persisted) return false;
    console.log(
      `[auto-tune] safetyPad ${padNum} → ${next} (mean potions: cur=${meanCur.toFixed(1)}, L=${meanL.toFixed(1)}, U=${meanU.toFixed(1)})`
    );
  }
  return true;
}

const autoTuneEventHandlers = Object.freeze({
  [EVENT_READ_PAD]: () => getCurrentPad(),
  [EVENT_RECORD_BATTLE]: (event) => observeBattle(event.potionsUsed),
  [EVENT_RECORD_POTION_USE]: () => recordPotionUse(),
  [EVENT_ROUND_STARTED]: () => recordRoundStarted(),
  [EVENT_RESET]: () => resetAutoTune(),
  [EVENT_READ_STATUS]: () => getAutoTuneStatus(),
});

export function runAutoTuneAutomation(event = { type: EVENT_READ_PAD }) {
  return autoTuneEventHandlers[event?.type]?.(event);
}
