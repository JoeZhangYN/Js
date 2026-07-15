const STOP_COPY = Object.freeze({
  "credit-cap": [
    "⚠ 维修缺料，购买花费超过单轮上限，已停机",
    "⚠ 維修缺料，購買花費超過單輪上限，已停機",
    "⚠ Repair stopped: material cost exceeds per-run cap",
  ],
  "insufficient-credits": [
    "⚠ 维修缺料，信用点不足，已停机",
    "⚠ 維修缺料，信用點不足，已停機",
    "⚠ Repair stopped: not enough credits for materials",
  ],
  "no-stock": [
    "⚠ 维修缺料，物品商店库存不足，已停机",
    "⚠ 維修缺料，物品商店庫存不足，已停機",
    "⚠ Repair stopped: item shop out of stock",
  ],
  "unknown-item": [
    "⚠ 维修缺料，无法识别所需材料，已停机",
    "⚠ 維修缺料，無法識別所需材料，已停機",
    "⚠ Repair stopped: unknown material",
  ],
  "missing-storetoken": [
    "⚠ 维修买料缺少商店凭证，已停机",
    "⚠ 維修買料缺少商店憑證，已停機",
    "⚠ Repair stopped: missing item shop token",
  ],
  "buy-error": [
    "⚠ 维修买料请求出错，已停机",
    "⚠ 維修買料請求出錯，已停機",
    "⚠ Repair stopped: buy request error",
  ],
  repairStuck: [
    "⚠ 装备修理失败，已停止下一场自动战斗，请检查信用点 / 装备",
    "⚠ 裝備修理失敗，已停止下一場自動戰鬥，請檢查信用點 / 裝備",
    "⚠ Repair failed — next automatic battle stopped; check credits / equipment",
  ],
  backendFailure: [
    "⚠ 维修请求失败，已停止下一场自动战斗，请检查网络 / 服务器响应",
    "⚠ 維修請求失敗，已停止下一場自動戰鬥，請檢查網絡 / 伺服器響應",
    "⚠ Repair request failed — next automatic battle stopped; check network / server response",
  ],
});

export function readRepairStopCopy(reason) {
  return STOP_COPY[reason] || STOP_COPY.repairStuck;
}
