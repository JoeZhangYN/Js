import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleItemCommandEvent, runBattleItemCommand } from "./battle-item-command.js";
import { BattleSkillCommandEvent, runBattleSkillCommand } from "./battle-skill-command.js";

const mocks = vi.hoisted(() => ({
  gE: vi.fn(),
  isOn: vi.fn(),
  itemSelector: vi.fn((id) => `#item-${id}`),
  runDiagnosticConsoleAutomation: vi.fn(),
  runBattleCommandEvidence: vi.fn(),
}));

vi.mock("../dom/query.js", () => ({ gE: mocks.gE, isOn: mocks.isOn }));
vi.mock("../dom/selectors.js", () => ({ itemSelector: mocks.itemSelector }));
vi.mock("../core/diagnostic-console.js", () => ({
  DiagnosticConsoleEvent: Object.freeze({ WARN: "warn" }),
  runDiagnosticConsoleAutomation: mocks.runDiagnosticConsoleAutomation,
}));
vi.mock("./battle-command-evidence.js", () => ({
  BattleCommandEvidenceEvent: { RECORD_RESULT: "recordResult" },
  runBattleCommandEvidence: mocks.runBattleCommandEvidence,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.isOn.mockReturnValue(true);
  mocks.runDiagnosticConsoleAutomation.mockReturnValue(true);
});

describe("battle command recording failures", () => {
  function makeCommandEvidenceThrow() {
    mocks.runBattleCommandEvidence.mockImplementation(() => {
      throw new Error("command evidence failed");
    });
  }

  it("keeps clicked skills acted when command evidence recording throws", () => {
    const skill = { click: vi.fn() };
    makeCommandEvidenceThrow();
    mocks.gE.mockReturnValue(skill);

    expect(
      runBattleSkillCommand({
        type: BattleSkillCommandEvent.CLICK_READY,
        skillId: "412",
      })
    ).toBe(true);
    expect(skill.click).toHaveBeenCalledTimes(1);
    expect(mocks.runDiagnosticConsoleAutomation).toHaveBeenCalledWith({
      type: "warn",
      args: [
        "[HVAA] battle command evidence failed",
        expect.objectContaining({
          command: "skill.clickReady",
          result: "accepted",
          recordingError: "command evidence failed",
        }),
      ],
    });
  });

  it("keeps clicked skills acted when command evidence recording and typed warning both fail", () => {
    const skill = { click: vi.fn() };
    mocks.gE.mockReturnValue(skill);
    mocks.runDiagnosticConsoleAutomation.mockReturnValue(false);
    mocks.runBattleCommandEvidence.mockImplementation(() => {
      throw new Error("command evidence failed");
    });

    let result;
    expect(() => {
      result = runBattleSkillCommand({
        type: BattleSkillCommandEvent.CLICK_READY,
        skillId: "412",
      });
    }).not.toThrow();

    expect(result).toBe(true);
    expect(skill.click).toHaveBeenCalledTimes(1);
  });

  it("keeps clicked items acted when command evidence recording throws", () => {
    const item = { click: vi.fn() };
    makeCommandEvidenceThrow();
    mocks.gE.mockReturnValue(item);

    expect(runBattleItemCommand({ type: BattleItemCommandEvent.CLICK_ITEM, itemId: 12101 })).toBe(
      true
    );
    expect(item.click).toHaveBeenCalledTimes(1);
    expect(mocks.runDiagnosticConsoleAutomation).toHaveBeenCalledWith({
      type: "warn",
      args: [
        "[HVAA] battle command evidence failed",
        expect.objectContaining({
          command: "item.clickItem",
          result: "accepted",
          recordingError: "command evidence failed",
        }),
      ],
    });
  });
});
