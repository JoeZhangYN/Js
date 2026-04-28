// 对象/数组工具函数。

/**
 * 从对象数组中提取并去重 key 集合。
 * @param {object[]} objArr
 * @param {string=} prop 若给则取 item[prop] 的 keys，否则取 item 自身的 keys
 * @returns {string[]}
 */
export function getKeys(objArr, prop) {
  const keys = objArr.flatMap((item) => Object.keys(prop ? item[prop] : item));
  return [...new Set(keys)].sort();
}

/**
 * 按 key 字典序排序对象（返回新对象）。
 * @template T
 * @param {Record<string, T>} obj
 * @returns {Record<string, T>}
 */
export function objSort(obj) {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
}
