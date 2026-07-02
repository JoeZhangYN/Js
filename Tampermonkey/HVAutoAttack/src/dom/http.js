// HTTP 请求 helper：XMLHttpRequest 包装，支持 GET/POST + 3 次重试。
// HV 战斗页面用此回拉下一回合数据。
import { gE } from "./query.js";

export const HTTP_REQUEST_FAILURE_KEY = "HVAA:lastHttpRequestFailure";
const HTTP_CAPABILITY = "httpRequest";
const MAX_RETRIES = 3;

function recordHttpRequestFailure(stage, failure) {
  const evidence = { capability: HTTP_CAPABILITY, stage, ...failure };
  try {
    sessionStorage.setItem(HTTP_REQUEST_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // HTTP retry/failure handling must not depend on diagnostic storage.
  }
  try {
    console.warn("[HVAA] HTTP request failed", evidence);
  } catch (_error) {
    // Console hooks must not block HTTP failure callbacks.
  }
  return evidence;
}

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
  const method = parm ? "POST" : "GET";
  const responseType = type || "document";
  let xhr = new window.XMLHttpRequest();
  xhr.open(method, href);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
  xhr.responseType = responseType;
  xhr.onerror = function () {
    xhr = null;
    if (retries < MAX_RETRIES) {
      const retryDelayMs = 1000 * (retries + 1);
      recordHttpRequestFailure("retryScheduled", {
        kind: "networkError",
        href,
        method,
        responseType,
        attempts: retries + 1,
        maxAttempts: MAX_RETRIES + 1,
        retryDelayMs,
      });
      setTimeout(() => post(href, func, parm, type, onFailure, retries + 1), retryDelayMs);
    } else if (typeof onFailure === "function") {
      onFailure(
        recordHttpRequestFailure("finalFailure", {
          kind: "networkError",
          href,
          method,
          responseType,
          attempts: retries + 1,
          maxAttempts: MAX_RETRIES + 1,
        })
      );
    } else {
      recordHttpRequestFailure("finalFailure", {
        kind: "networkError",
        href,
        method,
        responseType,
        attempts: retries + 1,
        maxAttempts: MAX_RETRIES + 1,
      });
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
    } else {
      const failure = recordHttpRequestFailure("finalFailure", {
        kind: "httpStatus",
        href,
        method,
        responseType,
        status: e.target.status,
        response: e.target.response,
      });
      if (typeof onFailure === "function") onFailure(failure);
    }
    xhr = null;
  };
  xhr.send(parm);
}
