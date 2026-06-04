// 页面跳转 helpers。

/** 重定向当前页面（带 5s 后重试）。 */
export function goto() {
  window.location.href = window.location;
  setTimeout(goto, 5000);
}

/**
 * 延时重载页面：sec 秒后调 goto()。收口散落的 `setTimeout(goto, sec*1000)`（probe verify-no-raw-reload 禁裸用）。
 * @param {number} sec 延迟秒数
 * @returns {number} setTimeout 句柄（供 clearTimeout 取消，如 reloader 回合结束取消 delayReload）
 */
export function scheduleReload(sec) {
  return setTimeout(goto, sec * 1000);
}

/**
 * 打开 URL。
 * @param {string} url
 * @param {boolean=} newTab true → 新标签
 */
export function openUrl(url, newTab) {
  window.open(url, newTab ? "_blank" : "_self");
}
