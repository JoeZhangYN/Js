# HVAutoAttack i18n 横切整合 — Handoff（续接点，2026-06-03 更新）

> i18n 横切整合 epic 续接点。前身「第一批汉化」已并入本 epic。
> 设计 plan：`~/.claude/plans/agile-sparking-raccoon.md`（已批准）。

## Epic 目标
统一 3 套散落汉化引擎的横切关注点 → 涉及 DOM 的翻译最终都过一遍 lang 管道，
始终输出对应语言（0简/1繁/2英），运行时切换即时生效 + 持久化。
**用户已豁免「可追上游 diff」**（i18n 稳定、重构整合而非完整迁移上游）。

## 已完成（commit）
| 阶段 | 内容 | commit | 验收 |
|---|---|---|---|
| Phase1 | 统一 RestoreController（修 #change-translate 双挂 bug） | `003d2f9` | ⏳ 待 HV 实站 |
| Phase2 | lang 三态即时切换 + 持久化 + zh-convert 接线 | `c3b2516` | ⏳ 待 HV 实站 |
| persistentGuarantee | 装备列表渐进加载持续翻译（observer） | `6c6fe6c` | ⏳ 待 HV 实站 |
| Phase3 | 词典去重 | — | ❌ 实证跳过（870 共同 key/125 异译多为语境分立同名异义） |

## 架构（已落地）
- `src/i18n/core/restore-controller.js`：单例，统一按钮+Alt+A+全局态 + `registerRestore`
  + `registerRetranslate` + `setLang`(lang 显示态执行器) + `isTranslated`/`hideButton` 等。
- `src/i18n/core/lang-post.js`：`langPostProcess(s)=convertByLang(s,g('lang'))`，繁简末端。
- equip/interface-translate.js：删各自按钮/Alt+A 旧路径(拆桥)→注册回调；译文出口接
  `langPostProcess`；各注册 retranslate(lang 切换重翻)；equip `main()` 加幂等守卫
  (equhide id / 拍卖 observer dataset / eqtp style id) + `observeEquipList`(渐进加载持续翻译)。
- render.js onchange：`setValue(option.lang)` 持久化 + `setLang` 即时切换。
- main.js：首次按持久化 lang 修正显示态(`setLang` 1 转繁 / 2 还原英文)。
- translate 主体双策略(equip innerHTML / interface XPath textNode)保留(falseSiblings,禁合并)。

## 待办
- **Phase4（最大块，待用户验收 Phase1+2 后启动）**：hv-utils(20551 行)补 lang。
  `HVUT_CN.t` 加 lang 分支(覆盖 14 查表) + 三态化 ~293 焊死字面量(topMenuLinks L62 /
  config.data label L9809+ / stamina L10713+ / HVAA_ITEM_CN L10-29)。英文取自存档基线
  `HentaiVerse/HVUT_4.0.0_English.user.js` + `HVUT_isekai_4.2.0_English.user.js`(不造词)。
  双版本 IIFE(ISEKAI L46-9560 / 主世界 L9561+)同步。逻辑值/键/POST 保留英文。切 lang 优先重载生效。
- **Phase5 BUG1（仓库/装备店护甲名没翻）**：阻塞于用户 HV F12 未翻护甲名 outerHTML 样本
  (H1 词典缺词 / H2 正则 / H3 品质色块 span 打断匹配)。
- **第二批(epic 外)**：dict-store.js(GM 词典覆盖+导入导出) + 设置面板「汉化」tab UI。

## 当前阻塞 / 续接动作
用户正实站验收 Phase1+2 + persistentGuarantee。
- 验收 OK → 启动 Phase4(hv-utils 补 lang，ultracode 多 agent，英文取存档基线)。
- 发现问题 → 前进修正(observeEquipList 容器覆盖 / lang 切换重翻幂等)。

## 不变信息
- jpx-lang(window.jpxI18N 繁体数据桥)**排除**出管道，lang=2 时 init 守卫 return。
- HVAA 自身 UI 三语(CSS `<l0>/<l1>/<l2>` 显隐, inject.js)独立机制，不动。
- 用户安装：`HVAutoAttack/dist/HVAutoAttack.user.js`(npm run build 产物, gitignored, 手动重装覆盖)。
- build：`cd Tampermonkey/HVAutoAttack && npm run build`(verify-sloc+check-circular+vite+postbuild)。
- observeEquipList 监听容器：`.equiplist/#equiplist/#leftpane/#eqch_left/#equipselect_left` +
  `tr[onmouseover]` 所在 table。若某装备页容器不在此列表 → 该页渐进加载仍不翻，需补选择器。
