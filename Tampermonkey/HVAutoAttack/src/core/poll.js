// 轮询调度 helper。
//
// 收口散落的 `const f=()=>{ if(!cond) setTimeout(f,200); else <act> }; f();` 手写轮询惯用式
// （idle-arena 等 4 token / repair-check 等 json 释放，语义不同但同为「每 N ms 重试直到条件满足」）。
// 副作用经返回的 Promise 显式化：resolve 于 predicate 首次为真。

/**
 * 每 intervalMs 轮询 predicate，直到其返回真值，然后 resolve。
 * @param {() => boolean} predicate 判定函数（真 → 停止轮询并 resolve）
 * @param {number} [intervalMs=200] 轮询间隔（毫秒）
 * @returns {Promise<void>} predicate 首次为真时 resolve
 */
export function pollUntil(predicate, intervalMs = 200) {
  return new Promise((resolve) => {
    const tick = () => {
      if (predicate()) {
        resolve();
      } else {
        setTimeout(tick, intervalMs);
      }
    };
    tick();
  });
}
