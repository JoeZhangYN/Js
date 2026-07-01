import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleActionEffectDispatchEvent,
  runBattleActionEffectDispatch,
} from "./battle-action-effect-dispatch.js";

const mocks = vi.hoisted(() => ({
  readBattleCommandEvidence: vi.fn(),
  runBattleSkillCommand: vi.fn(),
}));

vi.mock("./battle-command-evidence.js", () => ({
  readBattleCommandEvidence: mocks.readBattleCommandEvidence,
}));

vi.mock("./battle-skill-command.js", () => ({
  BattleSkillCommandEvent: Object.freeze({ CLICK_READY: "clickReady" }),
  runBattleSkillCommand: mocks.runBattleSkillCommand,
}));

beforeEach(() => {
  window.sessionStorage.clear();
  mocks.readBattleCommandEvidence.mockReset();
  mocks.runBattleSkillCommand.mockReset();
});

describe("battle action effect command evidence read failures", () => {
  it("keeps acted command effects acted when command evidence reads throw", () => {
    mocks.readBattleCommandEvidence.mockImplementation(() => {
      throw new Error("command evidence read failed");
    });
    mocks.runBattleSkillCommand.mockReturnValue(true);

    expect(
      runBattleActionEffectDispatch({
        type: BattleActionEffectDispatchEvent.APPLY_ACTION_RESULT,
        result: { kind: "skill-command", skillId: 111 },
      })
    ).toBe(true);

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleActionEffect"))).toMatchObject({
      result: { kind: "skill-command", skillId: 111 },
      acted: true,
      knownResultKind: true,
      failureReason: null,
      commandEvidenceReadError: "command evidence read failed",
    });
  });
});
