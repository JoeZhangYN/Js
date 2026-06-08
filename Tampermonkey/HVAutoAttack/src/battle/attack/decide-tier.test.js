// Commit 1 smoke 测试：验证 vitest + happy-dom 基建通，并顺带固定 selectSpellTier 行为。
// selectSpellTier 是 PURE 决策（只读 opt/snap），是依赖倒置后单测的典型对象。
import { describe, it, expect } from "vitest";
import { selectSpellTier } from "./decide-tier.js";

/** 最小 snap 工厂：只填 selectSpellTier 实际读到的字段。 */
function snap(over = {}) {
  return {
    attackStatus: 2, // → 法术 id 前缀 12x（id1=121 / id2=122 / id3=123）
    channeling: false,
    aliveCount: 5,
    skillReady: {},
    ...over,
  };
}

describe("selectSpellTier (smoke: 验证 vitest 基建)", () => {
  it("attackStatus=0 → 不施法 tier 0", () => {
    expect(selectSpellTier({}, snap({ attackStatus: 0 }))).toEqual({ tier: 0 });
  });

  it("少怪降级(aliveCount<=阈值) → 仅 tier1（ready 时）", () => {
    const s = snap({ aliveCount: 2, skillReady: { "121": true } });
    expect(selectSpellTier({}, s)).toEqual({ tier: 1 });
  });

  it("多怪 + 高阶 ready + 无 highSkillCondition(默认 true) → tier 3", () => {
    const s = snap({ aliveCount: 5, skillReady: { "121": true, "122": true, "123": true } });
    expect(selectSpellTier({}, s)).toEqual({ tier: 3 });
  });

  it("多怪 + 仅中阶 ready → tier 2", () => {
    const s = snap({ aliveCount: 5, skillReady: { "121": true, "122": true } });
    expect(selectSpellTier({}, s)).toEqual({ tier: 2 });
  });

  it("全不 ready → tier 0", () => {
    expect(selectSpellTier({}, snap({ skillReady: {} }))).toEqual({ tier: 0 });
  });
});
