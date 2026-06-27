// option 字段统一读取层（5 大铁律 §1e 应抽未抽 — `g("option")?.xxx !== false` ≥ 10 处真重复）。
//
// 解决两个问题：
// 1. 早期 page hook（init.js 在 g("option") 装填前要读 forgeCostShow / equipPercentileMode）
//    → 需要 fallback 到 getValue("option", true)
// 2. defaultOn 字段（schema 里 defaultOn: true 的）原始 option 缺字段时也算启用
//    → 散落写法 `g("option")?.xxx !== false` 易写漏 ?. / 易把 undefined 当 false
//
// 同形态同失败模式 → 抽 helper 防退化。
import { g } from "./store.js";
import { delValue, getValue, setValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";

const EVENT_READ = "read";
const EVENT_WRITE = "write";
const EVENT_CLEAR = "clear";
const EVENT_READ_FIELD = "readField";
const EVENT_IS_ON = "isOn";
const EVENT_WRITE_FIELD = "writeField";

export const OptionEvent = Object.freeze({
  READ: EVENT_READ,
  WRITE: EVENT_WRITE,
  CLEAR: EVENT_CLEAR,
  READ_FIELD: EVENT_READ_FIELD,
  IS_ON: EVENT_IS_ON,
  WRITE_FIELD: EVENT_WRITE_FIELD,
});

function readOption() {
  return g("option") || getValue(STORAGE_KEYS.OPTION, true) || null;
}

function writeOption(option) {
  g("option", option);
  setValue(STORAGE_KEYS.OPTION, option);
}

function clearOption() {
  g("option", null);
  delValue(STORAGE_KEYS.OPTION);
}

/**
 * 读 option 字段值：g("option") 优先（已装填），缺则 fallback 到 GM_setValue 直读，再缺返 fallback。
 * @param {string} key option 键名
 * @param {*=} fallback 字段未设时的默认值
 * @returns {*} option[key]，或 fallback
 */
function getOption(key, fallback) {
  const opt = readOption() || {};
  return opt[key] !== undefined ? opt[key] : fallback;
}

/**
 * defaultOn 风格 bool 字段是否启用（schema 默认开启，除非用户显式关）。
 * 等价于 `g("option")?.xxx !== false` 但带 fallback 处理 + 早期未装填兼容。
 * @param {string} key
 */
function isOptionOn(key) {
  return getOption(key, true) !== false;
}

/**
 * 写 option 单字段并持久化（统一写入口）。先取**完整** option（g 优先，未装填则 getValue 直读
 * 持久化态，再缺才空对象），改单字段后回写内存 + 落盘。
 *
 * 杜绝散落的 `g("option")||{}` 残缺写：在 option 尚未装填的页面（如 showequip 早返回页）切 lang，
 * 旧写法只剩 `{lang}` 落盘，抹掉其它全部配置（现象①持久化失效根因）。本入口经 getValue fallback
 * 始终拿到完整 option，单字段更新不丢其它字段。
 * @param {string} key option 键名
 * @param {*} val 新值
 */
function setOption(key, val) {
  const opt = readOption() || {};
  opt[key] = val;
  writeOption(opt);
}

export function runOptionAutomation(event = { type: EVENT_READ }) {
  if (event.type === EVENT_READ) return readOption();
  if (event.type === EVENT_WRITE) {
    writeOption(event.option);
    return undefined;
  }
  if (event.type === EVENT_CLEAR) {
    clearOption();
    return undefined;
  }
  if (event.type === EVENT_READ_FIELD) return getOption(event.key, event.fallback);
  if (event.type === EVENT_IS_ON) return isOptionOn(event.key);
  if (event.type === EVENT_WRITE_FIELD) {
    setOption(event.key, event.value);
    return undefined;
  }
  return undefined;
}
