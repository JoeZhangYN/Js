// HVAutoAttack 入口。所有业务在子模块中。
// SOT：原始单文件 ../legacy/[HV]AutoAttack.legacy.js（永不修改）。
import { initEquipTranslate } from "./i18n/equip-translate.js"; // indefined HV物品装备汉化 #404119（装备词条 + 词缀分色）
import { initInterfaceTranslate } from "./i18n/interface-translate.js"; // indefined HentaiVerse汉化(界面) #404118（角色页/界面词条，含 Fighting Style 等）
import "./pages/encounter-bridge.js"; // hv-utils sloppy-mode 不能 import；随机遭遇业务口径通过桥复用。
import "./i18n/hvut-runtime-policy-bridge.js"; // sloppy-mode HVUT 只消费已分类世界 authority + typed entry policy。
import "./i18n/hvut-ability-catalog-bridge.js"; // 两个世界只保留展示名差异，等级/AP 统一由当前规则目录注入。
import "./i18n/hvut-ability-requirement-bridge.js"; // 能力等级需求先归一为 typed decision，再由 sloppy runtime 统一渲染。
import "./i18n/equip-filter-expression-bridge.js"; // hv-utils sloppy-mode 不能 import；装备筛选表达式经受限 parser 桥求值。
import "./i18n/shrine-offer-message-bridge.js"; // hv-utils sloppy-mode 不能 import；Shrine offer 响应分类经桥复用纯函数。
import "./i18n/shrine-offer-reservation-bridge.js"; // hv-utils sloppy-mode 不能 import；Shrine offer reservation 经桥复用纯函数。
import "./i18n/hvut-config-migration-bridge.js"; // hv-utils sloppy-mode 不能 import；配置迁移 segment 差异经桥选择。
import "./i18n/hvut-config-field-bridge.js"; // hv-utils sloppy-mode 不能 import；配置字段适用性经桥统一裁决。
import { initializeHvutStorageBridge } from "./i18n/hvut-storage-bridge.js"; // 小配置写时去重；派生聚合先装载世界隔离 IDB。
import "./core/async-task-layout-bridge.js"; // hv-utils 批处理按 typed parallel/sequential/grouped 拓扑排布。
import "./i18n/hvut-armory-integration-bridge.js"; // hv-utils Armory 聚合经能力工厂执行同源读取/原子提交。
import "./core/navigation-bridge.js"; // hv-utils sloppy-mode 不能 import；重定向能力经全局导航桥统一收口。
import { init } from "./pages/init.js";
import { g } from "./state/store.js";
import { setLang } from "./i18n/core/restore-controller.js";
import { DiagnosticEvidenceKey } from "./core/diagnostic-evidence-keys.js";
import { writeDiagnosticSessionSnapshot } from "./core/diagnostic-evidence-journal.js";
import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "./core/diagnostic-console.js";

async function startApplication() {
  await initializeHvutStorageBridge();
  await import("./i18n/hv-utils.js");
  initEquipTranslate();
  initInterfaceTranslate();
  init();
  const lang = String(g("lang"));
  if (lang === "1" || lang === "2") setLang(lang);
}

startApplication().catch((error) => {
  const evidence = {
    capability: "appStartup",
    stage: "hydrateHvutStorage",
    error: error?.message || String(error),
  };
  writeDiagnosticSessionSnapshot(DiagnosticEvidenceKey.APP_STARTUP_FAILURE, evidence);
  runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.ERROR,
    args: ["[HVAA] application bootstrap failed", evidence],
  });
});
