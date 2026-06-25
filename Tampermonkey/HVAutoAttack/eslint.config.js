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
      // 反退化锁（拆桥）：g("end") 中断 flag 已彻底拆除（write-only 死路，主循环短路改由
      // dispatch 返 acted 驱动）。禁重新引入；如需"主循环停止"信号，让 decide 返 { kind } + dispatch 返 true。
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.name='g'][arguments.0.value='end']",
          message:
            'g("end") 中断 flag 已拆除（write-only 死路）。主循环停止信号由 dispatch 返 acted 驱动，勿重新引入全局 end flag。',
        },
      ],
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
