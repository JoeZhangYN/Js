import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleSpiritToggleEvent,
  runBattleSpiritToggleAutomation,
} from "./battle-spirit-toggle.js";

const mocks = vi.hoisted(() => ({
  g: vi.fn(),
  gE: vi.fn(),
  isSpiritActive: vi.fn(),
  runCdRuntimeAutomation: vi.fn(),
  runBattleCommandEvidence: vi.fn(),
}));

vi.mock("../dom/query.js", () => ({ gE: mocks.gE, isSpiritActive: mocks.isSpiritActive }));
vi.mock("../state/store.js", () => ({ g: mocks.g }));
vi.mock("../state/cd-tracker.js", () => ({
  CdRuntimeEvent: Object.freeze({ READ_GLOBAL_TURN: "readGlobalTurn" }),
  runCdRuntimeAutomation: mocks.runCdRuntimeAutomation,
}));
vi.mock("./battle-command-evidence.js", () => ({
  BattleCommandEvidenceEvent: Object.freeze({ RECORD_RESULT: "recordResult" }),
  runBattleCommandEvidence: mocks.runBattleCommandEvidence,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.runCdRuntimeAutomation.mockReturnValue(12);
});

describe("battle Spirit toggle read failure evidence", () => {
  it("records Spirit button read failures as not acted", () => {
    mocks.gE.mockImplementation(() => {
      throw new Error("button read failed");
    });

    expect(
      runBattleSpiritToggleAutomation({ type: BattleSpiritToggleEvent.CLICK_AND_RECORD })
    ).toBe(false);

    expect(mocks.runCdRuntimeAutomation).not.toHaveBeenCalled();
    expect(mocks.g).not.toHaveBeenCalled();
    expect(mocks.runBattleCommandEvidence).toHaveBeenCalledWith({
      type: "recordResult",
      command: "spirit.clickAndRecord",
      result: "rejected",
      reason: "spiritElementReadFailed",
      detail: { error: "button read failed" },
    });
  });

  it("records Spirit active-state read failures as not acted", () => {
    const spirit = { click: vi.fn() };
    mocks.gE.mockReturnValue(spirit);
    mocks.isSpiritActive.mockImplementation(() => {
      throw new Error("active read failed");
    });

    expect(
      runBattleSpiritToggleAutomation({
        type: BattleSpiritToggleEvent.ACTIVATE_IF_INACTIVE,
      })
    ).toBe(false);

    expect(spirit.click).not.toHaveBeenCalled();
    expect(mocks.runCdRuntimeAutomation).not.toHaveBeenCalled();
    expect(mocks.runBattleCommandEvidence).toHaveBeenCalledWith({
      type: "recordResult",
      command: "spirit.activateIfInactive",
      result: "rejected",
      reason: "spiritActiveReadFailed",
      detail: { error: "active read failed" },
    });
  });

  it("returns inactive when Spirit status reading fails", () => {
    const spirit = {};
    mocks.gE.mockReturnValue(spirit);
    mocks.isSpiritActive.mockImplementation(() => {
      throw new Error("active read failed");
    });

    expect(runBattleSpiritToggleAutomation({ type: BattleSpiritToggleEvent.READ_ACTIVE })).toBe(
      false
    );
    expect(mocks.runBattleCommandEvidence).not.toHaveBeenCalled();
  });
});
