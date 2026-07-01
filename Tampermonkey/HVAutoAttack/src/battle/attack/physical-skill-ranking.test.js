// 6B-1：pickByUtility 纯选择回归锁(选最高分 >0,无副作用)。
import { describe, it, expect, vi } from "vitest";
import { PhysicalSkillRankingEvent, runPhysicalSkillRanking } from "./physical-skill-ranking.js";

function pickByUtility(candidates, options = {}) {
  return runPhysicalSkillRanking({
    type: PhysicalSkillRankingEvent.PICK_BY_UTILITY,
    candidates,
    options,
  });
}

function aoeScore(baseScore, aliveCount) {
  return runPhysicalSkillRanking({
    type: PhysicalSkillRankingEvent.AOE_SCORE,
    baseScore,
    aliveCount,
  });
}

describe("pickByUtility", () => {
  it("选最高分候选", () => {
    const w = pickByUtility([
      { code: "T1", score: 40 },
      { code: "OFC", score: 100 },
      { code: "T2", score: 60 },
    ]);
    expect(w.code).toBe("OFC");
  });

  it("score=0 视为不可用,被排除", () => {
    const w = pickByUtility([
      { code: "OFC", score: 0 },
      { code: "T1", score: 40 },
    ]);
    expect(w.code).toBe("T1");
  });

  it("全 0 → null", () => {
    expect(
      pickByUtility([
        { code: "a", score: 0 },
        { code: "b", score: 0 },
      ])
    ).toBeNull();
  });

  it("空候选 → null", () => {
    expect(pickByUtility([])).toBeNull();
  });

  it("不执行副作用(纯选择,无 dispatch 调用)", () => {
    let called = false;
    const w = pickByUtility([{ code: "x", score: 10, dispatch: () => (called = true) }]);
    expect(w.code).toBe("x");
    expect(called).toBe(false);
  });

  it("aoeScore = base × max(1, aliveCount)", () => {
    expect(aoeScore(100, 3)).toBe(300);
    expect(aoeScore(100, 0)).toBe(100);
  });

  it("默认不打 debug log，保持纯选择安静", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    pickByUtility([
      { code: "T1", score: 40 },
      { code: "OFC", score: 100, explain: "aoe" },
    ]);

    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it("debugLog:true 时输出 utility debug logging", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    pickByUtility(
      [
        { code: "T1", score: 40 },
        { code: "OFC", score: 100, explain: "aoe" },
      ],
      { debugLog: true }
    );

    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("[physical-skill-ranking] OFC score=100")
    );
    log.mockRestore();
  });

  it("rejects unknown physical skill ranking events", () => {
    expect(runPhysicalSkillRanking({ type: "unknown", candidates: [{ code: "OFC", score: 100 }] })).toBeNull();
    expect(runPhysicalSkillRanking(null)).toBeNull();
  });
});
