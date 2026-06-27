// GM_* / localStorage 持久化封装。storagePrefix 从 env.js 注入（单例）。
// 行为对齐原 setValue/getValue/delValue：未装 GM_* 时 fallback 到 window.localStorage。
import { storagePrefix } from "../env.js";
import { STORAGE_KEYS } from "./persist-keys.js";

/**
 * 写入持久化数据。
 * @param {string} item key（不含 prefix）
 * @param {*} value 任意可序列化值；非字符串走 JSON.stringify
 */
export function setValue(item, value) {
  const key = storagePrefix + item;
  // 防退化：完整 option 必带 version（init.js 装填时对齐）。缺 version = 疑似散落 `g("option")||{}`
  // 残缺写覆盖完整配置（现象①根因）。只 warn 不阻断（advisory），引导改走 state/option.js setOption。
  if (item === STORAGE_KEYS.OPTION && value && typeof value === "object" && !value.version) {
    console.warn(
      "[HVAA] setValue('option') 写入缺 version 字段，疑似残缺 option 覆盖；应走 setOption() 统一写入口:",
      value
    );
  }
  if (typeof GM_setValue === "undefined") {
    window.localStorage[key] = typeof value === "string" ? value : JSON.stringify(value);
  } else {
    GM_setValue(key, value);
  }
}

/**
 * 读取持久化数据。
 * @param {string} item key（不含 prefix）
 * @param {boolean=} toJSON true 时对 localStorage fallback 走 JSON.parse
 * @returns {*}
 */
export function getValue(item, toJSON) {
  const key = storagePrefix + item;
  if (typeof GM_getValue === "undefined" || !GM_getValue(key, null)) {
    return key in window.localStorage
      ? toJSON
        ? JSON.parse(window.localStorage[key])
        : window.localStorage[key]
      : null;
  }
  return GM_getValue(key, null);
}

/**
 * 删除持久化数据。支持字符串 key 或快捷 number：
 * 0 → 清 disabled；1 → 清 round* + monsterStatus；2 → 清 roundType + battleCode + 0+1。
 * @param {string|number} item
 */
export function delValue(item) {
  const key = storagePrefix + item;
  if (typeof item === "string") {
    if (typeof GM_deleteValue === "undefined") {
      window.localStorage.removeItem(key);
    } else {
      GM_deleteValue(key);
    }
  } else if (typeof item === "number") {
    if (item === 0) {
      delValue(STORAGE_KEYS.DISABLED);
    } else if (item === 1) {
      delValue(STORAGE_KEYS.ROUND_NOW);
      delValue(STORAGE_KEYS.ROUND_ALL);
      delValue(STORAGE_KEYS.MONSTER_STATUS);
    } else if (item === 2) {
      delValue(STORAGE_KEYS.ROUND_TYPE);
      delValue(STORAGE_KEYS.BATTLE_CODE);
      delValue(0);
      delValue(1);
    }
  }
}
