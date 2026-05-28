// Riddle 答案码映射 SSOT。
// 短码 (ts/ra/fs/rd/pp/aj) → riddler1 内 6 个候选项 checkbox 的 children 索引（RMA L40 同源）。
// 提取到 data 叶子层打破 riddle.js ↔ riddle-ml.js 循环依赖：
//   原 riddle-ml.js 顶层 `Object.keys(ANSWER_MAP)` 在 riddle.js 的 `const ANSWER_MAP`
//   初始化前求值 → "Cannot access 'ANSWER_MAP' before initialization" TDZ。
//   下沉到无依赖叶子后，两边都 import 自此处，叶子最先初始化，TDZ 根除。
export const ANSWER_MAP = { ts: 0, ra: 1, fs: 2, rd: 3, pp: 4, aj: 5 };
