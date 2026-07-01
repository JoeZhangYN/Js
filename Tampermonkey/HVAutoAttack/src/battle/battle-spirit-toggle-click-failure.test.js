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

describe("battle spirit toggle click failure evidence", () => {
  it("records Spirit click failures as not acted without recording cooldown", () => {
    const spirit = {
      click: vi.fn(() => {
        throw new Error("blocked");
      }),
    };
    mocks.gE.mockReturnValue(spirit);

    expect(
      runBattleSpiritToggleAutomation({ type: BattleSpiritToggleEvent.CLICK_AND_RECORD })
    ).toBe(false);

    expect(mocks.runCdRuntimeAutomation).not.toHaveBeenCalled();
    expect(mocks.g).not.toHaveBeenCalled();
    expect(mocks.runBattleCommandEvidence).toHaveBeenCalledWith({
      type: "recordResult",
      command: "spirit.clickAndRecord",
      result: "rejected",
      reason: "clickFailed",
      detail: { error: "blocked" },
    });
  });
});
