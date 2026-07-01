import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleFleeCommandEvent, runBattleFleeCommand } from "./battle-flee-command.js";

const mocks = vi.hoisted(() => ({
  gE: vi.fn(),
  runNavigationAutomation: vi.fn(),
  runBattleCommandEvidence: vi.fn(),
}));

vi.mock("../dom/query.js", () => ({ gE: mocks.gE }));
vi.mock("../core/navigate.js", () => ({
  NavigationEvent: Object.freeze({ SCHEDULE_RELOAD: "scheduleReload" }),
  NavigationReloadReason: Object.freeze({ FLEE_CONFIRMATION: "fleeConfirmation" }),
  runNavigationAutomation: mocks.runNavigationAutomation,
}));
vi.mock("./battle-command-evidence.js", () => ({
  BattleCommandEvidenceEvent: Object.freeze({ RECORD_RESULT: "recordResult" }),
  runBattleCommandEvidence: mocks.runBattleCommandEvidence,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
});

describe("runBattleFleeCommand DOM read failures", () => {
  it("records Flee button read failures as not acted without scheduling reload", () => {
    mocks.gE.mockImplementation(() => {
      throw new Error("flee read exploded");
    });

    expect(runBattleFleeCommand({ type: BattleFleeCommandEvent.CLICK_AND_RELOAD })).toBe(false);

    expect(mocks.runNavigationAutomation).not.toHaveBeenCalled();
    expect(mocks.runBattleCommandEvidence).toHaveBeenCalledWith({
      type: "recordResult",
      command: "flee.clickAndReload",
      result: "rejected",
      reason: "fleeElementReadFailed",
      detail: { error: "flee read exploded" },
    });
  });
});
