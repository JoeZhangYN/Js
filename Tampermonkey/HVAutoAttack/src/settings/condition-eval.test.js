// Commit 2：checkCondition 纯化回归锁。
// 验证传 snap 时 isCd/buffTurn/变量比较全部吃 snapshot（不读 DOM），OR-of-AND 语义不变。
import { describe, it, expect } from "vitest";
import { checkCondition } from "./condition-eval.js";

const baseSnap = {
  hp: 50,
  mp: 80,
  oc: 100,
  skillReady: { 213: true, 221: false }, // 213 可用 / 221 在 CD
  playerEffectTurns: { protection: 3, hastespell: Infinity }, // 永续 = Infinity
};

describe("checkCondition 纯化(吃 snap)", () => {
  it("undefined parms → true", () => {
    expect(checkCondition(undefined, baseSnap)).toBe(true);
  });

  it("变量比较吃 snap[str]: hp(50) < 60 → true", () => {
    expect(checkCondition([["hp,2,60"]], baseSnap)).toBe(true);
  });

  it("变量比较: hp(50) < 40 → false", () => {
    expect(checkCondition([["hp,2,40"]], baseSnap)).toBe(false);
  });

  it("_isCd 吃 snap.skillReady: 213 可用 → isCd===0", () => {
    expect(checkCondition([["_isCd_213,5,0"]], baseSnap)).toBe(true);
  });

  it("_isCd: 221 在 CD → isCd===1", () => {
    expect(checkCondition([["_isCd_221,5,1"]], baseSnap)).toBe(true);
  });

  it("_buffTurn 吃 snap.playerEffectTurns: protection 剩 3 回合 >= 3", () => {
    expect(checkCondition([["_buffTurn_protection,3,3"]], baseSnap)).toBe(true);
  });

  it("_buffTurn 子串匹配 + 永续 Infinity > 99", () => {
    expect(checkCondition([["_buffTurn_haste,1,99"]], baseSnap)).toBe(true);
  });

  it("_buffTurn 不存在的 buff → 0", () => {
    expect(checkCondition([["_buffTurn_nonexist,5,0"]], baseSnap)).toBe(true);
  });

  it("OR-of-AND: 首组 AND 失败、次组成功 → true", () => {
    expect(checkCondition([["hp,1,90"], ["mp,1,50"]], baseSnap)).toBe(true);
  });

  it("AND 内全真 → true", () => {
    expect(checkCondition([["hp,2,60", "mp,1,50"]], baseSnap)).toBe(true);
  });

  it("AND 内一假 → 该组 false", () => {
    expect(checkCondition([["hp,2,60", "mp,1,90"]], baseSnap)).toBe(false);
  });

  it("向后兼容：空数组条件 → false（沿用 legacy）", () => {
    expect(checkCondition([], baseSnap)).toBe(false);
  });
});

describe("非门扩展(v2)", () => {
  // 前缀 "!" = 子句非门；行首 "||" = 该行并联(OR)；纯非门行 = 全局前置守卫。
  it("带状(前置守卫)：!mp,4,25 在前 + mp,4,45 → 仅 (25,45] 触发", () => {
    const band = [["!mp,4,25"], ["mp,4,45"]];
    expect(checkCondition(band, { mp: 40 })).toBe(true); // 25<40<=45 → 用
    expect(checkCondition(band, { mp: 20 })).toBe(false); // 守卫触发(mp<=25) → 顺延
    expect(checkCondition(band, { mp: 50 })).toBe(false); // 正向 mp<=45 不满足
    expect(checkCondition(band, { mp: 25 })).toBe(false); // 边界:mp<=25 守卫触发
  });

  it("纯守卫(无正向行)：未触发 → true / 触发 → false", () => {
    expect(checkCondition([["!mp,4,25"]], { mp: 30 })).toBe(true);
    expect(checkCondition([["!mp,4,25"]], { mp: 20 })).toBe(false);
  });

  it("多守卫(分行)：任一触发即整体 false", () => {
    const cfg = [["!mp,4,25"], ["!hp,2,10"], ["mp,4,45"]];
    expect(checkCondition(cfg, { mp: 40, hp: 50 })).toBe(true); // 都没触发 + 正向成立
    expect(checkCondition(cfg, { mp: 40, hp: 5 })).toBe(false); // hp<10 守卫触发
  });

  it("单行多非门(串联 AND)：仅当全部排除条件成立才触发守卫", () => {
    const cfg = [["!mp,4,25", "!hp,4,25"]];
    expect(checkCondition(cfg, { mp: 20, hp: 20 })).toBe(false); // 两者都<=25 → 触发
    expect(checkCondition(cfg, { mp: 20, hp: 90 })).toBe(true); // 仅 mp 低 → 不触发(AND)
  });

  it("混合行(局部非门,串联)：mp,1,30 AND 非(soloMonsterHpPercent<=25)", () => {
    const cfg = [["mp,1,30", "!soloMonsterHpPercent,4,25"]];
    expect(checkCondition(cfg, { mp: 40, soloMonsterHpPercent: 100 })).toBe(true); // mp>30 且 非濒死独怪
    expect(checkCondition(cfg, { mp: 40, soloMonsterHpPercent: 20 })).toBe(false); // 独怪 HP<=25 → 非门使本行假
    expect(checkCondition(cfg, { mp: 20, soloMonsterHpPercent: 100 })).toBe(false); // mp>30 不成立
  });

  it("行并联(||)：行内任一子句成立即该行 true", () => {
    const cfg = [["||", "hp,2,30", "mp,2,30"]];
    expect(checkCondition(cfg, { hp: 50, mp: 20 })).toBe(true); // mp<30
    expect(checkCondition(cfg, { hp: 50, mp: 50 })).toBe(false); // 两者都不<30
  });
});
