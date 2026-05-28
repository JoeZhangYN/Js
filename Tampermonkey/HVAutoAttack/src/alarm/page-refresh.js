// 页面定时刷新（防移动端浏览器长时间挂机内存堆积 / JS 上下文死锁导致卡死）。
// 与 reloader.js 的 delayReload 正交：delayReload 是 action-driven（每次 api_call 起 idle 计时器，eventEnd 清），
// 本模块是 absolute-clock：脚本启动即倒计时 N 分钟无条件 reload，不依赖任何战斗事件。
//
// 设计点：
// - 默认 30 分钟 + 0~1 分钟随机抖动，避免多窗口同步 reload
// - in/out battle 都生效（init.js 两条路径统一调）
// - 单次 setTimeout，reload 后新页面会重新调用 setupPageRefresh 自然续期
//
// 关联：用户提供的 legacy snippet 是独立 UserScript "30分钟间隔刷新,防止移动端页面卡主"，
// 此模块为其在 HVAutoAttack 体系内的等价实现（option 开关 + 可配间隔）。
export function setupPageRefresh(option) {
  if (!option || !option.pageRefresh) return;
  const minutes = Number(option.pageRefreshMinutes) || 30;
  if (minutes <= 0) return;
  const jitter = Math.floor(Math.random() * 2); // 0~1 分钟抖动
  const delayMs = (minutes + jitter) * 60 * 1000;
  setTimeout(() => {
    location.reload();
  }, delayMs);
}
