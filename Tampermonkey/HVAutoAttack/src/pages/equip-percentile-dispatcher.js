// 装备百分位三态互斥分发器：option.equipPercentileMode = 'off' | 'offline' | 'live'（schema 扁平 key 对齐）
// 互斥约束：offline 与 live 都改写 #equip_extended 属性 span，dispatcher 是唯一入口。
// 早调路径：init.js 在 g("option") 装填前调本函数，故先读 g(option)，缺则 fallback 到 getValue。
//
// ⚠ Sentinel H3 已知限制：mode 切换需 **刷新页面** 才生效（两模块各自持文件级 setupDone 闭包 + 全局 keydown
// 监听 + MutationObserver，无 teardown 接口）。dispatcher 内 setupDone 哨兵保证同一 session 内不重复 init，
// 但切 mode 后旧模块的 observer / listener 仍在跑——schema label 已警告用户。未来优化方向：模块 export
// teardown() 移除 listener，dispatcher 维护 currentMode 切 mode 时先 teardown。
import { g } from "../state/store.js";
import { getValue } from "../state/storage.js";
import { setupEquipPercentileOffline } from "./equip-percentile-offline.js";
import { setupEquipPercentileLive } from "./equip-percentile-live.js";

export function setupEquipPercentile() {
  const option = g("option") || getValue("option", true) || {};
  const mode = option.equipPercentileMode || "off";
  if (mode === "off") return;
  if (mode === "offline") {
    setupEquipPercentileOffline();
    return;
  }
  if (mode === "live") {
    const sendRangeEnabled = option.equipPercentileLiveSendRange ?? true;
    setupEquipPercentileLive({ sendRangeEnabled });
    return;
  }
}
