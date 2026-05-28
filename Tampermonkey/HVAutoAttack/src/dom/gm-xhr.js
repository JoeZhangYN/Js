// GM_xmlhttpRequest 兼容封装（铁律 §1e 应抽未抽 — ≥4 处真重复，同形态同失败模式）。
//
// Sentinel M1 触发：riddle-ml.js gmXhr + equip-percentile-live.js get/post/sendThisPage 三处独立实现，
// 都做 GM_xmlhttpRequest 优先 → GM.xmlHttpRequest（Greasemonkey API 变种）fallback → 都没则 onerror。
//
// 在 Tampermonkey/Violentmonkey/Greasemonkey 多 GM 实现间提供单一稳定 API。
// 失败模式（无 GM xhr 环境，极少见）触发同步 onerror({status:0, statusText:"no GM xhr"})。
//
// 与原生 fetch() 的差异：
// - GM xhr 可跨域（@connect 白名单内）—— fetch 受 CORS 限制
// - 故跨域 POST 必走本模块；同域请求两者皆可，统一用本模块降低分支

/**
 * @typedef {object} GmXhrOpts
 * @property {string} method
 * @property {string} url
 * @property {*=} data POST body (Blob / string / FormData)
 * @property {boolean=} binary 二进制 body 标记（Tampermonkey 需要）
 * @property {object=} headers
 * @property {string=} responseType "blob"|"json"|"text"|"document" 等
 * @property {number=} timeout 毫秒
 * @property {(resp:{status:number,statusText:string,response:*,responseText:string,responseHeaders:string})=>void=} onload
 * @property {(err:{status:number,statusText:string,error?:string})=>void=} onerror
 * @property {()=>void=} ontimeout
 */

/**
 * 跨 GM 实现的 xhr 请求。
 * @param {GmXhrOpts} opts
 */
export function gmXhr(opts) {
  if (typeof GM_xmlhttpRequest !== "undefined") return GM_xmlhttpRequest(opts);
  if (typeof GM !== "undefined" && GM && typeof GM.xmlHttpRequest === "function") {
    return GM.xmlHttpRequest(opts);
  }
  // 兜底：无 GM xhr 环境时触发同步 onerror，调用方 Promise.resolve(null) 链可正常继续
  if (opts.onerror) opts.onerror({ status: 0, statusText: "no GM xhr" });
}
