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
  CAPTURE_REJECTED: Object.freeze({
    l0: "[HVAA][RMA] 答题样本已达到 512 条或 128 MiB 上限；本题继续提交，但不会保存样本。请先从脚本菜单导出样本。",
    l1: "[HVAA][RMA] 答題樣本已達到 512 條或 128 MiB 上限；本題繼續提交，但不會儲存樣本。請先從腳本選單匯出樣本。",
    l2: "[HVAA][RMA] Riddle samples reached the 512-record or 128 MiB limit. The answer will still submit, but this sample was not stored. Export samples from the userscript menu.",
  }),
  CAPTURE_FAILED: Object.freeze({
    l0: "[HVAA][RMA] 本题样本未能写入 IndexedDB；答题仍会继续。请在战斗外页面重试或导出已有样本。",
    l1: "[HVAA][RMA] 本題樣本未能寫入 IndexedDB；答題仍會繼續。請在戰鬥外頁面重試或匯出已有樣本。",
    l2: "[HVAA][RMA] This sample could not be written to IndexedDB. Answer submission will continue; retry outside battle or export existing samples.",
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

export function discloseRiddleDatasetStatus(copy, values) {
  const message = formatRiddleDatasetStatus(copy, values);
  try {
    runUserFeedbackAutomation({
      type: UserFeedbackEvent.ALERT,
      copy: { l0: message, l1: message, l2: message },
    });
  } catch {
    // Disclosure still reaches diagnostics when a page blocks alert().
  }
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.WARN,
    args: [message],
  });
}
