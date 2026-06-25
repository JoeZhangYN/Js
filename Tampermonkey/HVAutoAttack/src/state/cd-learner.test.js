// F3 回归锁：CD 收敛学习器。钉死「学习只下拉、永不上调」安全不变量 + 各守卫 + 消费方夹。
import { describe, it, expect, beforeEach } from "vitest";
import { g } from "./store.js";
import { recordCdFire, finalizeCdPending, getLearnedCd } from "./cd-learner.js";
import { turnsUntilReady } from "./cd-tracker.js";

const fire = (code, id, globalTurn) => recordCdFire(code, id, { globalTurn });
const settle = (globalTurn, readyId) =>
  finalizeCdPending({ globalTurn, skillReady: readyId ? { [readyId]: true } : {} });

beforeEach(() => {
  localStorage.clear();
  g("cdLearnPending", {});
  g("globalTurn", 0);
  g("skillLastUsed", {});
  g("option", {});
});

describe("cd-learner 学习与守卫", () => {
  it("脱灰 gap < cdBase → 学到更短 CD（OFC 50→25）", () => {
    fire("OFC", "1111", 10);
    settle(35, "1111"); // gap 25 < 50
    expect(getLearnedCd("OFC")).toBeCloseTo(25, 5);
  });

  it("gap > cdBase（OC 饿膨胀）→ clamp 到 cdBase，永不上调", () => {
    fire("OFC", "1111", 10);
    settle(70, "1111"); // gap 60 > 50 → sample clamp 50
    expect(getLearnedCd("OFC")).toBeLessThanOrEqual(50);
    expect(getLearnedCd("OFC")).toBeCloseTo(50, 5);
  });

  it("同回合 gap<=0 → 不学（fallback cdBase）", () => {
    fire("OFC", "1111", 10);
    settle(10, "1111");
    expect(getLearnedCd("OFC")).toBe(50);
  });

  it("仍灰 → 续等，后续脱灰才结算", () => {
    fire("OFC", "1111", 10);
    settle(35, null); // skillReady 空 → 仍灰
    expect(getLearnedCd("OFC")).toBe(50);
    settle(40, "1111"); // gap 30
    expect(getLearnedCd("OFC")).toBeCloseTo(30, 5);
  });

  it("陈旧测量 gap > 3×cdBase → 弃，不学", () => {
    fire("OFC", "1111", 10);
    settle(200, "1111"); // gap 190 > 150 → 弃
    expect(getLearnedCd("OFC")).toBe(50);
  });

  it("EWMA：连续 gap=20 收敛到 20（OFC）", () => {
    for (let t = 0; t < 6; t++) {
      fire("OFC", "1111", t * 100);
      settle(t * 100 + 20, "1111");
    }
    expect(getLearnedCd("OFC")).toBeCloseTo(20, 0);
  });

  it("按 code 键：fightingStyle 变（id 2202→2102）学习连续", () => {
    fire("T2", "2202", 0);
    settle(3, "2202"); // gap 3 < cdBase 5 → 学 3
    expect(getLearnedCd("T2")).toBeCloseTo(3, 5);
    fire("T2", "2102", 100); // 风格切换 id 变，code 仍 T2
    settle(102, "2102"); // gap 2 → n=2 alpha 0.5: 3*.5+2*.5=2.5
    expect(getLearnedCd("T2")).toBeCloseTo(2.5, 5);
  });

  it("未知 code → 0（无 entry）", () => {
    expect(getLearnedCd("NOPE")).toBe(0);
  });
});

describe("turnsUntilReady 用学习 CD（夹 Math.min cdBase）", () => {
  it("学到 OFC=20 → 开火 10 回合后剩 10（用 20 而非 50）", () => {
    fire("OFC", "1111", 0);
    settle(20, "1111"); // 学 20
    g("skillLastUsed", { OFC: 100 });
    g("globalTurn", 110);
    expect(turnsUntilReady("OFC")).toBe(10); // min(20,50)-10
  });

  it("未学习 → 退 cdBase 50（开火 10 回合后剩 40）", () => {
    g("skillLastUsed", { OFC: 100 });
    g("globalTurn", 110);
    expect(turnsUntilReady("OFC")).toBe(40);
  });
});
