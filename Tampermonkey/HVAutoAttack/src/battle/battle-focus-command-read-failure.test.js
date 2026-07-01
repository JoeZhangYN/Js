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

describe("runBattleFocusCommand DOM read failures", () => {
  it("records Focus button read failures as not acted", () => {
    mocks.gE.mockImplementation(() => {
      throw new Error("focus read exploded");
    });

    expect(runBattleFocusCommand({ type: BattleFocusCommandEvent.CLICK })).toBe(false);

    expect(mocks.runBattleCommandEvidence).toHaveBeenCalledWith({
      type: "recordResult",
      command: "focus.click",
      result: "rejected",
      reason: "focusElementReadFailed",
      detail: { error: "focus read exploded" },
    });
  });
});
