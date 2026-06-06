// 答题页面自动答题。
// ★ 原版 SOT（后续核对认准此文件，勿找错）：Tampermonkey/HentaiVerse/Riddle Master Assistant Reborn.user.js v0.5.2
//   —— 答题时机逻辑对齐其 getRemainingSeconds() / waitUntilNearEnd()；ML 远程答题逻辑见同源的 riddle-ml.js。
//   注：legacy/[HV]AutoAttack.legacy.js 是 AutoAttack 整体原版（含旧版随机答题），**非本 ML 答题逻辑来源**，勿混。
// P0 重构（Monsterbation/RMA 借鉴 + bug fix）：
// - 修复 bug：原 answers 数组漏 "ra"，随机命中率仅 1/5（应 1/6）
// - 答案分发改 ANSWER_MAP 数据驱动（替代 6 个 if 平铺）
// - 倒计时双源解析：textContent 正则优先（抗 HV UI 改版），sprite 背景位置作 legacy fallback
// P2 集成：setupRiddleHelper（小马旋转/锐化/对比 + 6 缩略图视觉辅助）— async 不 await，不阻塞倒计时
// P6 集成：tryMLAnswer + setupRMAHealth（rdma.ooguy.com ML 远程答题，失败 fallback 现有随机猜）
import { gE } from "../dom/query.js";
import { g } from "../state/store.js";
import { isOptionOn } from "../state/option.js";
import { setAlarm } from "../alarm/alarm.js";
import { ANSWER_MAP } from "../data/riddle-answers.js";
import { setupRiddleHelper } from "./riddle-helper.js";
import { tryMLAnswer, setupRMAHealth } from "./riddle-ml.js";
import { recordRiddleAppear } from "../state/riddle-stats.js";

// 答案码 SSOT 见 data/riddle-answers.js（提取到叶子层打破与 riddle-ml.js 的循环依赖 TDZ）
const ANSWER_KEYS = Object.keys(ANSWER_MAP);

/**
 * 读 #riddlecounter 剩余秒数。
 * 优先用 textContent 正则（HV UI 改版仍可用），fallback 到 sprite 背景位置（legacy 兼容）。
 * @returns {number} 剩余秒；NaN 表示读不到
 */
function parseRemainingSeconds() {
  const counter = gE("#riddlecounter");
  if (counter) {
    const text = (counter.textContent || "").trim();
    // M:SS 优先（对齐 RMA 原版 getRemainingSeconds；移植曾漏 → 倒计时 "2:30" 被读成 2s 误判）。
    const ms = text.match(/(\d+):(\d+)/);
    if (ms) {
      const sec = parseInt(ms[1]) * 60 + parseInt(ms[2]);
      if (sec > 0 && sec < 3600) return sec;
    }
    const m = text.match(/(\d+)/);
    if (m) {
      const sec = parseInt(m[1]);
      if (!isNaN(sec) && sec > 0 && sec < 3600) return sec;
    }
  }
  // legacy: 数字精灵图 backgroundPosition.x / 12 = 数字位
  const timeDiv = gE("#riddlecounter>div>div", "all");
  if (!timeDiv || timeDiv.length === 0) return NaN;
  let time = "";
  for (let j = 0; j < timeDiv.length; j++) {
    const bp = timeDiv[j].style.backgroundPosition.match(/(\d+)px$/);
    if (!bp) return NaN;
    time = (bp[1] / 12).toString() + time;
  }
  return parseInt(time);
}

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
  if (submit) submit.click();
}

export function riddleAlert() {
  setAlarm("Riddle");
  recordRiddleAppear(); // 小马验证统计：谜题页出现一次（与 ML 是否开启/成功无关）

  // P2 视觉辅助：async 但不 await（图片预处理不阻塞倒计时；找不到 #riddleimage>img 内部静默 return）
  if (isOptionOn("riddleHelperUi")) {
    setupRiddleHelper();
  }

  // P6 ML 健康巡检：30s 周期 setInterval 启动一次（内部 healthStarted 哨兵防重入）
  if (isOptionOn("mlAnswer")) {
    setupRMAHealth();
  }

  // P6 时机修复（对齐原 RMA：题目一出现立即识别，提交延后到倒计时末端）：
  // ML 识别在此立即异步启动并缓存到 mlAnswer，而非等倒计时剩 riddleAnswerTime 才 await。
  // 原 bug：识别被放到倒计时末端才开始，ML POST（最长 12s）来不及返回 → 错过倒计时，
  // 表现为「超时随机正常、ML 没反应」。提前后 ML 有整个倒计时时长可用。
  /** @type {string[]|null} ML 命中答案码数组（多答案题多只）；null=未就绪/识别失败 */
  let mlAnswer = null;
  if (isOptionOn("mlAnswer")) {
    tryMLAnswer()
      .then((a) => {
        mlAnswer = a;
      })
      .catch(() => {});
  }

  // 等倒计时接近末端再提交。★ 对齐原版 Riddle Master Assistant Reborn.user.js v0.5.2 的
  // waitUntilNearEnd()：每秒**重读真实倒计时** #riddlecounter，剩余 ≤ riddleAnswerTime 时提交
  // （ML 就绪用 ML 答案，否则随机单只）。修移植退化 bug——原写法改成 30 次内部自减(非重读真值)，
  // 倒计时 > ~33s 时窗口内永减不到阈值 → 不提交（用户实证"没反应"）；现重读真值，任意时长鲁棒。
  const beforeEnd = parseInt(g("option").riddleAnswerTime) || 3;
  let submitted = false;
  let unreadable = 0;
  function submitAtEnd() {
    if (submitted) return;
    submitted = true;
    clearInterval(timer);
    // ML 就绪 → 多答案数组；否则随机单只（ANSWER_KEYS.length 防退化：原 answers 漏 "ra" 命中率 1/5 旧 bug）。
    const answers =
      mlAnswer && mlAnswer.length
        ? mlAnswer
        : [ANSWER_KEYS[Math.floor(Math.random() * ANSWER_KEYS.length)]];
    riddleSubmit(answers);
  }
  function tick() {
    if (submitted) return;
    const remaining = parseRemainingSeconds();
    if (isNaN(remaining)) {
      if (++unreadable >= 5) submitAtEnd(); // 连续 5s 读不到倒计时 → 兜底提交（对齐原版 waitUntilNearEnd 的 5s fallback）
      return;
    }
    unreadable = 0;
    document.title = remaining; // 倒计时显示在标签页标题
    if (remaining <= beforeEnd) submitAtEnd();
  }
  const timer = setInterval(tick, 1000);
  tick(); // 立即检查一次（倒计时已 ≤ 阈值则立即提交）
}
