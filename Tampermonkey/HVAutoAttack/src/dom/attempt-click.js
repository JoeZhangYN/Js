// 战斗 step 通用"探活 + click"封装：isOn 探活通过才 click 并返 true（acted），
// 失败模式（按钮禁用 / 元素缺失）→ 返 false 让后续 rule 接管。
//
// 历史背景：channeling 激活时 defend 按钮被游戏禁用（opacity 0.5），裸 click 不触发
// api_call。探活返 false（acted=false）→ runRules 不短路、后续 rule 接管；若误返 true
// 而又没真发出 api_call，reloader 的 eventEnd 永不触发 → 主循环挂死，故写前探活是硬约束。
// 此模式至少在 main-loop defend / boss-Imperil / attack 法术阶 / physical-skill-ranking / channel buff 等 ≥10 处复刻 →
// 抽 helper 防退化（CLAUDE.md 铁律 1(e)：≥2 真重复必抽，反退化锁让旧路径不能再回归）。
import { gE, isOn } from "./query.js";

/**
 * 探活后 click 目标元素并设 end 标记。
 * @param {string|Element} selector CSS 选择器、数字技能 ID 或 DOM 元素（透传 gE）
 * @returns {boolean} true = 已 click（acted）；false = 按钮不可用 / 元素缺失
 */
export function attemptClick(selector) {
  if (!isOn(selector)) return false;
  const el = gE(selector);
  if (!el) return false;
  el.click();
  return true;
}

/**
 * 技能 click 后立即 click 目标（法术阶 / debuff 单体 / boss-Imperil 等"先选技能再点怪"双段操作）。
 * 探活两端：skill 走 isOn（opacity）；target 走存在性 + 死怪检测（`img[src*="nbardead.png"]` 父节点子）。
 * Sentinel H2 修复：原版仅查 target 存在性，死怪场景下 skill 已发但目标无效 → 浪费一个回合 OC。
 * @param {string|Element} skillSelector
 * @param {string|Element} targetSelector
 * @returns {boolean} true = skill+target 都 click（acted）；false = skill 不可用 / target 死/缺
 */
export function attemptClickWithTarget(skillSelector, targetSelector) {
  if (!isOn(skillSelector)) return false;
  const skillEl = gE(skillSelector);
  if (!skillEl) return false;
  const targetEl = gE(targetSelector);
  if (!targetEl) return false;
  // 死怪检测：mkey_X 父节点下若存在 nbardead.png → target 已死，弃 click 保 skill click 完整性
  if (targetEl.querySelector('img[src*="nbardead.png"]')) return false;
  skillEl.click();
  targetEl.click();
  return true;
}
