import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleDefendCommandEvent, runBattleDefendCommand } from "./battle-defend-command.js";

const mocks = vi.hoisted(() => ({
  attemptClick: vi.fn(),
  runBattleCommandEvidence: vi.fn(),
}));

vi.mock("../dom/attempt-click.js", () => ({ attemptClick: mocks.attemptClick }));
vi.mock("./battle-command-evidence.js", () => ({
  BattleCommandEvidenceEvent: Object.freeze({ RECORD_RESULT: "recordResult" }),
  runBattleCommandEvidence: mocks.runBattleCommandEvidence,
}));

beforeEach(() => {
  mocks.attemptClick.mockReset();
  mocks.runBattleCommandEvidence.mockReset();
});

describe("runBattleDefendCommand", () => {
  it("clicks Defend through one command entry", () => {
    mocks.attemptClick.mockReturnValue(true);

    expect(runBattleDefendCommand({ type: BattleDefendCommandEvent.CLICK })).toBe(true);

    expect(mocks.attemptClick).toHaveBeenCalledWith("#ckey_defend");
    expect(mocks.runBattleCommandEvidence).toHaveBeenCalledWith({
      type: "recordResult",
      command: "defend.click",
      result: "accepted",
      reason: "clicked",
    });
  });

  it("returns false when Defend is unavailable", () => {
    mocks.attemptClick.mockReturnValue(false);

    expect(runBattleDefendCommand({ type: BattleDefendCommandEvent.CLICK })).toBe(false);
    expect(mocks.runBattleCommandEvidence).toHaveBeenCalledWith({
      type: "recordResult",
      command: "defend.click",
      result: "rejected",
      reason: "defendUnavailable",
    });
  });
});
