import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleStartRuntimeEvent,
  runBattleStartRuntimeAutomation,
} from "./battle-start-runtime.js";

const mocks = vi.hoisted(() => ({
  g: vi.fn(),
  runBattleActionSpeedAutomation: vi.fn(),
  runOptionAutomation: vi.fn(),
}));

vi.mock("../state/store.js", () => ({ g: mocks.g }));
vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));
vi.mock("./battle-action-speed.js", () => ({
  BattleActionSpeedEvent: Object.freeze({ BATTLE_STARTED: "battleStarted" }),
  runBattleActionSpeedAutomation: mocks.runBattleActionSpeedAutomation,
}));

beforeEach(() => {
  sessionStorage.clear();
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.runOptionAutomation.mockReturnValue({});
});

describe("runBattleStartRuntimeAutomation", () => {
  it("initializes battle runtime attack mode and action speed", () => {
    const deps = {
      readOptionField: vi.fn(() => "magic"),
      read: vi.fn(),
      write: vi.fn(),
      startSpeed: vi.fn(),
    };

    expect(
      runBattleStartRuntimeAutomation({ type: BattleStartRuntimeEvent.BATTLE_STARTED }, deps)
    ).toBe(true);

    expect(deps.write).toHaveBeenCalledWith("attackStatus", 0);
    expect(deps.readOptionField).toHaveBeenCalledWith("attackStatus", 0);
    expect(deps.startSpeed).toHaveBeenCalledTimes(1);
  });

  it("reads current attack mode through the runtime entry", () => {
    const deps = {
      readOptionField: vi.fn(),
      read: vi.fn(() => "magic"),
      write: vi.fn(),
      startSpeed: vi.fn(),
    };

    expect(
      runBattleStartRuntimeAutomation({ type: BattleStartRuntimeEvent.READ_ATTACK_STATUS }, deps)
    ).toBe(0);

    expect(deps.read).toHaveBeenCalledWith("attackStatus");
  });

  it("rejects unknown events without touching start runtime state", () => {
    const deps = {
      readOptionField: vi.fn(),
      read: vi.fn(),
      write: vi.fn(),
      startSpeed: vi.fn(),
    };

    expect(runBattleStartRuntimeAutomation({ type: "unknown" }, deps)).toBe(false);

    expect(deps.readOptionField).not.toHaveBeenCalled();
    expect(deps.read).not.toHaveBeenCalled();
    expect(deps.write).not.toHaveBeenCalled();
    expect(deps.startSpeed).not.toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleLifecycle"))).toMatchObject({
      phase: "unknownStartRuntimeEvent",
      result: false,
      steps: [{ reason: "unknownStartRuntimeEvent", eventType: "unknown" }],
    });
  });

  it("rejects null events without touching start runtime state", () => {
    const deps = {
      readOptionField: vi.fn(),
      read: vi.fn(),
      write: vi.fn(),
      startSpeed: vi.fn(),
    };

    expect(runBattleStartRuntimeAutomation(null, deps)).toBe(false);

    expect(deps.readOptionField).not.toHaveBeenCalled();
    expect(deps.read).not.toHaveBeenCalled();
    expect(deps.write).not.toHaveBeenCalled();
    expect(deps.startSpeed).not.toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleLifecycle"))).toMatchObject({
      phase: "unknownStartRuntimeEvent",
      result: false,
      steps: [{ reason: "unknownStartRuntimeEvent", eventType: null }],
    });
  });

  it("reads battle start runtime options through the option entry on the default path", () => {
    mocks.runOptionAutomation.mockReturnValue("melee");

    expect(runBattleStartRuntimeAutomation({ type: BattleStartRuntimeEvent.BATTLE_STARTED })).toBe(
      true
    );

    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "attackStatus",
      fallback: 0,
    });
    expect(mocks.g).toHaveBeenCalledWith("attackStatus", 0);
    expect(mocks.runBattleActionSpeedAutomation).toHaveBeenCalledWith({
      type: "battleStarted",
    });
  });

  it("normalizes numeric attack status before writing and reading runtime state", () => {
    const deps = {
      readOptionField: vi.fn(() => "2"),
      read: vi.fn(() => "5"),
      write: vi.fn(),
      startSpeed: vi.fn(),
    };

    expect(
      runBattleStartRuntimeAutomation({ type: BattleStartRuntimeEvent.BATTLE_STARTED }, deps)
    ).toBe(true);
    expect(
      runBattleStartRuntimeAutomation({ type: BattleStartRuntimeEvent.READ_ATTACK_STATUS }, deps)
    ).toBe(5);

    expect(deps.write).toHaveBeenCalledWith("attackStatus", 2);
  });
});
