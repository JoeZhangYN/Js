// 编译期反退化：钉死 F3 CD 学习器的两道安全夹 + 消费方 DOM 就绪权威，防未来重构悄悄移除。
// 不变量：① 学习 CD 只能下拉(cd-tracker 夹 Math.min(learnedCd, cdBase))；
//        ② 拒学膨胀(cd-learner 夹 Math.min(gap, entry.cdBase))；
//        ③ 真正开火仍以 DOM snap.skillReady 为权威(decide-skill 仍读它) —— 学习值只锐化前瞻。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("../src", import.meta.url));
const read = (rel) => readFileSync(`${SRC}/${rel}`, "utf8");

const checks = [
  {
    file: "state/cd-tracker.js",
    re: /CdLearningEvent\.READ_CD[\s\S]*Math\.min\(\s*learnedCd\s*,\s*entry\.cdBase\s*\)/,
    msg: "cd-tracker.turnsUntilReady 缺 CD learner 入口读取 + Math.min(learnedCd, cdBase) 下拉夹",
  },
  {
    file: "state/cd-learner.js",
    re: /Math\.min\(\s*gap\s*,\s*entry\.cdBase\s*\)/,
    msg: "cd-learner 缺 Math.min(gap, entry.cdBase) 拒学膨胀夹",
  },
  {
    file: "battle/attack/decide-skill.js",
    re: /snap\.skillReady\[/,
    msg: "decide-skill 不再以 snap.skillReady 为开火权威（学习 CD 不得成为唯一开火门）",
  },
];

let bad = 0;
for (const c of checks) {
  if (!c.re.test(read(c.file))) {
    console.error(`[verify-cd-learner-safety] FAIL: ${c.msg}（${c.file}）`);
    bad++;
  }
}
if (bad) process.exit(1);
console.log("[verify-cd-learner-safety] OK — CD 学习只下拉 + 拒学膨胀 + DOM 就绪权威 三不变量在位");
