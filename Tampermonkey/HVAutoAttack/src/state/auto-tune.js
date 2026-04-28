// 自学 safetyPad（F 方案 PoC）：1D 网格线搜索替代完整 BO。
// 每"回合"末尾记录本回合用药数 → 当前 pad bucket 累积；样本 ≥ MIN 后比对邻居 bucket 取低 mean → 走 gradient。
//
// 简化合理性：safetyPad 是 1D 凸目标（药量随 pad 单调，死亡概率随 pad 反向单调）→ 局部线搜索即可收敛。
// 未做 GP / Thompson Sampling：当前问题状态空间小，过设计反不利。
//
// file-size-gate: exempt phase-poc-autotune
import { g } from "./store.js";
import { setValue, getValue } from "./storage.js";

const PAD_GRID = [1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 2.0];
const MIN_OBSERVATIONS = 5;
const PAD_KEY = "autoTunePad";
const HISTORY_KEY = "autoTuneHistory";

/** 当前 safetyPad 值（持久化）。默认 1.3 = grid 中心。 */
export function getCurrentPad() {
  const p = parseFloat(getValue(PAD_KEY));
  return isNaN(p) ? 1.3 : p;
}

/** UI 重置按钮调用：清掉历史 + 复位 1.3。 */
export function resetAutoTune() {
  setValue(PAD_KEY, 1.3);
  setValue(HISTORY_KEY, {});
}

/** UI 显示用：返回当前 history 摘要 + 当前 pad。 */
export function getAutoTuneStatus() {
  const history = getValue(HISTORY_KEY, true) || {};
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
export function observeBattle(potionsUsed) {
  const pad = getCurrentPad();
  const history = getValue(HISTORY_KEY, true) || {};
  const key = pad.toFixed(2);
  if (!history[key]) history[key] = { n: 0, sumPotions: 0 };
  history[key].n += 1;
  history[key].sumPotions += potionsUsed;
  setValue(HISTORY_KEY, history);
  maybeStep(history, pad, key);
}

function maybeStep(history, pad, key) {
  const cur = history[key];
  if (cur.n < MIN_OBSERVATIONS) return;

  const padNum = parseFloat(pad.toFixed(2));
  const idx = PAD_GRID.indexOf(padNum);
  if (idx < 0) {
    setValue(PAD_KEY, 1.3); // grid 漂移恢复
    return;
  }

  const lowerKey = idx > 0 ? PAD_GRID[idx - 1].toFixed(2) : null;
  const upperKey = idx < PAD_GRID.length - 1 ? PAD_GRID[idx + 1].toFixed(2) : null;

  // 探索：未访问的邻居优先（确保 line search 覆盖）
  if (lowerKey && !history[lowerKey]) {
    setValue(PAD_KEY, parseFloat(lowerKey));
    console.log(`[auto-tune] explore ${pad} → ${lowerKey}`);
    return;
  }
  if (upperKey && !history[upperKey]) {
    setValue(PAD_KEY, parseFloat(upperKey));
    console.log(`[auto-tune] explore ${pad} → ${upperKey}`);
    return;
  }

  // 利用：邻居都有数据 → 比 mean potion，下降梯度
  const meanCur = cur.sumPotions / cur.n;
  const meanL = lowerKey && history[lowerKey].n >= MIN_OBSERVATIONS ? history[lowerKey].sumPotions / history[lowerKey].n : Infinity;
  const meanU = upperKey && history[upperKey].n >= MIN_OBSERVATIONS ? history[upperKey].sumPotions / history[upperKey].n : Infinity;

  let next = padNum;
  // 容差 5% 防抖动
  if (meanL < meanCur * 0.95 && meanL <= meanU) next = parseFloat(lowerKey);
  else if (meanU < meanCur * 0.95 && meanU <= meanL) next = parseFloat(upperKey);

  if (next !== padNum) {
    setValue(PAD_KEY, next);
    console.log(`[auto-tune] safetyPad ${padNum} → ${next} (mean potions: cur=${meanCur.toFixed(1)}, L=${meanL.toFixed(1)}, U=${meanU.toFixed(1)})`);
  }
}
