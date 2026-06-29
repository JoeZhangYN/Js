// file-size-gate: exempt schema 声明式 SOT-设计上渐增至 80+ 字段（待办 C 全量迁入）
// Option schema 单 SOT（Phase 5 chunk A 引入；现存 ~80 字段渐进迁入，新字段直接进 schema）。
// 当前阶段只声明 Phase 6 新增的 3 个字段；老字段仍由 settings/render.js 内联模板渲染。
// 后续 chunk 把全 80 字段迁入 schema、render.js 改为 schema-driven。

/**
 * @typedef {object} OptionField
 * @property {string} key 存储 key
 * @property {"checkbox"|"number"|"text"|"select"} kind UI 类型
 * @property {string} group tab 分组（Main/Heal/Tactics/Spell/Item/Channel/Buff/Debuff/Skill/Drop/Usage/Alarm/QuickSite/Backup）
 * @property {{l0:string,l1:string,l2:string}} label 三语标签
 * @property {*} default 默认值
 * @property {boolean} [defaultOn] checkbox 上是否标 data-default-on
 * @property {string[]} [enum] select 选项
 * @property {Record<string,string>} [enumLabel] select 选项显示文本
 * @property {(v:any)=>boolean} [validate] 自定义校验
 * @property {string} [description] 三语说明（可选）
 */

/** @type {OptionField[]} */
const OPTION_SCHEMA = [
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
    key: "skipWeakenWhenClearReady",
    kind: "checkbox",
    group: "Debuff",
    default: true,
    defaultOn: true,
    label: {
      l0: "OFC/FRD 本回合已就绪则直接跳过全员 Weaken（不等 OC 窗口/怪数门槛）",
      l1: "OFC/FRD 本回合已就緒則直接跳過全員 Weaken（不等 OC 窗口/怪數門檻）",
      l2: "Skip All-Weaken when clear-skill is ready THIS turn (ignores OC-window / alive threshold)",
    },
  },
  // === F4（实验，默认 OFF）：OFC 能秒 boss 则连 Imperil 都跳（按 MID 学击杀率，自适应等级漂移） ===
  {
    key: "skipImperilWhenOfcKills",
    kind: "checkbox",
    group: "Debuff",
    default: false,
    label: {
      l0: "【实验】OFC 本回合就绪且历史确认能秒杀该 boss（无 imperil）→ 跳过 Imperil",
      l1: "【實驗】OFC 本回合就緒且歷史確認能秒殺該 boss（無 imperil）→ 跳過 Imperil",
      l2: "[Experimental] Skip Imperil when OFC ready & confirmed to one-shot this boss (no-imperil)",
    },
  },
  {
    key: "bigKillMinSamples",
    kind: "number",
    group: "Debuff",
    default: 4,
    label: {
      l0: "需多少次「无 imperil 秒杀」样本才信任（防偶然）",
      l1: "需多少次「無 imperil 秒殺」樣本才信任（防偶然）",
      l2: "Min no-imperil one-shot samples before trusting",
    },
  },
  {
    key: "bigKillProbThreshold",
    kind: "number",
    group: "Debuff",
    default: 0.9,
    label: {
      l0: "无 imperil 击杀率阈值（≥此值才跳 Imperil，0~1）",
      l1: "無 imperil 擊殺率閾值（≥此值才跳 Imperil，0~1）",
      l2: "No-imperil kill-rate threshold (skip when ≥, 0~1)",
    },
  },
  {
    key: "bigKillScaleDriftTol",
    kind: "number",
    group: "Debuff",
    default: 1.15,
    label: {
      l0: "满血漂移容忍（本场 boss 满血涨过 N 倍上次确认值 → 不信任，重新上 Imperil）",
      l1: "滿血漂移容忍（本場 boss 滿血漲過 N 倍上次確認值 → 不信任，重新上 Imperil）",
      l2: "MaxHP drift tolerance (distrust if current maxHP > N× last confirmed)",
    },
  },
  {
    key: "dynamicBigKillLog",
    kind: "checkbox",
    group: "Debuff",
    default: false,
    label: {
      l0: "控制台输出 OFC 击杀学习日志（调试）",
      l1: "控制台輸出 OFC 擊殺學習日誌（調試）",
      l2: "Console log for OFC kill-learning (debug)",
    },
  },
  // === F5（实验，默认 OFF）：学进场爆发伤害+类型 → 对高爆发怪单点 Silence/Sleep 防血量蹦极 ===
  {
    key: "burstControlSwitch",
    kind: "checkbox",
    group: "Debuff",
    default: false,
    label: {
      l0: "【实验】学习致死爆发伤害 → 对高爆发怪单点 Silence(法术)/Sleep(物理) 防血量蹦极",
      l1: "【實驗】學習致死爆發傷害 → 對高爆發怪單點 Silence(法術)/Sleep(物理) 防血量蹦極",
      l2: "[Experimental] Learn lethal burst → single-target Silence(spell)/Sleep(phys) the bursty monster",
    },
  },
  {
    key: "burstControlHpFrac",
    kind: "number",
    group: "Debuff",
    default: 50,
    label: {
      l0: "蹦极阈值：单发 ≥ 当前血 N% 即视为威胁（触发控制）",
      l1: "蹦極閾值：單發 ≥ 當前血 N% 即視為威脅（觸發控制）",
      l2: "Bungee threshold: single hit ≥ N% of current HP triggers control",
    },
  },
  {
    key: "burstControlSilenceForSpell",
    kind: "checkbox",
    group: "Debuff",
    default: true,
    defaultOn: true,
    label: {
      l0: "法术爆发优先用 Silence（仅挡施法；物理爆发恒用 Sleep）",
      l1: "法術爆發優先用 Silence（僅擋施法；物理爆發恆用 Sleep）",
      l2: "Prefer Silence for spell bursts (physical bursts always use Sleep)",
    },
  },
  {
    key: "drainTargetMaxHp",
    kind: "checkbox",
    group: "Debuff",
    default: true,
    defaultOn: true,
    label: {
      l0: "Drain 优先打绝对血最多的敌人（存活最久，drain 生效最久；天然 boss 优先）",
      l1: "Drain 優先打絕對血最多的敵人（存活最久，drain 生效最久；天然 boss 優先）",
      l2: "Drain targets the highest absolute-HP enemy (survives longest; boss-first naturally)",
    },
  },
  {
    key: "autoElement",
    kind: "checkbox",
    group: "Spell",
    default: false,
    label: {
      l0: "按九抗自动选最弱属性攻击（需 scan 怪物九抗，无数据回退当前属性）",
      l1: "按九抗自動選最弱屬性攻擊（需 scan 怪物九抗，無數據回退當前屬性）",
      l2: "Auto-pick weakest element by monster resists (needs scanned data; falls back otherwise)",
    },
  },
  {
    key: "hp1",
    kind: "number",
    group: "Heal",
    default: 50,
    label: { l0: "Health Gem", l1: "Health Gem", l2: "Health Gem" },
  },
  {
    key: "mp1",
    kind: "number",
    group: "Heal",
    default: 70,
    label: { l0: "Mana Gem", l1: "Mana Gem", l2: "Mana Gem" },
  },
  {
    key: "sp1",
    kind: "number",
    group: "Heal",
    default: 75,
    label: { l0: "Spirit Gem", l1: "Spirit Gem", l2: "Spirit Gem" },
  },
  {
    key: "dynamicHealThreshold",
    kind: "checkbox",
    group: "Heal",
    default: false,
    label: {
      l0: "智能 Health Gem 阈值（按敌方 DPS + 剩余回合估算危险线）",
      l1: "智能 Health Gem 閾值（按敵方 DPS + 剩餘回合估算危險線）",
      l2: "Smart Health Gem threshold (DPS-based danger line)",
    },
  },
  {
    key: "playerMaxHp",
    kind: "number",
    group: "Heal",
    default: 17000,
    label: {
      l0: "玩家最大 HP",
      l1: "玩家最大 HP",
      l2: "Player max HP",
    },
  },
  {
    key: "dynamicHealSafetyPad",
    kind: "number",
    group: "Heal",
    default: 1.3,
    label: {
      l0: "安全系数",
      l1: "安全係數",
      l2: "Safety pad",
    },
  },
  {
    key: "autoTune",
    kind: "checkbox",
    group: "Heal",
    default: false,
    label: {
      l0: "自学 safetyPad（每 5 场战斗自动调节，覆盖上方静态值）",
      l1: "自學 safetyPad（每 5 場戰鬥自動調節，覆蓋上方靜態值）",
      l2: "Auto-tune safetyPad (online learning, overrides static value)",
    },
  },
  {
    key: "noWastePotion",
    kind: "checkbox",
    group: "Heal",
    default: true,
    defaultOn: true,
    label: {
      l0: "药品防溢出：deficit 不够大时跳过该瓶",
      l1: "藥品防溢出：deficit 不夠大時跳過該瓶",
      l2: "No-waste potion: skip if deficit too small",
    },
  },
  {
    key: "potionWasteTolerance",
    kind: "number",
    group: "Heal",
    default: 0.7,
    label: {
      l0: "容差",
      l1: "容差",
      l2: "tolerance",
    },
  },
  {
    key: "stallMode",
    kind: "checkbox",
    group: "Heal",
    default: true,
    defaultOn: true,
    label: {
      l0: "拖战策略：仅剩 1 怪+后续轮还有时主动喝 MP/SP pot 拉满下轮开局，同时跳 useDeSkill",
      l1: "拖戰策略：僅剩 1 怪+後續輪還有時主動喝 MP/SP pot 拉滿下輪開局，同時跳 useDeSkill",
      l2: "Stall mode: when 1 alive + more rounds, drink MP/SP pots to top up",
    },
  },
  {
    key: "stallFocus",
    kind: "checkbox",
    group: "Heal",
    default: true,
    defaultOn: true,
    label: {
      l0: "拖战时 OC 高优先 Focus 换 Channeling（mana regen）",
      l1: "拖戰時 OC 高優先 Focus 換 Channeling（mana regen）",
      l2: "Stall: prefer Focus when OC high (Channeling for MP regen)",
    },
  },
  {
    key: "stallFocusOcThreshold",
    kind: "number",
    group: "Heal",
    default: 60,
    label: { l0: "OC 阈值", l1: "OC 閾值", l2: "OC threshold" },
  },
  {
    key: "stallFocusMpMax",
    kind: "number",
    group: "Heal",
    default: 80,
    label: { l0: "MP 上限", l1: "MP 上限", l2: "MP max" },
  },
  {
    key: "stallTopupMpFloor",
    kind: "number",
    group: "Heal",
    default: 70,
    label: { l0: "拖战 Draught MP 阈值", l1: "拖戰 Draught MP 閾值", l2: "Stall Draught MP threshold" },
  },
  {
    key: "stallTopupSpFloor",
    kind: "number",
    group: "Heal",
    default: 70,
    label: { l0: "拖战 Draught SP 阈值", l1: "拖戰 Draught SP 閾值", l2: "Stall Draught SP threshold" },
  },
  {
    key: "stallTurnOffSpirit",
    kind: "checkbox",
    group: "Heal",
    default: true,
    defaultOn: true,
    label: {
      l0: "拖战时关闭 Spirit Stance（避免与 Focus 双向耗 OC）",
      l1: "拖戰時關閉 Spirit Stance（避免與 Focus 雙向耗 OC）",
      l2: "Stall: turn off Spirit Stance (avoid double OC drain with Focus)",
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
  // === Spirit Stance：攻击流开/关姿态与技能前置姿态的配置说明 SOT ===
  {
    key: "turnOnSS",
    kind: "checkbox",
    group: "Tactics",
    default: false,
    label: {
      l0: "开启 Spirit Stance",
      l1: "開啟 Spirit Stance",
      l2: "Turn on Spirit Stance",
    },
  },
  {
    key: "turnOffSS",
    kind: "checkbox",
    group: "Tactics",
    default: false,
    label: {
      l0: "关闭 Spirit Stance",
      l1: "關閉 Spirit Stance",
      l2: "Turn off Spirit Stance",
    },
  },
  {
    key: "preCastSS",
    kind: "checkbox",
    group: "Tactics",
    default: false,
    label: {
      l0: "释放 Buff/Debuff 前开启 Spirit Stance",
      l1: "釋放 Buff/Debuff 前開啟 Spirit Stance",
      l2: "Activate Spirit Stance before Buff/Debuff",
    },
  },
  // === 攻击资源动作：由 decideAttack 唯一裁决，设置页说明/默认值由 schema 派生 ===
  {
    key: "focus",
    kind: "checkbox",
    group: "Tactics",
    default: false,
    label: { l0: "Focus", l1: "Focus", l2: "Focus" },
  },
  {
    key: "etherTap",
    kind: "checkbox",
    group: "Tactics",
    default: false,
    label: { l0: "Ether Tap", l1: "Ether Tap", l2: "Ether Tap" },
  },
  // === 战斗控制：规则表只调用唯一纯决策，设置页说明/默认值由 schema 派生 ===
  {
    key: "defend",
    kind: "checkbox",
    group: "Tactics",
    default: false,
    label: { l0: "Defend", l1: "Defend", l2: "Defend" },
  },
  {
    key: "autoFlee",
    kind: "checkbox",
    group: "Tactics",
    default: false,
    label: {
      l0: "自动逃跑",
      l1: "自動逃跑",
      l2: "Flee",
    },
  },
  {
    key: "autoPause",
    kind: "checkbox",
    group: "Tactics",
    default: false,
    label: {
      l0: "自动暂停",
      l1: "自動暫停",
      l2: "Pause",
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
    enumLabel: {
      off: "off (关闭)",
      offline: "offline (本地公式)",
      live: "live (已并入 offline)",
    },
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

const EVENT_READ_FIELD = "readField";
const EVENT_READ_DEFAULT = "readDefault";
const EVENT_READ_GROUP = "readGroup";

export const OptionSchemaEvent = Object.freeze({
  READ_FIELD: EVENT_READ_FIELD,
  READ_DEFAULT: EVENT_READ_DEFAULT,
  READ_GROUP: EVENT_READ_GROUP,
});

function readOptionSchemaField(key) {
  return OPTION_SCHEMA.find((field) => field.key === key);
}

function readOptionSchemaDefault(key) {
  return readOptionSchemaField(key)?.default;
}

function readOptionSchemaGroup(group) {
  return OPTION_SCHEMA.filter((field) => field.group === group);
}

export function runOptionSchema(event) {
  switch (event?.type) {
    case EVENT_READ_FIELD:
      return readOptionSchemaField(event.key);
    case EVENT_READ_DEFAULT:
      return readOptionSchemaDefault(event.key);
    case EVENT_READ_GROUP:
      return readOptionSchemaGroup(event.group);
    default:
      return undefined;
  }
}
