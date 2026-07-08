import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";
import { UserFeedbackEvent, runUserFeedbackAutomation } from "../core/lang.js";

export const RIDDLE_DATASET_STATUS_COPY = Object.freeze({
  EMPTY_SAMPLE_STORE: Object.freeze({
    l0: "[HVAA][RMA] 无答题样本可导出",
    l1: "[HVAA][RMA] 無答題樣本可匯出",
    l2: "[HVAA][RMA] No riddle samples to export",
  }),
  EMPTY_EXPORTABLE_SAMPLE_STORE: Object.freeze({
    l0: "[HVAA][RMA] 无可导出的答题样本",
    l1: "[HVAA][RMA] 無可匯出的答題樣本",
    l2: "[HVAA][RMA] No exportable riddle samples",
  }),
  EXPORT_SUCCESS: Object.freeze({
    l0: "[HVAA][RMA] 已导出 {count} 条答题样本(zip: webp+json)，并清除原始记录(防重复导出)",
    l1: "[HVAA][RMA] 已匯出 {count} 條答題樣本(zip: webp+json)，並清除原始記錄(防重複匯出)",
    l2: "[HVAA][RMA] Exported {count} riddle sample(s) (zip: webp+json) and cleared source records",
  }),
});

function formatRiddleDatasetStatus(copy, values = {}) {
  const text = runUserFeedbackAutomation({ type: UserFeedbackEvent.TEXT, copy });
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, String(value)),
    text
  );
}

export function reportRiddleDatasetStatus(copy, values) {
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.INFO,
    args: [formatRiddleDatasetStatus(copy, values)],
  });
}
