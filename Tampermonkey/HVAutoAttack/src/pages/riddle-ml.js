// file-size-gate: exempt 移植自 Riddle Master Assistant Reborn 独立脚本-自包含功能
// P6 ML 远程答题（来源：Tampermonkey/HentaiVerse/Riddle Master Assistant Reborn.user.js v0.5.2）
// 暴露：
//   - tryMLAnswer(): Promise<string[]|null>  返回命中的 ANSWER_MAP key 数组(多答案题多只) 或 null
//   - setupRMAHealth()                     30s 健康巡检（init 时调用一次启动）
// 不暴露 saveRiddle / send_head：内部使用。
//
// 复用 data/riddle-answers.js 的 ANSWER_MAP（已下沉叶子层，断开与 riddle.js 的循环依赖 TDZ）。
// GM 存储 key：is_maintenance / is_down / last_awake_ts / last_date / check_interval / extend_submit_interval
//   - 直接用 GM_setValue/GM_getValue（带 prefix 会污染 RMA 兼容性；这里用裸 key 与原 RMA 一致）
// 失败备份 key：saved_<prefix>_<ts>（同 RMA）
// 三级图片 fallback（参 RMA L79-166）：canvas → fetch(only-if-cached) → fetch(force-cache) → fetch(network)
// XHR 兜底通过 GM_xmlhttpRequest 完成（@grant 需加 GM_xmlhttpRequest）
import { g } from "../state/store.js";
import { setAlarm } from "../alarm/alarm.js";
import { gmXhr } from "../dom/gm-xhr.js";
import { ANSWER_MAP } from "../data/riddle-answers.js";

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

/**
 * 取 riddle 图片 <img> 元素。
 * 优先 querySelector("img")（跳过 #riddleimage 内可能的空白文本节点 / HV UI 改版），
 * fallback childNodes[0]（原 RMA 写法，兼容旧 DOM）。
 * @returns {HTMLImageElement|null}
 */
function getRiddleImgEl() {
  const holder = document.getElementById("riddleimage");
  return holder?.querySelector("img") || holder?.childNodes?.[0] || null;
}

/**
 * 等 <img> 解码完成（complete && naturalWidth>0），canvas 主路径（最可靠）才能 drawImage。
 * 超时（默认 4s）/ error 也 resolve —— 让调用侧继续，由 fetch 兜底，绝不卡住。
 * 修 H-C：入口 @run-at document-end 时图片常未解码（naturalWidth=0），原代码直接退化到 fetch。
 * @param {HTMLImageElement|null} imgEl
 * @param {number} timeoutMs
 * @returns {Promise<void>}
 */
function waitImageLoaded(imgEl, timeoutMs = 4000) {
  return new Promise((resolve) => {
    if (!imgEl || (imgEl.complete && imgEl.naturalWidth)) {
      resolve();
      return;
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    imgEl.addEventListener("load", finish, { once: true });
    imgEl.addEventListener("error", finish, { once: true });
    setTimeout(finish, timeoutMs);
  });
}

function getImageBlobFromCanvas() {
  return new Promise((resolve, reject) => {
    const imgEl = getRiddleImgEl();
    if (!imgEl || !imgEl.naturalWidth) {
      reject(new Error("riddleimage not ready (naturalWidth=0)"));
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
  } catch {
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
  } catch {
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
  } catch {
    return await getImageBlobFromFetch(url);
  }
}

// ---------------- 失败备份（GM_setValue 单通道；无浏览器下载） ----------------

// 保存答题图片+json 到 GM 存储（成功 isFailed=false / 失败 true，对齐原 RMA saveRiddle）。
// 仅 GM 单通道（挂机多在后台标签页，<a>.click() 自动下载在后台失效）；批量取出用 exportSavedRiddles()。
function saveRiddle(imgBlob, resultObj, isFailed = true) {
  if (!imgBlob) return;
  const baseName = `${SAVE_PREFIX}${tsStr()}${isFailed ? "_failed" : ""}`;
  const enhanced = {
    saved_at: new Date().toISOString(),
    is_failed: isFailed,
    image_src: getRiddleImgEl()?.src || "unknown",
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
 * 命中 → 返回命中的 ANSWER_MAP key 数组（多答案题多只小马同现，故返全部命中）；失败/超时/服务异常 → null（由 riddle.js fallback 随机猜）。
 * 不做提交；提交由 riddle.js 的 riddleSubmit() 完成。
 *
 * @returns {Promise<string[]|null>}
 */
let inFlight = false;
export async function tryMLAnswer() {
  if (inFlight) return null; // 防同 tick 重入
  const opt = g("option") || {};
  // defaultOn 语义：与调用侧 riddle.js isOptionOn("mlAnswer") 一致（缺字段=开，仅显式 false 才关）。
  // 修 H-B：原 `!opt.mlAnswer` 把老配置缺字段误判为关 → 调用侧以为开、这里立刻 bail → 必随机。
  if (opt.mlAnswer === false) {
    console.warn("[HVAA][RMA] mlAnswer 显式关闭，跳过 ML 识别（走随机）");
    return null;
  }

  // 修 H-A（主因）：不再因 is_maintenance/is_down 闸门提前 return。
  // 对齐原版 RMA v0.5.2——总是尝试 POST，真失败交给下方 onerror/ontimeout + 调用侧随机兜底。
  // 这两个标志降级为纯遥测：原 bug 是后台标签页健康巡检 HEAD 超时置 is_down=true 后，
  // 当天每道题都被闸门挡死走随机（且巡检只在 riddle 页跑、极少刷新 → 长期卡死）。
  const isMaintenance = await gmGet("is_maintenance", false);
  const isDown = await gmGet("is_down", false);
  if (isMaintenance || isDown) {
    console.warn("[HVAA][RMA] 健康巡检此前标记服务异常(maintenance/down)，仍尝试本次识别");
  }

  const endpoint = opt.mlEndpoint || ML_ENDPOINT_DEFAULT;
  const apiKey = opt.mlApiKey || "";
  const backupOnFail = opt.mlBackupOnFail !== false;

  // 修 H-C 辅助：鲁棒取 <img>（querySelector 跳过文本节点，fallback childNodes[0]）
  const imgEl = getRiddleImgEl();
  const imageUrl = imgEl?.src;
  if (!imageUrl) {
    console.warn("[HVAA][RMA] 找不到 riddle 图片元素/src，跳过 ML 识别（走随机）");
    return null;
  }

  inFlight = true;
  try {
    // 等图片解码完成，canvas 主路径（最可靠）才能用；超时静默退到 fetch 兜底
    await waitImageLoaded(imgEl);
    const imgBlob = await getImageBlob(imageUrl);
    if (!imgBlob || imgBlob.size === 0) {
      console.warn("[HVAA][RMA] 图片 blob 为空(canvas 污染/fetch 失败)，本次走随机");
      if (backupOnFail) saveRiddle(imgBlob, { _error: "empty_blob" });
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
            console.warn("[HVAA][RMA] 429 限流，本次走随机");
            if (backupOnFail) saveRiddle(imgBlob, { _status: 429 });
            setAlarm("Error");
            resolve(null);
            return;
          }
          let dict;
          try {
            dict = JSON.parse(res.responseText);
          } catch (e) {
            console.warn("[HVAA][RMA] 响应非 JSON，本次走随机:", res.status, e.message);
            if (backupOnFail) saveRiddle(imgBlob, { _parse_error: e.message });
            setAlarm("Error");
            resolve(null);
            return;
          }
          if (dict.return === "good") {
            // HV 答题常多只小马同现（多答案不少见）→ 取响应里全部命中的答案码，调用侧勾选多个 checkbox。
            // filter+includes 兼容服务端 "ts,ra" / "tsra" 等格式（6 个码 ts/ra/fs/rd/pp/aj 互不为子串，无误配）。
            const answers = (dict.answer || "").toLowerCase();
            const hits = ANSWER_CODES.filter((code) => answers.includes(code));
            if (!hits.length) {
              console.warn("[HVAA][RMA] 响应无可识别答案码，本次走随机:", dict);
              if (backupOnFail)
                saveRiddle(imgBlob, { _reason: "no_answer_code_in_response", raw: dict });
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
            // 成功识别也保存（积累正确样本，对齐原 RMA line 427）；受 mlBackupOnFail 统一控制
            if (backupOnFail) saveRiddle(imgBlob, dict, false);
            resolve(hits);
            return;
          }
          if (dict.return === "finish") {
            console.warn("[HVAA][RMA] no more solves today");
            if (backupOnFail) saveRiddle(imgBlob, dict);
            setAlarm("Error");
            resolve(null);
            return;
          }
          if (dict.return === "error" || dict.expire === true) {
            console.warn("[HVAA][RMA] server error / license issue", dict);
            if (backupOnFail) saveRiddle(imgBlob, dict);
            setAlarm("Error");
            resolve(null);
            return;
          }
          console.warn("[HVAA][RMA] 未知 return 字段，本次走随机:", dict);
          if (backupOnFail) saveRiddle(imgBlob, { _reason: "unknown_return", raw: dict });
          setAlarm("Error");
          resolve(null);
        },
        onerror: () => {
          console.warn("[HVAA][RMA] POST onerror（网络/CORS/@connect 未授权），本次走随机");
          if (backupOnFail) saveRiddle(imgBlob, { _onerror: true });
          setAlarm("Error");
          resolve(null);
        },
        ontimeout: () => {
          console.warn("[HVAA][RMA] POST 超时(>12s)，本次走随机");
          if (backupOnFail) saveRiddle(imgBlob, { _timeout: true });
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

// ---------------- 导出：批量取出 GM 存储的答题备份 ----------------

/**
 * 把 GM 存储里所有 saved_* 备份打包成单个 JSON 文件下载。
 * 手动触发（GM 菜单命令 registerExportMenu），规避挂机后台标签页自动下载失效。
 */
export function exportSavedRiddles() {
  if (typeof GM_listValues === "undefined") {
    console.warn("[HVAA][RMA] GM_listValues 不可用，无法导出");
    return;
  }
  const keys = GM_listValues().filter((k) => k.startsWith("saved_"));
  if (!keys.length) {
    console.info("[HVAA][RMA] 无答题备份可导出");
    return;
  }
  const bundle = {};
  for (const k of keys) bundle[k] = GM_getValue(k);
  const blob = new Blob([JSON.stringify(bundle)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = `riddle_backups_${tsStr()}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
  console.info(`[HVAA][RMA] 已导出 ${keys.length} 条答题备份`);
}

let exportMenuRegistered = false;
/** 注册 GM 菜单命令「导出答题备份」（脚本启动调一次，全局可用）。 */
export function registerExportMenu() {
  if (exportMenuRegistered) return;
  if (typeof GM_registerMenuCommand === "undefined") return;
  exportMenuRegistered = true;
  GM_registerMenuCommand("导出答题备份(图片+json)", exportSavedRiddles);
}
