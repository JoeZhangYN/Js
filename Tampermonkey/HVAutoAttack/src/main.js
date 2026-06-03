// HVAutoAttack 入口。所有业务在子模块中。
// SOT：原始单文件 ../legacy/[HV]AutoAttack.legacy.js（永不修改）。
import { initEquipTranslate } from "./i18n/equip-translate.js"; // indefined HV物品装备汉化 #404119（装备词条 + 词缀分色）
import { initInterfaceTranslate } from "./i18n/interface-translate.js"; // indefined HentaiVerse汉化(界面) #404118（角色页/界面词条，含 Fighting Style 等）
import "./i18n/hv-utils.js"; // 副作用 import：HV Utils 统一汉化（sssss2）自执行，整页汉化。
import { init } from "./pages/init.js";

// 汉化执行：equip/interface 翻 HV 原生英文文本（装备名/角色页/界面），与 sssss2 功能 UI 区域不同、无覆盖。
// 注：vite 提升 import，hv-utils 副作用在 import 阶段先跑；下方显式调用 indefined 两套汉化 + 主逻辑。
initEquipTranslate();
initInterfaceTranslate();
init();
