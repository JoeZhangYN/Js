// 深度B：decideCriticalBuff 回归锁（纯决策，喂 explicit facts+opt 断言 ActionResult）。
import { describe, it, expect } from "vitest";
import { CriticalBuffDecisionEvent, runCriticalBuffDecision } from "./decide-critical-buff.js";

/** 最小 facts 工厂（只填 decideCriticalBuff 读到的字段）。 */
function facts(over = {}) {
  return {
    manaPercent: 10,
    playerEffects: [],
    ...over,
  };
}

function decide(opt, facts) {
  return runCriticalBuffDecision({ type: CriticalBuffDecisionEvent.DECIDE, opt, ...facts });
}

const OPT_ON = {
  pauseOnCriticalBuffExpire: true,
  criticalBuffsList: "Spark of Life, Spirit Shield",
  criticalBuffMinTurns: 2,
  criticalBuffMpFloor: 30,
};

describe("decideCriticalBuff gate（未命中 → noop）", () => {
  it("pauseOnCriticalBuffExpire 关 → noop", () => {
    const s = facts({ playerEffects: [{ img: "", name: "Spark of Life", turns: 1 }] });
    expect(decide({ ...OPT_ON, pauseOnCriticalBuffExpire: false }, s)).toEqual({
      kind: "noop",
    });
  });

  it("criticalBuffsList 空 → noop", () => {
    const s = facts({ playerEffects: [{ img: "", name: "Spark of Life", turns: 1 }] });
    expect(decide({ ...OPT_ON, criticalBuffsList: "" }, s)).toEqual({ kind: "noop" });
  });

  it("MP 充足（>= mpFloor）→ noop（自动续 buff 大概率成功）", () => {
    const s = facts({
      manaPercent: 50,
      playerEffects: [{ img: "", name: "Spark of Life", turns: 1 }],
    });
    expect(decide(OPT_ON, s)).toEqual({ kind: "noop" });
  });

  it("MP 缺省（undefined → 100）→ noop", () => {
    const s = facts({
      manaPercent: undefined,
      playerEffects: [{ img: "", name: "Spark of Life", turns: 1 }],
    });
    expect(decide(OPT_ON, s)).toEqual({ kind: "noop" });
  });

  it("无匹配 buff 名 → noop", () => {
    const s = facts({ playerEffects: [{ img: "", name: "Haste", turns: 1 }] });
    expect(decide(OPT_ON, s)).toEqual({ kind: "noop" });
  });

  it("匹配但回合数 > minTurns（buff 还很久）→ noop", () => {
    const s = facts({ playerEffects: [{ img: "", name: "Spark of Life", turns: 5 }] });
    expect(decide(OPT_ON, s)).toEqual({ kind: "noop" });
  });

  it("永续 buff（turns=Infinity）→ noop（不算即将消失）", () => {
    const s = facts({ playerEffects: [{ img: "", name: "Spark of Life", turns: Infinity }] });
    expect(decide(OPT_ON, s)).toEqual({ kind: "noop" });
  });

  it("playerEffects 空 → noop", () => {
    expect(decide(OPT_ON, facts())).toEqual({ kind: "noop" });
  });
});

describe("decideCriticalBuff 命中 → critical-pause", () => {
  it("entry maps snap facts internally", () => {
    expect(
      runCriticalBuffDecision({
        type: CriticalBuffDecisionEvent.DECIDE,
        opt: OPT_ON,
        snap: {
          mp: 10,
          playerEffects: [{ img: "", name: "Spark of Life", turns: 1 }],
        },
      })
    ).toEqual({
      kind: "critical-pause",
      name: "Spark of Life",
      turns: 1,
      mp: 10,
      mpFloor: 30,
    });
  });

  it("匹配 buff + turns<=minTurns + MP<mpFloor → critical-pause", () => {
    const s = facts({
      manaPercent: 10,
      playerEffects: [{ img: "", name: "Spark of Life", turns: 1 }],
    });
    expect(decide(OPT_ON, s)).toEqual({
      kind: "critical-pause",
      name: "Spark of Life",
      turns: 1,
      mp: 10,
      mpFloor: 30,
    });
  });

  it("turns 恰等于 minTurns（边界 <=）→ 命中", () => {
    const s = facts({
      manaPercent: 10,
      playerEffects: [{ img: "", name: "Spirit Shield", turns: 2 }],
    });
    expect(decide(OPT_ON, s)).toMatchObject({
      kind: "critical-pause",
      name: "Spirit Shield",
      turns: 2,
    });
  });

  it("缺省阈值（minTurns=2/mpFloor=30）下命中", () => {
    const opt = { pauseOnCriticalBuffExpire: true, criticalBuffsList: "Spark of Life" };
    const s = facts({
      manaPercent: 20,
      playerEffects: [{ img: "", name: "Spark of Life", turns: 2 }],
    });
    expect(decide(opt, s)).toEqual({
      kind: "critical-pause",
      name: "Spark of Life",
      turns: 2,
      mp: 20,
      mpFloor: 30,
    });
  });

  it("多 buff 取第一个命中的", () => {
    const s = facts({
      manaPercent: 10,
      playerEffects: [
        { img: "", name: "Haste", turns: 1 }, // 不在 list
        { img: "", name: "Spark of Life", turns: 8 }, // 在 list 但回合够
        { img: "", name: "Spirit Shield", turns: 1 }, // 命中
      ],
    });
    expect(decide(OPT_ON, s)).toMatchObject({
      kind: "critical-pause",
      name: "Spirit Shield",
      turns: 1,
    });
  });

  it("rejects unknown critical buff decision events", () => {
    expect(runCriticalBuffDecision({ type: "unknown", opt: OPT_ON, ...facts() })).toEqual({
      kind: "noop",
    });
  });
});
