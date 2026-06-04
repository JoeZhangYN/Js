# hv-utils 双版本去重重构 — Handoff（续接点，2026-06-04）

> 新 epic：把 `src/i18n/hv-utils.js`（20563 行 = HV Utils 工具 ISEKAI v4.2.0 段 + 主世界 v4.0.0 段两个 IIFE 拼接）去重成「公共骨架 + IS_ISEKAI 分发」。
> 设计 plan：`~/.claude/plans/serene-conjuring-zephyr.md`（已批准 + plan-deep-reviewer `pass_with_caveats`）。
> 前置：i18n epic（HANDOFF-i18n.md）Stage A-E 已落地、Stage G 挂起到本 epic 末（L5）在单一实现上做一次。

## 诊断结论（5-agent 调研 + 样本核实）

文件注释 `:45` 判「两版同名异义、不去重」被**实证证伪**：大量函数 byte-identical（底层工具 11 个、`equip_code`/`_tr.data`/`_ml.parse`…），逻辑函数几乎全 same-algo（差异只在 DOM 选择器/CN 文案/CSS 主题/class 前缀）。两段是 **trueSiblings**（同算法两 DOM 适配 + 命名漂移），不是 falseSiblings。

## 进度（已完成 L0-L2，4 commit）

| 层 | commit | 内容 | 验收 |
|---|---|---|---|
| L0 | `a95f7e8` | IS_ISEKAI 判定 4 形态归一（`_server.isekai`/`$config.isekai`/行内三元 → 单锚 `IS_ISEKAI`）+ `$config.season` 双义分离 | ✅ 27 点替换等价 + build；⏳ 待实站 |
| L1 | `7feb524` | 13 底层工具去重（`$id/$qs/$element/...` 提公共区，`scrollIntoView` 取守卫版，`popup_text` width IS_ISEKAI 配置） | ✅ 机械 diff distinct=1 + build；⏳ 待实站 |
| L2.1 | `7383f9e` | `$ajax`+`_query` 提公共区（FORM 并集 + limiter 文案配置；decode key 取 ISEKAI） | ✅ 作用域验证 + build；⏳ 待实站 |
| L2.2 | `96c7d21` | `$item`+`$mail` 提公共区（`$item` buy 3 alert 文案配置；`$mail` md5 逐字一致） | ✅ md5 一致 + build；⏳ 待实站 |

**20563 → 20086 行（减 477 行）**，L0-L2 全部**零行为变更**（机械验证：md5/counts/diff/build 全过）。**⏳ 整体待用户实站验收**（两模式各开几页确认 console 无 hv-utils 报错——build 绿只证语法/打包，不测运行时作用域链）。

## 架构（已落地 L0-L2）

- **硬约束**：`protected` 作标识符 15+ 处 → 只能 **sloppy mode 单文件内重构**，**不能拆 ESM**（加 import 触发 strict mode 崩）。物理形态 = 公共部分提到文件顶层（`L50` 之后、`if(IS_ISEKAI)` 之前的公共作用域），两 IIFE 经**作用域链**访问公共定义。
- **公共区现状**（`L50`-`if(IS_ISEKAI)` 之间）：13 工具 function + `IS_ISEKAI` + `_query` + `$ajax` + `$item` + `$mail`。
- **词法作用域铁律**：提公共区的对象只能引用 {公共区符号, IS_ISEKAI, 全局}，**不能引用 IIFE 内对象**（`$config`/`$equip` 等留分支的），否则运行时 ReferenceError。提取前必须**依赖复核**（grep 对象体内引用的 IIFE 内符号）。
- **命名归一基准 = ISEKAI 4.2.0**（封命名方法/嵌套对象/富版实现为准）。

## 关键不变量（续接必读，勿违反）

1. **`$config.ns`（`hvut`/`hvuti` GM 命名空间）绝不归一**——老用户配置键依赖，改了 = 配置丢失。L0 只归一判定锚，ns 字符串值不动。
2. **`$config.season`**（L0 从 `$config.isekai` 分离）= season 字符串载体（主世界 IIFE 恒 falsy 死值）；`IS_ISEKAI` = 布尔判定。两者勿混（一个取值一个判定）。
3. **`$mail.log = _mm.write.log`/`= _mm.write_log` patch 站点**（4 处，对象外各 IIFE 内）留分支不动——运行时单段 patch 公共区共享对象。
4. **`needs_binding=!isekai`** 等业务硬约束（`_up.set` isekai 装备无绑定材料）去重时必须内化进配置，不留行内三元（L3/L4 处理）。
5. **`_ss` 数据清单按版本天然分叉不可合并**（两版祭坛物品本就不同），必须 IS_ISEKAI 数据配置表分发（L3）。

## L3-L5 续接动作（plan serene-conjuring-zephyr）

- **L3 路由块去重（same-algo 主体，最大工作量）**：按模块（Character→Bazaar→Battle/Forge）逐个，`if(_query.s===X){…}` 块合并为公共骨架 + IS_ISEKAI 配置表（selector/文案/主题/class 前缀）+ 命名归一（ISEKAI 基准，见 plan 命名归一表）。单段独有大模块（`$armory`/`_in`/`_iw`/`_up`/`mage_stats`）IS_ISEKAI 守卫条件分支保留（不同 bounded context 不硬合）。**每模块 build + 两模式逐页实站验收**。
- **L4 内部抽象下沉**：ROUTES 路由层(114 处 URL)/SCREENS 注册表(50+ if 块)/TYPE_HANDLERS/EQUIP_CATEGORY 元数据表(分类字符串 30 次)/sendStep helper(14 处)/魔法常量/CSS 主题表。
- **L5 反退化锁 + i18n Stage G**：dup-block probe 接 build 链 + lint 禁 isekai 直读；i18n Stage G 在单一实现上做一次（HVUT_CN 两段共用 + lpr/彩票/inv_eqstor 自渲染查表 + 内部读 resolveEn 防 self-pollution）。

## plan-deep-reviewer 4 caveat（L3-L5 执行期补齐）

1. `$armory` 对照模块统一为 `_es`（单件买卖，非 `_in`）。
2. L5 dup/命名 probe **显式豁免 `$config.ns`**（`hvut`/`hvuti`）。
3. L2 闭包污染核对补「公共候选对象赋值点扫描」机械辅助（L2 已完成，L3 提取继续用）。
4. L5 dup-block probe **显式豁免** IS_ISEKAI 守卫的合法单段大模块（`$armory`/`_in`/`_iw`/`_up`/`mage_stats` ~1830 行）+ `_ss` 分叉数据。

## 验收方案 + 不变信息

- **每层/每模块**：`cd Tampermonkey/HVAutoAttack && npm run build`（verify-sloc + check-circular + vite + verify-metadata + postbuild-check；L5 起加 dup-block probe）。
- **机械 diff 复核 identical**（L1/L2 已用，L3 same-algo 不适用，靠两模式实站）。
- **HV 实站**（用户执行，两模式逐页）：装 `dist/HVAutoAttack.user.js`（gitignored，npm run build 产物，**手动重装覆盖**，版本恒 10.0.1）。
- hv-utils.js **严禁整文件 Read**（908KB），Grep 定位 ±20 行小改，区分双 IIFE（`<9559` ISEKAI / `>9573` 主世界，但 L0-L2 后行号已偏移，用 grep 不信旧行号）。
- ultracode 加速形态：**并行准备「精确到行方案」+ 机械 diff 复核（只读 fan-out），主对话/执行 agent 串行写文件 + build 验证 + 审 git diff**（单文件不并行写，会冲突 + 改错 IIFE 段）。git diff 行数大可能是块移动对齐噪声（验 md5/counts 守恒确认）。
