// 页面导航副作用：唯一对外入口 runNavigationAutomation(event)。

const EVENT_RELOAD_NOW = "reloadNow";
const EVENT_SCHEDULE_RELOAD = "scheduleReload";
const EVENT_OPEN_URL = "openUrl";
const EVENT_OPEN_WINDOW = "openWindow";

export const NavigationEvent = Object.freeze({
  RELOAD_NOW: EVENT_RELOAD_NOW,
  SCHEDULE_RELOAD: EVENT_SCHEDULE_RELOAD,
  OPEN_URL: EVENT_OPEN_URL,
  OPEN_WINDOW: EVENT_OPEN_WINDOW,
});

/** 重定向当前页面（带 5s 后重试）。 */
function goto() {
  window.location.href = window.location;
  setTimeout(goto, 5000);
}

/**
 * 延时重载页面。
 * @returns {number} setTimeout 句柄（供 clearTimeout 取消，如 reloader 回合结束取消 delayReload）
 */
function scheduleReload(event) {
  let delayMs;
  if (typeof event.milliseconds !== "undefined") delayMs = event.milliseconds;
  else if (typeof event.seconds !== "undefined") delayMs = event.seconds * 1000;
  else if (typeof event.minutes !== "undefined") delayMs = event.minutes * 60 * 1000;
  else return false;
  return setTimeout(goto, delayMs);
}

/**
 * 打开 URL。
 * @param {string} url
 * @param {boolean=} newTab true -> 新标签
 */
function openUrl(url, newTab) {
  window.open(url, newTab ? "_blank" : "_self");
}

function openWindow(url, name, features) {
  return window.open(url, name, features);
}

export function runNavigationAutomation(event = { type: EVENT_RELOAD_NOW }) {
  if (event.type === EVENT_RELOAD_NOW) {
    goto();
    return true;
  }
  if (event.type === EVENT_SCHEDULE_RELOAD) {
    return scheduleReload(event);
  }
  if (event.type === EVENT_OPEN_URL) {
    openUrl(event.url, event.newTab);
    return true;
  }
  if (event.type === EVENT_OPEN_WINDOW) {
    return openWindow(event.url, event.name, event.features);
  }
  return false;
}
