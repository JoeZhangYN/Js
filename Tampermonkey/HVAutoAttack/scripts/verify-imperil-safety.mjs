// 编译期反退化：钉死 F4 跳 Imperil 的「costly-direction 默认保留」安全不变量，防重构悄悄放开。
// 不变量：① 跳 Imperil 全程门控 opt.skipImperilWhenOfcKills（默认 OFF）；② 学习器有 mid 缺失 +
//        样本量两道守卫（无证据→不跳）；③ boss Imperil 入口仍保留 DOM skillReady["213"] 原始就绪条件。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("../src", import.meta.url));
const read = (rel) => readFileSync(`${SRC}/${rel}`, "utf8");

const learner = read("state/big-skill-kill-learner.js");
const bigSkill = read("battle/rules/big-skill.js");
const bossImperil = read("battle/rules/decide-boss-imperil.js");

const fails = [];
const need = (cond, msg) => {
  if (!cond) fails.push(msg);
};

// ① 学习器决策：toggle 门 + mid 缺失守卫 + 样本量守卫，缺一即可能无证据放跳
need(
  /skipImperilWhenOfcKills/.test(learner),
  "big-skill-kill-learner 缺 skipImperilWhenOfcKills 开关门"
);
need(
  /mid\s*==\s*null/.test(learner),
  "big-skill-kill-learner 缺 mid==null 守卫（未知 boss 必须保留 Imperil）"
);
need(/bigKillMinSamples/.test(learner), "big-skill-kill-learner 缺 bigKillMinSamples 样本量守卫");

// ② 消费方 big-skill.js：引用 big-skill kill query 必同时受 skipImperilWhenOfcKills 门控
if (/WILL_KILL_BOSS/.test(bigSkill)) {
  need(
    /skipImperilWhenOfcKills/.test(bigSkill),
    "big-skill.js 用 kill query 却无 skipImperilWhenOfcKills 门控"
  );
}

// ③ boss Imperil 入口不得丢掉原始 DOM 就绪条件
need(
  /skillReady\??\.\["213"\]/.test(bossImperil),
  'boss Imperil 入口丢失 snap.skillReady["213"] 原始就绪条件'
);

if (fails.length) {
  console.error("[verify-imperil-safety] FAIL:");
  for (const f of fails) console.error("  - " + f);
  process.exit(1);
}
console.log(
  "[verify-imperil-safety] OK — 跳 Imperil 全程门控 + 无证据保留 + DOM 就绪条件 三不变量在位"
);
