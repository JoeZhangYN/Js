// 编译期反退化：钉死 F4 跳 Imperil 的「costly-direction 默认保留」安全不变量，防重构悄悄放开。
// 不变量：① 跳 Imperil 全程门控 opt.skipImperilWhenOfcKills（默认 OFF）；② 学习器有 mid 缺失 +
//        样本量两道守卫（无证据→不跳）；③ boss Imperil 入口仍保留 skillReady["213"] 就绪事实。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("../src", import.meta.url));
const read = (rel) => readFileSync(`${SRC}/${rel}`, "utf8");

const learner = read("state/big-skill-kill-learner.js");
const bigSkill = read("battle/debuff/big-skill-debuff.js");
const bossImperil = read("battle/debuff/decide-boss-imperil.js");
const bossImperilTest = read("battle/debuff/decide-boss-imperil.test.js");
const debuffFacts = read("battle/debuff/debuff-facts.js");

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
need(/runBigSkillDebuffAutomation/.test(bigSkill), "big-skill.js 缺 debuff decision 入口");
if (/WILL_KILL_BOSS/.test(bigSkill)) {
  need(
    /skipImperilWhenOfcKills/.test(bigSkill),
    "big-skill.js 用 kill query 却无 skipImperilWhenOfcKills 门控"
  );
}

// ③ boss Imperil 入口不得丢掉 213 就绪事实：rule fact 映射，entry 消费。
need(
  /imperilSkillReady:\s*!!snap\?\.skillReady\?\.\["213"\]/.test(debuffFacts),
  'boss Imperil debuff facts 丢失 snap.skillReady["213"] 就绪事实映射'
);
need(
  /event\?\.imperilSkillReady/.test(bossImperil),
  "boss Imperil 入口丢失 imperilSkillReady 就绪事实门控"
);
need(
  !/event\.type\s*\|\|\s*EVENT_DECIDE/.test(bossImperil) &&
    /event\?\.type\s*\|\|\s*EVENT_DECIDE/.test(bossImperil),
  "boss Imperil 入口必须在事件类型归一化前 fail closed"
);
need(
  /runBossImperilAutomation\(null\)/.test(bossImperilTest),
  "boss Imperil 测试必须锁住 null event fail-closed"
);

if (fails.length) {
  console.error("[verify-imperil-safety] FAIL:");
  for (const f of fails) console.error("  - " + f);
  process.exit(1);
}
console.log(
  "[verify-imperil-safety] OK — 跳 Imperil 全程门控 + 无证据保留 + 213 就绪事实 三不变量在位"
);
