// GM_xmlhttpRequest 兼容封装（铁律 §1e 应抽未抽 — ≥4 处真重复，同形态同失败模式）。
//
// Sentinel M1 触发：riddle-ml.js gmXhr + 旧 equip-percentile live 跨域请求三处独立实现，
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
 * @property {()=>void=} onabort
 */

/** 任一字符码点 > 0xFF（超出 Latin-1）即返回 true。导出供读取端预判脏值（如 ML API key 自愈）。 */
export function hasNonLatin1(str) {
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 0xff) return true;
  }
  return false;
}

/**
 * 头部名/值必须 Latin-1（码点 ≤ 0xFF）。GM 内部 new Headers() 对非 Latin-1 字符**同步抛**
 * DOMException（onerror status=0 "Failed to construct 'Headers': String contains non
 * ISO-8859-1 code point"）——伪装成网络失败、但请求根本没发出。常见诱因：含中文/全角/
 * 智能引号/零宽字符的值被粘进 apikey 之类的头部。中央闸门提前判定 → 转成可诊断 onerror。
 * @param {object|undefined} headers
 * @returns {string|null} 含脏字符的头部名；null=全部 Latin-1 安全
 */
function findNonLatin1Header(headers) {
  if (!headers) return null;
  for (const [name, value] of Object.entries(headers)) {
    if (hasNonLatin1(name)) return name;
    if (value != null && hasNonLatin1(String(value))) return name;
  }
  return null;
}

/**
 * 跨 GM 实现的 xhr 请求。
 * @param {GmXhrOpts} opts
 */
export function gmXhr(opts) {
  // 中央闸门：非 Latin-1 头部会让 GM 内部 new Headers() 同步抛异常（伪装成网络 onerror、请求未发出）。
  // 提前拦下 → 干净可诊断的 onerror，杜绝把"客户端头部脏字符"误报成"网络/CORS/@connect 未授权"。
  const badHeader = findNonLatin1Header(opts.headers);
  if (badHeader) {
    if (opts.onerror) {
      opts.onerror({
        status: 0,
        statusText: `header "${badHeader}" 含非 ASCII 字符(非 Latin-1)，请求未发出`,
        error: "non_latin1_header",
      });
    }
    return;
  }
  if (typeof GM_xmlhttpRequest !== "undefined") return GM_xmlhttpRequest(opts);
  if (typeof GM !== "undefined" && GM && typeof GM.xmlHttpRequest === "function") {
    return GM.xmlHttpRequest(opts);
  }
  // 兜底：无 GM xhr 环境时触发同步 onerror，调用方 Promise.resolve(null) 链可正常继续
  if (opts.onerror) opts.onerror({ status: 0, statusText: "no GM xhr" });
}
