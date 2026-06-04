# HVAutoAttack i18n 横切 DOM 冲突修复 — Handoff（续接点，2026-06-04 更新）

> i18n 横切整合 epic 的当前阶段：**统一英中态协调器**（修用户实站验收暴露的 5 现象）。
> 设计 plan：`~/.claude/plans/spicy-inventing-comet.md`（已批准）。
> 前身 Phase1/2/persistentGuarantee（旧 commit 003d2f9/c3b2516/6c6fe6c）已并入。

## 诊断结论（ultracode workflow 9 agent + 2 Explore 核实）

用户实站报 5 现象 → **4 个收敛到 1 根因 + 1 正交独立**：
- **根因**：HV 原生英文 DOM 被多功能各自读写、无单一权威。i18n（equip innerHTML / interface textNode）把英文翻成中文后，下游读方（hv-utils show_base/parse_table、offline 百分位）仍用英文 key/正则索引同一被改 DOM → 中文 key 查英文对象失配。
- 现象①持久化是**正交独立 bug**（render.js `g("option")||{}` 残缺写），非 DOM 冲突。

## Stage 进度

| Stage | 内容 | commit | 验收 |
|---|---|---|---|
| A | lang 持久化（现象①）setOption 统一写入口 | `e4dec05` | ⏳ 待实站 |
| B | 横切协调器骨架 + 中英逆表 + 写方登记（纯增量） | `bf63089` | 离线验证逆表✓ / ⏳ 实站无回归 |
| C1 | show_base 读源归一（现象⑤ `[undefined]`）双 IIFE | `9e1bda6` | ⏳ 待角色页实站 |
| C2 | parse_table 训练表读源归一（tr_level 英文键修复）双 IIFE | `1360d54` | ⏳ 待训练页实站 |
| D | offline 百分位读源归一（现象④） | — | **阻塞：需用户样本** |
| E | observer 事件化拆桥（现象③渐进） | — | **阻塞：需用户样本** |
| F | node probe 防退化锁（build 链） | — | 待 D/E 后 |
| G | hv-utils 整体补 lang（原 Phase4，必最后） | — | 待 F 后 |
| H | 设置面板「汉化」配置 tab（新功能） | — | 现象修完后 |

## 架构（已落地 A–C）

- **横切协调器** = 扩 `src/i18n/core/restore-controller.js`（不新建平行单例）：
  - `resolveEn(node, group?)` 读出口：节点登记原文（interface textNode 精确）→ 逆表反查 → undefined（调用方 `?? 原值`）。**退化安全**：英文态/miss 返原值，不改英文态行为。
  - `registerTranslation(node, en)` 写登记；`SKIP_ATTR='data-i18n-skip'` + `isSkipped` 子树跳过。
- **逆表** `src/data/i18n/reverse-dict.js`：从 INTERFACE_WORDS + 品质前缀（EQUIP_EQUIPS 10 条 strip 装饰符）构造 中→英；正则/通配/多对一不可逆剔除；繁体查询前 `toSimplified` 归一。`reverseLookup(text, group)`。
- **全局桥** `window.HVAA_i18n`：hv-utils.js 是**非 ESM sloppy 第三方脚本**（加 import 触发 strict mode 撞 `protected` 保留字标识符），故 restore-controller 挂 `window.HVAA_i18n={resolveEn,...}`，hv-utils 双 IIFE 经全局桥读（`var resolveEn=...`）。**Stage D/G 的 hv-utils 读点也走此桥**。
- **写方接入**：interface translateText 登记 textNode 原文 + skip；equip translate 写前 skip。
- **持久化（A）**：`src/state/option.js` 抽 `setOption(key,val)`（g||getValue fallback 取完整 option）；render.js onchange + ability-page 走它；storage.js setValue("option") 缺 version warn。

## 当前阻塞 / 续接动作

**Stage D/E 阻塞于用户实站样本**（我无 HV 登录态）：
- **D（百分位）**：`equipPercentileMode='offline'` 装备弹窗 `#popup_box` 内单个 `.showequip` outerHTML（看品质前缀是否已中文 span）；`'live'` 模式 `#showequip` outerHTML + option 实际 `equipPercentileMode` 值。
- **E（渐进）**：装备仓库(`ss=in`)/装备店(`ss=es`)/锻造(Forge) 3 页滚动后容器层级 outerHTML + console 有无 `[HVAA][equip-i18n]` 报错。
- **C 验收（可选辅助）**：主世界角色页 `#eqch_stats` outerHTML 确认 show_base 反查命中。

**验收 A/B/C1/C2 后**：D（需样本）→ E（需样本）→ F（probe）→ G（hv-utils 补 lang）→ H（汉化 tab）。

## 现象② = 汉化 tab（Stage H，用户已定范围）

设置面板独立「汉化」配置页（原 epic 第二批）。用户定内容：**①lang 切换集中 ②dict-store 自定义词典覆盖+导入导出 ③装备百分位设置移入**（不做各引擎独立开关）。时机：现象修完后。

## 不变信息（保留）

- jpx-lang(window.jpxI18N 繁体桥)**排除**出管道，lang=2 init 守卫 return。
- HVAA 自身 UI 三语（CSS `<l0>/<l1>/<l2>` 显隐，inject.js）独立机制，不动。
- 用户安装：`HVAutoAttack/dist/HVAutoAttack.user.js`（npm run build 产物，gitignored，**手动重装覆盖**；版本号恒 10.0.1 无法自动提示更新 → 验收前务必重装）。
- build：`cd Tampermonkey/HVAutoAttack && npm run build`（verify-sloc+check-circular+vite+verify-metadata+postbuild）。
- observeEquipList 监听容器：`.equiplist/#equiplist/#leftpane/#eqch_left/#equipselect_left` + `tr[onmouseover]` 所在 table（Stage E 将补 sssss2 稳定父节点 + 事件化拆桥）。
- hv-utils.js 20551 行双 IIFE（ISEKAI <9560 / 主世界 >9561），**严禁整文件 Read**，Grep 定位 ±20 行小改，区分两版。
- **下个 epic**：后台定时调度抽象（setInterval 驱动训练续训 + 遭遇战检测 + 统一抽象），i18n 全收尾后做。
