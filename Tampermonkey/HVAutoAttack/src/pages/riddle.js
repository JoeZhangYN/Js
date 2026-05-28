// 答题页面自动答题。
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
import { setupRiddleHelper } from "./riddle-helper.js";
import { tryMLAnswer, setupRMAHealth } from "./riddle-ml.js";

// 答案码 → riddler1 内 6 个候选项 checkbox 的 children 索引（RMA L40 同源）
// export：riddle-ml.js 复用，避免重复定义
export const ANSWER_MAP = { ts: 0, ra: 1, fs: 2, rd: 3, pp: 4, aj: 5 };
const ANSWER_KEYS = Object.keys(ANSWER_MAP);

/**
 * 读 #riddlecounter 剩余秒数。
 * 优先用 textContent 正则（HV UI 改版仍可用），fallback 到 sprite 背景位置（legacy 兼容）。
 * @returns {number} 剩余秒；NaN 表示读不到
 */
function parseRemainingSeconds() {
  const counter = gE("#riddlecounter");
  if (counter) {
    const text = counter.textContent || "";
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
 * 勾选指定答案的 checkbox 并提交。
 * @param {string} answer ANSWER_MAP key (ts/ra/fs/rd/pp/aj)
 */
function riddleSubmit(answer) {
  const idx = ANSWER_MAP[answer];
  if (idx === undefined) return;
  const riddler1 = document.getElementById("riddler1");
  const checkbox = riddler1?.children?.[idx]?.children?.[0]?.children?.[0];
  if (!checkbox) return;
  checkbox.checked = true;
  const submit = document.getElementById("riddlesubmit");
  if (submit) submit.click();
}

export function riddleAlert() {
  setAlarm("Riddle");

  // P2 视觉辅助：async 但不 await（图片预处理不阻塞倒计时；找不到 #riddleimage>img 内部静默 return）
  if (isOptionOn("riddleHelperUi")) {
    setupRiddleHelper();
  }

  // P6 ML 健康巡检：30s 周期 setInterval 启动一次（内部 healthStarted 哨兵防重入）
  if (isOptionOn("mlAnswer")) {
    setupRMAHealth();
  }

  // Sentinel H1 修复：30 ticks × async checkTime 会让倒计时末端每 tick 都 await + submit；
  // tryMLAnswer 内部 inFlight 哨兵会让第 2 tick 返回 null → fallback 随机猜抢跑 + 重复提交。
  // 双哨兵：pendingSubmit（已进入 submit 流程，防 ML 等待期间被随机猜抢跑）+ submitted（已 submit 完，防重复提交）。
  let pendingSubmit = false;
  let submitted = false;
  const checkTime = async function () {
    if (submitted) return;
    let time;
    if (typeof g("time") === "undefined") {
      const parsed = parseRemainingSeconds();
      if (isNaN(parsed)) return;
      g("time", parsed);
      time = parsed;
    } else {
      time = g("time");
      time--;
      g("time", time);
    }
    document.title = time;
    if (time <= g("option").riddleAnswerTime && !pendingSubmit) {
      pendingSubmit = true; // 锁定：本轮 await ML 期间后续 tick 直接 return（见函数开头 submitted 检查 + 此处）
      // P6: ML 优先；命中 → 直接 submit；失败 / 关闭 → fallback 随机猜
      let answer = null;
      if (isOptionOn("mlAnswer")) {
        answer = await tryMLAnswer();
      }
      if (!answer) {
        // Bug fix：原 answers 5 项漏 "ra" 改 6 项；用 ANSWER_KEYS.length 防退化
        answer = ANSWER_KEYS[Math.floor(Math.random() * ANSWER_KEYS.length)];
      }
      submitted = true;
      riddleSubmit(answer);
    }
  };

  for (let i = 0; i < 30; i++) {
    setTimeout(checkTime, i * 1000);
  }
}
