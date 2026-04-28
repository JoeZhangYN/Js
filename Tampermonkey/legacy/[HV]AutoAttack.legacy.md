# [HV]AutoAttack.js 技术文档

HentaiVerse 自动战斗脚本，支持主世界/异世界双环境，提供 Buff/Debuff 施放、物品使用、目标优先级计算、自动攻击等功能。

## 游戏数据参考

### 攻击魔法 (Offensive Spells)

ID 规则: `1{element}{tier}` — element: 1=Fire 2=Cold 3=Elec 4=Wind 5=Holy 6=Dark; tier: 1/2/3

| 元素 | T1 | T2 | T3 |
|------|----|----|-----|
| Fire | Fiery Blast | Inferno | Flames of Loki |
| Cold | Freeze | Blizzard | Fimbulvetr |
| Elec | Shockblast | Chained Lightning | Wrath of Thor |
| Wind | Gale | Downburst | Storms of Njord |
| Holy | Smite | Banishment | Paradise Lost |
| Dark | Corruption | Disintegrate | Ragnarok |

| 属性 | T1 MP | T1 CD | T1 目标 | T2 MP | T2 CD | T2 目标 | T3 MP | T3 CD | T3 目标 |
|------|-------|-------|---------|-------|-------|---------|-------|-------|---------|
| 四元素 | 6 | 0 | 3 | 14 | 4 | 5 | 21 | 7 | 7 |
| Holy | 14 | 0 | 3 | 21 | 4 | 5 | 30 | 7 | 7 |
| Dark | 14 | 0 | 3 | 18.5 | 4 | 5 | 28 | 7 | 7 |

- CD 可通过 Ability 减半 (如 4→2, 7→4)
- 目标数可通过 Ability 增加 (如 3→5, 5→7, 7→10)
- 元素附加状态效果触发率: T1=25%, T2=50%, T3=75%
- 元素克制链: Fire↔Cold, Elec↔Wind, Holy↔Dark (互为弱点)

### Debuff 法术

| Code | 法术名 | MP | CD | 持续 | 效果 |
|------|--------|-----|-----|------|------|
| Dr | Drain | 11.5 | 20 | 7 | DoT + 生命偷取 |
| Slo | Slow | 18 | 3 | 10 | 行动速度 -30~50% |
| We | Weaken | 10 | 3 | 10 | 伤害 -25~50% |
| Sle | Sleep | 22 | 7 | 5 | 阻止所有行动 |
| Co | Confuse | 25 | 10 | 10 | 25% 概率打自己 |
| Im | Imperil | 10 | 3 | 10 | 防御 -25~50% |
| Bl | Blind | 18 | 7 | 10 | 命中 -20~30% |
| Si | Silence | 18 | 10 | 10 | 阻止施法/特殊攻击 |
| MN | MagNet | 22 | 15 | 10 | 阻止闪避+抗性 |

- CD/持续/效果均可通过 Ability 强化
- AoE 目标数可通过 Ability 提升 (默认单体)

### Buff 法术

| Code | 法术名 | MP | CD | 持续 | 效果 |
|------|--------|-----|-----|------|------|
| Pr | Protection | 25 | 0 | 15 | 减伤 25~30% |
| Ha | Haste | 30 | 0 | 10 | 行动速度 +25~50% |
| SV | Shadow Veil | 30 | 0 | 10 | 闪避 +15~25% |
| Ab | Absorb | 30 | 20 | ∞ | 吸收魔法 60~90% |
| SL | Spark of Life | 44 | 0 | 15 | 防即死 |
| AF | Arcane Focus | 100 | 0 | 50 | 魔法伤害 +25%, 暴击 +10% |
| He | Heartseeker | 100 | 0 | 50 | 物理伤害 +25%, 暴击 +10% |
| SS | Spirit Shield | 25 | 0 | 15 | 伤害转移至 SP |
| Re | Regen | 22.5 | 0 | 14 | 每回合回复 HP |

### 战斗技能

| 流派 | T1 | T2 | T3 | T1 OC | T2 OC | T3 OC | CD |
|------|----|----|-----|-------|-------|-------|----|
| 盾战 | Shield Bash (眩晕5回合) | Vital Strike (流血) | Merciful Blow (斩杀<25%HP) | 25 | 50 | 100 | 10 |
| 双刀 | Iris Strike (致盲) | Backstab (双倍伤害+毒) | Frenzied Blows (5目标10-20连击) | 50 | 50 | 75 | 5/5/10 |
| 双手 | Great Cleave (高伤) | Rending Blow (破甲5目标) | Shatter Strike (破甲后眩晕5目标) | 50 | 50 | 50 | 10 |

| 特殊技能 | OC | CD | 效果 |
|----------|-----|-----|------|
| OFC (Orbital Friendship Cannon) | 200 | 50 | 全体 void 伤害 |
| FRD (FUS RO DAH) | 100 | 10 | 全体 void 伤害 + 眩晕 5 回合 |

### Spirit Stance & Overcharge

- **OC 获取**: 普通攻击命中生成 5-10% OC，上限 250%
- **Spirit Stance**: 切换式，需 ≥50% OC；激活时物理伤害 +100%，魔法消耗 -25%，每回合消耗 1 SP + 10% OC
- **技能消耗**: 盾战 T1=25 T2=50 T3=100, OFC=200, FRD=100 (均需额外 5 OC 用于目标选择)

## 模块常量

### BUFF_SKILL_LIB

Buff 技能库，9 个支援类法术。

| Code | Name | ID | img |
|------|------|----|-----|
| Pr | Protection | 411 | protection |
| SL | Spark of Life | 422 | sparklife |
| SS | Spirit Shield | 423 | spiritshield |
| Ha | Haste | 412 | haste |
| AF | Arcane Focus | 432 | arcanemeditation |
| He | Heartseeker | 431 | heartseeker |
| Re | Regen | 312 | regen |
| SV | Shadow Veil | 413 | shadowveil |
| Ab | Absorb | 421 | absorb |

### DEBUFF_SKILL_LIB

Debuff 技能库，9 个可施法 debuff + 4 个武器附加 debuff（仅用于权重计算）。

| Code | Name | ID | img | 备注 |
|------|------|----|-----|------|
| Sle | Sleep | 222 | sleep | 可施法 |
| Bl | Blind | 231 | blind | 可施法 |
| Slo | Slow | 221 | slow | 可施法 |
| Im | Imperil | 213 | imperil | 可施法 |
| MN | MagNet | 233 | magnet | 可施法 |
| Si | Silence | 232 | silence | 可施法 |
| Dr | Drain | 211 | drainhp | 可施法 |
| We | Weaken | 212 | weaken | 可施法 |
| Co | Confuse | 223 | confuse | 可施法 |
| CM | Coalesced Mana | null | coalescemana | 武器附加 |
| Stun | Stunned | null | wpn_stun | 武器附加 |
| PA | Penetrated Armor | null | wpn_ap | 武器附加 |
| BW | Bleeding Wound | null | wpn_bleed | 武器附加 |

### NAME_TO_BUFF_CODE

游戏显示名 → Buff Code 反向映射（用于 Channel 技能重施判断）。

| 显示名 | Code |
|--------|------|
| Protection | Pr |
| Spark of Life | SL |
| Spirit Shield | SS |
| Hastened | Ha |
| Arcane Focus | AF |
| Heartseeker | He |
| Regen | Re |
| Shadow Veil | SV |

注意: `BUFF_SKILL_LIB` 中 Haste 的 `name` 为 `"Haste"`，但游戏 buff 栏显示为 `"Hastened"`，且 `Absorb` 无需反向映射，因此此表不能从 `BUFF_SKILL_LIB` 自动派生。

### OFFENSIVE_SPELL_LIB

攻击魔法名称库，key 格式 `{element}{tier}` — element: 1=Fire 2=Cold 3=Elec 4=Wind 5=Holy 6=Dark; tier: 1/2/3。用于 AoE 目标选择时查询 `spellAoe` 中的目标数。

| Key | Name |
|-----|------|
| 11 | Firebolt | 12 | Fiery Blast | 13 | Inferno |
| 21 | Snowball | 22 | Freeze | 23 | Blizzard |
| 31 | Spark | 32 | Thunderbolt | 33 | Chain Lightning |
| 41 | Gust | 42 | Cyclone | 43 | Tornado |
| 51 | Smite | 52 | Banishment | 53 | Wrath |
| 61 | Corruption | 62 | Pestilence | 63 | Disintegrate |

## 核心函数

### 状态管理

| 函数 | 签名 | 说明 |
|------|------|------|
| `g` | `g(key?, value?)` | 全局状态读写器，无参返回整个状态对象 |
| `setValue` | `setValue(item, value)` | 持久化存储 (GM_setValue / localStorage) |
| `getValue` | `getValue(item, toJSON?)` | 读取持久化数据 |
| `gE` | `gE(selector, mode?, parent?)` | DOM 查询 (`"all"` 模式返回 NodeList) |
| `isOn` | `isOn(id)` | 检查技能/物品是否可用 (opacity !== 0.5) |

### Buff/Debuff 到期续施

| 函数 | 签名 | 说明 |
|------|------|------|
| `needsRecast` | `needsRecast(parent, imgSrc) → boolean` | 效果不存在或剩余 ≤ 1 回合返回 true；从 `onmouseover` 的 `battle.set_infopane_effect(name, desc, turns)` 提取剩余回合 |

被 `useBuffSkill`、`useChannelSkill` 第一步、`canApplyDebuff` 共用，替代原来的"图标存在就跳过"逻辑，消除到期空档。

### Debuff 系统

| 函数 | 签名 | 说明 |
|------|------|------|
| `canApplyDebuff` | `canApplyDebuff(monsterBuff, debuffKey) → "cast"\|"blocked"\|"skip"` | 1. `needsRecast` → 存在且剩余>1 → skip；2. 不可用 → skip；3. 槽位<6 → cast；4. 槽位满 + `debuffSkillTurnAlert` → 最后一个 debuff 剩余回合 ≥ 阈值 → cast，否则 → blocked (暂停+警报) |
| `useDeSkill` | `useDeSkill()` | 按优先级对首目标施放 debuff，使用 `canApplyDebuff` 判断 |
| `castDebuffOnAll` | `castDebuffOnAll(debuffKey)` | 遍历所有存活怪物施放指定 debuff，AoE 技能选择相邻目标 |
| `getLastBuffTurn` | `getLastBuffTurn(imgs) → number` | 从 buff 图标 onmouseover 属性提取剩余回合数 (用于槽位管理) |

Debuff 标签页 "持续 Turns" 配置用于**槽位管理**: 怪物 6 槽满时，是否值得挤掉旧 debuff。与到期续施 (`needsRecast`) 是两个独立功能。

### Buff 系统

| 函数 | 签名 | 说明 |
|------|------|------|
| `useBuffSkill` | `useBuffSkill()` | 按优先级施放 buff，`needsRecast` 判断是否需要新施/续施 |
| `useChannelSkill` | `useChannelSkill()` | Channeling 状态: 1. `needsRecast` 施放/续施 buff → 2. 通用技能 → 3. 重施即将消失的 buff |
| `useInfusions` | `useInfusions()` | 根据攻击属性自动施放对应元素灌注 |
| `checkAndActivateSpirit` | `checkAndActivateSpirit() → boolean` | 施法前检查是否需要先激活 Spirit Stance |

### 战斗核心

| 函数 | 签名 | 说明 |
|------|------|------|
| `main` | `main()` | 主循环入口，按固定顺序执行防御 → 物品 → Buff → Debuff → 攻击 |
| `attack` | `attack()` | 攻击决策：Focus → Spirit Stance → Ether Tap → 攻击魔法 → 技能 → 普攻 |
| `countMonsterHP` | `countMonsterHP()` | 扫描怪物血条计算 HP，结合 debuff 权重计算目标优先级 |
| `newRound` | `newRound()` | 新战斗初始化：统计怪物数、解析战斗类型、提取初始 HP |
| `parseAbilityPage` | `parseAbilityPage()` | 解析技能页面 `?s=Character&ss=ab`，提取各法术 AoE 目标数存入 `spellAoe` |
| `tagEndToTrue` | `tagEndToTrue()` | 设置 end 标志，中断当前回合执行 |

### 闲置竞技场

| 函数 | 签名 | 说明 |
|------|------|------|
| `idleArena` | `idleArena()` | 闲置自动挑战竞技场/擂台/GrindFest，按配置队列依次发起战斗 |
| `getToken` | `getToken(data, e)` | `idleArena` 内部函数，从 Arena/RoB/GrindFest 页面提取战斗 token |

**持久世界 vs 异世界 token 差异**:

| | 持久世界 | 异世界 |
|---|---|---|
| Arena onclick | `init_battle(id, count, 'token')` | `init_battle(id, entrycost)` |
| GrindFest onclick | `init_battle(1, 'token')` | `init_battle(1, entrycost)` |
| Token 来源 | 每按钮独立 `inittoken` | 表单级 `<input name="postoken">` |
| POST 参数 | `initid=X&inittoken=Y` | `initid=X&postoken=Y` |

`getToken` 使用嵌套可选正则 `/init_battle\((\d+)(?:,\s*\d+(?:,\s*'(.*?)')?)?\)/` 兼容两种格式：外层可选匹配 `,\d+`，内层可选匹配 `,'token'`。有引号时提取 token 字符串，无引号时存 `true` 标记可用性。异世界额外从页面 DOM 提取 `postoken`。

### 辅助系统

| 函数 | 签名 | 说明 |
|------|------|------|
| `checkCondition` | `checkCondition(parms) → boolean` | 条件评估器，支持 HP/MP/SP/Buff 等复合条件 |
| `killBug` | `killBug()` | 检测 HV 战斗 bug，自动重载 |
| `riddleAlert` | `riddleAlert()` | Riddle 页面自动答题 |
| `dropMonitor` | `dropMonitor(battleLog)` | 解析战斗日志追踪掉落物 |
| `recordUsage` | `recordUsage(parm)` | 记录每回合技能/物品使用统计 |

## 主循环调用流程

```
init()
├─ e-hentai.org → 重定向回 HV
├─ Riddle 页面 → riddleAlert()
├─ 大厅页面
│  ├─ 技能页面 (?s=Character&ss=ab) → parseAbilityPage() 自动提取法术 AoE
│  ├─ quickSite() / idleArena() / repairCheck()
│  └─ encounterCheck()
└─ 战斗页面 → reloader() → newRound() → main()

main() [每回合执行]
├─ countMonsterHP()          # 更新目标权重
├─ battleInfo()              # 显示战斗信息
├─ killBug()                 # Bug 检测
│
├─ 逃跑判断 → autoFlee
├─ 暂停判断 → autoPause
├─ useGem()                  # 宝石使用
├─ deadSoon()                # 紧急物品使用
├─ 防御判断 → defend
├─ useScroll()               # 卷轴施放
├─ useInfusions()            # 元素灌注 (仅法术模式)
│
├─ useChannelSkill()         # Channel 状态技能
├─ useBuffSkill()            # Buff 施放
├─ castDebuffOnAll("We")     # 全员 Weaken
├─ castDebuffOnAll("Im")     # 全员 Imperil
├─ useDeSkill()              # 单目标 Debuff
│
├─ attack()                  # 攻击决策
│  ├─ Focus (增加魔法命中)
│  ├─ Spirit Stance 开/关切换
│  ├─ Ether Tap 检测 (Coalesced Mana buff)
│  │
│  ├─ [法术模式] attackStatus !== 0
│  │  ├─ Channeling 检测 → 强制最高阶 (跳过条件)
│  │  ├─ 少怪降级 (≤N 只) → 仅用 T1 (Channeling 时不降级)
│  │  ├─ highSkillCondition 满足 → T3
│  │  ├─ middleSkillCondition 满足 → T2
│  │  ├─ 默认 → T1
│  │  └─ AoE 目标选择: 查询 OFFENSIVE_SPELL_LIB + spellAoe
│  │
│  ├─ [物理模式 + 技能]
│  │  ├─ 少怪降级 (≤N 只) → 跳过 OFC/FRD 全体攻击
│  │  ├─ Merciful Blow (最后回合 + 最后怪物 + HP<25% + 流血)
│  │  └─ 按 skillOrderValue 顺序: OFC → FRD → T3 → T2 → T1
│  │     (需 spiritOn + OC 足够 + 条件满足)
│  │
│  └─ 点击首目标 → 普通攻击/技能释放
│
└─ recordUsage()             # 统计记录
```

每个步骤执行后检查 `g("end")`，若为 true 则中断当前回合。

## attack() 逻辑

### 法术模式 (attackStatus 1-6)

```javascript
// Channeling 强制最高阶: 跳过条件检查，使用最高可用阶法术
// 少怪降级: 存活怪物 ≤ N 时仅用 T1 (Channeling 时不降级)
// 正常流程: highSkillCondition → T3, middleSkillCondition → T2, 默认 → T1
// AoE 目标选择: 查询 OFFENSIVE_SPELL_LIB + spellAoe, AoE≥2 时选最前目标
```

**配置项** (Spell 标签页):
- `highSkillCondition` / `middleSkillCondition`: T3/T2 施放条件
- `channelForceHighTier`: Channeling 时强制最高阶 (默认开启, `data-default-on`)
- `spellTierDowngrade` + `spellDowngradeThreshold`: 少怪降级 (默认开启, 阈值 3)

### 物理模式 (attackStatus 0)

```javascript
// 少怪降级: 存活怪物 ≤ N 时跳过 OFC/FRD/T3
// 需要 spiritOn 才能释放技能
// 按 skillOrderValue 顺序遍历, 检查条件/isOn/OC
// skillOTOS 限制每回合只释放一次指定技能
```

**配置项** (Skill 标签页):
- `physicalSkillDowngrade` + `physicalDowngradeThreshold`: 少怪降级 (默认开启, 阈值 3)
- 仅跳过 OFC/FRD (固定每目标伤害, 少怪=浪费OC); 流派技能总伤害不变, 不跳过

## 配置选项映射

所有配置存储在 `g("option")` 对象中，通过 `GM_setValue(storagePrefix + "option", ...)` 持久化。

| 分类 | 配置键 | 类型 | 说明 |
|------|--------|------|------|
| **基础** | `lang` | string | 语言: "0"=简中, "1"=繁中, "2"=英文 |
| | `attackStatus` | number | 攻击属性: -1=无, 0=物理, 1-6=元素 |
| | `fightingStyle` | string | 流派: "2"=盾战等 |
| **Buff** | `buffSkillSwitch` | boolean | 启用 Buff 自动施放 |
| | `buffSkill` | object | 各 Buff 启用开关 (key=Code) |
| | `buffSkillOrderValue` | string | Buff 施放优先级 (逗号分隔) |
| **Debuff** | `debuffSkillSwitch` | boolean | 启用 Debuff 自动施放 |
| | `debuffSkill` | object | 各 Debuff 启用开关 |
| | `debuffSkillOrderValue` | string | Debuff 施放优先级 |
| | `debuffSkillTurnAlert` | boolean | 启用槽位满检查 |
| | `debuffSkillTurn` | object | 各 Debuff 最低回合数阈值 |
| | `debuffSkillAoe` | object | AoE 宽度 (手动配置, 被 spellAoe 自动覆盖) |
| | `debuffSkillAllWk` | boolean | 启用全员 Weaken |
| | `debuffSkillAllIm` | boolean | 启用全员 Imperil |
| **攻击魔法** | `middleSkillCondition` | array[] | T2 施放条件 |
| | `highSkillCondition` | array[] | T3 施放条件 |
| | `channelForceHighTier` | boolean | Channeling 时强制最高阶 (默认开启, `data-default-on`) |
| | `spellTierDowngrade` | boolean | 少怪降级: 仅用 T1 (默认开启, `data-default-on`) |
| | `spellDowngradeThreshold` | number | 少怪降级阈值 (默认 3) |
| **技能** | `skillSwitch` | boolean | 启用技能自动释放 |
| | `skillOrderValue` | string | 技能优先级 |
| | `skillOTOS` | object | 限制每回合只释放一次 |
| | `mercifulBlow` | boolean | 盾战斩杀技 |
| | `physicalSkillDowngrade` | boolean | 少怪降级: 跳过 OFC/FRD (默认开启, `data-default-on`) |
| | `physicalDowngradeThreshold` | number | 少怪降级阈值 (默认 3) |
| **架势** | `turnOnSS` / `turnOffSS` | boolean | Spirit Stance 开/关 |
| | `preCastSS` | boolean | Buff/Debuff 前激活 Spirit |
| | `focus` | boolean | 自动 Focus |
| | `etherTap` | boolean | 自动 Ether Tap |
| **防御** | `defend` | boolean | 自动防御 |
| | `autoFlee` | boolean | 自动逃跑 |
| | `autoPause` | boolean | 自动暂停 |
| **自动检测** | `spellAoe` (GM存储) | object | 从技能页面自动解析的法术 AoE 目标数 |
| **目标** | `ruleReverse` | boolean | 反转权重 (攻击最弱目标) |
| | `weight` | object | 各 Debuff 权重修正值 |

条件数组格式: `[["hp,1,50"], ["_buffTurn,protection,1,3"]]` → HP > 50 OR Protection 剩余 > 3 回合。
