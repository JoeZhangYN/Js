import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleDefendCommandEvent, runBattleDefendCommand } from "./battle-defend-command.js";

const mocks = vi.hoisted(() => ({
  attemptClick: vi.fn(),
}));

vi.mock("../dom/attempt-click.js", () => ({ attemptClick: mocks.attemptClick }));

beforeEach(() => {
  mocks.attemptClick.mockReset();
});

describe("runBattleDefendCommand", () => {
  it("clicks Defend through one command entry", () => {
    mocks.attemptClick.mockReturnValue(true);

    expect(runBattleDefendCommand({ type: BattleDefendCommandEvent.CLICK })).toBe(true);

    expect(mocks.attemptClick).toHaveBeenCalledWith("#ckey_defend");
  });

  it("returns false when Defend is unavailable", () => {
    mocks.attemptClick.mockReturnValue(false);

    expect(runBattleDefendCommand({ type: BattleDefendCommandEvent.CLICK })).toBe(false);
  });
});
