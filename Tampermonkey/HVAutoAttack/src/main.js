// HVAutoAttack 入口。所有业务在子模块中。
// SOT：原始单文件 ../legacy/[HV]AutoAttack.legacy.js（永不修改）。
import "./i18n/hv-utils.js"; // 副作用 import：HV Utils 统一汉化（sssss2）自执行，整页汉化。先于 init() 跑。
import { init } from "./pages/init.js";
init();
