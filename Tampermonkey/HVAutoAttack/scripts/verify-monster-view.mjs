// 反退化 probe（拆桥）：决策层（decide-*.js + action decision 组合根）的目标选择与血量读取
// 必须走统一怪物视图 snap.view（battle-monster-view entry）+ battle-target-strategy 入口，
// 不得裸读散落字段或绕过缓存直查库。
//
// 背景：怪物事实曾散在 snap.monsters(血条百分比) / g("monsterStatus")(绝对血/finWeight) /
// monster-db(九抗) 三面，各 decide 各取一面 → Drain 目标漂移即源于此（用了 hpRatio 百分比 + 邻居偏移）。
// 已收口到 snap.view（含 hpPercent/hpAbsNow/hpMax/finWeight/resists/isBoss）+ target strategy entry。
//
// 锁三类（仅扫决策层，视图源头 monster-view/target-strategy/snapshot/attack 不在 scope）：
//   ① 裸读 .hpRatio/.hpNow/.finWeight → 走 view.hpPercent/hpAbsNow + target strategy entry
//   ② 读 .monsters → 走 snap.view + battle-monster-view 的 aliveByOrder/byOrder
//   ③ getMonster（直查 IndexedDB）→ 走 state/monster-cache（同步缓存，prime 在 resist-panel）
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { stripComments } from "./lib/i18n-probe-lex.mjs";

const SRC_DIR = fileURLToPath(new URL("../src", import.meta.url));
const LEGACY_TARGET_STRATEGY = `${SRC_DIR}/battle/target-strategy.js`;

/** scope：决策层 = decide-*.js（非 test）+ action decision 组合根。视图源头不在 scope。 */
function isDecideFile(rel) {
  if (rel === "battle/battle-action-decision.js") return true;
  const name = rel.split("/").pop();
  return name.startsWith("decide-") && !name.endsWith(".test.js");
}

const RULES = [
  {
    re: /\.(hpRatio|hpNow|finWeight)\b/,
    msg: "裸读 .hpRatio/.hpNow/.finWeight → 走 snap.view 的 hpPercent/hpAbsNow + target strategy entry",
  },
  {
    re: /\.monsters\b/,
    msg: "读 .monsters → 走 snap.view + battle-monster-view 的 aliveByOrder/byOrder",
  },
  { re: /\bgetMonster\b/, msg: "decide 层直查库 getMonster → 走 state/monster-cache（同步缓存）" },
];

function collectJs(dir, base = "") {
  const out = [];
  for (const name of readdirSync(dir)) {
    const abs = `${dir}/${name}`;
    const rel = base ? `${base}/${name}` : name;
    if (statSync(abs).isDirectory()) out.push(...collectJs(abs, rel));
    else if (name.endsWith(".js")) out.push({ abs, rel });
  }
  return out;
}

const violations = [];
if (existsSync(LEGACY_TARGET_STRATEGY)) {
  violations.push({
    rel: "battle/target-strategy.js",
    line: 1,
    msg: "legacy target-strategy helper module must stay retired",
  });
}

const targetStrategyFile = `${SRC_DIR}/battle/battle-target-strategy.js`;
const targetStrategyText = readFileSync(targetStrategyFile, "utf8");
const targetStrategyEntry =
  targetStrategyText.match(/export function runBattleTargetStrategy\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
  "";
if (/battleTargetStrategyEventHandlers\[event\.type\]/.test(targetStrategyEntry)) {
  violations.push({
    rel: "battle/battle-target-strategy.js",
    line: 1,
    msg: "target strategy entry must fail closed for invalid events",
  });
}
if (!/battleTargetStrategyEventHandlers\[event\?\.type\]/.test(targetStrategyEntry)) {
  violations.push({
    rel: "battle/battle-target-strategy.js",
    line: 1,
    msg: "target strategy entry must dispatch invalid events through optional type",
  });
}
const targetStrategyTestText = readFileSync(`${SRC_DIR}/battle/battle-target-strategy.test.js`, "utf8");
if (!targetStrategyTestText.includes("rejects invalid target strategy events")) {
  violations.push({
    rel: "battle/battle-target-strategy.test.js",
    line: 1,
    msg: "target strategy tests must cover invalid events",
  });
}
if (!/runBattleTargetStrategy\(null\)/.test(targetStrategyTestText)) {
  violations.push({
    rel: "battle/battle-target-strategy.test.js",
    line: 1,
    msg: "target strategy tests must cover null events",
  });
}

for (const { abs, rel } of collectJs(SRC_DIR)) {
  if (!isDecideFile(rel)) continue;
  const codeLines = stripComments(readFileSync(abs, "utf8")).split(/\r?\n/);
  for (let i = 0; i < codeLines.length; i += 1) {
    for (const r of RULES) {
      if (r.re.test(codeLines[i])) violations.push({ rel, line: i + 1, msg: r.msg });
    }
    if (/from\s+["'][^"']*(?:^|[\\/])target-strategy\.js["']/.test(codeLines[i])) {
      violations.push({
        rel,
        line: i + 1,
        msg: "decide 层目标选择必须走 runBattleTargetStrategy(event)",
      });
    }
  }
}

for (const { abs, rel } of collectJs(`${SRC_DIR}/battle`)) {
  if (
    rel === "battle-target-strategy.js" ||
    rel === "battle-target-strategy.test.js" ||
    rel === "target-strategy.test.js"
  ) {
    continue;
  }
  const codeLines = stripComments(readFileSync(abs, "utf8")).split(/\r?\n/);
  for (let i = 0; i < codeLines.length; i += 1) {
    if (/from\s+["'][^"']*(?:^|[\\/])target-strategy\.js["']/.test(codeLines[i])) {
      violations.push({
        rel: `battle/${rel}`,
        line: i + 1,
        msg: "battle 目标选择必须走 runBattleTargetStrategy(event)",
      });
    }
  }
}

for (const { abs, rel } of collectJs(`${SRC_DIR}/battle`)) {
  const codeLines = stripComments(readFileSync(abs, "utf8")).split(/\r?\n/);
  for (let i = 0; i < codeLines.length; i += 1) {
    if (/from\s+["'][^"']*(?:^|[\\/])target-strategy\.js["']/.test(codeLines[i])) {
      violations.push({
        rel: `battle/${rel}`,
        line: i + 1,
        msg: "legacy target-strategy helper imports must stay retired",
      });
    }
  }
}

if (violations.length > 0) {
  console.error(`[verify-monster-view] FAIL: ${violations.length} 处决策层绕过统一怪物视图：`);
  for (const v of violations) console.error(`  src/${v.rel}:${v.line} — ${v.msg}`);
  process.exit(1);
}

console.log(
  "[verify-monster-view] OK — 决策层目标选择/血量统一走 snap.view + target strategy entry（无散落裸读 / 无绕缓存直查库）"
);
