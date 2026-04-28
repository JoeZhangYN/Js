# HVAutoAttack

HentaiVerse 自动战斗 Tampermonkey 脚本（多文件重构版）。

## 项目结构

- `src/` — 源文件（阶段 1 时全部在 `src/main.js`，后续阶段渐进拆分）
- `scripts/` — 构建期校验脚本（SLOC / metadata / postbuild）
- `types/` — IDE-only TypeScript 类型声明（不参与构建）
- `dist/` — 构建产物 `HVAutoAttack.user.js`（git-ignore）
- `vite.config.js` — vite-plugin-monkey 配置（**红线**：`@name`/`@namespace` 不能改）
- `../legacy/[HV]AutoAttack.legacy.js` — 重构前原始单文件，永不删除

## 开发

需要 Node.js ≥ 20。包管理器 npm / pnpm / yarn 任选，下方示例用 npm。

```bash
npm install             # 一次性安装依赖
npm run build           # 出 dist/HVAutoAttack.user.js
npm run dev             # vite dev server (实验性，见下方注意事项)
npm run lint            # 跑 eslint
npm run format          # prettier 格式化
npm run check           # lint + format check + SLOC gate
```

## 安装到 Tampermonkey

1. `pnpm build` 产出 `dist/HVAutoAttack.user.js`
2. 在浏览器拖入 / 在 Tampermonkey 后台粘贴安装
3. **首次替换旧版**前请在浏览器控制台备份 GM 数据：
   ```js
   Object.keys(localStorage).filter(k=>k.startsWith('hvAA_')).reduce((a,k)=>(a[k]=localStorage[k],a),{})
   ```
4. 由于 `@name="[HV]AutoAttack"` 和 `@namespace="https://github.com/dodying/"` 与原脚本完全一致，GM 存储自动继承

## 注释剥离说明

vite + esbuild 默认在 AST 解析时剥离 JSDoc 块注释。Phase 1 的 dist 比原脚本小 ~12 KB（156KB vs 168KB），全部来自注释。**运行时行为完全等价**。

源文件 `src/main.js` 注释保留；后续 Phase 2-5 拆出的小模块文件（≤150 SLOC）会带 JSDoc。

## Dev mode 注意

vite-plugin-monkey 的 dev mode 会注入 `@require http://localhost:5173/...`：
- HV 是 https，浏览器会因 mixed-content 拦截 → 需 vite 起自签 https，或在 `http://alt.hentaiverse.org/` 调试
- Tampermonkey 设置 → 安全 → 修改的脚本来源里加 `localhost`
- **当前阶段（Phase 1）建议**：用 `pnpm build` + 手动重装；dev mode 留待后续阶段

## 红线

| 字段 | 值 | 改动后果 |
|------|----|---------|
| `@name` | `[HV]AutoAttack` | 改 → GM 存储 namespace 漂移 → 用户配置全丢 |
| `@namespace` | `https://github.com/dodying/` | 同上 |
| `storagePrefix` | `hvAA_` / `hvAA_isekai_` | 改 → 持久化 key 前缀变 → 数据读不到 |

阶段 1-5 期间这三个值绝对不动。

## 重构进度

阶段路线图见 `C:\Users\<user>\.claude\plans\glistening-yawning-nygaard.md`。

- [x] Phase 0：冻结基线（`pre-refactor-baseline` git tag + `legacy/` 副本）
- [x] Phase 1：项目骨架 + 字节级一致打包
- [x] Phase 2：抽离纯数据 + 工具
- [x] Phase 3：抽离 UI 层
- [x] Phase 4：抽离战斗业务模块
- [x] Phase 5 chunk A：foundation（types.js / step-runner.js / schema.js + main() runSteps）
- [x] **Phase 5b-1**：BattleSnapshot 层 + universal cd-tracker（23 fixed-CD 技能）
- [x] **Phase 5b-2 wave 1**：3 hot spot L1 切割（useBuffSkill / castDebuffOnAll / attack 决策）
- [x] **Phase 5b-3 wave 2 partial**：useGem / useInfusions / useDeSkill L1 切割
- [x] **Phase 5b-5**：OFC/FRD 智能跳过 debuff 优化 + boss-aware（boss 存活时 Imperil 不跳过；单点 boss-Imperil 即使 AllIm 未勾选）
- [x] **Phase 5b 收尾**：文档同步 + R1-R9 验收清单
- [ ] Phase 5b-3 残余：useScroll / useChannelSkill / deadSoon（DOM 耦合复杂，可工作不需重构）
- [ ] Phase 5b-4：render.js schema-driven（延后，高风险 UI 重构）

## 架构（Phase 5b 末状态）

```
src/
├── core/types.js                       # ActionResult / BattleSnapshot / MonsterFacts / CdMap typedef
├── state/
│   ├── store.js                        # g() + tagEndToTrue
│   └── cd-tracker.js                   # SKILL_REGISTRY + globalTurn + skillLastUsed
├── battle/
│   ├── snapshot.js                     # collectSnapshot：每 turn 入口一次性 batch DOM 读
│   ├── step-runner.js                  # runSteps：13 step 数组顺序执行
│   ├── main-loop.js                    # main() + shouldSkipForBigSkill (5b-5)
│   ├── buff/
│   │   ├── decide-buff.js              # PURE: (opt, snap) → ActionResult
│   │   └── execute-buff.js             # SHELL: snap collect + decide + dispatch
│   ├── debuff/
│   │   ├── decide-cast-all.js          # PURE: 全员 debuff 决策
│   │   └── execute-cast-all.js         # SHELL: alert-and-pause + click-skill-then-target
│   └── attack/
│       ├── decide-tier.js              # PURE: 法术阶选择
│       └── decide-skill.js             # PURE: 物理技能 OFC/FRD/T1-T3 选择
└── ...
```

**3 铁律强制**（snapshot 层）：
1. snapshot 只存值（plain object），禁 DOM 引用
2. snapshot 生命周期 = 当前 turn 内
3. dispatch 副作用用 selector 字符串重查询，不缓存引用
