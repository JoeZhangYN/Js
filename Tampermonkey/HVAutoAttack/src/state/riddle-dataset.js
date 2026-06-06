// 「带置信度的答题训练样本集」—— 本地训练 ML 用的领域模块。
// 业务概念：一条样本 = {答题图, 提交的答案码, 来源 source, 置信度 confidence, 时间}。
// 业务规则内化(SSOT, 用户定标 2026-06-06)：来源决定置信度——
//   ML 命中 / 人工确认 = 高可信(high)；随机兜底 = 低可信(low)。
//   ★ 调用方只传 source，confidence 由本模块派生，绝不在调用侧散落判定（铁律 §1 业务约束内化进模块）。
// 页面无逐题对错(提交即跳转拿不到 verdict)，故样本不存对错，只存"提交了什么+来源+置信度"，对错靠后期处理。
// 存储：GM 裸 key saved_pony_<ts>（沿用 RMA 兼容，不加 storagePrefix）。
// 导出：core/zip 打成真 pony_<ts>.webp + pony_<ts>.json 包；**导出后默认清除原始记录防重复导出**（用户定 2026-06-06）。
import { makeStoreZip } from "../core/zip.js";

const SAVE_PREFIX = "pony_";

/** 样本来源枚举（调用侧把自身路径映射到这三种之一）。 */
export const SAMPLE_SOURCE = { ML: "ml", RANDOM: "random", MANUAL: "manual" };

/** 业务规则 SSOT：随机兜底=低可信，其余(ML/人工)=高可信。 */
function confidenceOf(source) {
  return source === SAMPLE_SOURCE.RANDOM ? "low" : "high";
}

function tsStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  // 形如 2025-01-21_07-09-15（导出文件名 pony_<ts>.webp 直接用，人读友好、文件系统安全）。
  return (
    d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) +
    "_" + p(d.getHours()) + "-" + p(d.getMinutes()) + "-" + p(d.getSeconds())
  );
}

/**
 * 采集一条训练样本（无论 ML/随机/人工，只要提交答案就调）。
 * confidence 由 source 派生（规则内化）；imageDataUrl 为空仍存(仅 json，便于后期补图/统计)。
 * 用 GM_setValue 同步写：提交即重定向，异步写会被导航杀掉。
 * @param {{imageDataUrl:string|null, answers:string, source:string, imageSrc?:string}} sample
 */
export function recordRiddleSample({ imageDataUrl, answers, source, imageSrc }) {
  if (typeof GM_setValue === "undefined") return; // 同步样本写依赖 GM_setValue(TM)；GM.* 异步过不了跳转
  const src = source || SAMPLE_SOURCE.MANUAL;
  GM_setValue(`saved_${SAVE_PREFIX}${tsStr()}`, {
    json: {
      saved_at: new Date().toISOString(),
      source: src,
      confidence: confidenceOf(src),
      answers: answers || "",
      image_src: imageSrc || "unknown",
    },
    imageBase64: imageDataUrl || "",
    timestamp: Date.now(),
  });
}

// ---------------- 导出：saved_* → 真 .jpg + .json 的 zip ----------------

/** dataURL → 字节（解 base64）。非法/空返 null。 */
function dataUrlToBytes(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return null;
  try {
    const bin = atob(dataUrl.slice(comma + 1));
    const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u;
  } catch {
    return null;
  }
}

function strBytes(str) {
  return new TextEncoder().encode(str);
}

/**
 * 把一条存储记录的 json 归一成**新 schema**（导出时统一，旧记录无损「重建」、幂等）。
 * - 新记录（已有 source）：原样返回。
 * - 旧记录（is_failed/return/answer 数组）：迁移 →
 *     answer:["ra","aj"] → answers:"ra,aj"；is_failed=false→confidence high、true→low；
 *     source 统一 "ml"（旧批均 ML 诊断保存）；原始 return/is_failed/expire 收进 legacy 保留可追溯。
 * @param {{json?:object, timestamp?:number}} entry
 */
function toCanonicalSampleJson(entry) {
  const j = (entry && entry.json) || {};
  if (j.source) return j; // 已是新 schema
  const answers = Array.isArray(j.answer) ? j.answer.join(",") : j.answer || j.answers || "";
  const failed = j.is_failed === true;
  return {
    saved_at: j.saved_at || (entry && entry.timestamp ? new Date(entry.timestamp).toISOString() : ""),
    source: "ml", // 旧批均为 ML 远程识别的诊断保存
    confidence: failed ? "low" : "high", // is_failed 真→低可信(ML 失败)，假→高可信(ML 命中)
    answers,
    image_src: j.image_src || "unknown",
    legacy: { return: j.return, is_failed: j.is_failed, expire: j.expire }, // 原始诊断字段留痕
  };
}

/** 从 dataURL 的 mime 推扩展名（image/webp→webp, image/jpeg→jpg, 其它原样；缺省 webp）。 */
function imgExt(dataUrl) {
  const m = /^data:image\/(\w+)/.exec(dataUrl || "");
  if (!m) return "webp";
  return m[1] === "jpeg" ? "jpg" : m[1];
}

/**
 * 导出文件名归一：不论存储 key 是旧 saved_riddle_20260528_023853（无短横）还是新
 * saved_pony_2026-06-06_03-28-40，一律输出 pony_YYYY-MM-DD_HH-MM-SS，zip 内格式一致。
 * 拿不到 14 位时间戳时兜底原样加 pony_ 前缀。
 */
function sampleBaseName(key) {
  const raw = key.replace(/^saved_/, "").replace(/^(pony_|riddle_)/, "");
  const d = raw.replace(/\D/g, ""); // YYYYMMDDHHMMSS
  if (d.length >= 14) {
    return `pony_${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}_${d.slice(8, 10)}-${d.slice(10, 12)}-${d.slice(12, 14)}`;
  }
  return `pony_${raw}`;
}

/**
 * 把 GM 存储里所有 saved_pony_* 样本打包成单个 zip 下载（每条 → pony_<ts>.webp + pony_<ts>.json）。
 * 手动触发（GM 菜单），规避挂机后台标签页自动下载失效。开箱即用、无需后期解 base64。
 * **导出后默认清除原始 saved_* 记录**（用户定 2026-06-06：防下次重复导出）；zip blob 已在内存、清 GM 不影响下载。
 */
export function exportRiddleDataset() {
  if (typeof GM_listValues === "undefined") {
    console.warn("[HVAA][RMA] GM_listValues 不可用，无法导出");
    return;
  }
  const keys = GM_listValues().filter((k) => k.startsWith("saved_"));
  if (!keys.length) {
    console.info("[HVAA][RMA] 无答题样本可导出");
    return;
  }
  const files = [];
  const used = new Set(); // 防同秒时间戳归一后撞名（zip 内同名会覆盖）
  for (const k of keys) {
    const entry = GM_getValue(k);
    if (!entry) continue;
    let base = sampleBaseName(k);
    if (used.has(base)) {
      let n = 2;
      while (used.has(`${base}_${n}`)) n++;
      base = `${base}_${n}`;
    }
    used.add(base);
    files.push({ name: `${base}.json`, bytes: strBytes(JSON.stringify(toCanonicalSampleJson(entry), null, 2)) });
    const imgBytes = dataUrlToBytes(entry.imageBase64);
    if (imgBytes) files.push({ name: `${base}.${imgExt(entry.imageBase64)}`, bytes: imgBytes });
  }
  const blob = makeStoreZip(files);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = `pony_dataset_${tsStr()}.zip`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
  // 默认清除原始记录（防重复导出）。GM_deleteValue 不可用则跳过，不阻断下载。
  if (typeof GM_deleteValue !== "undefined") {
    for (const k of keys) GM_deleteValue(k);
  }
  console.info(`[HVAA][RMA] 已导出 ${keys.length} 条答题样本(zip: webp+json)，并清除原始记录(防重复导出)`);
}

let exportMenuRegistered = false;
/** 注册 GM 菜单命令「导出答题训练样本(zip)」（脚本启动调一次，全局可用）。 */
export function registerExportMenu() {
  if (exportMenuRegistered) return;
  if (typeof GM_registerMenuCommand === "undefined") return;
  exportMenuRegistered = true;
  GM_registerMenuCommand("导出答题训练样本(zip: 图片+json)", exportRiddleDataset);
}
