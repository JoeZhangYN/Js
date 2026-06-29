import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeChannel } from "./execute-channel.js";

const mocks = vi.hoisted(() => ({
  runBattleSkillCommand: vi.fn(),
}));

vi.mock("../battle-skill-command.js", () => ({
  BattleSkillCommandEvent: Object.freeze({ CLICK_READY: "clickReady" }),
  runBattleSkillCommand: mocks.runBattleSkillCommand,
}));

beforeEach(() => {
  mocks.runBattleSkillCommand.mockReset();
});

describe("executeChannel", () => {
  it("routes channel skill clicks through the skill command entry and claims the channel branch", () => {
    mocks.runBattleSkillCommand.mockReturnValue(false);

    expect(executeChannel({ type: "click", skillId: "412" })).toBe(true);

    expect(mocks.runBattleSkillCommand).toHaveBeenCalledWith({
      type: "clickReady",
      skillId: "412",
    });
  });
});
