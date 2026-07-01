import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleFocusCommandEvent, runBattleFocusCommand } from "./battle-focus-command.js";

const mocks = vi.hoisted(() => ({
  gE: vi.fn(),
  runBattleCommandEvidence: vi.fn(),
}));

vi.mock("../dom/query.js", () => ({ gE: mocks.gE }));
vi.mock("./battle-command-evidence.js", () => ({
  BattleCommandEvidenceEvent: Object.freeze({ RECORD_RESULT: "recordResult" }),
  runBattleCommandEvidence: mocks.runBattleCommandEvidence,
}));

beforeEach(() => {
  mocks.gE.mockReset();
  mocks.runBattleCommandEvidence.mockReset();
});

describe("runBattleFocusCommand", () => {
  it("clicks Focus through one command entry", () => {
    const focus = { click: vi.fn() };
    mocks.gE.mockReturnValue(focus);

    expect(runBattleFocusCommand({ type: BattleFocusCommandEvent.CLICK })).toBe(true);

    expect(mocks.gE).toHaveBeenCalledWith("#ckey_focus");
    expect(focus.click).toHaveBeenCalledTimes(1);
    expect(mocks.runBattleCommandEvidence).toHaveBeenCalledWith({
      type: "recordResult",
      command: "focus.click",
      result: "accepted",
      reason: "clicked",
    });
  });

  it("reports missing Focus without throwing", () => {
    mocks.gE.mockReturnValue(null);

    expect(runBattleFocusCommand({ type: BattleFocusCommandEvent.CLICK })).toBe(false);
    expect(mocks.runBattleCommandEvidence).toHaveBeenCalledWith({
      type: "recordResult",
      command: "focus.click",
      result: "rejected",
      reason: "focusMissing",
      detail: undefined,
    });
  });

  it("records Focus click failures as not acted", () => {
    const focus = {
      click: vi.fn(() => {
        throw new Error("blocked");
      }),
    };
    mocks.gE.mockReturnValue(focus);

    expect(runBattleFocusCommand({ type: BattleFocusCommandEvent.CLICK })).toBe(false);

    expect(mocks.runBattleCommandEvidence).toHaveBeenCalledWith({
      type: "recordResult",
      command: "focus.click",
      result: "rejected",
      reason: "clickFailed",
      detail: { error: "blocked" },
    });
  });

  it("records unknown Focus events as not acted", () => {
    expect(runBattleFocusCommand({ type: "unknown" })).toBe(false);

    expect(mocks.gE).not.toHaveBeenCalled();
    expect(mocks.runBattleCommandEvidence).toHaveBeenCalledWith({
      type: "recordResult",
      command: "focus.click",
      result: "rejected",
      reason: "unknownFocusCommand",
      detail: { eventType: "unknown" },
    });
  });

  it("records null Focus events as not acted", () => {
    expect(runBattleFocusCommand(null)).toBe(false);

    expect(mocks.gE).not.toHaveBeenCalled();
    expect(mocks.runBattleCommandEvidence).toHaveBeenCalledWith({
      type: "recordResult",
      command: "focus.click",
      result: "rejected",
      reason: "unknownFocusCommand",
      detail: { eventType: null },
    });
  });
});
