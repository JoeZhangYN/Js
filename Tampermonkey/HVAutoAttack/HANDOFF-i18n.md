# HVAutoAttack 汉化整合 — Handoff (2026-06-03)

> 新 session 续接点。第一批已 commit + 用户验证核心 OK(中文+词缀分色回来)。

## 已完成(第一批, v10.0.1, build 全绿 1.79MB)
| 功能 | 逻辑模块 | 数据模块 | 状态 |
|---|---|---|---|
| 装备词条+词缀分色 #404119 | `src/i18n/equip-translate.js` | `src/data/i18n/equip-dict.js`(4词典) | ✅ 用户验证 OK |
| 界面/角色页汉化 #404118(Fighting Style等) | `src/i18n/interface-translate.js` | `src/data/i18n/interface-dict.js`(65选择器+33分区) | ✅ 用户验证 OK |
| 繁简转换(自建) | `src/i18n/zh-convert.js` | `src/data/i18n/zh-table.js`(T2S 1189字对) | 🔧 已建**未接线** |
| jpx 语言包 | `src/i18n/jpx-lang.js` / `jpx-dict.js` | — | ❌ 弃用(死路:仅发 window.jpxI18N、需不在仓主脚本、key 是标识符非页面文本) |

其它已改:
- `src/i18n/hv-utils.js`: sssss2 `equipColor` 品质整件染色已禁(`if(false)`,改用 #404119 词缀分色) + 汉化错误诊断弹窗(临时, catch 内 textarea)
- `src/main.js`: 接线 `initEquipTranslate → initInterfaceTranslate → hv-utils(副作用) → init`
- `src/pages/init.js`: 版本更新弹窗已禁(改静默对齐 option.version)
- `package.json`: 9.99.9999 → **10.0.1**; `scripts/postbuild-check.mjs`: 体积上限 1.5MB → 2.5MB
- `HentaiVerse/SOURCES.md`: 新增「功能嵌入矩阵」+「如何追上游更新」; 上游全存档 `HentaiVerse/`

## 遗留 BUG(用户验证发现, 待修)
1. **仓库/装备店护甲名没翻**(人物装备页护甲已翻 ✅): 同一装备列表武器翻了护甲没翻 → #404119 的 `EQUIP_EQUIPS`(equip-dict.js)护甲**类型/材质/部位词收得不全**(indefined 上游词典武器全、护甲缺)。修: 补 equip-dict 护甲词条(需 HV 护甲词表: Power/Shade/Leather/Plate 等 type × 材质 × 部位 × 中文)。
2. **锁定装备「前置」后翻译失效**: #404119 是页面加载时**一次性翻**, 而 sssss2 的排序/锁定前置**重排装备列表 DOM** → 翻好的被打乱/重渲染失效。修: 给 #404119 装备列表加 `MutationObserver` 重翻(或在 sssss2 排序后重触发 `translateEquipsList`)。

## 第二批待办(未开始, 用户已确认要)
- **dict-store.js**(GM 存储覆盖默认词典 + 运行时导入/导出): 复用 `render.js` L739 `hvAAExport`/`hvAAImport` + `.hvAAConfig` textarea 模式; 加 `getDict(name)`(GM 有则用否则默认)/`exportDict`/`importDict`/`resetDict`; 改 equip/interface/zh-convert 逻辑从 `getDict` 取词典。
- **繁简一键切换**: 接 HVAA `lang` 设置(0简/1繁/2英, `g("lang")`/render.js); equip/interface 输出经 `convertByLang(_, lang)`(zh-convert)归一。注: 两汉化本简体, lang=1 时才 简→繁(一对多有歧义, 以简为主)。
- **设置面板「汉化」tab**: `render.js` 新增 `hvAATab-I18n` + tabmenu 项(装备/界面汉化开关 + 繁简切换 + 词典导入导出 UI); `schema.js` 加字段。tab 切换逻辑见 render.js L458。

## 杂项
- 根目录 `Tampermonkey/[HV]AutoAttack.js` 是旧单文件(==`legacy/[HV]AutoAttack.legacy.js`)冗余/误导源——用户最初误装它致"退化"错觉。**建议删**(本次未删, 未 commit)。
- 用户安装产物: `HVAutoAttack/dist/HVAutoAttack.user.js`(同 @name/@namespace, 手动重装覆盖; 同版本号不自动更新)。
- 执行顺序注意: 当前 main.js 中 hv-utils(sssss2)在 import 阶段先于 indefined 调用; #404119 @notice 称"需先于其它汉化", 若发现 sssss2 与 indefined 抢翻同区域, 把 hv-utils 改 export 函数后置调用。
