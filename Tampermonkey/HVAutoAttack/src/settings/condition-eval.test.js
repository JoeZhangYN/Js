// Commit 2：checkCondition 纯化回归锁。
// 验证传 snap 时 isCd/buffTurn/变量比较全部吃 snapshot（不读 DOM），OR-of-AND 语义不变。
import { describe, it, expect } from "vitest";
import { checkCondition } from "./condition-eval.js";

const baseSnap = {
  hp: 50,
  mp: 80,
  oc: 100,
  skillReady: { "213": true, "221": false }, // 213 可用 / 221 在 CD
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
});
