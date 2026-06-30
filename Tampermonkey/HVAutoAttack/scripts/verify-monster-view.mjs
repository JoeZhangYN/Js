// 反退化 probe（拆桥）：决策层（decide-*.js + action decision/sequence 组合根）的目标选择与血量读取
// 必须走统一怪物视图 snap.view（battle/monster-view.js join）+ target-strategy 具名策略，
// 不得裸读散落字段或绕过缓存直查库。
//
// 背景：怪物事实曾散在 snap.monsters(血条百分比) / g("monsterStatus")(绝对血/finWeight) /
// monster-db(九抗) 三面，各 decide 各取一面 → Drain 目标漂移即源于此（用了 hpRatio 百分比 + 邻居偏移）。
// 已收口到 snap.view（含 hpPercent/hpAbsNow/hpMax/finWeight/resists/isBoss）+ target-strategy。
//
// 锁三类（仅扫决策层，视图源头 monster-view/target-strategy/snapshot/attack 不在 scope）：
//   ① 裸读 .hpRatio/.hpNow/.finWeight → 走 view.hpPercent/hpAbsNow + target-strategy 具名策略
//   ② 读 .monsters → 走 snap.view + monster-view 的 aliveByOrder/byOrder
//   ③ getMonster（直查 IndexedDB）→ 走 state/monster-cache（同步缓存，prime 在 resist-panel）
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { stripComments } from "./lib/i18n-probe-lex.mjs";

const SRC_DIR = fileURLToPath(new URL("../src", import.meta.url));

/** scope：决策层 = decide-*.js（非 test）+ action decision/sequence 组合根。视图源头不在 scope。 */
function isDecideFile(rel) {
  if (rel === "battle/battle-action-decision.js") return true;
  if (rel === "battle/battle-action-attack-sequence.js") return true;
  if (rel === "battle/battle-action-buff-sequence.js") return true;
  if (rel === "battle/battle-action-debuff-sequence.js") return true;
  if (rel === "battle/battle-action-survival-sequence.js") return true;
  const name = rel.split("/").pop();
  return name.startsWith("decide-") && !name.endsWith(".test.js");
}

const RULES = [
  {
    re: /\.(hpRatio|hpNow|finWeight)\b/,
    msg: "裸读 .hpRatio/.hpNow/.finWeight → 走 snap.view 的 hpPercent/hpAbsNow + target-strategy 具名策略",
  },
  { re: /\.monsters\b/, msg: "读 .monsters → 走 snap.view + monster-view 的 aliveByOrder/byOrder" },
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
for (const { abs, rel } of collectJs(SRC_DIR)) {
  if (!isDecideFile(rel)) continue;
  const codeLines = stripComments(readFileSync(abs, "utf8")).split(/\r?\n/);
  for (let i = 0; i < codeLines.length; i += 1) {
    for (const r of RULES) {
      if (r.re.test(codeLines[i])) violations.push({ rel, line: i + 1, msg: r.msg });
    }
  }
}

if (violations.length > 0) {
  console.error(`[verify-monster-view] FAIL: ${violations.length} 处决策层绕过统一怪物视图：`);
  for (const v of violations) console.error(`  src/${v.rel}:${v.line} — ${v.msg}`);
  process.exit(1);
}

console.log(
  "[verify-monster-view] OK — 决策层目标选择/血量统一走 snap.view + target-strategy（无散落裸读 / 无绕缓存直查库）"
);
