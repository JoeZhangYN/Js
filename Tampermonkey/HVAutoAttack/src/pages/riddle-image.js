// 「答题图像获取」能力（riddle 域）。
// 业务概念：从 #riddleimage 拿到答题图——既供 ML 识别(需 Blob 作 POST body)，也供训练样本采集(需同步 dataUrl)。
// 两个消费方：pages/riddle-ml.js(ML POST) + state/riddle-dataset.js←pages/riddle.js(提交时采样)。
// 三级 fallback（参 RMA L79-166）：canvas → fetch(only-if-cached) → fetch(force-cache) → fetch(network)。
import { recordRiddleImageFailure } from "./riddle-image-failure.js";

const EVENT_CAPTURE_SAMPLE = "captureSample";
const EVENT_PREPARE_ML_PAYLOAD = "prepareMlPayload";

export const RiddleImageEvent = Object.freeze({
  CAPTURE_SAMPLE: EVENT_CAPTURE_SAMPLE,
  PREPARE_ML_PAYLOAD: EVENT_PREPARE_ML_PAYLOAD,
});

const riddleImageEventHandlers = Object.freeze({
  [EVENT_CAPTURE_SAMPLE]: () => captureSampleImage(),
  [EVENT_PREPARE_ML_PAYLOAD]: () => prepareMlPayload(),
});

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
      0.95
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

/**
 * 取答题图 Blob（canvas 主路径，失败退 fetch 三级）。ML POST body 用。
 * @param {string} url 图片 src
 * @returns {Promise<Blob>}
 */
async function getImageBlob(url) {
  try {
    return await getImageBlobFromCanvas();
  } catch {
    return await getImageBlobFromFetch(url);
  }
}

/**
 * **同步**捕获当前答题图为 webp dataURL（训练样本采集用）。
 * 同步是刚需：提交即重定向，FileReader/fetch 等异步会被导航杀掉 → 必须 canvas.toDataURL 当场拿到。
 * 格式 webp（用户定 2026-06-06：导出 pony_*.webp）——体积小，Chromium/Firefox 均支持 canvas webp 编码。
 * 跨域污染(tainted canvas)时 toDataURL 抛 → 返 null（样本仅存 json，不致命）。
 * @returns {string|null} "data:image/webp;base64,..." 或 null
 */
function captureRiddleDataUrl() {
  const imgEl = getRiddleImgEl();
  if (!imgEl || !imgEl.naturalWidth) return null;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = imgEl.naturalWidth;
    canvas.height = imgEl.naturalHeight;
    canvas.getContext("2d").drawImage(imgEl, 0, 0);
    return canvas.toDataURL("image/webp", 0.95);
  } catch (error) {
    recordRiddleImageFailure("capture-data-url", { error: error?.message || String(error) });
    return null; // tainted canvas / 同步取不到
  }
}

function captureSampleImage() {
  const imgEl = getRiddleImgEl();
  return {
    imageDataUrl: captureRiddleDataUrl(),
    imageSrc: imgEl?.src,
  };
}

async function prepareMlPayload() {
  const imgEl = getRiddleImgEl();
  const imageUrl = imgEl?.src;
  if (!imageUrl) return null;
  await waitImageLoaded(imgEl);
  let blob = null;
  try {
    blob = await getImageBlob(imageUrl);
  } catch (error) {
    recordRiddleImageFailure("prepare-ml-payload", {
      reason: "blobUnavailable",
      imageUrl,
      error: error?.message || String(error),
    });
    return null;
  }
  return { imageUrl, blob };
}

export function runRiddleImageAutomation(event = { type: EVENT_CAPTURE_SAMPLE }) {
  return riddleImageEventHandlers[event?.type]?.(event);
}
