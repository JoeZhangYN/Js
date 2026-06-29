// 装备百分位执行器：equipment view 编排入口已裁定 mode，本函数只执行对应增强。
//
// [2026-06-10 能量模型] live(联网旧实现, 移植自 Live Percentile Ranges) 整体过时：
// 潜能体系消失后, 装备页直印 Base 点数 + 固定品质 range(QUALITY_CONFIG) 直接回答"浮动百分位"，
// offline 算法完全覆盖且离线。live 的页面解析在新页面入口即死(#showequip id 已不存在, 只剩 class;
// `Condition: X / Y (Z%)` / Tier-PXP 反推字段全消失), 在线数据库的旧 base 体系亦失效。
// 故 mode='live' 降级走 offline（老用户存值兼容, 不改写存值）; 旧 live 实现已删除。
//
// ⚠ Sentinel H3 已知限制：off ↔ offline 切换需 **刷新页面** 才生效（offline 持文件级 setupDone
// 闭包 + 全局 keydown 监听 + MutationObserver，无 teardown 接口）——schema label 已警告用户。
import { runOfflineEquipPercentileEnhancement } from "./equip-percentile-offline.js";

export function runEquipPercentileEnhancement(mode) {
  if (mode === "live") {
    console.info(
      "[HVAA] equipPercentileMode=live 已随能量模型过时，自动降级为 offline（本地品质点数公式）"
    );
  }
  runOfflineEquipPercentileEnhancement();
}
