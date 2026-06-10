// file-size-gate: exempt schema 声明式 SOT-设计上渐增至 80+ 字段（待办 C 全量迁入）
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
  // === 移动端防卡死：定时绝对时钟刷新（与 reloader.delayReload 正交） ===
  {
    key: "pageRefresh",
    kind: "checkbox",
    group: "Main",
    default: true,
    defaultOn: true,
    label: {
      l0: "定时刷新页面（防移动端长时间挂机卡死）",
      l1: "定時刷新頁面（防移動端長時間掛機卡死）",
      l2: "Periodic page refresh (mobile anti-hang)",
    },
  },
  {
    key: "pageRefreshMinutes",
    kind: "number",
    group: "Main",
    default: 30,
    label: {
      l0: "刷新间隔（分钟）",
      l1: "刷新間隔（分鐘）",
      l2: "Refresh interval (minutes)",
    },
  },
  // === 关键 buff graceful degradation (Monsterbation L1318 灵感) ===
  {
    key: "pauseOnCriticalBuffExpire",
    kind: "checkbox",
    group: "Main",
    default: false,
    label: {
      l0: "关键 buff 即将消失+MP 不足时暂停脚本",
      l1: "關鍵 buff 即將消失+MP 不足時暫停腳本",
      l2: "Pause when critical buff expiring & MP low",
    },
  },
  {
    key: "criticalBuffsList",
    kind: "text",
    group: "Main",
    default: "Hastened,Protection,Spark of Life",
    label: {
      l0: "关键 buff 列表（英文名，逗号分隔）",
      l1: "關鍵 buff 列表（英文名，逗號分隔）",
      l2: "Critical buffs (English name, comma-separated)",
    },
  },
  {
    key: "criticalBuffMinTurns",
    kind: "number",
    group: "Main",
    default: 2,
    label: {
      l0: "关键 buff 剩余阈值（≤N 回合触发）",
      l1: "關鍵 buff 剩餘閾值（≤N 回合觸發）",
      l2: "Critical buff turns threshold (≤N triggers)",
    },
  },
  {
    key: "criticalBuffMpFloor",
    kind: "number",
    group: "Main",
    default: 30,
    label: {
      l0: "MP 阈值（<N% 视为不足以续 buff）",
      l1: "MP 閾值（<N% 視為不足以續 buff）",
      l2: "MP threshold (<N% means insufficient to recast)",
    },
  },
  // === 自动维修：耐久阈值 + 缺料联动物品商店买齐（两世界统一，repair/ 业务能力消费） ===
  {
    key: "repairValue",
    kind: "number",
    group: "Main",
    default: 60,
    label: {
      l0: "修复装备耐久阈值（耐久 ≤ N% 才修；留空用默认 60）",
      l1: "修復裝備耐久閾值（耐久 ≤ N% 才修；留空用默認 60）",
      l2: "Repair durability threshold (repair when ≤ N%; blank = 60)",
    },
  },
  {
    key: "repairBuyMaterials",
    kind: "checkbox",
    group: "Main",
    default: false,
    label: {
      l0: "维修缺料时自动从物品商店买齐再修",
      l1: "維修缺料時自動從物品商店買齊再修",
      l2: "Auto-buy materials from Item Shop to repair",
    },
  },
  {
    key: "repairCreditCap",
    kind: "number",
    group: "Main",
    default: 50000,
    label: {
      l0: "买料单轮花费上限（信用点，超限停机告警）",
      l1: "買料單輪花費上限（信用點，超限停機告警）",
      l2: "Material spend cap per run (credits)",
    },
  },
  // === P1 PriceForged 强化价格（装备页注入 tooltip + 总价 + Lv 预测） ===
  {
    key: "forgeCostShow",
    kind: "checkbox",
    group: "Main",
    default: true,
    defaultOn: true,
    label: {
      l0: "装备详情页显示强化材料价格（isekai/persistent 自动选）",
      l1: "裝備詳情頁顯示強化材料價格（isekai/persistent 自動選）",
      l2: "Show forge material cost on equip page (isekai/persistent auto)",
    },
  },
  // === P2 Pony riddle 图片助手（旋转/锐化/对比 + 6 小马图鉴） ===
  {
    key: "riddleHelperUi",
    kind: "checkbox",
    group: "Main",
    default: true,
    defaultOn: true,
    label: {
      l0: "答题页显示彩虹小马辅助面板（旋转/锐化/对比 + 6 缩略图）",
      l1: "答題頁顯示彩虹小馬輔助面板（旋轉/銳化/對比 + 6 縮略圖）",
      l2: "Show MLP riddle helper panel (rotate/sharpen/contrast + 6 thumbnails)",
    },
  },
  // === P3P4 装备百分位（off / offline 本地品质点数公式；live 已随能量模型过时, 存值兼容降级走 offline） ===
  // [2026-06-10] equipPercentileLiveSendRange 已删（live 专属, 零消费）; enum 保留 'live' 兼容老存值。
  {
    key: "equipPercentileMode",
    kind: "select",
    group: "Main",
    default: "off",
    enum: ["off", "offline", "live"],
    label: {
      l0: "装备浮动百分位（off / offline 本地公式；live 已并入 offline — ⚠ 切模式需刷新页面）",
      l1: "裝備浮動百分位（off / offline 本地公式；live 已併入 offline — ⚠ 切模式需刷新頁面）",
      l2: "Equip Percentile (off / offline local; live merged into offline — ⚠ refresh after switching)",
    },
  },
  // === P6 RMA ML 远程答题（rdma.ooguy.com） ===
  {
    key: "mlAnswer",
    kind: "checkbox",
    group: "Main",
    default: true,
    defaultOn: true,
    label: {
      l0: "答题页启用 ML 远程识别（rdma.ooguy.com）",
      l1: "答題頁啟用 ML 遠程識別（rdma.ooguy.com）",
      l2: "Enable ML remote riddle solver (rdma.ooguy.com)",
    },
  },
  {
    key: "mlBackupOnFail",
    kind: "checkbox",
    group: "Main",
    default: true,
    defaultOn: true,
    label: {
      l0: "备份答题图片+json 到 GM 存储（成功+失败，菜单可导出）",
      l1: "備份答題圖片+json 到 GM 存儲（成功+失敗，選單可匯出）",
      l2: "Backup riddle image+json to GM (success + failure)",
    },
  },
  {
    key: "mlEndpoint",
    kind: "text",
    group: "Main",
    default: "https://rdma.ooguy.com/help2",
    label: {
      l0: "ML 服务端点 URL",
      l1: "ML 服務端點 URL",
      l2: "ML service endpoint URL",
    },
  },
  {
    key: "mlApiKey",
    kind: "text",
    group: "Main",
    default: "",
    label: {
      l0: "ML API key（可选，留空走匿名）",
      l1: "ML API key（可選，留空走匿名）",
      l2: "ML API key (optional, blank = anonymous)",
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
