# HVAutoAttack i18n 横切 DOM 冲突修复 — Handoff（续接点，2026-06-04 更新）

> i18n 横切整合 epic 当前阶段：**统一英中态协调器**（修用户实站验收暴露的 5 现象）。
> 设计 plan：`~/.claude/plans/spicy-inventing-comet.md`（已批准）。
> 前身 Phase1/2/persistentGuarantee（旧 commit 003d2f9/c3b2516/6c6fe6c）已并入。

## 诊断结论（ultracode workflow 9 agent + 2 Explore + 实站样本核实）

5 现象 → **4 个收敛到 1 根因 + 1 正交独立**：
- **根因**：HV 原生英文 DOM 被多功能各自读写、无单一权威。i18n（equip innerHTML / interface textNode）把英文翻成中文后，下游读方（hv-utils show_base/parse_table/lpr、百分位）仍用英文 key/正则索引同一被改 DOM → 失配。
- 现象①持久化是**正交独立 bug**（render.js `g("option")||{}` 残缺写）。

## Stage 进度（本 session 6 commit）

| Stage | 内容 | commit | 验收 |
|---|---|---|---|
| A | lang 持久化（现象①）setOption 统一写入口 | `e4dec05` | ⏳ 待实站 |
| B | 横切协调器骨架 + 中英逆表 + 写方登记（纯增量） | `bf63089` | 离线验证逆表✓ |
| C1 | show_base 读源归一（现象⑤ `[undefined]`）双 IIFE | `9e1bda6` | ✅ **用户实站确认 `[undefined]` 消失** |
| C2 | parse_table 训练表读源归一（tr_level 英文键）双 IIFE | `1360d54` | ✅ **用户确认训练表正常渲染** |
| (handoff) | 更新续接点 | `addca8e` | — |
| E(短期) | observeEquipList 覆盖 `#inv_eqstor` 等稳定父容器 | `c5dfe69` | ⏳ 待实站（装备仓库装备名） |
| D | 装备百分位统一纳入协调器（已重定义，见下） | — | 阻塞：见续接 |
| E(完整) | ISEKAI/装备店锻造其它容器 + 长期事件化拆桥 | — | 阻塞：见续接 |
| F | node probe 防退化锁（build 链） | — | 待 D/E 后 |
| G | hv-utils 整体补 lang（原 Phase4，**含 lpr/彩票/inv_eqstor 装备名**） | — | 待 |
| H | 设置面板「汉化」配置 tab（新功能） | — | 现象修完后 |

## 架构（已落地 A–C+E短期）

- **横切协调器** = 扩 `src/i18n/core/restore-controller.js`：
  - `resolveEn(node, group?)` 读出口：节点登记原文 → 逆表反查 → undefined（调用方 `?? 原值`）。**退化安全**。
  - `registerTranslation`/`SKIP_ATTR='data-i18n-skip'`/`isSkipped`。
  - **全局桥 `window.HVAA_i18n`**：hv-utils.js 是非 ESM sloppy 第三方脚本（加 import 触发 strict mode 撞 `protected` 保留字），故 restore-controller 挂 `window.HVAA_i18n={resolveEn,...}`，hv-utils 双 IIFE 经全局桥读（`var resolveEn=...`）。**Stage G 的 hv-utils 读点继续走此桥**。
- **逆表** `src/data/i18n/reverse-dict.js`：INTERFACE_WORDS + 品质前缀 → 中→英；正则/通配/多对一不可逆剔除；繁体查询前 `toSimplified`。`reverseLookup(text, group)`。离线验证 6 主属性/品质/训练全可逆。
- **持久化（A）**：`src/state/option.js` 抽 `setOption(key,val)`；render.js onchange + ability-page 走它；storage.js setValue("option") 缺 version warn；button.js:16 改条件兜底。
- **C 读源归一**：hv-utils show_base（ISEKAI:~3852 / 主世界:~13750 含 toLowerCase）+ parse_table（ISEKAI:~4401 / 主世界:~14736 + parse_progress _tr.current）全走 `resolveEn(node,'characterStatus'|'trains') ?? name`，逻辑 key（_tr.level/data/dataset/option.value）用英文 enName、显示用中文 name。
- **E 短期**：observeEquipList 容器前置 `#inv_eqstor/#inv_equip/#shop_pane/#item_pane/#eqinv_outer`（稳定 HV 父容器，监听 subtree 捕获 hv-utils 异步渲染的 .equiplist 装备名）。

## 关键新认识（实站样本驱动，影响 D/G）

**用户报的"百分位/彩票/装备名英文"大多是 hv-utils 自渲染，正解是 Stage G（让 hv-utils 自渲染走翻译），而非外部事后翻（横切叠加）。** 用户理念明确：**i18n 是最终通用层，取消分治避让，所有读方走 resolveEn**。

- **两个不同的百分位功能（勿混）**：
  1. `equip-percentile-live.js`（独立模块）：仅在 **showequip.php / /equip/ 详情页**跑（i18n 避让不翻的页）；documentInteractor `if(!#showequip)return`。用户 `equipPercentileMode='live'`。**它退化不是 i18n 污染**（那页无中文），是功能本身（todo#420 从未实站验证）。
  2. **hv-utils 的 lpr**（`hvut-in-lpr` 按钮 data-action="lpr" data-eid + `equips.set` hover）：在 **装备列表（#inv_eqstor）hover** 显示百分位。用户期望"鼠标移到装备直接显示百分比，按键切回数值"指的是**这个**。lpr 用 eid（数字）不受装备名翻译影响。退化需查 hv-utils lpr 实现（未查）。
- **彩票/计时**：hv-utils 渲染 `#hvut-bottom`（`Luck of the Draw [5]`+倒计时 / `Peerless Fiery Longsword of Slaughter` lt武器彩票 / `Peerless Cobalt Plate Cuirass of Warding` la防具彩票 + 倒计时），自渲染英文 → **Stage G**。
- **inv_eqstor 装备名**：hv-utils 异步渲染英文（`hvut-eq-Legendary` class + 英文名）。E 短期用 equip observer 事后翻（横切叠加，可能与 hvut-eq-* class 视觉重复上色）；**长期 Stage G 让 hv-utils 自渲染中文**。
- **Stage D 重定义**（已记 task）：装备百分位统一纳入协调器——取消 equip/interface 对 `/equip`+showequip 的避让守卫 → i18n 翻详情页；live/offline 读 DOM 走 resolveEn；offline 注入 `.hv-lpr-avg` 打 data-i18n-skip。前置需 live 现状确认（能出/完全不出）。

## 当前续接动作（用户决策："2+3+1" 顺序）

1. **先验收 Stage E（短期）**：重装 dist → 主世界装备仓库(`?s=Character&ss=in`)装备名是否翻中文 + 有无视觉重复上色。
2. **查 lpr/ISEKAI**：① hv-utils 的 lpr 百分位实现（`hvut-in-lpr`/`data-action="lpr"`/`equips.set` 在 hv-utils.js，grep 定位，判退化根因 + 是否 i18n 污染）；② ISEKAI 装备仓库**无效**根因（需用户 ISEKAI 页 console + outerHTML；equip-translate initEquipTranslate 对 isekai 不 return，疑 hv-utils ISEKAI 分支渲染/时序不同）。
3. **启动 Stage G**：hv-utils 整体补 lang（ultracode 多 agent）——`HVUT_CN.t` 加 lang 分支(14查表) + ~293 焊死字面量三态化（topMenuLinks/config.data label/stamina/HVAA_ITEM_CN）+ **lpr/彩票/#hvut-bottom/inv_eqstor 装备名自渲染中文** + 内部读走 resolveEn 防 self-pollution。英文取存档基线 `HVUT_4.0.0_English`/`HVUT_isekai_4.2.0_English`，双 IIFE 同步。前置 SKIP_ATTR(已有)。

**仍需用户实站样本**：① ISEKAI 装备仓库 console+outerHTML（Stage 2 查 ISEKAI）；② live 模式 showequip `#showequip` 现状（Stage D，若还做 live）。

## 现象② = 汉化 tab（Stage H，用户已定范围）

设置面板独立「汉化」配置页（原 epic 第二批）。内容：**①lang 切换集中 ②dict-store 自定义词典覆盖+导入导出 ③装备百分位设置移入**（不做各引擎独立开关）。时机：现象修完后。

## 不变信息（保留）

- jpx-lang(window.jpxI18N 繁体桥)排除出管道，lang=2 init 守卫 return。
- HVAA 自身 UI 三语（CSS `<l0>/<l1>/<l2>`，inject.js）独立机制，不动。
- 用户安装：`dist/HVAutoAttack.user.js`（npm run build 产物，gitignored，**手动重装覆盖**；版本号恒 10.0.1，验收前务必重装）。
- build：`cd Tampermonkey/HVAutoAttack && npm run build`（verify-sloc+check-circular+vite+verify-metadata+postbuild）。
- hv-utils.js 20551 行双 IIFE（ISEKAI <9560 / 主世界 >9561，IS_ISEKAI 判定 L44），**严禁整文件 Read**，Grep 定位 ±20 行小改，区分两版。改 hv-utils 加 import 会触发 strict mode（`protected` 保留字）→ 必须经 `window.HVAA_i18n` 全局桥，不能 ESM import。
- **下个 epic**：后台定时调度抽象（setInterval 驱动训练续训 + 遭遇战检测 + 统一抽象），i18n 全收尾后做。

## Stage G 进展（2026-06-04，**SSOT 归一路线**，承接 dedup epic 证伪后 pivot）

> dedup epic（serene-conjuring-zephyr）执行中证伪：两版适配两个不同游戏（persistent HV vs Isekai），infra 游戏机制级分叉不可机械去重。但「内部装备中文 ≠ 外部」真因是翻译层散落漂移，与游戏机制正交、可归一。故 Stage G 改用 **SSOT 路线**（hv-utils 自渲染翻译收口到 canonical `src/data/i18n` 经 `window.HVAA_i18n` 桥），而非原 handoff 的「HVUT_CN 加 lang 分支 + 双 IIFE 同步」in-place 路线。设计 plan：`~/.claude/plans/abundant-hugging-lerdorf.md`。

| 阶段 | commit | 内容 |
|---|---|---|
| G0 | `8ffdd7a` | `window.HVAA_i18n.t(value,group)` 正向桥（读 canonical EQUIP_ITEMS/INFO + hvut-terms + INTERFACE_WORDS）+ hv-utils `hvaaT`/`hvaaTEquip` 桥读 |
| G1 | `2ae6a5c` | 物品/材料名收口（删 `HVAA_ITEM_CN`+`HVUT_CN.material`；漂移修复 Health Potion 生命药水→体力药水 等） |
| G2 | `9832894` | 装备名自渲染收口（equip-translate 加 `export translateEquipName` 注册到桥，复用外部同 dictEquips；9 display 点 + `data-i18n-skip`；逻辑值保英文） |
| G3 | `b9ed8f3` | 术语 spell/eqCategory/abCategory 收口（新建 canonical `src/data/i18n/hvut-terms.js` exact-lookup；删 HVUT_CN 术语+.t）+ hv-utils 顶部旁注 :45 更正 |
| G4 | `95c1ade` | 反退化 probe `scripts/verify-no-dup-translation.mjs` + 接 build 链（禁再现独立翻译表，`i18n-probe-allow` 行级豁免） |

**Stage G 剩余**：① 用户 HV 两模式实站验收（装备/物品/材料/术语中文 == 外部游戏 DOM，无双翻）；② **follow-up**：`HVUT_CN.stamina`（stamina_readout tooltip 整句替换，带 `i18n-probe-allow` 暂留）移交外部 `interface-translate`（interface-dict:448 已部分覆盖），届时删本表；③ config.data label / topMenuLinks 焊死字面量三态化（原 Stage G 范围，未做）。
