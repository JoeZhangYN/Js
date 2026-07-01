import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleDefendCommandEvent, runBattleDefendCommand } from "./battle-defend-command.js";

const mocks = vi.hoisted(() => ({
  gE: vi.fn(),
  isOn: vi.fn(),
  runBattleCommandEvidence: vi.fn(),
}));

vi.mock("../dom/query.js", () => ({ gE: mocks.gE, isOn: mocks.isOn }));
vi.mock("./battle-command-evidence.js", () => ({
  BattleCommandEvidenceEvent: Object.freeze({ RECORD_RESULT: "recordResult" }),
  runBattleCommandEvidence: mocks.runBattleCommandEvidence,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
});

describe("runBattleDefendCommand DOM read failures", () => {
  it("records Defend readiness read failures as not acted", () => {
    mocks.isOn.mockImplementation(() => {
      throw new Error("defend readiness exploded");
    });

    expect(runBattleDefendCommand({ type: BattleDefendCommandEvent.CLICK })).toBe(false);

    expect(mocks.gE).not.toHaveBeenCalled();
    expect(mocks.runBattleCommandEvidence).toHaveBeenCalledWith({
      type: "recordResult",
      command: "defend.click",
      result: "rejected",
      reason: "defendReadinessReadFailed",
      detail: { error: "defend readiness exploded" },
    });
  });

  it("records Defend element read failures as not acted", () => {
    mocks.isOn.mockReturnValue(true);
    mocks.gE.mockImplementation(() => {
      throw new Error("defend read exploded");
    });

    expect(runBattleDefendCommand({ type: BattleDefendCommandEvent.CLICK })).toBe(false);

    expect(mocks.runBattleCommandEvidence).toHaveBeenCalledWith({
      type: "recordResult",
      command: "defend.click",
      result: "rejected",
      reason: "defendElementReadFailed",
      detail: { error: "defend read exploded" },
    });
  });
});
