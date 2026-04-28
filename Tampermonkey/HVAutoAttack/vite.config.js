// DO NOT CHANGE @name OR @namespace BEFORE v10.0
// 这两个值决定 Tampermonkey GM_* 存储的命名空间。改了 → 用户配置全部丢失。
// 红线：重构期间必须与原 [HV]AutoAttack.js 头部完全一致。
import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8")
);

export default defineConfig({
  plugins: [
    monkey({
      entry: "src/main.js",
      userscript: {
        name: {
          "": "[HV]AutoAttack",
          "zh-CN": "[HV]AutoAttack",
          "zh-TW": "[HV]AutoAttack",
        },
        namespace: "https://github.com/dodying/",
        version: pkg.version,
        description: {
          "": "HV auto attack script, for the first user, should configure before use it.",
          "zh-CN": "HV自动打怪脚本，初次使用，请先设置好选项，请确认字体设置正常",
          "zh-TW": "HV自動打怪腳本，初次使用，請先設置好選項，請確認字體設置正常",
        },
        author: "dodying joezhangyn",
        icon: "https://gitee.com/dodying/userJs/raw/master/Logo.png",
        supportURL: "https://github.com/dodying/UserJs/issues",
        match: [
          "http*://hentaiverse.org/*",
          "http://alt.hentaiverse.org/*",
          "https://e-hentai.org/*",
        ],
        exclude: [
          "http*://hentaiverse.org/pages/showequip.php?*",
          "http://alt.hentaiverse.org/pages/showequip.php",
        ],
        grant: [
          "GM_setValue",
          "GM_getValue",
          "GM_deleteValue",
          "GM_notification",
          "unsafeWindow",
        ],
        "run-at": "document-end",
      },
      build: {
        fileName: "HVAutoAttack.user.js",
        metaFileName: false,
      },
      server: {
        mountGmApi: true,
      },
    }),
  ],
  build: {
    minify: false,
    target: "es2020",
    sourcemap: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
