import { gE } from "../dom/query.js";

const EVENT_START = "start";
const EVENT_READ_REMAINING = "readRemaining";
const EVENT_EXTERNAL_SUBMITTED = "externalSubmitted";
const EVENT_ML_ANSWERS_READY = "mlAnswersReady";

export const RiddleSubmissionTimingEvent = Object.freeze({
  START: EVENT_START,
  READ_REMAINING: EVENT_READ_REMAINING,
  EXTERNAL_SUBMITTED: EVENT_EXTERNAL_SUBMITTED,
  ML_ANSWERS_READY: EVENT_ML_ANSWERS_READY,
});

let activeSession = null;

function readRemainingSeconds() {
  const counter = gE("#riddlecounter");
  if (counter) {
    const text = (counter.textContent || "").trim();
    const ms = text.match(/(\d+):(\d+)/);
    if (ms) {
      const sec = parseInt(ms[1]) * 60 + parseInt(ms[2]);
      if (sec > 0 && sec < 3600) return sec;
    }
    const m = text.match(/(\d+)/);
    if (m) {
      const sec = parseInt(m[1]);
      if (!Number.isNaN(sec) && sec > 0 && sec < 3600) return sec;
    }
  }

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

function createSubmissionTiming(event) {
  const beforeEnd = Number(event.beforeEnd) || 3;
  const submit = event.submit;
  const fallbackAnswers = event.fallbackAnswers;
  const readRemaining = event.readRemaining || readRemainingSeconds;
  const setTitle = event.setTitle || ((remaining) => { document.title = String(remaining); });
  const getMlAnswers = event.getMlAnswers || (() => null);
  let submitted = false;
  let unreadable = 0;
  let countdownTimer = null;
  let mlTimer = null;

  function cancelTimers() {
    if (countdownTimer) clearInterval(countdownTimer);
    if (mlTimer) clearTimeout(mlTimer);
    countdownTimer = null;
    mlTimer = null;
  }

  function submitOnce(answers, via) {
    if (submitted) return false;
    submitted = true;
    cancelTimers();
    submit(answers, via);
    return true;
  }

  function recordExternalSubmission() {
    if (submitted) return false;
    submitted = true;
    cancelTimers();
    return true;
  }

  function scheduleMlSubmit(answers, delayMs) {
    if (!answers || !answers.length || submitted) return false;
    if (mlTimer) clearTimeout(mlTimer);
    mlTimer = setTimeout(() => submitOnce(answers, "ML"), delayMs || 0);
    return true;
  }

  function currentAnswers() {
    const answers = getMlAnswers();
    return answers && answers.length ? answers : fallbackAnswers();
  }

  if (event.mlAnswers && event.mlAnswers.length) {
    scheduleMlSubmit(event.mlAnswers, event.mlDelayMs);
  }

  countdownTimer = setInterval(() => {
    if (submitted) return;
    const remaining = readRemaining();
    if (Number.isNaN(remaining)) {
      unreadable++;
      if (unreadable >= 5) submitOnce(currentAnswers(), "兜底·读不到倒计时");
      return;
    }
    unreadable = 0;
    setTitle(remaining);
    if (remaining <= beforeEnd) submitOnce(currentAnswers(), "末端兜底");
  }, 1000);

  return Object.freeze({ recordExternalSubmission, scheduleMlSubmit, cancelTimers });
}

function startSubmissionTiming(event) {
  if (activeSession) activeSession.cancelTimers();
  activeSession = createSubmissionTiming(event);
  return true;
}

export function runRiddleSubmissionTiming(event = { type: EVENT_READ_REMAINING }) {
  if (event.type === EVENT_READ_REMAINING) return readRemainingSeconds();
  if (event.type === EVENT_START) return startSubmissionTiming(event);
  if (event.type === EVENT_EXTERNAL_SUBMITTED) {
    return activeSession ? activeSession.recordExternalSubmission() : false;
  }
  if (event.type === EVENT_ML_ANSWERS_READY) {
    return activeSession ? activeSession.scheduleMlSubmit(event.mlAnswers, event.mlDelayMs) : false;
  }
  return undefined;
}
