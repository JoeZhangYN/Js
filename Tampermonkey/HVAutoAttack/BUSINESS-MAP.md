# HVAutoAttack 理想业务地图（codex 逼近北极星）

> 用途：本文件是 **target-state 业务地图**——不是「代码现状镜像」，而是「代码应当收敛到的理想形态」。codex / 任何编码 agent 改动本仓时，以本图为北极星：每次 PR 让代码**更贴近**而非偏离本图。
> 口径：本图描述「业务能力 + 边界 + 不变量」，不描述具体实现行数。标 `【现状已达标】` = 代码已符合理想；标 `【Δ 收敛中】` = 当前与理想有差，是 codex 的逼近方向。
> 基准日期：2026-06-29。版本恒 `10.0.1`。

---

## 0. 系统是什么（一句话业务定义）

**HentaiVerse（HV）网页游戏的全自动挂机脚本**：Tampermonkey 油猴脚本，注入 `hentaiverse.org` / `alt.hentaiverse.org` / `e-hentai.org` 三域，在**单一浏览器页面 + 单一后端（HV DOM/HTTP）**环境下，自动完成「打怪 → 答题 → 开下一场 → 修装备 → 恢复体力」的完整闭环，并附带汉化、战斗监控、装备分析。

**两个世界（bounded world）**：主世界 `hvAA_` 与异世界 `hvAA_isekai_`，存储前缀隔离、运行时 namespace 隔离（`env.js`），同一套代码按 `isIsekai` 分发。

**业务闭环（meta-loop）**：
```
大厅(lobby) ──idleArena/encounter──▶ 战斗(battle) ──victory──▶ 答题(riddle) ──▶ 回大厅
   ▲                                                                              │
   └──────────────── repair(修装备) / stamina(恢复体力) ◀───────────────────────┘
```

---

## 1. 架构北极星：5 条不可违反的形态律

这 5 条是**架构第一性**（高内聚低耦合的载体）。codex 任何改动**先过这 5 条**，违反即偏离理想。每条都有机械锁（`scripts/verify-*.mjs`，60+ 个，挂 `npm run build`）。

### 律 1 — 能力入口唯一化（capability-entry pattern）【现状已达标，持续守】

每个**业务能力** = 一个文件，对外只暴露两个符号：
```js
export const XxxEvent = Object.freeze({ ... });      // 该能力的事件枚举（discriminated union 的 tag）
export function runXxxAutomation(event) { ... }       // 唯一入口，内部 switch(event.type) 穷尽
```
- 能力**内部函数/常量/DOM 选择器/storage key 一律 private**，禁跨能力直接 import 内部符号——只能经入口 + event 通信。
- 机械锁形态：`verify-<capability>-boundary.mjs` 扫全 `src/`，发现「非内部文件 import 了内部符号」「裸调内部函数」「直读本能力的 storage key」即 `exit(1)`（范本见 `verify-battle-monitor-boundary.mjs`，含 11 类禁则）。
- **理想判据**：新增能力 = 新增一个 `runXxxAutomation` 入口 + 一个 `verify-xxx-boundary.mjs` 拆桥锁；禁止往老入口塞无关 event。

> 这条把「高内聚」物理化：一个业务概念 = 一个文件边界 = 一个事件枚举。读一个 `XxxEvent` 即知该能力全部对外行为。

### 律 2 — Functional Core / Imperative Shell（L1 切缝）【现状已达标】

战斗决策严格分两层（项目选 L1，非 L3 六边形——单入口单后端无多租户，六边形过设计）：
- **PURE CORE（决策层）**：`battle/**/decide-*.js` `can-apply.js` `*-scoring.js` `*-ranking.js` `target-strategy.js` `condition-eval.js` `dynamic-threshold.js` `log-parser.js`。签名恒 `(opt, snap) → ActionResult`，**零 DOM 读、零 g()、零 GM_*、零 setTimeout**。可零依赖单测（vitest fixture）。
- **IMPERATIVE SHELL（副作用层）**：`battle-action-effect-dispatch.js`（ActionResult 唯一副作用翻译入口）+ 各 `execute-*.js` / command entry + `store/storage/dom/navigate/alarm`。
- **数据流**：`main-loop` 只运行 `battle-turn-prelude`，再把 `runBattleTurnContext(PREPARE)` 的整体结果交给 `runBattleActionDecision(DECIDE)`；行动决策入口按 4 个业务出口（survival → buffPreparation → offensiveDebuff → attack）依序裁决，每个出口只返回 `ActionResult`，由 `battle-action-effect-dispatch` 执行并按 acted 短路，同时通过 `battle-action-decision-evidence.js` 记录每个出口的 acted / not-acted 决策证据。
- 机械锁：`check-mainloop-imports.mjs` 禁 `main-loop.js` 回退 import step 实现；`verify-battle-business-map.mjs` 锁定本地图与真实入口/决策链一致。

**ActionResult 是核心契约**（`core/types.js` JSDoc discriminated union）：
`noop` | `click` | `toggle-spirit` | `click-skill-then-target` | `click-then-reload` | `alert-and-pause` | `pause` | `critical-pause` | `halt` | `attack-plan` | `item-plan` | `channel-plan`。
**理想**：决策只产数据（哪个 selector/哪个 plan），永不自己点 DOM；新增一种行动 = 加一个 ActionResult variant + dispatch 一个 case（穷尽 switch，编译期挡漏接）。

### 律 3 — BattleSnapshot 三铁律（turn-local 观测模型）【现状已达标】

每 turn 入口 `runBattleSnapshot(READ_CURRENT)` 一次性 batch 读 DOM → plain object，供全部 decide 复用：
- **铁律 A**：snapshot 只存值（number/string/array-of-plain-object），**禁 Element/Node 引用**（`assertNoDomRefs` 启动时递归断言）。根因：`reloader` 会 replaceChild 整片 DOM，缓存引用 = detached node 陷阱。
- **铁律 B**：snapshot 生命周期 = 当前 turn 内，**绝不**入 `g()`/`setValue`/模块顶层。跨 turn 状态（globalTurn/skillLastUsed）才走 `state/store`。
- **铁律 C**：副作用用 selector 字符串**重查询** DOM，不用缓存引用（`dispatch` 内 `gE(result.selector).click()`）。

> 这条是「DOM 易变性」与「决策可测性」的隔离墙。codex 改 snapshot 字段：只能加值类型字段，且 decide 侧不得再读 DOM 兜底（要读就批进 `runBattleSnapshot(READ_CURRENT)`，维持「DOM 读一次」）。

### 律 4 — 依赖方向单向 + 无环【现状已达标】

```
data/* core/*（纯 stdlib）
   ▲
decide-*/can-apply/scoring/condition-eval（PURE，禁 import dom/store/storage/GM_*）
   ▲
state/store storage dom/* alarm/* execute-* dispatch（SHELL）
   ▲
各能力 runXxxAutomation 入口
   ▲
pages/init.js（composition root，零业务，仅 wiring）
   ▲
main.js（entry shim）
```
机械锁：`check-circular.mjs`（禁环）+ 各 boundary 脚本（禁反向/跨层）。**理想**：底层永不知道上层；`init.js` / `page-automation.js` 只做编排 wiring，零业务判断。

### 律 5 — 单一真相源（SSOT）+ 说明↔行为同源【现状部分达标，见 §8 Δ】

每类配置/常量只有一处定义：
| SOT | 文件 | 内容 |
|---|---|---|
| 持久化 key | `state/persist-keys.js` `STORAGE_KEYS` | 全 GM_* key 一处声明 |
| 配置字段 schema | `settings/schema.js` `OPTION_SCHEMA` | key/kind/group/三语 label/default |
| 配置读取 | `state/option.js` `runOptionAutomation` | 全 option 读写唯一口径（含 defaultOn 语义） |
| 页面类型判定 | `pages/page-kind.js` `detectPageKind` | 替代散落哨兵检测 |
| 技能 CD 表 | `state/skill-registry.js` `SKILL_REGISTRY` | 全技能 id + cdBase |
| 攻击元素/法术 | `data/spell-lib.js` 等 `data/*` | 静态游戏数据 |

**说明↔行为同源**：配置字段的三语 label 与其行为从 `OPTION_SCHEMA` 同一处派生；红线字段（`@name`/`@namespace`/`storagePrefix`）改动 = 用户配置全丢（见 §7）。

---

## 2. 业务能力地图（按 bounded context 分组）

全系统 ~90 个 `runXxxAutomation(event)` 能力入口。按业务边界归 10 个 BC。**每个 BC 顶层只有一个对外编排入口**（其余是其内部协作能力）。

### BC-1 页面路由（pages/，composition root）
入口链：`main.js → init.js → page-automation.js`。
- `page-kind.js` — **页面类型 SOT**：`detectPageKind` → `EHENTAI|RIDDLE|BATTLE|LOBBY|SHOWEQUIP|UNKNOWN`。所有页面分发的唯一判据。
- `app-startup.js` — 启动期一次性初始化（option 同步 / 样式注入 / 按钮）。
- `page-automation.js` — 按 kind 分发：equipment-view → cross-site-encounter → 未识别页重载 → game-page（riddle/battle/lobby）。
- `cross-site-encounter-navigation.js` — e-hentai ↔ HV 跨域跳转。
- `lobby-automation.js` — 战外大厅 tick（驱动 encounter / idleArena / repair）。
- **理想**：`init.js` 永远只算一次 kind 然后 wiring，零 ad-hoc DOM 哨兵（锁 `verify-no-adhoc-pagekind.mjs`）。

### BC-2 战斗回合引擎（battle/，业务心脏）— 详见 §3
入口：`battle-automation.js`（PAGE_READY 装配）→ `main-loop.js`（每 turn）。

### BC-3 战斗监控（monitor/）【现状已达标，boundary 锁最严】
入口：`battle-monitor-automation.js`，内部能力全 private：
- `battle-info.js` — HUD 刷新（回合/速度/怪数显示）
- `battle-action-usage-capture.js` — 行动用量采集（`unsafeWindow.info`/`#pane_item` 唯此处可读）
- `record-usage.js` — 技能/物品使用统计（ACTION_ENDED/COMPLETION_REACHED）
- `drop-monitor.js` — 掉落记录
- `battle-report.js` + `battle-report-view.js` — 战报聚合 + 渲染
- `battle-record-archive.js` — 战报存档读写（唯一碰 DROP/STATS/BATTLE_CODE storage）
- `battle-monitor-runtime.js` — 给上述能力提供 round/combatant/option 上下文（防它们直读 store）
- `monster-resist-panel.js` — 九抗面板

### BC-4 闲置挂机（arena/）
- `idle-arena.js` — 自动挑战 Arena/RoB/GrindFest：四站 token 并发拉取（`pollUntil` 等 4 个齐）→ 按 `idleArenaValue` 逐站开战 → 每日 reset（`day-record`）。
- `quick-site.js` — 大厅快捷站点跳转。

### BC-5 随机遭遇（pages/encounter*）
入口：`encounter.js`（lobby tick / random encounter / widget 三类 event）。
- `encounter-policy.js` — 遭遇激活决策（PURE：state → enter/navigate/open/wait）
- `encounter-state.js` — 遭遇持久态（LOAD_KEY/MARK_STARTED/READ_CURRENT）
- `encounter-lobby-schedule.js` — 下次检查调度
- `encounter-widget-policy.js` — 首页 widget 倒计时/链接策略（PURE `planEncounterWidgetEvent`）
- `encounter-bridge.js` — sloppy-mode 桥（hv-utils 不能 ESM import，业务口径经桥复用）

### BC-6 自动维修（repair/）【现状已达标，含关键死循环修复】
入口：`repair-orchestrator.js`（异步 IO 链：扫描 → 决策 → 缺料买齐/停机 → 修 → 复验 → 开下一场）。
- `parse-repair-state.js` — 解析装备耐久页（PURE）
- `decide-repair.js` — 止损决策（PURE：state+repairedIds → proceed/repair/stop-stuck）
- `repair-backend.js` — 两世界后端端口（fetchState/submitRepair）
- `material-shop.js` — 缺料联动物品商店买齐（cap/余额/库存守卫）
- **核心不变量**：「装备未修好就不开下一场」。idleArena 调度收归 repair 的 `proceed()`，与 init 解耦（破坏性死循环根因已消除）。

### BC-7 答题（pages/riddle*）
入口：`riddle-automation.js` → `riddle.js`（答题会话）。
- `riddle-image.js` / `riddle-ml.js` — 图片识别 + ML 答题（小马图）
- `riddle-helper.js` / `riddle-submission-timing.js` — 答案查表 + 提交时机
- `state/riddle-dataset.js` `riddle-log.js` `riddle-stats.js` — 数据集/日志/命中率
- `data/riddle-answers.js` `data/pony-images.js` — 静态答案库

### BC-8 装备分析（pages/equip*、showequip）
- `equipment-view-automation.js` — 装备页增强入口
- `equip-percentile-dispatcher.js` / `equip-percentile-offline.js` — 装备百分位（在线/离线）
- `showequip-forge-cost.js` — 强化价格估算（`data/forge-costs.js` `data/equip-quality-ranges.js`）
- `ability-page.js` — 角色能力页解析（spell AoE 等，供战斗 snapshot 读）

### BC-9 汉化 i18n（i18n/、data/i18n/）
main.js 装配三条独立汉化路径（功能区不重叠）：
- `equip-translate.js` — 装备词条 + 词缀分色（`data/i18n/equip-dict.js`）
- `interface-translate.js` — 角色页/界面词条（`data/i18n/interface-dict.js`）
- `hv-utils.js` — 第三方 HV Utils 整页汉化（**sloppy-mode 巨型文件，副作用 import，不能 ESM 拆**；去重 epic 见 `HANDOFF-dedup-refactor.md`）
- `core/restore-controller.js` `lang-post.js` — lang 三态（0 简体/1 繁/2 英文原文）切换
- `zh-convert.js` `jpx-lang.js` + `equip-filter-expression*.js`（装备筛选受限 parser 桥）

### BC-10 配置与设置（settings/、state/option*）
- `schema.js` — `OPTION_SCHEMA` 配置 SOT（渐进迁入中，见 §8 Δ）
- `render.js` — 设置面板渲染（理想：schema-driven，现状部分内联 HTML）
- `customize.js` — 条件编辑器；`condition-eval.js` — `checkCondition` PURE（facts → bool）
- `form-option.js` — 表单收集 → option；`button.js` — 设置按钮
- `state/option.js` — 配置读写唯一口径；`option-backup.js` — 备份/恢复

### 横切基础设施
- `state/store.js`（`g()` runtime）+ `storage.js`（GM_* wrapper）+ `persist-keys.js`（key SOT）
- `core/`：`navigate.js`（reload/goto 收口，锁 `verify-no-raw-reload`）/ `time.js` / `lang.js` / `obj.js` / `poll.js`（`pollUntil`）/ `zip.js` / `types.js`
- `dom/`：`query.js`（gE/cE/isOn）/ `selectors.js`（HV 选择器命名常量）/ `attempt-click.js`（isOn 探活+click）/ `http.js`（post 重试）/ `gm-xhr.js`
- `alarm/`：`alarm.js`（定时提醒）/ `notification-catalog.js` / `page-refresh.js`（未识别页/卡死重载）
- `style/inject.js`（CSS + 按钮 DOM）

---

## 3. 战斗回合引擎（业务心脏，逐层展开）

### 3.1 装配（battle-automation.js，PAGE_READY 一次）
顺序固定：pause-controls 安装 → action-event-bridge 安装（reloader/action lifecycle）→ battle-lifecycle 上报 BATTLE_STARTED（start-runtime → monster-knowledge → monitoring）→ round-start 建立 round context → 首次 turn。

### 3.2 每 turn 主循环（main-loop.js）
```
runBattleTurnAutomation(RUN_CURRENT_TURN):
  1. 暂停态？→ 渲染并 return
  2. runBattleTurnPrelude(PREPARE_CURRENT_TURN)
     ├─ monster-status ensure-ready
     ├─ battle-turn TURN_STARTED
     ├─ monitor HUD_REFRESH
     ├─ killBug()  ← HV「卡死 bug」检测点击
     └─ monster-status UPDATE_HP
  3. context = runBattleTurnContext(PREPARE) ← runBattleSnapshot(READ_CURRENT) + actionOptions + 学习器 finalize
  4. runBattleActionDecision(DECIDE)      ← 4 个业务出口裁决，ActionResult acted 即停
```

### 3.3 行动决策入口（battle-action-decision.js）— 4 个业务出口，顺序即优先级
**保命/急救在前，增伤/进攻在后**。`ACTION_STEPS` 是唯一行动决策组合点；`main-loop.js` 不知道具体规则，只传入完整 turn context。

| # | capability | 业务问题 | 入口 |
|---|---|---|---|
| 1 | survival | 当前回合是否必须先保命/逃跑/暂停/防御/用物品 | `runBattleSurvivalAction(DECIDE)` |
| 2 | buffPreparation | 当前回合是否需要续 buff、灌注、channel 或关键 buff guard | `runBattleBuffPreparation(DECIDE)` |
| 3 | offensiveDebuff | 当前回合是否需要 boss imperil、burst control、群体/单体 debuff | `runBattleOffensiveDebuff(DECIDE)` |
| 4 | attack | 前三类均不行动时如何完成攻击/focus/spirit/法术/物理技能 | `runBattleAttackAction(DECIDE)` |

每个出口内部再拥有自己的事实 mapper 和优先级，调用者只接收 `ActionResult`，不得重新组装 snap 字段、阈值或 action runner 协议。行动结果统一交给 `runBattleActionEffectDispatch(APPLY_ACTION_RESULT)`；该入口是唯一把 `ActionResult` 翻译成 DOM/command 副作用的地方。

**attack 决策（decide-attack.js）6 分支**：focus / spirit 切换 / spell+AoE / merciful 斩杀(HP≤0.248) / physical-utility / 默认攻击。法术阶选择（`selectSpellTier`）按 channeling 锁 + 怪数降级 + high/mid 条件。目标选择走 `target-strategy`：`firstByFinWeight`（综合权重最优首怪）/ `firstByOrder`（AoE 锚）。

**理想**：新增战斗行为先判断属于 survival / buffPreparation / offensiveDebuff / attack 哪个业务问题，在该 capability 内新增纯决策或子入口；只有新增跨 capability 的业务出口时才改 `ACTION_STEPS`。任何顺序变更都是业务优先级变更，必须在 `battle-action-decision.js` 显式改动并由 verifier 锁住。

---

## 4. 学习子系统（资源最优化，observe→finalize→EWMA→persist）

战斗中边打边学，把固定常量收敛成自适应值。统一范式：每 turn 入口先 finalize 上回合 pending 观测 → EWMA 更新 → 持久化。**安全 by-construction**（学习只能让决策更保守，永不诱发误开火）。

| 学习器 | key | 学什么 | 安全夹 |
|---|---|---|---|
| recovery-learner | `learnedRecovery` | T1 每 potion 实际恢复量 | — |
| cd-learner (F3) | `learnedCd` | 技能真实 CD（开火→脱灰的 globalTurn 差） | 拒学 gap>cdBase；消费再夹 `min(learned,cdBase)`；真开火仍以 DOM skillReady 为权威 |
| big-skill-kill-learner (F4) | `learnedBigKill` | OFC/FRD 对每 MID boss 的击杀率 | 默认 OFF；只用于「能秒则跳 imperil」 |
| incoming-burst-learner (F5) | `learnedIncomingBurst` | 每 MID 单发最大伤害+类型 | 默认 OFF，开关关零开销 |
| auto-tune | `autoTunePad`/`autoTuneHistory` | safetyPad 自学习探索 | 探索点 + 观测历史 |

配套 runtime SOT：`cd-tracker.js`（`globalTurn` 跨 battle 计数 + `skillLastUsed` + `turnsUntilReady`）、`skill-registry.js`（CD 基表）。

---

## 5. 数据 SOT 与存储模型

**持久层（GM_*，前缀 `hvAA_` / `hvAA_isekai_`）**，全 key 见 `STORAGE_KEYS`：
- 配置：`option`（+ `backup`）
- 战斗运行时：`battleCode` `roundType/Now/All` `monsterStatus` `url` `disabled`
- 监控：`drop`/`dropOld` `usage`/`usage2` `stats`/`statsOld`
- 挂机：`arena` `staminaLostLog`
- CD/学习：`globalTurn` `skillLastUsed` `learnedRecovery` `learnedCd` `learnedBigKill` `learnedIncomingBurst` `autoTunePad` `autoTuneHistory`
- 装备：`spellAoe`

**runtime 层（`g()` 闭包，不落盘）**：当前 turn 派生态、in-flight 学习 pending、option 内存副本。

**理想**：新增持久数据 = `STORAGE_KEYS` 加一条 + 经对应能力入口读写，**禁**任何能力直接 `getValue("字面量")`（boundary 锁逐 key 守）。

---

## 6. ActionResult / Event 契约（codex 扩展点速查）

- 加**一种战斗行动** → `core/types.js` ActionResult union 加 variant + `battle-action-effect-dispatch.js` 加 case（穷尽 switch）+ 对应 `execute-*.js` / command entry。
- 加**一条战斗规则** → 先落到 survival / buffPreparation / offensiveDebuff / attack 的能力入口内部；只有新增跨能力业务出口时才改 `battle-action-decision.js` 的 `ACTION_STEPS`。
- 加**一个能力** → 新文件 `export { XxxEvent, runXxxAutomation }` + 新 `verify-xxx-boundary.mjs` 挂 build。
- 加**一个配置项** → `OPTION_SCHEMA` 一条（含三语 label + default[On]）。
- 加**一个持久 key** → `STORAGE_KEYS` 一条。

---

## 7. 红线（绝对不可动，动 = 用户数据全丢）

| 字段 | 值 | 后果 |
|---|---|---|
| `@name` | `[HV]AutoAttack` | GM 存储 namespace 漂移 → 配置全丢 |
| `@namespace` | `https://github.com/dodying/` | 同上 |
| `storagePrefix` | `hvAA_` / `hvAA_isekai_` | 持久化 key 前缀变 → 数据读不到 |
| hv-utils `$config.ns` | `hvut`/`hvuti` | 第三方汉化工具配置键，改 = 其配置丢 |

`legacy/[HV]AutoAttack.legacy.js`（重构前单文件）= 永久行为基准，永不删除/修改。

---

## 8. 当前 vs 理想的 Δ（codex 的逼近方向）

机械锁已覆盖律 1-4，下列是**尚未完全收敛**的点（来自 HANDOFF 文档 + recon）：

1. **【Δ】OPTION_SCHEMA 全字段迁入**：`schema.js` 现仅声明部分新字段，老 ~80 字段仍由 `settings/render.js` 内联 HTML 渲染。理想：全字段进 schema，`render.js` 改 `OPTION_SCHEMA.filter(group).map(renderField)` 派生（说明↔行为彻底同源）。**收敛动作**：逐 tab 迁字段 + render schema-driven，每步 build + 设置面板全 tab 回归。

2. **【Δ】store.js 显式化**：`g(key,value)` 仍是闭包语义（env.js `hvAAOriginal/hvAAIsekai`）。理想：typed-key Store 类。低优先（当前等价行为稳定）。

3. **【Δ】hv-utils 双版本去重**：`i18n/hv-utils.js` 20k+ 行双 IIFE（主世界 v4.0.0 + 异世界 v4.2.0），same-algo 双 DOM 适配。理想：公共骨架 + `IS_ISEKAI` 分发。**硬约束**：`protected` 作标识符 → 只能 sloppy-mode 单文件内重构，**不能拆 ESM**。进度 L0-L2 已落地（20563→20086 行），L3-L5 续接见 `HANDOFF-dedup-refactor.md`。

4. **【Δ】残余 DOM 耦合 step**：`useScroll`/`useChannelSkill`/`deadSoon` 历史上 DOM 耦合较深；现已基本纯化（决策链全 16 条标称 PURE），codex 核对时确认无 decide 侧 DOM 兜底残留。

5. **【Δ】存储访问收口**：`riddle-ml`/`equip-percentile` 自建 GM_ wrapper（模块内自洽，价值边际，记录在案）。理想：统一走 `storage.js`，但优先级低。

**收敛总原则**：每个 Δ 的方向都是「**更贴近律 1-5**」。codex 改动若让某 Δ 缩小（字段进 schema / key 进 SOT / DOM 读批进 snapshot / 内部符号收回入口）= 正确逼近；若新增「绕过入口的直连」「decide 里读 DOM」「散落 storage 字面量」= 偏离，必被 boundary 锁拦或应被拦。

---

## 9. codex 使用本图的协议

1. **改动前**：定位改动落在哪个 BC（§2）、是否触及决策链（§3）、是否新增 ActionResult/Event/key/字段（§6）。
2. **设计时**：先问「这改动让代码更贴近律 1-5 还是更远？」远则换方案。
3. **新建路径必拆桥**：新入口/新 ActionResult/新 key → 同步删旧路径 + 加 `verify-*.mjs` 锁，否则新路径只是建议。
4. **验证**：`cd Tampermonkey/HVAutoAttack && npm run build`（跑全 60+ boundary 锁 + sloc + circular + metadata + postbuild）+ `npm test`（vitest 决策单测）。**build 绿只证语法/打包/边界，运行时行为需用户两世界逐页实站**（HV 抓包须走代理 `127.0.0.1:1081`，见仓库 HV 调试规范）。
5. **红线**：§7 四项绝对不碰。

---

## 10. Framework Drift Callback Index（后续回调锚点）

本节是给后续 codex 回调/续跑使用的**业务归因索引**。当 `AGENTS.md` 的项目规则、纠正目标、架构提示词，或构建守卫中的项目框架维护规则发生变化时，必须同步更新本节；否则未来只能从聊天记录恢复意图，会重新落回表症修补。

每条框架漂移记录至少保留这些字段：`identity`（业务身份/世界/页面）、`authority`（端点、存储、DOM、恢复或诊断权威）、`drift`（哪个流程规则失守）、`converged-entry`（当前收敛入口或目标入口）、`guard`（阻止退化的测试/verify 脚本）、`next-callback`（下一次接手应优先看的边界）。

当前已识别的回调锚点：

1. **HVUT failure evidence / runtime diagnostics**
   - `identity`: HVUT 子能力（Armory、Ability、Monster Lab、MoogleMail、Shrine、配置持久化）。
   - `authority`: 可复制的用户可见诊断报告 + `sessionStorage` evidence key。
   - `drift`: 旧流程把失败压成泛化 `alert` 或 console-only，页面跳转/刷新后证据丢失。
   - `converged-entry`: `show_hvut_failure_report(...)` / `show_hvut_runtime_failure_report(...)`。
   - `guard`: `verify-hvut-runtime-failure-boundary.mjs` 及各 HVUT capability boundary。
   - `next-callback`: 配置/存储失败仍需继续收敛到统一诊断，不允许新增裸 `alert` 作为异常出口。

2. **Main / Isekai encounter world authority**
   - `identity`: 主世界与异世界遭遇战入口。
   - `authority`: 世界专属 URL、storage namespace、恢复跳转策略。
   - `drift`: 下游重复从 URL 猜世界，导致异世界入口拼成主世界或错误根路径。
   - `converged-entry`: encounter identity classifier -> `PLAN_ACTIVATION(..., { isIsekai })` -> `buildEncounterEntryUrl(...)`。
   - `guard`: `verify-encounter-boundary.mjs`、`verify-hvut-random-encounter-storage-boundary.mjs`、isekai entry tests。
   - `next-callback`: 倒计时、计数、跳转、熔断必须只消费 typed world context，不能刷新首页就增加遭遇计数。

3. **Armory page fact parsing**
   - `identity`: Bazaar Armory sell/salvage/filter 页面。
   - `authority`: 页面事实解析结果，而不是固定假设 `itemdata` / `eqitems` 总存在。
   - `drift`: 集成流程把不同 screen 的可用脚本对象当成同一硬前置，导致 sell/all 空列表和弹窗错误。
   - `converged-entry`: Armory page parse/context boundary + integrate failure report。
   - `guard`: `verify-hvut-armory-page-context-boundary.mjs`、`verify-hvut-armory-page-parse-boundary.mjs`、`verify-hvut-armory-integrate-boundary.mjs`。
   - `next-callback`: 新增 Armory screen/filter 时先声明页面事实可选性和派生路径，再接 integrate。
