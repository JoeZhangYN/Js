// 页面跳转 helpers。

/** 重定向当前页面（带 5s 后重试）。 */
export function goto() {
  window.location.href = window.location;
  setTimeout(goto, 5000);
}

/**
 * 打开 URL。
 * @param {string} url
 * @param {boolean=} newTab true → 新标签
 */
export function openUrl(url, newTab) {
  window.open(url, newTab ? "_blank" : "_self");
}
