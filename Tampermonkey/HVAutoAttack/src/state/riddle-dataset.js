// 「带置信度的答题训练样本集」—— 本地训练 ML 用的领域模块。
// 业务概念：一条样本 = {答题图, 提交的答案码, 来源 source, 置信度 confidence, 时间}。
// 业务规则内化(SSOT, 用户定标 2026-06-06)：来源决定置信度——
//   ML 命中 / 人工确认 = 高可信(high)；随机兜底 = 低可信(low)。
//   ★ 调用方只传 source，confidence 由本模块派生，绝不在调用侧散落判定（铁律 §1 业务约束内化进模块）。
// 页面无逐题对错(提交即跳转拿不到 verdict)，故样本不存对错，只存"提交了什么+来源+置信度"，对错靠后期处理。
// 存储：GM 裸 key saved_pony_<ts>（沿用 RMA 兼容，不加 storagePrefix）。
// 导出：core/zip 打成真 pony_<ts>.webp + pony_<ts>.json 包；**导出后默认清除原始记录防重复导出**（用户定 2026-06-06）。
import { makeStoreZip } from "../core/zip.js";
import { TimeEvent, runTimeAutomation } from "../core/time.js";
import {
  dataUrlToBytes,
  imgExt,
  sampleBaseName,
  strBytes,
  toCanonicalSampleJson,
} from "./riddle-dataset-export-format.js";
import { recordRiddleDatasetFailure } from "./riddle-dataset-failure.js";

const SAVE_PREFIX = "pony_";

const EVENT_RECORD_SAMPLE = "recordSample";
const EVENT_EXPORT = "export";
const EVENT_REGISTER_EXPORT_MENU = "registerExportMenu";

export const RiddleDatasetEvent = Object.freeze({
  RECORD_SAMPLE: EVENT_RECORD_SAMPLE,
  EXPORT: EVENT_EXPORT,
  REGISTER_EXPORT_MENU: EVENT_REGISTER_EXPORT_MENU,
});

const riddleDatasetEventHandlers = Object.freeze({
  [EVENT_RECORD_SAMPLE]: (event) => recordRiddleSample(event),
  [EVENT_EXPORT]: () => exportRiddleDataset(),
  [EVENT_REGISTER_EXPORT_MENU]: () => registerExportMenu(),
});

/** 样本来源枚举（调用侧把自身路径映射到这三种之一）。 */
export const RiddleSampleSource = Object.freeze({ ML: "ml", RANDOM: "random", MANUAL: "manual" });

/** 业务规则 SSOT：随机兜底=低可信，其余(ML/人工)=高可信。 */
function confidenceOf(source) {
  return source === RiddleSampleSource.RANDOM ? "low" : "high";
}

function tsStr() {
  return runTimeAutomation({ type: TimeEvent.LOCAL_FILE_TIMESTAMP });
}

/**
 * 采集一条训练样本（无论 ML/随机/人工，只要提交答案就调）。
 * confidence 由 source 派生（规则内化）；imageDataUrl 为空仍存(仅 json，便于后期补图/统计)。
 * 用 GM_setValue 同步写：提交即重定向，异步写会被导航杀掉。
 * @param {{imageDataUrl:string|null, answers:string, source:string, imageSrc?:string}} sample
 */
function recordRiddleSample({ imageDataUrl, answers, source, imageSrc }) {
  if (typeof GM_setValue === "undefined") {
    recordRiddleDatasetFailure("record-missing-gm-set", { answers: answers || "" });
    return;
  }
  const src = source || RiddleSampleSource.MANUAL;
  const key = `saved_${SAVE_PREFIX}${tsStr()}`;
  try {
    GM_setValue(key, {
      json: {
        saved_at: runTimeAutomation({ type: TimeEvent.ISO_TIMESTAMP }),
        source: src,
        confidence: confidenceOf(src),
        answers: answers || "",
        image_src: imageSrc || "unknown",
      },
      imageBase64: imageDataUrl || "",
      timestamp: Date.now(),
    });
  } catch (error) {
    recordRiddleDatasetFailure("record-write", { key, error: error.message });
  }
}

// ---------------- 导出：saved_* → 真 .jpg + .json 的 zip ----------------

/**
 * 把 GM 存储里所有 saved_pony_* 样本打包成单个 zip 下载（每条 → pony_<ts>.webp + pony_<ts>.json）。
 * 手动触发（GM 菜单），规避挂机后台标签页自动下载失效。开箱即用、无需后期解 base64。
 * **导出后默认清除原始 saved_* 记录**（用户定 2026-06-06：防下次重复导出）；zip blob 已在内存、清 GM 不影响下载。
 */
function exportRiddleDataset() {
  if (typeof GM_listValues === "undefined") {
    recordRiddleDatasetFailure("export-missing-gm-list", { reason: "GM_listValues unavailable" });
    return;
  }
  let keys = [];
  try {
    keys = GM_listValues().filter((k) => k.startsWith("saved_"));
  } catch (error) {
    recordRiddleDatasetFailure("export-list", { error: error.message });
    return;
  }
  if (!keys.length) {
    console.info("[HVAA][RMA] 无答题样本可导出");
    return;
  }
  const files = [];
  const exportedKeys = [];
  const used = new Set(); // 防同秒时间戳归一后撞名（zip 内同名会覆盖）
  for (const k of keys) {
    let entry;
    try {
      entry = GM_getValue(k);
    } catch (error) {
      recordRiddleDatasetFailure("export-read", { key: k, error: error.message });
      continue;
    }
    if (!entry) continue;
    exportedKeys.push(k);
    let base = sampleBaseName(k);
    if (used.has(base)) {
      let n = 2;
      while (used.has(`${base}_${n}`)) n++;
      base = `${base}_${n}`;
    }
    used.add(base);
    files.push({
      name: `${base}.json`,
      bytes: strBytes(JSON.stringify(toCanonicalSampleJson(entry), null, 2)),
    });
    const imgBytes = dataUrlToBytes(entry.imageBase64);
    if (imgBytes) files.push({ name: `${base}.${imgExt(entry.imageBase64)}`, bytes: imgBytes });
  }
  if (!exportedKeys.length) {
    console.info("[HVAA][RMA] 无可导出的答题样本");
    return;
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
    for (const k of exportedKeys) {
      try {
        GM_deleteValue(k);
      } catch (error) {
        recordRiddleDatasetFailure("export-delete", { key: k, error: error.message });
      }
    }
  } else {
    recordRiddleDatasetFailure("export-missing-gm-delete", { exported: exportedKeys.length });
  }
  console.info(
    `[HVAA][RMA] 已导出 ${exportedKeys.length} 条答题样本(zip: webp+json)，并清除原始记录(防重复导出)`
  );
}

let exportMenuRegistered = false;
/** 注册 GM 菜单命令「导出答题训练样本(zip)」（脚本启动调一次，全局可用）。 */
function registerExportMenu() {
  if (exportMenuRegistered) return;
  if (typeof GM_registerMenuCommand === "undefined") return;
  exportMenuRegistered = true;
  GM_registerMenuCommand("导出答题训练样本(zip: 图片+json)", exportRiddleDataset);
}

export function runRiddleDatasetAutomation(event) {
  return riddleDatasetEventHandlers[event?.type]?.(event);
}
