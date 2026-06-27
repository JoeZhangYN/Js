// 答题页面自动答题。
// ★ 原版 SOT（后续核对认准此文件，勿找错）：Tampermonkey/HentaiVerse/Riddle Master Assistant Reborn.user.js v0.5.2
//   —— 答题时机逻辑对齐其 getRemainingSeconds() / waitUntilNearEnd()；ML 远程答题逻辑见同源的 riddle-ml.js。
//   注：legacy/[HV]AutoAttack.legacy.js 是 AutoAttack 整体原版（含旧版随机答题），**非本 ML 答题逻辑来源**，勿混。
// P0 重构（Monsterbation/RMA 借鉴 + bug fix）：
// - 修复 bug：原 answers 数组漏 "ra"，随机命中率仅 1/5（应 1/6）
// - 答案分发改 ANSWER_MAP 数据驱动（替代 6 个 if 平铺）
// - 倒计时双源解析：textContent 正则优先（抗 HV UI 改版），sprite 背景位置作 legacy fallback
// P2 集成：runRiddleVisualAid（小马旋转/锐化/对比 + 6 缩略图视觉辅助）— async 不 await，不阻塞倒计时
// P6 集成：runRiddleMlAutomation（rdma.ooguy.com ML 远程答题，失败 fallback 现有随机猜）
import { g } from "../state/store.js";
import { isOptionOn } from "../state/option.js";
import { AlarmEvent, runAlarmAutomation } from "../alarm/alarm.js";
import { ANSWER_MAP } from "../data/riddle-answers.js";
import { runRiddleVisualAid } from "./riddle-helper.js";
import { RiddleMlEvent, runRiddleMlAutomation } from "./riddle-ml.js";
import { RiddleStatsEvent, runRiddleStatsAutomation } from "../state/riddle-stats.js";
import { RiddleLogEvent, runRiddleLogAutomation } from "../state/riddle-log.js";
import { RiddleImageEvent, runRiddleImageAutomation } from "./riddle-image.js";
import {
  RiddleDatasetEvent,
  RiddleSampleSource,
  runRiddleDatasetAutomation,
} from "../state/riddle-dataset.js";
import {
  RiddleSubmissionTimingEvent,
  runRiddleSubmissionTiming,
} from "./riddle-submission-timing.js";

// 答案码 SSOT 见 data/riddle-answers.js（提取到叶子层打破与 riddle-ml.js 的循环依赖 TDZ）
const ANSWER_KEYS = Object.keys(ANSWER_MAP);

/**
 * 勾选答案 checkbox 并提交。HV 答题常多只小马同现（多答案不少见）→ 收数组、勾选全部命中 box 后单次提交。
 * @param {string[]} answers ANSWER_MAP key 数组 (ts/ra/fs/rd/pp/aj)
 */
function riddleSubmit(answers) {
  const riddler1 = document.getElementById("riddler1");
  if (!riddler1) return;
  let any = false;
  for (const answer of answers) {
    const idx = ANSWER_MAP[answer];
    if (idx === undefined) continue;
    const checkbox = riddler1.children?.[idx]?.children?.[0]?.children?.[0];
    if (!checkbox) continue;
    checkbox.checked = true;
    any = true;
  }
  if (!any) return;
  const submit = document.getElementById("riddlesubmit");
  if (!submit) return;
  // ★ 必须先解除 disabled 再 click：HV 答题页 #riddlesubmit 初始 disabled="disabled"，
  //   仅当用户**真实点击** checkbox 触发其 onclick 时 HV 原生脚本才移除 disabled。
  //   脚本 `checkbox.checked = true` 只改属性、不派发 onclick → 按钮恒灰 → click() 是 no-op（提交无反应）。
  //   对齐 SOT 原版 Riddle Master Assistant Reborn.user.js v0.5.2（btn.disabled=false 后 btn.click()，
  //   见其 L302-305 随机兜底 / L446-456 ML 命中两处）。移植曾漏此行 → ML 识别了却提交不出去（本次修复）。
  submit.disabled = false;
  submit.click();
}

/**
 * 读 #riddler1 当前勾选的答案码（提交那一刻的真实状态，脚本/手动提交都准）。
 * @returns {string} 逗号分隔码，如 "ts,ra"；无勾选返 ""
 */
function submittedCodes() {
  const riddler1 = document.getElementById("riddler1");
  if (!riddler1) return "";
  const hits = [];
  for (const code of ANSWER_KEYS) {
    const idx = ANSWER_MAP[code];
    const box = riddler1.children?.[idx]?.children?.[0]?.children?.[0];
    if (box && box.checked) hits.push(code);
  }
  return hits.join(",");
}

export function runRiddleAnsweringSession() {
  runAlarmAutomation({ type: AlarmEvent.TRIGGER, kind: "Riddle" });
  runRiddleStatsAutomation({ type: RiddleStatsEvent.RECORD_APPEAR }); // 小马验证统计：谜题页出现一次（与 ML 是否开启/成功无关）

  // P2 视觉辅助：async 但不 await（图片预处理不阻塞倒计时；找不到 #riddleimage>img 内部静默 return）
  if (isOptionOn("riddleHelperUi")) {
    runRiddleVisualAid();
  }

  // P6 ML 健康巡检：30s 周期 setInterval 启动一次（内部 healthStarted 哨兵防重入）
  if (isOptionOn("mlAnswer")) {
    runRiddleMlAutomation({ type: RiddleMlEvent.START_HEALTH });
  }

  // 提交策略 ★ 对齐原版 Riddle Master Assistant Reborn.user.js v0.5.2（核对认准此文件）：
  // ① ML 识别成功 → 短延迟(模拟人类, 原版 extend_submit_interval≈3s)**立即提交，不等末端**
  //    （原版 setTimeout(btn.click, delay)）。移植退化为"ML 成功也等末端" → ML 识别了却不提交，
  //    看着像没反应、用户手动答 → 手动提交后页面跳转把在途 ML POST 杀掉 → onload/onerror 都没机会跑
  //    → 小马验证统计"错误/成功都不+1"（用户实证 2026-06-06）。现恢复原版：成功即提交。
  // ② ML 失败/未就绪 → 每秒**重读真实倒计时** #riddlecounter（对齐原版 getRemainingSeconds/
  //    waitUntilNearEnd），剩余 ≤ riddleAnswerTime（或连续读不到 5s）随机单只兜底提交。任意时长鲁棒。
  const beforeEnd = parseInt(g("option").riddleAnswerTime) || 3;
  /** @type {string[]|null} ML 命中答案码数组（多答案题多只）；null=未就绪/失败 */
  let mlAnswer = null;
  let pendingSource = null; // doSubmit 设置；#riddlesubmit hook 据此判 source（手动点击=null→manual）
  let sampled = false; // 训练样本每题只采一次
  // ANSWER_KEYS.length 防退化（原 answers 漏 "ra" 命中率 1/5 旧 bug）。
  const randomAnswer = () => [ANSWER_KEYS[Math.floor(Math.random() * ANSWER_KEYS.length)]];
  function doSubmit(answers, via) {
    console.log(`[HVAA][riddle] 自动提交(${via})`, answers); // 可见性：无反应时看 console 确认走哪条路径
    // 提交即重定向、console 即丢 → 落滚动日志（半持久化）：本次答案 + 路径，事后可翻"答案是什么/走哪条路"
    runRiddleLogAutomation({
      type: RiddleLogEvent.PUSH,
      message: `submit via=${via} answers=${Array.isArray(answers) ? answers.join(",") : answers}`,
    });
    pendingSource = via; // 供提交 hook 判 confidence（须在 riddleSubmit 触发 click 之前设好）
    riddleSubmit(answers);
  }
  const timing = runRiddleSubmissionTiming({
    type: RiddleSubmissionTimingEvent.START,
    beforeEnd,
    fallbackAnswers: randomAnswer,
    getMlAnswers: () => mlAnswer,
    submit: doSubmit,
  });
  // 训练样本采集：hook #riddlesubmit 点击（脚本 riddleSubmit 的 .click() 与用户手动点都经此）→ 跳转前
  // **同步**采样。无论 ML/随机/手动只要提交就存（用户诉求 2026-06-06）；source→confidence 规则内化在 riddle-dataset。
  function captureSubmission() {
    if (sampled) return;
    sampled = true;
    const source = pendingSource
      ? pendingSource === "ML"
        ? RiddleSampleSource.ML
        : RiddleSampleSource.RANDOM
      : RiddleSampleSource.MANUAL;
    const answers = submittedCodes();
    const image = runRiddleImageAutomation({ type: RiddleImageEvent.CAPTURE_SAMPLE });
    runRiddleDatasetAutomation({
      type: RiddleDatasetEvent.RECORD_SAMPLE,
      imageDataUrl: image.imageDataUrl,
      answers,
      source,
      imageSrc: image.imageSrc,
    });
    runRiddleLogAutomation({
      type: RiddleLogEvent.PUSH,
      message: `sample source=${source} answers=${answers}`,
    });
  }
  if (isOptionOn("mlBackupOnFail")) {
    const submitBtn = document.getElementById("riddlesubmit");
    if (submitBtn) submitBtn.addEventListener("click", captureSubmission, { capture: true });
  }
  if (isOptionOn("mlAnswer")) {
    runRiddleMlAutomation({ type: RiddleMlEvent.TRY_ANSWER })
      .then((a) => {
        mlAnswer = a;
        if (a && a.length) {
          // ML 命中 → 短延迟提交（前台 ~3s / 后台 3-8s 模拟人类），不等末端。
          const delay = document.hasFocus() ? 3000 : 3000 + Math.random() * 5000;
          timing.scheduleMlSubmit(a, delay);
        }
      })
      .catch(() => {});
  }
}
