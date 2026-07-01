import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleTargetCommandEvent, runBattleTargetCommand } from "./battle-target-command.js";

const mocks = vi.hoisted(() => ({
  gE: vi.fn(),
  runBattleSkillCommand: vi.fn(),
}));

vi.mock("../dom/query.js", () => ({ gE: mocks.gE }));
vi.mock("./battle-skill-command.js", () => ({
  BattleSkillCommandEvent: Object.freeze({ CLICK_READY: "clickReady" }),
  runBattleSkillCommand: mocks.runBattleSkillCommand,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  sessionStorage.clear();
});

describe("battle target command click failure evidence", () => {
  it("records target click failures as not acted", () => {
    const target = {
      click: vi.fn(() => {
        throw new Error("blocked");
      }),
      querySelector: vi.fn(() => null),
    };
    mocks.gE.mockReturnValue(target);

    expect(
      runBattleTargetCommand({ type: BattleTargetCommandEvent.CLICK_TARGET, targetId: 3 })
    ).toBe(false);

    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleCommand"))).toMatchObject({
      command: "target.click",
      result: "rejected",
      reason: "clickFailed",
      detail: { targetId: 3, error: "blocked" },
    });
  });
});
