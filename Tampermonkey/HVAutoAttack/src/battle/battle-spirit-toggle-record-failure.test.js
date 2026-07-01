import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleSpiritToggleEvent,
  runBattleSpiritToggleAutomation,
} from "./battle-spirit-toggle.js";

const mocks = vi.hoisted(() => ({
  g: vi.fn(),
  gE: vi.fn(),
  isSpiritActive: vi.fn(),
  runCdRuntimeAutomation: vi.fn(() => 12),
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

describe("battle Spirit toggle record failure", () => {
  it("keeps clicked Spirit acted when cooldown recording fails", () => {
    const spirit = { click: vi.fn() };
    mocks.gE.mockReturnValue(spirit);
    mocks.g.mockImplementation((key, value) => {
      if (value !== undefined) throw new Error("cooldown write failed");
      return 7;
    });

    expect(
      runBattleSpiritToggleAutomation({ type: BattleSpiritToggleEvent.CLICK_AND_RECORD })
    ).toBe(true);

    expect(spirit.click).toHaveBeenCalledTimes(1);
    expect(mocks.runBattleCommandEvidence).toHaveBeenCalledWith({
      type: "recordResult",
      command: "spirit.clickAndRecord",
      result: "accepted",
      reason: "clicked",
      detail: { toggleRecordError: "cooldown write failed" },
    });
  });
});
