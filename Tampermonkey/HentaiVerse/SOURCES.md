# HentaiVerse 合并源台账（SOURCES）

> 本台账记录 `Tampermonkey/HentaiVerse/` 下各脚本（"合并源"）的**真实上游地址**、**仓库版本 vs 上游最新版本**、**核对状态**，以及它们被整合进 `Tampermonkey/HVAutoAttack/` 的位置。
>
> - **用途**：判断哪些合并源已过期、是否需要更新、更新后是否要适配 HVAutoAttack 整合实现。
> - **核对日期**：2026-05-29
> - **核对方法**：脚本头部 `@version`/`@namespace`/`@updateURL` + sleazyfork/greasyfork 站内搜索 + GitHub + Wayback Machine。
> - **维护原则**：台账先行，**不覆盖脚本文件**；确认要更新的脚本再逐个拉最新并检查 HVAutoAttack 适配。

## 状态图例

| 标记 | 含义 |
|------|------|
| ✅ 最新 | 仓库版本 = 上游最新版本 |
| ⚠️ 存疑/近似 | 版本接近最新但有来源/后缀差异，需 diff 确认 |
| ❓ 上游未定位 | 公开脚本站（sleazyfork/greasyfork）搜不到，疑 e-hentai 论坛附件 / gist / 国内源 / 已下架 |
| 🔧 定制版 | JoeZhangYN 本地合并/魔改产物，无单一上游，**禁止盲目覆盖** |
| 💀 上游已死 | 原托管平台关停，仅存归档快照 |

---

## 主对照表

| 合并源脚本 | 仓库版本 | 真实上游 | 上游最新 | 状态 | 整合进 HVAutoAttack |
|-----------|---------|---------|---------|------|---------------------|
| **HV Utils 统一汉化** | `1.0.0` | JoeZhangYN 自合并（原料 sssss2 v3+v4） | N/A | 🔧 | `src/i18n/hv-utils.js`（核心汉化） |
| **HV Utils 汉化** | `3.0.0` | [sleazyfork #496994](https://sleazyfork.org/scripts/496994-hv-utils-汉化)（sake123456） | `3.0.0`（2024-06-03） | ✅ 版本号一致 | 同上（"统一汉化"的主世界原料） |
| **HV Utils Isekai 汉化** | `4.1.1` | 同上脚本 isekai 分支 / sssss2 论坛 [211883](https://forums.e-hentai.org/index.php?showtopic=211883) | 待确认对应 | ❓ | 同上（isekai 原料） |
| **HV 物品汉化V2**（装备词缀染色，未入库） | — | [userscripts-mirror #152937](https://userscripts-mirror.org/scripts/show/152937)（ggxxsol） | `V2.8.2`（2014 冻结） | 💀 | 未整合；**现代替代见下方 indefined** |
| **jpx Chinese Language Pack** | `2026.01.31` | namespace `ijpx`，公开站未见 | 未定位 | ❓ 版本超新，疑 sleazyfork 中文区/论坛 | 未整合（独立汉化包） |
| **Riddle Master Assistant Reborn** | `0.5.2` | [sleazyfork #424684](https://sleazyfork.org/scripts/424684-riddle-master-assistant-reborn)（rdmareborn） | `0.3.2`（2022-02-27，停更） | ⚠️ **仓库 > 上游**，0.5.2 来源不明（疑未发布的 fork/本地魔改） | `src/pages/riddle*.js`、`src/data/riddle-answers.js`（RMA L40 同源） |
| **HV 彩虹小马 (My Little Pony)** | `0.6` | [sleazyfork #459603](https://sleazyfork.org/scripts/459603)（ssnangua_cn） | `0.6` | ✅ 最新 | `src/data/pony-images.js`（mlp v0.6 L166-179） |
| **Hentaiverse Monsterbation** | `1.4.1.3` | [sleazyfork #491790](https://sleazyfork.org/scripts/491790-hentaiverse-monsterbation)（wehi-snapmail-cc，汉化贴吧 mbbdzz） | `1.4.1.3w`（2024-04-09） | ⚠️ 上游带 `w` 后缀，近似最新；另有原版 [#423369](https://sleazyfork.org/scripts/423369-hentaiverse-monsterbation)（lucifer1118, 2021） | `src/battle/{critical-buff-guard,item,main-loop}.js`（借鉴）+ `i18n` 兼容 |
| **Live Percentile Ranges** | `1.1.0.s3` | Superlatanium，公开站未见（`.s3` 疑某 fork 后缀） | 未定位 | ❓ 疑 e-hentai 论坛 / 已整合进 HV Utils | `src/pages/equip-percentile-live.js` |
| **Percentage Ranges** | `1.1.9` | [gist/hvscripts](https://gist.github.com/hvscripts/2ecad2b7e2f681ab84ab5dee3509b194)（剑行血间, SIRIUSs） | `1.1.9` | ✅ 与 gist 一致 | `src/pages/equip-percentile-offline.js` |
| **PriceForgedEquipment-Persistent** | `1.02`（2022.12.20） | namespace `HVEquipPrice`，公开站未见 | 未定位 | ❓ 疑论坛附件 | `src/data/forge-costs.js`（硬编码 2022 价格） |
| **PriceForgedEquipment-Isekai** | `1.01`（2022.12.20） | 同上 | 未定位 | ❓ 疑论坛附件 | 同上 |

---

## 现代活跃替代品：indefined / HVTranslate ⭐

GitHub [`indefined/UserScripts/HVTranslate`](https://github.com/indefined/UserScripts/tree/master/HVTranslate) 是**活跃维护**的 HV 汉化套件（2025 年底仍在更新），可作为已死/过期汉化脚本的现代替代：

| 脚本 | 版本 | 上游 |
|------|------|------|
| **HV 物品装备汉化** ⭐ | `2025.11.13` | [sleazyfork #404119](https://sleazyfork.org/scripts/404119) + [GitHub](https://github.com/indefined/UserScripts/blob/master/HVTranslate/HV%20物品装备汉化.user.js) |
| HentaiVerse汉化（界面） | `2025.12.02.1` | [sleazyfork #404118](https://sleazyfork.org/scripts/404118) + GitHub |
| HV 图片按钮汉化 | `2021.04.25` | GitHub |

> **关键**：你最初找的"装备前缀后缀翻译 + 染色"（2014 ggxxsol `HV 物品汉化V2`，💀 上游已死）的**现代活跃替代 = indefined「HV 物品装备汉化」v2025.11.13**。若要做装备词缀汉化染色，应基于此而非 ggxxsol 老版。

---

## 适配风险初判（步骤2 预判，待逐脚本确认）

| 风险级 | 合并源 | 理由 |
|--------|--------|------|
| 🔴 高 | PriceForgedEquipment → `src/data/forge-costs.js` | 硬编码 2022.12.20 价格数据；游戏 forge 价格会随版本变，**最可能已过期** |
| 🟠 中 | Live Percentile / Percentage Ranges → `equip-percentile-*` | 百分位基准随装备 meta 更新；但上游本身难定位更新 |
| 🟢 低 | Riddle / 彩虹小马 / Monsterbation / HV Utils 汉化 | 上游已停更或版本一致，无更新压力（HV Utils 汉化 3.0.0 仅需 diff 确认内容） |

---

## 后续 Action（等确认）

1. **逐脚本拉最新 + 存档**：确认要更新的脚本，从上游拉最新 JS 覆盖（定制版 🔧 除外）。
2. **未定位上游（❓）**：需提供原始来源链接（e-hentai 论坛 211883 附件区 / 国内分享），或接受"仓库版即现存最新"。
3. **forge-costs.js 数据核对**（🔴 高优先）：核对 2022 价格数据是否仍与游戏现状一致。
4. **装备词缀汉化染色**：若要落地，基于 indefined「HV 物品装备汉化」v2025.11.13 移植，叠加按品质/元素的背景色方案。

## 如何维护本台账

- 新增合并源 → 加一行，填仓库版本 + 上游 URL + 整合位置。
- 更新脚本后 → 同步"仓库版本"列 + 状态。
- 上游版本核对：sleazyfork 脚本页 `@version`，或 `https://update.sleazyfork.org/scripts/<id>/<name>.meta.js`。
