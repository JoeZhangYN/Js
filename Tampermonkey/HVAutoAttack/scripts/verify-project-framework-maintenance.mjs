import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const agentsPath = path.join(root, "AGENTS.md");
const businessMapPath = path.join(root, "BUSINESS-MAP.md");
const runBuildPath = path.join(root, "scripts", "run-build.mjs");
const agents = fs.readFileSync(agentsPath, "utf8");
const businessMap = fs.readFileSync(businessMapPath, "utf8");
const runBuild = fs.readFileSync(runBuildPath, "utf8");
const violations = [];

for (const required of [
  "## Project-Framework Self-Maintenance",
  "project-framework self-maintenance before and after the boundary edit",
  "which old behaviors remain authoritative",
  "Classify the failure as framework drift",
  "Self-discover abstraction candidates exposed by the fix",
  "Do not regress original business capability during convergence",
  "Completion evidence must separate layers",
  "When project rules, architecture prompts, or corrected working goals change",
  "Keep framework artifacts synchronized",
  "Framework Drift Callback Index",
  "Encounter countdown/count writes must require authoritative encounter entry",
  "HVUT evidence-backed failures must surface through copyable diagnostics",
]) {
  if (!agents.includes(required)) {
    violations.push(`AGENTS.md must keep project-framework maintenance rule: ${required}`);
  }
}

for (const required of [
  "## 10. Framework Drift Callback Index",
  "后续 codex 回调/续跑",
  "`identity`",
  "`authority`",
  "`drift`",
  "`converged-entry`",
  "`guard`",
  "`next-callback`",
  "HVUT failure evidence / runtime diagnostics",
  "Main / Isekai encounter world authority",
  "Armory page fact parsing",
  "## 11. Next Architecture Boundary Queue",
  "Encounter readiness authority",
  "HVUT config/storage visible diagnostics",
  "HVUT page fact optionality",
  "只有真实遭遇战 entry 成功或战斗启动证据才能推进倒计时/计数",
  "所有 HVUT 配置、日志、缓存、迁移、持久化失败统一进入 typed evidence + copyable report",
]) {
  if (!businessMap.includes(required)) {
    violations.push(`BUSINESS-MAP.md must keep callback reference anchor: ${required}`);
  }
}

if (!runBuild.includes("node scripts/verify-project-framework-maintenance.mjs")) {
  violations.push("run-build.mjs must run verify-project-framework-maintenance.mjs");
}

if (violations.length) {
  console.error("[verify-project-framework-maintenance] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-project-framework-maintenance] OK - project framework maintenance is locked");
