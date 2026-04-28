// 时间格式化 helper。
// e=0 → epoch ms；e=1 → "M/D"；e=2 → "Y/M/D"；e=3 → 本地化字符串（24h）。

/**
 * @param {0|1|2|3} e 格式枚举
 * @param {number=} stamp 可选时间戳（ms），缺省取 now
 * @returns {string|number|undefined}
 */
export function time(e, stamp) {
  const date = stamp ? new Date(stamp) : new Date();
  if (e === 0) return date.getTime();
  if (e === 1) return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
  if (e === 2) {
    return `${date.getUTCFullYear()}/${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
  }
  if (e === 3) {
    return date.toLocaleString(navigator.language, { hour12: false });
  }
}
