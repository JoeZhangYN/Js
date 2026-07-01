// HVAutoAttack 入口。所有业务在子模块中。
// SOT：原始单文件 ../legacy/[HV]AutoAttack.legacy.js（永不修改）。
import { initEquipTranslate } from "./i18n/equip-translate.js"; // indefined HV物品装备汉化 #404119（装备词条 + 词缀分色）
import { initInterfaceTranslate } from "./i18n/interface-translate.js"; // indefined HentaiVerse汉化(界面) #404118（角色页/界面词条，含 Fighting Style 等）
import "./pages/encounter-bridge.js"; // hv-utils sloppy-mode 不能 import；随机遭遇业务口径通过桥复用。
import "./i18n/equip-filter-expression-bridge.js"; // hv-utils sloppy-mode 不能 import；装备筛选表达式经受限 parser 桥求值。
import "./core/navigation-bridge.js"; // hv-utils sloppy-mode 不能 import；重定向能力经全局导航桥统一收口。
import "./i18n/hv-utils.js"; // 副作用 import：HV Utils 统一汉化（sssss2）自执行，整页汉化。
import { init } from "./pages/init.js";
import { g } from "./state/store.js";
import { setLang } from "./i18n/core/restore-controller.js";

// 汉化执行：equip/interface 翻 HV 原生英文文本（装备名/角色页/界面），与 sssss2 功能 UI 区域不同、无覆盖。
// 注：vite 提升 import，hv-utils 副作用在 import 阶段先跑；下方显式调用 indefined 两套汉化 + 主逻辑。
initEquipTranslate();
initInterfaceTranslate();
init();
// 首次翻译在 lang 就绪前已出简体；按持久化 lang 修正显示态（1 转繁 / 2 还原英文原文；0 简体已正确）
const _lang = String(g("lang"));
if (_lang === "1" || _lang === "2") setLang(_lang);
