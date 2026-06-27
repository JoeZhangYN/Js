// DO NOT CHANGE @name OR @namespace BEFORE v10.0
// 这两个值决定 Tampermonkey GM_* 存储的命名空间。改了 → 用户配置全部丢失。
// 红线：重构期间必须与原 [HV]AutoAttack.js 头部完全一致。
import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

// @version 每次构建自增（pkg.version + 构建时间戳）：让 Tampermonkey「覆盖安装」时识别为新版本 →
// 刷新 @connect / @grant 授权。背景（2026-06-06 排查结论）：原 @version 恒 10.0.1 → 覆盖安装 TM
// 因版本未变不刷新 grant → 新加的 @connect rdma.ooguy.com 未生效 → ML POST onerror（网络/CORS）。
// name/namespace 不动 → GM 存储命名空间不受 version 影响，用户配置不丢（见文件顶部红线）。
// 代价：每次 rebuild 都是新版本，TM 会提示更新/重确认授权（开发期可接受）。
const buildStamp = (() => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
})();
const version = `${pkg.version}.${buildStamp}`;

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
        version,
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
          "https://alt.hentaiverse.org/*", // HV Utils 汉化覆盖 alt https
          "https://e-hentai.org/*",
          "http://e-hentai.org/*", // HV Utils 汉化覆盖 e-hentai http
        ],
        // P1 (PriceForged) + P3P4 (equip-percentile) 要求放开 showequip.php，
        // 让 setupForgeCost / setupEquipPercentile 能在装备页运行；
        // showequip-forge-cost.js 与 equip-percentile-dispatcher.js 内部有 #eu span / #popup_box 兜底，普通页自然 no-op
        exclude: [],
        grant: [
          "GM_setValue",
          "GM_getValue",
          "GM_deleteValue",
          "GM_notification",
          "GM_xmlhttpRequest", // P6 RMA ML 远程答题 POST rdma.ooguy.com
          "GM_addStyle", // HV Utils 汉化 60+ 处 CSS 注入
          "GM_listValues", // P6 导出答题备份遍历 saved_*
          "GM_registerMenuCommand", // P6 GM 菜单「导出答题备份」
          "unsafeWindow",
        ],
        connect: [
          "rdma.ooguy.com", // P6 RMA ML 答题端点
          "hv-monsterdb-data.skk.moe", // C 怪物九抗全量库（SukkaW 社区 DB, MIT）
          "hentaiverse.org", // HV Utils 汉化 $ajax 自请求
          "e-hentai.org", // HV Utils 汉化 e-hentai 域请求
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
