import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["dist/**", "node_modules/**", ".vite/**"],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        ...globals.browser,
        unsafeWindow: "readonly",
        GM_setValue: "readonly",
        GM_getValue: "readonly",
        GM_deleteValue: "readonly",
        GM_notification: "readonly",
        GM_info: "readonly",
        GM_xmlhttpRequest: "readonly", // P4 Live Percentile Send Range / P6 RMA ML
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
