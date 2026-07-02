// file-size-gate: exempt 移植自 Riddle Master Assistant Reborn 独立脚本-自包含功能
// P6 ML 远程答题（来源：Tampermonkey/HentaiVerse/Riddle Master Assistant Reborn.user.js v0.5.2）
// 暴露：runRiddleMlAutomation(event)
// 本模块仅做「ML 识别」：图片获取已抽到 pages/riddle-image.js；训练样本保存/导出已抽到
//   state/riddle-dataset.js（保存统一在「提交动作」riddle.js #riddlesubmit hook 采样）。本模块不再存图。
//
// 复用 data/riddle-answers.js 的 ANSWER_MAP（已下沉叶子层，断开与 riddle.js 的循环依赖 TDZ）。
// GM 存储 key：is_maintenance / is_down / last_awake_ts / last_date / check_interval / extend_submit_interval
//   - 直接用 GM_setValue/GM_getValue（带 prefix 会污染 RMA 兼容性；这里用裸 key 与原 RMA 一致）
// XHR 兜底通过 GM_xmlhttpRequest 完成（@grant 需加 GM_xmlhttpRequest）
import { AlarmEvent, runAlarmAutomation } from "../alarm/alarm.js";
import { gmXhr, hasNonLatin1 } from "../dom/gm-xhr.js";
import { ANSWER_MAP } from "../data/riddle-answers.js";
import { RiddleStatsEvent, runRiddleStatsAutomation } from "../state/riddle-stats.js";
import { RiddleImageEvent, runRiddleImageAutomation } from "./riddle-image.js";
import { TimeEvent, runTimeAutomation } from "../core/time.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";

const ML_ENDPOINT_DEFAULT = "https://rdma.ooguy.com/help2";
const STATUS_ENDPOINT = "https://rdma.ooguy.com/status";
const ANSWER_CODES = Object.keys(ANSWER_MAP); // ["ts","ra","fs","rd","pp","aj"]
const EVENT_START_HEALTH = "startHealth";
const EVENT_TRY_ANSWER = "tryAnswer";

export const RIDDLE_ML_HEALTH_FAILURE_KEY = "HVAA:lastRiddleMlHealthFailure";
export const RIDDLE_ML_ANSWER_FAILURE_KEY = "HVAA:lastRiddleMlAnswerFailure";

export const RiddleMlEvent = Object.freeze({
  START_HEALTH: EVENT_START_HEALTH,
  TRY_ANSWER: EVENT_TRY_ANSWER,
});

const RIDDLE_ML_ANSWER_FLOW_STEPS = [
  readRiddleMlAnswerOptions,
  ensureRiddleMlAnswerEnabled,
  notePreviousRiddleMlHealthState,
  normalizeRiddleMlApiKey,
  prepareRiddleMlPayload,
  submitRiddleMlPayload,
  resolveRiddleMlAnswerResult,
];

function reportMlDetail(detail) {
  return runRiddleStatsAutomation({ type: RiddleStatsEvent.RECORD_DETAIL, detail });
}

function reportMlOutcome(outcome) {
  return runRiddleStatsAutomation({ type: RiddleStatsEvent.RECORD_OUTCOME, outcome });
}

function triggerErrorAlarm() {
  runAlarmAutomation({ type: AlarmEvent.TRIGGER, kind: "Error" });
}

function mlHealthErrorText(error) {
  return error?.message || String(error);
}

function recordRiddleMlHealthFailure(stage, reason, detail = {}) {
  const evidence = {
    capability: "riddleMlHealth",
    stage,
    reason,
    ...detail,
  };
  try {
    globalThis.sessionStorage?.setItem(RIDDLE_ML_HEALTH_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // Health recovery must not depend on diagnostic storage.
  }
  try {
    console.warn("[HVAA][RMA] health check failed", evidence);
  } catch (_error) {
    // Console hooks are diagnostic only.
  }
  return evidence;
}

function recordRiddleMlAnswerFallback(stage, reason, detail = {}) {
  const evidence = {
    capability: "riddleMlAnswer",
    stage,
    reason,
    fallback: "random",
    ...detail,
  };
  try {
    globalThis.sessionStorage?.setItem(RIDDLE_ML_ANSWER_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // Random answer fallback must not depend on diagnostic storage.
  }
  try {
    console.warn("[HVAA][RMA] ML answer fallback", evidence);
  } catch (_error) {
    // Console hooks are diagnostic only.
  }
  return evidence;
}

function runRiddleMlAnswerFallbackDiagnostic(stage, run) {
  try {
    run();
  } catch (error) {
    recordRiddleMlAnswerFallback(stage, "diagnosticFailed", { error: mlHealthErrorText(error) });
  }
}

function warnRiddleMlAnswerConsole(method, ...args) {
  runRiddleMlAnswerFallbackDiagnostic("answerConsole", () => console[method](...args));
}

function warnRiddleMlHealthConsole(method, ...args) {
  try {
    console[method](...args);
  } catch (error) {
    recordRiddleMlHealthFailure("healthConsole", "consoleFailed", {
      method,
      error: mlHealthErrorText(error),
    });
  }
}

function readMlOptions() {
  return {
    mlAnswer: runOptionAutomation({
      type: OptionEvent.READ_FIELD,
      key: "mlAnswer",
      fallback: true,
    }),
    mlEndpoint: runOptionAutomation({
      type: OptionEvent.READ_FIELD,
      key: "mlEndpoint",
      fallback: ML_ENDPOINT_DEFAULT,
    }),
    mlApiKey: runOptionAutomation({
      type: OptionEvent.READ_FIELD,
      key: "mlApiKey",
      fallback: "",
    }),
  };
}

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

async function readRiddleMlHealthValue(stage, key, fallback) {
  try {
    return await gmGet(key, fallback);
  } catch (error) {
    recordRiddleMlHealthFailure(stage, "gmGetFailed", { key, error: mlHealthErrorText(error) });
    return fallback;
  }
}

async function writeRiddleMlHealthValue(stage, key, value) {
  try {
    await gmSet(key, value);
    return true;
  } catch (error) {
    recordRiddleMlHealthFailure(stage, "gmSetFailed", { key, error: mlHealthErrorText(error) });
    return false;
  }
}

// gmXhr 已抽到 src/dom/gm-xhr.js（M1 应抽未抽修复）

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

// 图片获取已抽到 pages/riddle-image.js，ML 只请求“可 POST 的图片负载”。
// 答题样本保存(saveRiddle) 已抽到 state/riddle-dataset.js 并改为「提交动作」统一采样。

// ---------------- 30s 健康巡检 ----------------

function sendHead() {
  try {
    gmXhr({
      method: "HEAD",
      timeout: 30000,
      url: STATUS_ENDPOINT,
      onload: async (response) => {
        const wasMaintenance = await readRiddleMlHealthValue("headOnload", "is_maintenance", false);
        if (response.status !== 200) {
          recordRiddleMlHealthFailure("headOnload", "nonOkStatus", { status: response.status });
          if (!wasMaintenance) warnRiddleMlHealthConsole("warn", "[HVAA][RMA] server maintenance");
          await writeRiddleMlHealthValue("headOnload", "is_maintenance", true);
          await writeRiddleMlHealthValue("headOnload", "check_interval", 60);
        } else {
          if (wasMaintenance) warnRiddleMlHealthConsole("info", "[HVAA][RMA] server is up");
          await writeRiddleMlHealthValue("headOnload", "is_maintenance", false);
          await writeRiddleMlHealthValue("headOnload", "is_down", false);
          await writeRiddleMlHealthValue("headOnload", "check_interval", 3600);
        }
      },
      onerror: async (error) => {
        recordRiddleMlHealthFailure("headOnerror", "transportError", {
          error: error?.statusText || error?.error || mlHealthErrorText(error),
        });
        const wasDown = await readRiddleMlHealthValue("headOnerror", "is_down", false);
        if (!wasDown) warnRiddleMlHealthConsole("error", "[HVAA][RMA] server not respond");
        await writeRiddleMlHealthValue("headOnerror", "is_down", true);
        await writeRiddleMlHealthValue("headOnerror", "check_interval", 60);
      },
      ontimeout: async () => {
        recordRiddleMlHealthFailure("headOntimeout", "timeout");
        const wasDown = await readRiddleMlHealthValue("headOntimeout", "is_down", false);
        if (!wasDown) warnRiddleMlHealthConsole("error", "[HVAA][RMA] server timeout");
        await writeRiddleMlHealthValue("headOntimeout", "is_down", true);
        await writeRiddleMlHealthValue("headOntimeout", "check_interval", 60);
      },
    });
    return true;
  } catch (error) {
    recordRiddleMlHealthFailure("sendHead", "requestStartFailed", {
      error: mlHealthErrorText(error),
    });
    return false;
  }
}

async function stayAwake() {
  const today = runTimeAutomation({ type: TimeEvent.UTC_DATE_KEY });
  const lastDay = await readRiddleMlHealthValue("stayAwake", "last_date", "0/0/0");
  if (today !== lastDay) {
    await writeRiddleMlHealthValue("stayAwake", "last_date", today);
    await writeRiddleMlHealthValue("stayAwake", "is_maintenance", false);
    await writeRiddleMlHealthValue("stayAwake", "is_down", false);
    await writeRiddleMlHealthValue("stayAwake", "check_interval", 3600);
  }
  const now = (Date.now() / 1000) | 0;
  const lastTs = await readRiddleMlHealthValue("stayAwake", "last_awake_ts", 0);
  const interval = await readRiddleMlHealthValue("stayAwake", "check_interval", 3600);
  if (now - lastTs >= interval) {
    sendHead();
    await writeRiddleMlHealthValue("stayAwake", "last_awake_ts", now);
  }
}

let healthStarted = false;
function runRiddleMlHealthCycle() {
  stayAwake().catch((error) => {
    recordRiddleMlHealthFailure("healthCycle", "unhandledFailure", {
      error: mlHealthErrorText(error),
    });
  });
}

function startRiddleMlHealthCheck() {
  if (healthStarted) return;
  healthStarted = true;
  runRiddleMlHealthCycle();
  setInterval(runRiddleMlHealthCycle, 30000);
}

// ---------------- 主入口 tryMLAnswer ----------------

function createRiddleMlAnswerContext() {
  return {
    options: null,
    isMaintenance: false,
    isDown: false,
    apiKey: "",
    payload: null,
    requestResult: null,
    answer: null,
    done: false,
  };
}

function finishRiddleMlAnswer(context, answer, failure = null) {
  context.answer = answer;
  context.done = true;
  if (!answer && failure) {
    recordRiddleMlAnswerFallback(failure.stage, failure.reason, failure.detail);
  }
}

function readRiddleMlAnswerOptions(context) {
  context.options = readMlOptions();
}

function ensureRiddleMlAnswerEnabled(context) {
  // defaultOn 语义：与调用侧 riddle.js OptionEvent.IS_ON 一致（缺字段=开，仅显式 false 才关）。
  // 修 H-B：原 `!opt.mlAnswer` 把老配置缺字段误判为关 → 调用侧以为开、这里立刻 bail → 必随机。
  if (context.options.mlAnswer === false) {
    warnRiddleMlAnswerConsole("warn", "[HVAA][RMA] mlAnswer 显式关闭，跳过 ML 识别（走随机）");
    finishRiddleMlAnswer(context, null, { stage: "option", reason: "disabled" });
  }
}

async function notePreviousRiddleMlHealthState(context) {
  // 修 H-A（主因）：不再因 is_maintenance/is_down 闸门提前 return。
  // 对齐原版 RMA v0.5.2——总是尝试 POST，真失败交给下方 onerror/ontimeout + 调用侧随机兜底。
  // 这两个标志降级为纯遥测：原 bug 是后台标签页健康巡检 HEAD 超时置 is_down=true 后，
  // 当天每道题都被闸门挡死走随机（且巡检只在 riddle 页跑、极少刷新 → 长期卡死）。
  context.isMaintenance = await gmGet("is_maintenance", false);
  context.isDown = await gmGet("is_down", false);
  if (context.isMaintenance || context.isDown) {
    warnRiddleMlAnswerConsole(
      "warn",
      "[HVAA][RMA] 健康巡检此前标记服务异常(maintenance/down)，仍尝试本次识别"
    );
  }
}

function normalizeRiddleMlApiKey(context) {
  // 自愈历史脏数据：设置面板旧逻辑 value||placeholder 把占位符"(可选)"误存进 mlApiKey
  // （含中文 → 非 Latin-1，会让 POST 头部 new Headers() 同步抛异常）。含非 ASCII 一律视为未设(走匿名)，
  // 老用户无需手动清栏；source 端 render.js 已把该 placeholder 改空防再次误存。
  context.apiKey = context.options.mlApiKey || "";
  if (context.apiKey && hasNonLatin1(context.apiKey)) {
    warnRiddleMlAnswerConsole(
      "warn",
      '[HVAA][RMA] ML API key 含非 ASCII 字符(疑占位符"(可选)"误存)，已忽略走匿名；如需用 key 请在设置里重输纯 ASCII。'
    );
    context.apiKey = "";
  }
}

async function prepareRiddleMlPayload(context) {
  context.payload = await runRiddleImageAutomation({ type: RiddleImageEvent.PREPARE_ML_PAYLOAD });
  if (!context.payload) {
    warnRiddleMlAnswerConsole("warn", "[HVAA][RMA] 找不到 riddle 图片元素/src，跳过 ML 识别（走随机）");
    reportMlOutcome("no_image");
    finishRiddleMlAnswer(context, null, { stage: "payload", reason: "no_image" });
    return;
  }
  if (!context.payload.blob || context.payload.blob.size === 0) {
    warnRiddleMlAnswerConsole("warn", "[HVAA][RMA] 图片 blob 为空(canvas 污染/fetch 失败)，本次走随机");
    reportMlDetail("empty_blob (canvas 污染/fetch 失败)");
    reportMlOutcome("empty_blob");
    triggerErrorAlarm();
    finishRiddleMlAnswer(context, null, { stage: "payload", reason: "empty_blob" });
  }
}

async function submitRiddleMlPayload(context) {
  // apikey 仅在非空时附带（空串无意义；留空走匿名）。非 Latin-1 脏字符由 gmXhr 中央闸门拦截 →
  // 转成 error:"non_latin1_header" 的 onerror，下方按真因分类提示（不再误报网络/CORS）。
  const endpoint = context.options.mlEndpoint || ML_ENDPOINT_DEFAULT;
  const postHeaders = { "Content-Type": "image/jpeg" };
  if (context.apiKey) postHeaders.apikey = context.apiKey;
  context.requestResult = await requestRiddleMlAnswer(endpoint, context.payload.blob, postHeaders);
}

function resolveRiddleMlAnswerResult(context) {
  // 小马验证统计：成功(Array) → 记 ok 并返回答案数组；失败 → result 为结局分类字符串，记入对应失败计数(走随机兜底)。
  if (Array.isArray(context.requestResult)) {
    reportMlOutcome("ok");
    finishRiddleMlAnswer(context, context.requestResult);
    return;
  }
  reportMlOutcome(typeof context.requestResult === "string" ? context.requestResult : "unknown");
  finishRiddleMlAnswer(context, null, {
    stage: "request",
    reason: typeof context.requestResult === "string" ? context.requestResult : "unknown",
  });
}

function createRiddleMlResponseDecision(result, { detail = null, alarm = false, warn = null } = {}) {
  return { result, detail, alarm, warn };
}

function decideGoodRiddleMlAnswer(dict, responseHeaders) {
  // HV 答题常多只小马同现（多答案不少见）→ 取响应里全部命中的答案码，调用侧勾选多个 checkbox。
  // 多答案修复：dict.answer 可能是数组(如 ["ts","ra"])。统一 coerce 后匹配 6 个互不为子串的答案码。
  const rawAnswer = dict.answer;
  const answers = (Array.isArray(rawAnswer) ? rawAnswer.join(",") : String(rawAnswer ?? "")).toLowerCase();
  const hits = ANSWER_CODES.filter((code) => answers.includes(code));
  if (!hits.length) {
    return createRiddleMlResponseDecision("no_answer_code", {
      detail: "no_answer_code answer=" + JSON.stringify(dict.answer),
      alarm: true,
      warn: ["[HVAA][RMA] 响应无可识别答案码，本次走随机:", dict],
    });
  }
  const headers = parseRespHeaders(responseHeaders);
  const remaining = parseInt(headers["x-ratelimit-remaining"] || "999", 10);
  if (remaining < 3) {
    warnRiddleMlAnswerConsole("warn", `[HVAA][RMA] ratelimit remaining ${remaining}`);
  }
  return createRiddleMlResponseDecision(hits);
}

function decideRiddleMlServiceResponse(res) {
  if (res.status === 429) {
    return createRiddleMlResponseDecision("rate_limited", {
      detail: "rate_limited 429",
      alarm: true,
      warn: ["[HVAA][RMA] 429 限流，本次走随机"],
    });
  }
  let dict;
  try {
    dict = JSON.parse(res.responseText);
  } catch (e) {
    return createRiddleMlResponseDecision("non_json", {
      detail: "non_json status=" + res.status + " " + e.message,
      alarm: true,
      warn: ["[HVAA][RMA] 响应非 JSON，本次走随机:", res.status, e.message],
    });
  }
  if (dict.return === "good") return decideGoodRiddleMlAnswer(dict, res.responseHeaders);
  if (dict.return === "finish") {
    return createRiddleMlResponseDecision("finish", {
      detail: "finish (no more solves today)",
      alarm: true,
      warn: ["[HVAA][RMA] no more solves today"],
    });
  }
  if (dict.return === "error" || dict.expire === true) {
    return createRiddleMlResponseDecision("server_error", {
      detail: "server_error " + JSON.stringify(dict).slice(0, 150),
      alarm: true,
      warn: ["[HVAA][RMA] server error / license issue", dict],
    });
  }
  return createRiddleMlResponseDecision("unknown", {
    detail: "unknown " + JSON.stringify(dict).slice(0, 150),
    alarm: true,
    warn: ["[HVAA][RMA] 未知 return 字段，本次走随机:", dict],
  });
}

function applyRiddleMlResponseDecision(decision, resolve) {
  if (decision.warn) warnRiddleMlAnswerConsole("warn", ...decision.warn);
  if (decision.detail) reportMlDetail(decision.detail);
  if (decision.alarm) triggerErrorAlarm();
  resolve(decision.result);
}

async function requestRiddleMlAnswer(endpoint, imgBlob, postHeaders) {
  return new Promise((resolve) => {
    gmXhr({
      method: "POST",
      timeout: 12000,
      url: endpoint,
      binary: true,
      data: imgBlob,
      headers: postHeaders,
      onload: (res) => {
        // ① 捕获错误这一步（用户诉求 2026-06-06：现在没有捕获、错误直接飘 console 跳转即丢）：
        //    onload 回调由 GM 异步调起、不在外层 try/catch 覆盖内 —— 未捕获异常会让 Promise 永挂
        //    (inFlight 卡死) + 错误只进 console 跳转后丢失。整体 try 兜底 → 落库(recordMLDetail 过跳转可见)
        //    + resolve("exception")，保证永不挂死、详情可事后翻查。
        // 注：训练样本(图片+json)的保存已统一到「提交动作」(riddle.js #riddlesubmit hook → state/riddle-dataset.js)，
        //    本回调不再各分支 saveRiddle；ML 失败原因仍进滚动日志 + 末端随机兜底提交那次会把图存为 low 可信样本。
        try {
          applyRiddleMlResponseDecision(decideRiddleMlServiceResponse(res), resolve);
        } catch (e) {
          // 捕获错误兜底：多答案/异形响应等处理异常 → 落库 + resolve，绝不让错误逃逸 console 即丢或 Promise 挂死。
          warnRiddleMlAnswerConsole("error", "[HVAA][RMA] onload 处理异常(疑多答案/异形响应)，本次走随机:", e);
          reportMlDetail("onload_exception " + (e && e.message));
          triggerErrorAlarm();
          resolve("exception");
        }
      },
      onerror: (err) => {
        // 按 err 真因分类（旧版恒打"网络/CORS/@connect"，把客户端头部脏字符等误导成网络问题）。
        // GM_xmlhttpRequest 的 err 含 status/statusText/error；中央闸门 gmXhr 另注入 error 标签。
        const status = err && err.status;
        const detail = (err && (err.statusText || err.error)) || "";
        let cause;
        if (err && err.error === "non_latin1_header") {
          // gmXhr 拦下：apikey 等头部含非 ASCII（中文/全角/智能引号/零宽）→ 请求未发出。
          cause = "ML API key 含非 ASCII 字符，请在设置里清空重输或留空(走匿名)";
        } else if (status === 0) {
          cause = "网络层失败(@connect 未授权 / DNS / 拒连 / TLS / CORS)，请求未达服务端";
        } else {
          cause = "服务端拒绝(status " + status + ")";
        }
        warnRiddleMlAnswerConsole(
          "warn",
          `[HVAA][RMA] POST onerror，本次走随机 — ${cause}`,
          "status=" + status,
          detail,
          err
        );
        reportMlDetail("onerror status=" + status + " " + cause + (detail ? " | " + detail : ""));
        triggerErrorAlarm();
        resolve("onerror");
      },
      ontimeout: () => {
        warnRiddleMlAnswerConsole("warn", "[HVAA][RMA] POST 超时(>12s)，本次走随机");
        reportMlDetail("timeout (>12s)");
        triggerErrorAlarm();
        resolve("timeout");
      },
    });
  });
}

/**
 * 请求 ML 服务拿答案。
 * 命中 → 返回命中的 ANSWER_MAP key 数组（多答案题多只小马同现，故返全部命中）；失败/超时/服务异常 → null（由 riddle.js fallback 随机猜）。
 * 不做提交；提交由 riddle.js 的 riddleSubmit() 完成。
 *
 * @returns {Promise<string[]|null>}
 */
let inFlight = false;
async function tryMLAnswer() {
  if (inFlight) {
    recordRiddleMlAnswerFallback("answerFlow", "duplicateRequest");
    return null; // 防同 tick 重入
  }
  inFlight = true;
  try {
    const context = createRiddleMlAnswerContext();
    for (const step of RIDDLE_ML_ANSWER_FLOW_STEPS) {
      await step(context);
      if (context.done) return context.answer;
    }
    return context.answer;
  } catch (err) {
    recordRiddleMlAnswerFallback("answerFlow", "exception", { error: mlHealthErrorText(err) });
    runRiddleMlAnswerFallbackDiagnostic("answerFlowConsole", () =>
      console.error("[HVAA][RMA] tryMLAnswer error", err)
    );
    runRiddleMlAnswerFallbackDiagnostic("answerFlowStats", () => {
      reportMlDetail("exception " + mlHealthErrorText(err));
      reportMlOutcome("exception");
    });
    runRiddleMlAnswerFallbackDiagnostic("answerFlowAlarm", triggerErrorAlarm);
    return null;
  } finally {
    inFlight = false;
  }
}

const riddleMlEventHandlers = Object.freeze({
  [EVENT_START_HEALTH]: () => {
    startRiddleMlHealthCheck();
    return true;
  },
  [EVENT_TRY_ANSWER]: tryMLAnswer,
});

export function runRiddleMlAutomation(event = { type: EVENT_TRY_ANSWER }) {
  return riddleMlEventHandlers[event?.type]?.(event);
}
