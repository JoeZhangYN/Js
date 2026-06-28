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

    expect(deps.write).toHaveBeenCalledWith("attackStatus", "magic");
    expect(deps.readOptionField).toHaveBeenCalledWith("attackStatus");
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
    ).toBe("magic");

    expect(deps.read).toHaveBeenCalledWith("attackStatus");
  });

  it("rejects unknown events", () => {
    expect(runBattleStartRuntimeAutomation({ type: "unknown" })).toBe(false);
  });

  it("reads battle start runtime options through the option entry on the default path", () => {
    mocks.runOptionAutomation.mockReturnValue("melee");

    expect(runBattleStartRuntimeAutomation({ type: BattleStartRuntimeEvent.BATTLE_STARTED })).toBe(
      true
    );

    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "attackStatus",
      fallback: undefined,
    });
    expect(mocks.g).toHaveBeenCalledWith("attackStatus", "melee");
    expect(mocks.runBattleActionSpeedAutomation).toHaveBeenCalledWith({
      type: "battleStarted",
    });
  });
});
