import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["dist/**", "node_modules/**", ".vite/**", "src/i18n/**"],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        ...globals.browser,
        unsafeWindow: "writable", // init.js 跨 GM 实现 fallback 习语会重新赋值（reloader.js 读解析后的值）
        GM_setValue: "readonly",
        GM_getValue: "readonly",
        GM_deleteValue: "readonly",
        GM_notification: "readonly",
        GM_info: "readonly",
        GM_xmlhttpRequest: "readonly", // P4 Live Percentile Send Range / P6 RMA ML
        GM_listValues: "readonly", // P6 导出答题备份遍历 saved_*
        GM_registerMenuCommand: "readonly", // P6 GM 菜单「导出答题备份」
        GM: "readonly", // RMA 用 GM.xmlHttpRequest 兼容路径
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
      "no-empty": ["error", { allowEmptyCatch: true }],
      camelcase: "off",
      "no-inner-declarations": "off",
    },
  },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node },
    },
  },
];
