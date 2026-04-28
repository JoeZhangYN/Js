// OPTION_SCHEMA 单 SOT（Phase 5 chunk A 引入；现存 ~80 字段渐进迁入，新字段直接进 schema）。
// 当前阶段只声明 Phase 6 新增的 3 个字段；老字段仍由 settings/render.js 内联模板渲染。
// 后续 chunk 把全 80 字段迁入 schema、render.js 改为 schema-driven。

/**
 * @typedef {object} OptionField
 * @property {string} key 存储 key
 * @property {"checkbox"|"number"|"text"|"select"} kind UI 类型
 * @property {string} group tab 分组（Main/Spell/Item/Channel/Buff/Debuff/Skill/Drop/Usage/Alarm/QuickSite/Backup）
 * @property {{l0:string,l1:string,l2:string}} label 三语标签
 * @property {*} default 默认值
 * @property {boolean} [defaultOn] checkbox 上是否标 data-default-on
 * @property {string[]} [enum] select 选项
 * @property {(v:any)=>boolean} [validate] 自定义校验
 * @property {string} [description] 三语说明（可选）
 */

/** @type {OptionField[]} */
export const OPTION_SCHEMA = [
  // === Phase 6 新增：OFC/FRD CD 跟踪 + 跳过 debuff ===
  {
    key: "skipDebuffForBigSkill_We",
    kind: "checkbox",
    group: "Debuff",
    default: true,
    defaultOn: true,
    label: {
      l0: "OFC/FRD 即将就绪时跳过全员 Weaken",
      l1: "OFC/FRD 即將就緒時跳過全員 Weaken",
      l2: "Skip All-Weaken when OFC/FRD ready soon",
    },
  },
  {
    key: "skipDebuffForBigSkill_Im",
    kind: "checkbox",
    group: "Debuff",
    default: true,
    defaultOn: true,
    label: {
      l0: "OFC/FRD 即将就绪时跳过全员 Imperil",
      l1: "OFC/FRD 即將就緒時跳過全員 Imperil",
      l2: "Skip All-Imperil when OFC/FRD ready soon",
    },
  },
  {
    key: "skipDebuffForBigSkillThreshold",
    kind: "number",
    group: "Debuff",
    default: 3,
    label: {
      l0: "OFC/FRD CD 阈值（剩余 ≤ N 回合时触发跳过）",
      l1: "OFC/FRD CD 閾值（剩餘 ≤ N 回合時觸發跳過）",
      l2: "OFC/FRD CD threshold (skip when ≤ N turns)",
    },
  },
];

/**
 * 取 schema 中字段默认值。未注册返 undefined（Phase 5 渐进迁入期老字段不在表里）。
 * @param {string} key
 */
export function getOptionDefault(key) {
  const f = OPTION_SCHEMA.find((x) => x.key === key);
  return f ? f.default : undefined;
}

/**
 * 取某 tab 下所有字段（用于 render.js 渐进迁入）。
 * @param {string} group
 */
export function getFieldsByGroup(group) {
  return OPTION_SCHEMA.filter((f) => f.group === group);
}
