# HVAutoAttack 业务抽象 — Handoff（续接点，2026-06-04）

> 审查 HVAA 自写代码可做的业务抽象（现代化已到位无需做）。两个真实候选落地，设计 plan：`~/.claude/plans/resilient-napping-gem.md`（已批准）。**均为行为保持重构，build 绿只证语法/打包，待用户两模式实站验收。**

## 落地（本 session，待提交；plan 建议分 ② / ① 两 commit）

| 项 | 内容 | 文件 | 验收 |
|---|---|---|---|
| ②b | `pollUntil(predicate, ms=200)` 返 Promise，收口 200ms 轮询惯用式 | 新 `src/core/poll.js`；迁 `idle-arena.js`(等4token) + `repair-check.js`(等json释放,checkOnload→pollUntil+scanAndRepair保重入) | ⏳ 待实站 |
| ②a | `scheduleReload(sec)` 返 timer id，收口 `setTimeout(goto,N*1000)` ×4 | `core/navigate.js` 加；迁 `main-loop:101`/`reloader:30(delayReload=,clearTimeout依赖handle)`/`reloader:117`/`init:62` | ⏳ 待实站 |
| ② probe | `verify-no-raw-reload.mjs`：禁裸 `setTimeout(goto`，仅豁免 navigate.js | `scripts/`+build链 | ✅ build绿+自测 |
| ① | `init.js` 消费 `detectPageKind()`（page-kind.js SOT 原**零调用方贫血孤岛**→接真消费者）+ 拆 ad-hoc 哨兵 | `init.js` 5 分支（EHENTAI/兜底/RIDDLE/BATTLE/LOBBY） | ⏳ 待实站 |
| ① probe | `verify-no-adhoc-pagekind.mjs`：禁 `=== "e-hentai.org"` + 三哨兵复合（窄·避噪），豁免 page-kind.js + 第三方移植 | `scripts/`+build链 | ✅ build绿+自测 |

共用：`hasCJK`/`stripComments` 已抽到 `scripts/lib/i18n-probe-lex.mjs`（3 probe 复用，stripComments 为通用 JS 注释剥离）。

## ① 等价性分析（逐分支核对，禁盲改）

`init.js` 顶部算一次 `const kind = detectPageKind()`，分支映射：
- `host==="e-hentai.org"`(原44) ⟺ `kind===EHENTAI` — **精确**（detectPageKind EHENTAI 即此）
- `gE("#riddlecounter")`(原119) ⟺ `kind===RIDDLE` — **精确**
- else-if `!gE("#navbar")`(原130) ⟺ `kind===BATTLE` — **推导等价**（过兜底必有哨兵 + !riddle + !navbar ⟹ textlog ⟹ BATTLE）
- `!gE("#navbar,#riddlecounter,#textlog")`(原61) ⟺ 兜底 `kind∉{RIDDLE,BATTLE,LOBBY}`（=SHOWEQUIP|UNKNOWN，延时重载+return）
- else(原169) ⟺ `kind===LOBBY`

**关键残留假设（实站重点验）**：(61)/(169) 的等价依赖 **「showequip 页（#eu span / /equip/ / showequip.php）无 #navbar」**（detectPageKind 的 SHOWEQUIP 优先级先于 LOBBY；若存在 navbar+#eu span 同现页，detectPageKind 判 SHOWEQUIP 而原 init 判 LOBBY → 分发分歧）。page-kind.js 设计即假设 showequip 为独立无 navbar 页。**若实站发现某带 navbar 页含 #eu span 且功能异常，需在 detectPageKind 调整 SHOWEQUIP 判定或 init 兜底逻辑。**
- 保留不迁：`init.js:40` forgeCost 的 `#eu span` 是功能元素检查非分发（保留）；`riddle.js:25/35` `#riddlecounter` 读计时器值（保留）；`reloader.js:88` `#riddlecounter` 检测 POST 响应文档（保留）。

## 待用户实站验收（重装 `dist/HVAutoAttack.user.js`，版本恒 10.0.1）

- **①**（两模式逐页型）：e-hentai 跳回 HV、答题页弹答题、战斗页进主循环、战外大厅功能正常、showequip/装备详情页强化价格+百分位正常且**不被误判反复重载**。**重点验上述「showequip 无 navbar」假设**。
- **②**：idleArena 四站 token 齐后开战正常、repair 自动修理链正常、延时重载时机（flee 3s / victory 3s / delayReload 配置值 / 未识别页 5min）不变、回合结束 `clearTimeout(delayReload)` 仍取消重载。

## 未做（用户否决 / 超范围）
- config.data 面板 label 三态 / 顶部菜单显示三态（i18n epic ③ 已否决：内部面板价值低）。
- hv-utils dedup epic L3-L5（见 `HANDOFF-dedup-refactor.md`，第三方超大文件，独立 epic）。
- 存储访问收口（riddle-ml/equip-percentile 自建 GM_ wrapper，模块内自洽，价值边际，仅记录）。
