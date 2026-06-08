// vitest 测试配置（独立于 vite.config.js）。
// 刻意不复用 vite.config.js：那里挂了 vite-plugin-monkey（注入 userscript banner /
// GM_* polyfill / 每次自增 @version），对单测无意义且会污染环境。decide/dispatch/runRules
// 等纯逻辑只需 happy-dom 提供 window/document/location 即可。
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.js"],
  },
});
