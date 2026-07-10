// 用户可见反馈入口。l0=简中 / l1=繁中 / l2=英文。
import { g } from "../state/store.js";

const EVENT_TEXT = "text";
const EVENT_ALERT = "alert";
const EVENT_CONFIRM = "confirm";
const EVENT_PROMPT = "prompt";
const EVENT_BLOCKING_ERROR = "blockingError";

export const UserFeedbackEvent = Object.freeze({
  TEXT: EVENT_TEXT,
  ALERT: EVENT_ALERT,
  CONFIRM: EVENT_CONFIRM,
  PROMPT: EVENT_PROMPT,
  BLOCKING_ERROR: EVENT_BLOCKING_ERROR,
});

function readLocalizedFeedback(copy = {}) {
  const fallback = copy.l2 ?? copy.l0 ?? copy.l1 ?? "";
  return [copy.l0, copy.l1, copy.l2][g("lang")] ?? fallback;
}

function stringifyBlockingEvidence(evidence) {
  try {
    return JSON.stringify(evidence ?? null, null, 2);
  } catch (error) {
    return JSON.stringify({ serializationError: error?.message || String(error) });
  }
}

function buildBlockingErrorReport(event, message) {
  const evidence = event.evidence || {};
  return [
    `[HVAA] ${message}`,
    `incident: ${event.incident || "unassigned"}`,
    `page: ${event.page || globalThis.location?.href || "unknown"}`,
    `capability: ${evidence.capability || "unknown"}`,
    `stage: ${evidence.stage || "unknown"}`,
    `reason: ${evidence.reason || evidence.failure?.reason || "unknown"}`,
    "",
    stringifyBlockingEvidence(evidence),
  ].join("\n");
}

export function runUserFeedbackAutomation(event = { type: EVENT_TEXT }) {
  const message = readLocalizedFeedback(event.copy);
  if (event.type === EVENT_TEXT) return message;
  if (event.type === EVENT_ALERT) return window.alert(message);
  if (event.type === EVENT_CONFIRM) return window.confirm(message);
  if (event.type === EVENT_PROMPT) return window.prompt(message, event.defaultValue);
  if (event.type === EVENT_BLOCKING_ERROR) {
    return window.prompt(message, buildBlockingErrorReport(event, message));
  }
  return undefined;
}

/**
 * 多语言 alert 包装。
 * @param {-1|0|1|2} func -1=返字符串；0=alert；1=confirm；2=prompt
 * @param {string} l0 简体中文
 * @param {string} l1 繁体中文
 * @param {string} l2 English
 * @param {string=} answer prompt 默认值（仅 func=2）
 * @returns {string|boolean|null|undefined}
 */
export function _alert(func, l0, l1, l2, answer) {
  const copy = { l0, l1, l2 };
  if (func === -1) return runUserFeedbackAutomation({ type: UserFeedbackEvent.TEXT, copy });
  if (func === 0) return runUserFeedbackAutomation({ type: UserFeedbackEvent.ALERT, copy });
  if (func === 1) return runUserFeedbackAutomation({ type: UserFeedbackEvent.CONFIRM, copy });
  if (func === 2)
    return runUserFeedbackAutomation({
      type: UserFeedbackEvent.PROMPT,
      copy,
      defaultValue: answer,
    });
  return undefined;
}
