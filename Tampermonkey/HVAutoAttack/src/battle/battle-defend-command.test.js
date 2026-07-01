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

describe("runBattleDefendCommand", () => {
  it("clicks Defend through one command entry", () => {
    const defend = { click: vi.fn() };
    mocks.isOn.mockReturnValue(true);
    mocks.gE.mockReturnValue(defend);

    expect(runBattleDefendCommand({ type: BattleDefendCommandEvent.CLICK })).toBe(true);

    expect(mocks.isOn).toHaveBeenCalledWith("#ckey_defend");
    expect(mocks.gE).toHaveBeenCalledWith("#ckey_defend");
    expect(defend.click).toHaveBeenCalledTimes(1);
    expect(mocks.runBattleCommandEvidence).toHaveBeenCalledWith({
      type: "recordResult",
      command: "defend.click",
      result: "accepted",
      reason: "clicked",
    });
  });

  it("returns false when Defend is unavailable", () => {
    mocks.isOn.mockReturnValue(false);

    expect(runBattleDefendCommand({ type: BattleDefendCommandEvent.CLICK })).toBe(false);
    expect(mocks.gE).not.toHaveBeenCalled();
    expect(mocks.runBattleCommandEvidence).toHaveBeenCalledWith({
      type: "recordResult",
      command: "defend.click",
      result: "rejected",
      reason: "defendUnavailable",
      detail: undefined,
    });
  });

  it("records Defend click failures as not acted", () => {
    const defend = {
      click: vi.fn(() => {
        throw new Error("blocked");
      }),
    };
    mocks.isOn.mockReturnValue(true);
    mocks.gE.mockReturnValue(defend);

    expect(runBattleDefendCommand({ type: BattleDefendCommandEvent.CLICK })).toBe(false);

    expect(mocks.runBattleCommandEvidence).toHaveBeenCalledWith({
      type: "recordResult",
      command: "defend.click",
      result: "rejected",
      reason: "clickFailed",
      detail: { error: "blocked" },
    });
  });

  it("records unknown Defend events as not acted", () => {
    expect(runBattleDefendCommand({ type: "unknown" })).toBe(false);

    expect(mocks.isOn).not.toHaveBeenCalled();
    expect(mocks.gE).not.toHaveBeenCalled();
    expect(mocks.runBattleCommandEvidence).toHaveBeenCalledWith({
      type: "recordResult",
      command: "defend.click",
      result: "rejected",
      reason: "unknownDefendCommand",
      detail: { eventType: "unknown" },
    });
  });

  it("records null Defend events as not acted", () => {
    expect(runBattleDefendCommand(null)).toBe(false);

    expect(mocks.isOn).not.toHaveBeenCalled();
    expect(mocks.gE).not.toHaveBeenCalled();
    expect(mocks.runBattleCommandEvidence).toHaveBeenCalledWith({
      type: "recordResult",
      command: "defend.click",
      result: "rejected",
      reason: "unknownDefendCommand",
      detail: { eventType: null },
    });
  });
});
