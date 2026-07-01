import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleItemCommandEvent, runBattleItemCommand } from "./battle-item-command.js";
import { BattleSkillCommandEvent, runBattleSkillCommand } from "./battle-skill-command.js";

const mocks = vi.hoisted(() => ({
  gE: vi.fn(),
  isOn: vi.fn(),
  itemSelector: vi.fn((id) => `#item-${id}`),
  runBattleCommandEvidence: vi.fn(),
}));

vi.mock("../dom/query.js", () => ({ gE: mocks.gE, isOn: mocks.isOn }));
vi.mock("../dom/selectors.js", () => ({ itemSelector: mocks.itemSelector }));
vi.mock("./battle-command-evidence.js", () => ({
  BattleCommandEvidenceEvent: { RECORD_RESULT: "recordResult" },
  runBattleCommandEvidence: mocks.runBattleCommandEvidence,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.isOn.mockReturnValue(true);
});

describe("battle command recording failures", () => {
  function makeCommandEvidenceThrow() {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mocks.runBattleCommandEvidence.mockImplementation(() => {
      throw new Error("command evidence failed");
    });
    return warn;
  }

  it("keeps clicked skills acted when command evidence recording throws", () => {
    const skill = { click: vi.fn() };
    const warn = makeCommandEvidenceThrow();
    mocks.gE.mockReturnValue(skill);

    expect(
      runBattleSkillCommand({
        type: BattleSkillCommandEvent.CLICK_READY,
        skillId: "412",
      })
    ).toBe(true);
    expect(skill.click).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      "[HVAA] battle command evidence failed",
      expect.objectContaining({
        command: "skill.clickReady",
        result: "accepted",
        recordingError: "command evidence failed",
      })
    );
  });

  it("keeps clicked items acted when command evidence recording throws", () => {
    const item = { click: vi.fn() };
    const warn = makeCommandEvidenceThrow();
    mocks.gE.mockReturnValue(item);

    expect(runBattleItemCommand({ type: BattleItemCommandEvent.CLICK_ITEM, itemId: 12101 })).toBe(
      true
    );
    expect(item.click).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      "[HVAA] battle command evidence failed",
      expect.objectContaining({
        command: "item.clickItem",
        result: "accepted",
        recordingError: "command evidence failed",
      })
    );
  });
});
