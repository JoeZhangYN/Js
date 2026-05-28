// P6 ML 远程答题（来源：Tampermonkey/HentaiVerse/Riddle Master Assistant Reborn.user.js v0.5.2）
// 暴露：
//   - tryMLAnswer(): Promise<string|null>  返回 ANSWER_MAP key (ts/ra/fs/rd/pp/aj) 或 null
//   - setupRMAHealth()                     30s 健康巡检（init 时调用一次启动）
// 不暴露 saveRiddle / send_head：内部使用。
//
// 复用 riddle.js 的 ANSWER_MAP（需 lead 把 ANSWER_MAP 改 export）。
// GM 存储 key：is_maintenance / is_down / last_awake_ts / last_date / check_interval / extend_submit_interval
//   - 直接用 GM_setValue/GM_getValue（带 prefix 会污染 RMA 兼容性；这里用裸 key 与原 RMA 一致）
// 失败备份 key：saved_<prefix>_<ts>（同 RMA）
// 三级图片 fallback（参 RMA L79-166）：canvas → fetch(only-if-cached) → fetch(force-cache) → fetch(network)
// XHR 兜底通过 GM_xmlhttpRequest 完成（@grant 需加 GM_xmlhttpRequest）
import { g } from "../state/store.js";
import { setAlarm } from "../alarm/alarm.js";
import { gmXhr } from "../dom/gm-xhr.js";
import { ANSWER_MAP } from "./riddle.js";

const ML_ENDPOINT_DEFAULT = "https://rdma.ooguy.com/help2";
const STATUS_ENDPOINT = "https://rdma.ooguy.com/status";
const SAVE_PREFIX = "riddle_";
const ANSWER_CODES = Object.keys(ANSWER_MAP); // ["ts","ra","fs","rd","pp","aj"]

/**
 * GM API 统一封装：优先 GM_*（同步），退到 GM.*（Promise）。
 * 与 src/state/storage.js 不同——本模块不加 storagePrefix，沿用 RMA 的裸 key 兼容已有用户备份。
 */
function gmGet(key, def) {
  if (typeof GM_getValue !== "undefined") {
    const v = GM_getValue(key, def);
    return Promise.resolve(v);
  }
  if (typeof GM !== "undefined" && GM && typeof GM.getValue === "function") {
    return GM.getValue(key, def);
  }
  return Promise.resolve(def);
}

function gmSet(key, val) {
  if (typeof GM_setValue !== "undefined") {
    GM_setValue(key, val);
    return Promise.resolve();
  }
  if (typeof GM !== "undefined" && GM && typeof GM.setValue === "function") {
    return GM.setValue(key, val);
  }
  return Promise.resolve();
}

// gmXhr 已抽到 src/dom/gm-xhr.js（M1 应抽未抽修复）

function tsStr() {
  const d = new Date();
  return (
    d.getFullYear() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0") +
    "_" +
    String(d.getHours()).padStart(2, "0") +
    String(d.getMinutes()).padStart(2, "0") +
    String(d.getSeconds()).padStart(2, "0")
  );
}

function parseRespHeaders(headerStr) {
  const headers = {};
  if (!headerStr) return headers;
  headerStr
    .trim()
    .split(/[\r\n]+/)
    .forEach((line) => {
      const parts = line.split(": ");
      const k = parts.shift().toLowerCase();
      headers[k] = parts.join(": ");
    });
  return headers;
}

// ---------------- 图片获取：canvas → fetch 三级 fallback ----------------

function getImageBlobFromCanvas() {
  return new Promise((resolve, reject) => {
    const imgEl = document.getElementById("riddleimage")?.childNodes?.[0];
    if (!imgEl || !imgEl.naturalWidth) {
      reject(new Error("riddleimage not ready"));
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = imgEl.naturalWidth;
    canvas.height = imgEl.naturalHeight;
    const ctx = canvas.getContext("2d");
    try {
      ctx.drawImage(imgEl, 0, 0);
    } catch (e) {
      reject(e);
      return;
    }
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob null"))),
      "image/jpeg",
      0.95,
    );
  });
}

async function getImageBlobFromFetch(url) {
  // 1) only-if-cached（未命中抛 TypeError，捕获后继续）
  try {
    const res = await fetch(url, {
      method: "GET",
      credentials: "same-origin",
      cache: "only-if-cached",
      mode: "same-origin",
    });
    if (res.status === 200) return await res.blob();
  } catch (_) {
    /* miss */
  }
  // 2) force-cache
  try {
    const res = await fetch(url, {
      method: "GET",
      credentials: "same-origin",
      cache: "force-cache",
      mode: "same-origin",
    });
    if (res.status === 200) return await res.blob();
  } catch (_) {
    /* ignore */
  }
  // 3) network
  const res = await fetch(url, { method: "GET", credentials: "same-origin" });
  if (res.status === 200) return await res.blob();
  throw new Error(`fetch all attempts failed, last status: ${res.status}`);
}

async function getImageBlob(url) {
  try {
    return await getImageBlobFromCanvas();
  } catch (_) {
    return await getImageBlobFromFetch(url);
  }
}

// ---------------- 失败备份（GM_setValue 单通道；无浏览器下载） ----------------

function saveRiddleFailed(imgBlob, resultObj) {
  if (!imgBlob) return;
  const baseName = `${SAVE_PREFIX}${tsStr()}_failed`;
  const enhanced = {
    saved_at: new Date().toISOString(),
    is_failed: true,
    image_src: document.getElementById("riddleimage")?.childNodes?.[0]?.src || "unknown",
    ...resultObj,
  };
  const reader = new FileReader();
  reader.onloadend = () => {
    gmSet(`saved_${baseName}`, {
      json: enhanced,
      imageBase64: reader.result,
      timestamp: Date.now(),
    });
  };
  reader.readAsDataURL(imgBlob);
}

// ---------------- 30s 健康巡检 ----------------

function sendHead() {
  gmXhr({
    method: "HEAD",
    timeout: 30000,
    url: STATUS_ENDPOINT,
    onload: async (response) => {
      const wasMaintenance = await gmGet("is_maintenance", false);
      if (response.status !== 200) {
        if (!wasMaintenance) console.warn("[HVAA][RMA] server maintenance");
        await gmSet("is_maintenance", true);
        await gmSet("check_interval", 60);
      } else {
        if (wasMaintenance) console.info("[HVAA][RMA] server is up");
        await gmSet("is_maintenance", false);
        await gmSet("is_down", false);
        await gmSet("check_interval", 3600);
      }
    },
    onerror: async () => {
      const wasDown = await gmGet("is_down", false);
      if (!wasDown) console.error("[HVAA][RMA] server not respond");
      await gmSet("is_down", true);
      await gmSet("check_interval", 60);
    },
    ontimeout: async () => {
      const wasDown = await gmGet("is_down", false);
      if (!wasDown) console.error("[HVAA][RMA] server timeout");
      await gmSet("is_down", true);
      await gmSet("check_interval", 60);
    },
  });
}

async function stayAwake() {
  const d = new Date();
  const today = `${d.getUTCFullYear()}/${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  const lastDay = await gmGet("last_date", "0/0/0");
  if (today !== lastDay) {
    await gmSet("last_date", today);
    await gmSet("is_maintenance", false);
    await gmSet("is_down", false);
    await gmSet("check_interval", 3600);
  }
  const now = (Date.now() / 1000) | 0;
  const lastTs = await gmGet("last_awake_ts", 0);
  const interval = await gmGet("check_interval", 3600);
  if (now - lastTs >= interval) {
    sendHead();
    await gmSet("last_awake_ts", now);
  }
}

let healthStarted = false;
export function setupRMAHealth() {
  if (healthStarted) return;
  healthStarted = true;
  stayAwake();
  setInterval(stayAwake, 30000);
}

// ---------------- 主入口 tryMLAnswer ----------------

/**
 * 请求 ML 服务拿答案。
 * 命中 → 返回 ANSWER_MAP key（ts/ra/fs/rd/pp/aj）；失败/超时/服务异常 → null（由 riddle.js fallback 随机猜）。
 * 不做提交；提交由 riddle.js 的 riddleSubmit() 完成。
 *
 * @returns {Promise<string|null>}
 */
let inFlight = false;
export async function tryMLAnswer() {
  if (inFlight) return null; // 防同 tick 重入
  const opt = g("option") || {};
  if (!opt.mlAnswer) return null;

  // 维护中 / 宕机 → 跳过远程调用
  const isMaintenance = await gmGet("is_maintenance", false);
  const isDown = await gmGet("is_down", false);
  if (isMaintenance || isDown) return null;

  const endpoint = opt.mlEndpoint || ML_ENDPOINT_DEFAULT;
  const apiKey = opt.mlApiKey || "";
  const backupOnFail = opt.mlBackupOnFail !== false;

  const imageHolder = document.getElementById("riddleimage");
  const imageUrl = imageHolder?.childNodes?.[0]?.src;
  if (!imageUrl) return null;

  inFlight = true;
  try {
    const imgBlob = await getImageBlob(imageUrl);
    if (!imgBlob || imgBlob.size === 0) {
      if (backupOnFail) saveRiddleFailed(imgBlob, { _error: "empty_blob" });
      setAlarm("Error");
      return null;
    }

    const result = await new Promise((resolve) => {
      gmXhr({
        method: "POST",
        timeout: 12000,
        url: endpoint,
        binary: true,
        data: imgBlob,
        headers: {
          "Content-Type": "image/jpeg",
          apikey: apiKey,
        },
        onload: (res) => {
          if (res.status === 429) {
            if (backupOnFail) saveRiddleFailed(imgBlob, { _status: 429 });
            setAlarm("Error");
            resolve(null);
            return;
          }
          let dict;
          try {
            dict = JSON.parse(res.responseText);
          } catch (e) {
            if (backupOnFail) saveRiddleFailed(imgBlob, { _parse_error: e.message });
            setAlarm("Error");
            resolve(null);
            return;
          }
          if (dict.return === "good") {
            // RMA 服务可能返回多字符（"ts,ra"）；这里只取首个命中
            const answers = (dict.answer || "").toLowerCase();
            const hit = ANSWER_CODES.find((code) => answers.includes(code));
            if (!hit) {
              if (backupOnFail)
                saveRiddleFailed(imgBlob, { _reason: "no_answer_code_in_response", raw: dict });
              setAlarm("Error");
              resolve(null);
              return;
            }
            // ratelimit 提示（仅日志，不阻断）
            const headers = parseRespHeaders(res.responseHeaders);
            const remaining = parseInt(headers["x-ratelimit-remaining"] || "999", 10);
            if (remaining < 3) {
              console.warn(`[HVAA][RMA] ratelimit remaining ${remaining}`);
            }
            resolve(hit);
            return;
          }
          if (dict.return === "finish") {
            console.warn("[HVAA][RMA] no more solves today");
            if (backupOnFail) saveRiddleFailed(imgBlob, dict);
            setAlarm("Error");
            resolve(null);
            return;
          }
          if (dict.return === "error" || dict.expire === true) {
            console.warn("[HVAA][RMA] server error / license issue", dict);
            if (backupOnFail) saveRiddleFailed(imgBlob, dict);
            setAlarm("Error");
            resolve(null);
            return;
          }
          if (backupOnFail) saveRiddleFailed(imgBlob, { _reason: "unknown_return", raw: dict });
          setAlarm("Error");
          resolve(null);
        },
        onerror: () => {
          if (backupOnFail) saveRiddleFailed(imgBlob, { _onerror: true });
          setAlarm("Error");
          resolve(null);
        },
        ontimeout: () => {
          if (backupOnFail) saveRiddleFailed(imgBlob, { _timeout: true });
          setAlarm("Error");
          resolve(null);
        },
      });
    });

    if (result === null) return null;

    // document.hasFocus() 区分前后台延迟（不阻塞 tryMLAnswer 返回）
    // 调用方 riddle.js 拿到 key 后立刻调 riddleSubmit；
    // 这里 hasFocus 决定 RMA 风格的「人类抖动延迟」是否生效。
    // 因为提交动作不在本模块内执行，仅记录 extend_submit_interval 供调用方参考。
    return result;
  } catch (err) {
    console.error("[HVAA][RMA] tryMLAnswer error", err);
    setAlarm("Error");
    return null;
  } finally {
    inFlight = false;
  }
}
