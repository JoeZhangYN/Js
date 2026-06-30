import { describe, expect, it, vi } from "vitest";
import { runBattleActionDecision } from "./battle-action-decision.js";

const mocks = vi.hoisted(() => ({
  runRules: vi.fn(),
}));

vi.mock("./step-runner.js", () => ({ runRules: mocks.runRules }));
vi.mock("./rules/index.js", () => ({ BATTLE_RULES: [{ name: "testRule" }] }));

describe("runBattleActionDecision", () => {
  it("owns the battle rule order and runner protocol", () => {
    const snap = { hp: 70 };
    const battleRuleOptions = { autoFlee: false };

    runBattleActionDecision(snap, battleRuleOptions);

    expect(mocks.runRules).toHaveBeenCalledWith([{ name: "testRule" }], snap, battleRuleOptions);
  });
});
