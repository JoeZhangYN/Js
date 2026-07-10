// 入口路由：识别页面 (e-hentai redirect / lobby / riddle / battle) 并分派。
// file-size-gate: exempt phase-4-init
import { AppStartupEvent, runAppStartup } from "./app-startup.js";
import { PageAutomationEvent, runPageAutomation } from "./page-automation.js";
import { PageKindEvent, runPageKindAutomation } from "./page-kind.js";

export function init() {
  runAppStartup({ type: AppStartupEvent.USERSCRIPT_START });
  // 页面身份单一判定（page-kind SOT，替代散落 ad-hoc 哨兵检测）。页面进入后 DOM 稳定，算一次复用。
  const page = runPageKindAutomation({ type: PageKindEvent.DETECT_CURRENT });
  runPageAutomation({ type: PageAutomationEvent.PAGE_READY, kind: page.kind });
}
