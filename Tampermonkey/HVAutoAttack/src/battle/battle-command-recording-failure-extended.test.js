import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleDefendCommandEvent, runBattleDefendCommand } from "./battle-defend-command.js";
import { BattleFleeCommandEvent, runBattleFleeCommand } from "./battle-flee-command.js";
import { BattleFocusCommandEvent, runBattleFocusCommand } from "./battle-focus-command.js";
import {
  BattleSpiritToggleEvent,
  runBattleSpiritToggleAutomation,
} from "./battle-spirit-toggle.js";
import { BattleTargetCommandEvent, runBattleTargetCommand } from "./battle-target-command.js";

const mocks = vi.hoisted(() => ({
  g: vi.fn(),
  gE: vi.fn(),
  isOn: vi.fn(),
  isSpiritActive: vi.fn(),
  runBattleCommandEvidence: vi.fn(),
  runCdRuntimeAutomation: vi.fn(),
  runNavigationAutomation: vi.fn(),
}));

vi.mock("../core/navigate.js", () => ({
  NavigationEvent: { SCHEDULE_RELOAD: "scheduleReload" },
  NavigationReloadReason: { FLEE_CONFIRMATION: "fleeConfirmation" },
  runNavigationAutomation: mocks.runNavigationAutomation,
}));
vi.mock("../dom/query.js", () => ({
  gE: mocks.gE,
  isOn: mocks.isOn,
  isSpiritActive: mocks.isSpiritActive,
}));
vi.mock("../state/cd-tracker.js", () => ({
  CdRuntimeEvent: { READ_GLOBAL_TURN: "readGlobalTurn" },
  runCdRuntimeAutomation: mocks.runCdRuntimeAutomation,
}));
vi.mock("../state/store.js", () => ({ g: mocks.g }));
vi.mock("./battle-command-evidence.js", () => ({
  BattleCommandEvidenceEvent: { RECORD_RESULT: "recordResult" },
  runBattleCommandEvidence: mocks.runBattleCommandEvidence,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.isOn.mockReturnValue(true);
  mocks.isSpiritActive.mockReturnValue(false);
  mocks.runCdRuntimeAutomation.mockReturnValue(14);
  mocks.runNavigationAutomation.mockReturnValue(1);
});

function makeCommandEvidenceThrow() {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  mocks.runBattleCommandEvidence.mockImplementation(() => {
    throw new Error("command evidence failed");
  });
  return warn;
}

function expectRecordingWarning(warn, command) {
  expect(warn).toHaveBeenCalledWith(
    "[HVAA] battle command evidence failed",
    expect.objectContaining({
      command,
      result: "accepted",
      recordingError: "command evidence failed",
    })
  );
}

describe("battle command recording failures for accepted commands", () => {
  it("keeps clicked focus acted when command evidence recording throws", () => {
    const focus = { click: vi.fn() };
    const warn = makeCommandEvidenceThrow();
    mocks.gE.mockReturnValue(focus);

    expect(runBattleFocusCommand({ type: BattleFocusCommandEvent.CLICK })).toBe(true);

    expect(focus.click).toHaveBeenCalledTimes(1);
    expectRecordingWarning(warn, "focus.click");
  });

  it("keeps clicked defend acted when command evidence recording throws", () => {
    const defend = { click: vi.fn() };
    const warn = makeCommandEvidenceThrow();
    mocks.gE.mockReturnValue(defend);

    expect(runBattleDefendCommand({ type: BattleDefendCommandEvent.CLICK })).toBe(true);

    expect(defend.click).toHaveBeenCalledTimes(1);
    expectRecordingWarning(warn, "defend.click");
  });

  it("keeps clicked target acted when command evidence recording throws", () => {
    const target = { click: vi.fn(), querySelector: vi.fn(() => null) };
    const warn = makeCommandEvidenceThrow();
    mocks.gE.mockReturnValue(target);

    expect(
      runBattleTargetCommand({ type: BattleTargetCommandEvent.CLICK_TARGET, targetId: 3 })
    ).toBe(true);

    expect(target.click).toHaveBeenCalledTimes(1);
    expectRecordingWarning(warn, "target.click");
  });

  it("keeps clicked flee acted when command evidence recording throws", () => {
    const flee = { click: vi.fn() };
    const warn = makeCommandEvidenceThrow();
    mocks.gE.mockReturnValue(flee);

    expect(runBattleFleeCommand({ type: BattleFleeCommandEvent.CLICK_AND_RELOAD })).toBe(true);

    expect(flee.click).toHaveBeenCalledTimes(1);
    expect(mocks.runNavigationAutomation).toHaveBeenCalledOnce();
    expectRecordingWarning(warn, "flee.clickAndReload");
  });

  it("keeps clicked spirit acted when command evidence recording throws", () => {
    const spirit = { click: vi.fn() };
    const warn = makeCommandEvidenceThrow();
    mocks.gE.mockReturnValue(spirit);

    expect(
      runBattleSpiritToggleAutomation({ type: BattleSpiritToggleEvent.CLICK_AND_RECORD })
    ).toBe(true);

    expect(spirit.click).toHaveBeenCalledTimes(1);
    expectRecordingWarning(warn, "spirit.clickAndRecord");
  });
});
