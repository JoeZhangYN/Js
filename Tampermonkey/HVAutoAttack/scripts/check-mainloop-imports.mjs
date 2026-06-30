// 拆桥 gate：禁止 battle/main-loop.js 回退 import 已倒置的 step 实现。
// 背景：旧 main() 原直接 import 16 个具体实现（useGem/castDebuffOnAll/attack…）+ 内联闭包，
// 编排器与实现焊死。规则表和 runner 协议收敛后，runBattleTurnAutomation() 只该运行
// turn prelude，把 prelude 读到的 turn facts 转交给 prepareBattleTurnContext()，再把整体结果交给
// runBattleActionDecision(context)；
// 新增/调整 step 走 battle-action-decision.js。
// 本门控让旧路径（直接 import step 实现或拼规则表）不能再悄悄回归（反退化锁）。
//
// 符号级而非模块级：pre-step 也已收敛到 battle-turn-prelude，main-loop 不应直接导入。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const MAIN_LOOP = fileURLToPath(new URL("../src/battle/main-loop.js", import.meta.url));
const src = readFileSync(MAIN_LOOP, "utf8");

// 已倒置进行动决策链的 step-action 符号 + 旧编排器 —— main-loop 不得再直接 import。
const BANNED = [
  "BATTLE_RULES",
  "ACTION_STEPS",
  "runRules",
  "useGem",
  "deadSoon",
  "useScroll",
  "stallTopup",
  "useChannelSkill",
  "useBuffSkill",
  "useInfusions",
  "useDeSkill",
  "castDebuffOnAll",
  "attack",
  "checkCriticalBuffGuard",
  "checkAndActivateSpirit",
  "isStallMode",
  "shouldSkipForBigSkill",
  "runBossImperil",
  "runSteps",
  "killBug",
  "runBattleMonitorAutomation",
  "runMonsterStatusAutomation",
  "runBattleTurnRuntime",
  "runBattleKillBugRecovery",
  "BattleMonitorEvent",
  "MonsterStatusEvent",
  "BattleTurnEvent",
  "BattleKillBugRecoveryEvent",
];

// 仅解析 `import { ... } from "..."` 的具名绑定（避免误伤注释/字符串/默认导入）。
const importRe = /import\s*\{([^}]*)\}\s*from\s*["'][^"']+["']/g;
const imported = new Set();
let m;
while ((m = importRe.exec(src))) {
  for (const part of m[1].split(",")) {
    const name = part
      .trim()
      .split(/\s+as\s+/)[0]
      .trim();
    if (name) imported.add(name);
  }
}

const violations = BANNED.filter((b) => imported.has(b));
if (/const\s*\{[^}]*\bsnap\b[^}]*\}\s*=\s*prepareBattleTurnContext\(\)/.test(src)) {
  violations.push("destructured prepareBattleTurnContext()");
}
if (/runBattleActionDecision\([^,\n]+,\s*[^)]+\)/.test(src)) {
  violations.push("runBattleActionDecision(snap, options)");
}
if (!src.includes("runBattleTurnPrelude({ type: BattleTurnPreludeEvent.PREPARE_CURRENT_TURN })")) {
  violations.push("missing turn prelude entry");
}
if (!src.includes("prepareBattleTurnContext({ logTelemetry: prelude?.battleLogTelemetry })")) {
  violations.push("missing prelude battle log telemetry handoff");
}
if (violations.length) {
  console.error(
    `[check-mainloop-imports] main-loop.js 回退 import 了已倒置的 step 实现: ${violations.join(", ")}\n` +
      `  → 新增/调整行动 step 请改 battle-action-decision.js 的内部 ACTION_STEPS;\n` +
      `    main-loop 只该把 prepareBattleTurnContext() 整体交给 runBattleActionDecision(context)。`
  );
  process.exit(1);
}
console.log("[check-mainloop-imports] OK — main-loop delegates action decisions to one entry");
