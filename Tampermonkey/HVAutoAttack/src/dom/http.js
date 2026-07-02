// HTTP 请求 helper：XMLHttpRequest 包装，支持 GET/POST + 3 次重试。
// HV 战斗页面用此回拉下一回合数据。
import { gE } from "./query.js";

/**
 * 发起 HTTP 请求。parm 给则 POST，否则 GET。
 * 失败重试最多 3 次。response 类型默认 "document"，自动接管 #messagebox 替换。
 * @param {string} href URL
 * @param {(data: any, e: ProgressEvent) => void=} func 成功回调
 * @param {string|FormData=} parm POST 体（若给则触发 POST）
 * @param {XMLHttpRequestResponseType=} type 默认 "document"
 * @param {(failure: object) => void=} onFailure 最终失败回调
 * @param {number=} _retries 内部重试计数
 */
export function post(href, func, parm, type, onFailure, _retries) {
  if (typeof onFailure === "number" && _retries === undefined) {
    _retries = onFailure;
    onFailure = undefined;
  }
  const retries = _retries || 0;
  let xhr = new window.XMLHttpRequest();
  xhr.open(parm ? "POST" : "GET", href);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
  xhr.responseType = type || "document";
  xhr.onerror = function () {
    xhr = null;
    if (retries < 3) {
      setTimeout(() => post(href, func, parm, type, onFailure, retries + 1), 1000 * (retries + 1));
    } else if (typeof onFailure === "function") {
      onFailure({ kind: "networkError", href, retries: retries + 1 });
    }
  };
  xhr.onload = function (e) {
    if (e.target.status >= 200 && e.target.status < 400 && typeof func === "function") {
      const data = e.target.response;
      if (xhr.responseType === "document" && gE("#messagebox", data)) {
        if (gE("#messagebox")) {
          gE("#csp").replaceChild(gE("#messagebox", data), gE("#messagebox"));
        } else {
          gE("#csp").appendChild(gE("#messagebox", data));
        }
      }
      func(data, e);
    } else if (typeof onFailure === "function") {
      onFailure({
        kind: "httpStatus",
        href,
        status: e.target.status,
        response: e.target.response,
      });
    }
    xhr = null;
  };
  xhr.send(parm);
}
