// 页面停留刷新能力：防移动端浏览器长时间挂机内存堆积 / JS 上下文死锁导致卡死。
// 与 reloader.js 的 delayReload 正交：delayReload 是 action-driven（每次 api_call 起 idle 计时器，eventEnd 清），
// 本模块是 absolute-clock：页面自动化启动后倒计时 N 分钟触发一次同页 reload，不依赖战斗事件。
//
// 设计点：
// - 默认 30 分钟 + 0~1 分钟随机抖动，避免多窗口同步 reload
// - game page 都生效，由 page-automation 统一编排调用
// - 单次 scheduleReload，reload 后新页面会重新调用本入口自然续期
//
// 关联：用户提供的 legacy snippet 是独立 UserScript "30分钟间隔刷新,防止移动端页面卡主"，
// 此模块为其在 HVAutoAttack 体系内的等价实现（option 开关 + 可配间隔）。
import { scheduleReload } from "../core/navigate.js";

const EVENT_GAME_PAGE_READY = "gamePageReady";
const EVENT_UNKNOWN_PAGE_READY = "unknownPageReady";
const UNKNOWN_PAGE_RELOAD_SEC = 5 * 60;

export const PageRefreshEvent = Object.freeze({
  GAME_PAGE_READY: EVENT_GAME_PAGE_READY,
  UNKNOWN_PAGE_READY: EVENT_UNKNOWN_PAGE_READY,
});

function planPageRefreshDelayMs(option, { jitter = Math.random() } = {}) {
  if (!option || !option.pageRefresh) return;
  const minutes = Number(option.pageRefreshMinutes) || 30;
  if (minutes <= 0) return;
  const boundedJitter = Math.max(0, Math.min(0.999999, jitter));
  const jitterMinutes = Math.floor(boundedJitter * 2); // 0~1 分钟抖动
  return (minutes + jitterMinutes) * 60 * 1000;
}

export function runPageRefreshAutomation(event = { type: EVENT_GAME_PAGE_READY }, deps = {}) {
  if (event.type === EVENT_UNKNOWN_PAGE_READY) {
    const reload = deps.scheduleReload || scheduleReload;
    reload(UNKNOWN_PAGE_RELOAD_SEC);
    return true;
  }
  if (event.type !== EVENT_GAME_PAGE_READY) return false;
  const delayMs = planPageRefreshDelayMs(event.option, deps);
  if (!delayMs) return false;
  const reload = deps.scheduleReload || scheduleReload;
  reload(delayMs / 1000);
  return true;
}
