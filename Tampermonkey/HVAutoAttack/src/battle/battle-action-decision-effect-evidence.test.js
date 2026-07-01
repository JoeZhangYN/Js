import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleActionDecisionEvent, runBattleActionDecision } from "./battle-action-decision.js";

beforeEach(() => {
  document.body.innerHTML = "";
  window.sessionStorage.clear();
});

describe("battle action decision effect evidence bridge", () => {
  it("carries fresh effect command failure evidence into the decision step", () => {
    const skill = document.createElement("div");
    skill.id = "213";
    skill.style.opacity = "1";
    skill.click = vi.fn();
    document.body.appendChild(skill);
    const target = document.createElement("div");
    target.id = "mkey_1";
    target.innerHTML = '<img src="x/nbardead.png">';
    target.click = vi.fn();
    document.body.appendChild(target);

    expect(
      runBattleActionDecision({
        type: BattleActionDecisionEvent.DECIDE,
        context: {
          snap: {
            skillReady: { 213: true },
            view: [{ id: 1, order: 0, isDead: false, isBoss: true, buffs: [] }],
          },
          actionOptions: {},
        },
      })
    ).toBe(false);

    const decision = JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleActionDecision"));
    expect(decision.steps[2]).toMatchObject({
      capability: "offensiveDebuff",
      acted: false,
      failureReason: "targetDead",
      effect: {
        knownResultKind: true,
        failureReason: "targetDead",
        command: {
          command: "target.clickSkillThenTarget",
          acted: false,
          failureReason: "targetDead",
        },
      },
    });
  });
});
