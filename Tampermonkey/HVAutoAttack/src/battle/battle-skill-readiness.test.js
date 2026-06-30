import { beforeEach, describe, expect, it } from "vitest";
import { BattleSkillReadinessEvent, runBattleSkillReadiness } from "./battle-skill-readiness.js";

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("runBattleSkillReadiness", () => {
  it("reads known battle skill button readiness through one entry", () => {
    document.body.innerHTML = `
      <button id="111"></button>
      <button id="213" style="opacity: 0.5"></button>
      <button id="1111" style="opacity: 1"></button>
      <button id="not-a-skill"></button>
    `;

    expect(
      runBattleSkillReadiness({ type: BattleSkillReadinessEvent.READ_READY_MAP })
    ).toMatchObject({
      111: true,
      213: false,
      1111: true,
    });
    expect(
      runBattleSkillReadiness({ type: BattleSkillReadinessEvent.READ_READY_MAP })
    ).not.toHaveProperty("not-a-skill");
  });

  it("returns an empty readiness map for unknown events", () => {
    expect(runBattleSkillReadiness({ type: "unknown" })).toEqual({});
  });
});
