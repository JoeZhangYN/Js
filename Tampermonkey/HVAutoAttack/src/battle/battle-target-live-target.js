import { gE } from "../dom/query.js";

export function targetSelector(targetId) {
  return `#mkey_${targetId}`;
}

export function readLiveTarget(targetId) {
  let targetEl;
  try {
    targetEl = gE(targetSelector(targetId));
  } catch (error) {
    return {
      targetEl: null,
      reason: "targetReadFailed",
      error: error?.message || String(error),
    };
  }
  if (!targetEl) return { targetEl: null, reason: "targetMissing" };
  try {
    if (targetEl.querySelector('img[src*="nbardead.png"]')) {
      return { targetEl: null, reason: "targetDead" };
    }
  } catch (error) {
    return {
      targetEl: null,
      reason: "targetStateReadFailed",
      error: error?.message || String(error),
    };
  }
  return { targetEl, reason: "live" };
}

export function targetReadDetail(targetId, extra = {}) {
  const detail = { targetId };
  if (extra.error !== undefined) detail.error = extra.error;
  return detail;
}
