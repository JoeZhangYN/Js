import { beforeEach, describe, expect, it, vi } from "vitest";
import { prepareBattleTurnContext } from "./turn-context.js";

const mocks = vi.hoisted(() => ({
  collectSnapshot: vi.fn(),
  g: vi.fn(),
  runBattleRoundAutomation: vi.fn(),
  runBattleSpiritToggleAutomation: vi.fn(),
  runCdRuntimeAutomation: vi.fn(),
  runMonsterStatusAutomation: vi.fn(),
  runOptionAutomation: vi.fn(),
}));

vi.mock("./battle-round.js", () => ({
  BattleRoundEvent: Object.freeze({
    READ_RUNTIME: "readRuntime",
    READ_TYPE: "readType",
  }),
  runBattleRoundAutomation: mocks.runBattleRoundAutomation,
}));
vi.mock("./battle-spirit-toggle.js", () => ({
  BattleSpiritToggleEvent: Object.freeze({ READ_LAST_TOGGLE: "readLastToggle" }),
  runBattleSpiritToggleAutomation: mocks.runBattleSpiritToggleAutomation,
}));
vi.mock("../state/cd-tracker.js", () => ({
  CdRuntimeEvent: Object.freeze({ INCREMENT_TURN: "incrementTurn", PERSIST: "persist" }),
  runCdRuntimeAutomation: mocks.runCdRuntimeAutomation,
}));
vi.mock("./monster-status-automation.js", () => ({
  MonsterStatusEvent: Object.freeze({ READ_COMBATANT_COUNTS: "readCombatantCounts" }),
  runMonsterStatusAutomation: mocks.runMonsterStatusAutomation,
}));
vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));
vi.mock("../state/store.js", () => ({ g: mocks.g }));
vi.mock("./snapshot.js", () => ({
  collectSnapshot: mocks.collectSnapshot,
}));

const snap = { hp: 90, mp: 80, sp: 70, oc: 60 };

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.collectSnapshot.mockReturnValue(snap);
  mocks.g.mockImplementation((key, value) => {
    if (value !== undefined) return undefined;
    return undefined;
  });
  mocks.runBattleRoundAutomation.mockImplementation((event) => {
    if (event.type === "readRuntime") return { roundNow: 2, roundAll: 5, roundLeft: 3 };
    if (event.type === "readType") return "ar";
    return null;
  });
  mocks.runMonsterStatusAutomation.mockReturnValue({
    monsterAll: 4,
    monsterAlive: 3,
    bossAll: 1,
    bossAlive: 1,
  });
  mocks.runBattleSpiritToggleAutomation.mockReturnValue(97);
  mocks.runOptionAutomation.mockReturnValue(false);
});

describe("prepareBattleTurnContext", () => {
  it("prepares one turn context through the entry", () => {
    expect(prepareBattleTurnContext()).toBe(snap);

    expect(mocks.runCdRuntimeAutomation).toHaveBeenNthCalledWith(1, { type: "incrementTurn" });
    expect(mocks.runCdRuntimeAutomation).toHaveBeenNthCalledWith(2, { type: "persist" });
    expect(mocks.g).toHaveBeenCalledWith("hp", 90);
    expect(mocks.g).toHaveBeenCalledWith("mp", 80);
    expect(mocks.g).toHaveBeenCalledWith("sp", 70);
    expect(mocks.g).toHaveBeenCalledWith("oc", 60);
  });

  it("attaches decision runtime facts through capability entries", () => {
    const prepared = prepareBattleTurnContext();

    expect(prepared).toMatchObject({
      monsterAlive: 3,
      roundAll: 5,
      roundNow: 2,
      roundType: "ar",
      lastSpiritToggleGlobalTurn: 97,
    });
    expect(mocks.runBattleRoundAutomation).toHaveBeenCalledWith({ type: "readRuntime" });
    expect(mocks.runBattleRoundAutomation).toHaveBeenCalledWith({ type: "readType" });
    expect(mocks.runMonsterStatusAutomation).toHaveBeenCalledWith({
      type: "readCombatantCounts",
    });
    expect(mocks.runBattleSpiritToggleAutomation).toHaveBeenCalledWith({
      type: "readLastToggle",
    });
  });

  it("reads debug snapshot through the option entry and accepts plain snapshot values", () => {
    mocks.runOptionAutomation.mockReturnValue(true);

    prepareBattleTurnContext();

    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "debugSnapshot",
      fallback: false,
    });
  });

  it("rejects DOM references when debug snapshot checking is enabled", () => {
    mocks.runOptionAutomation.mockReturnValue(true);
    mocks.collectSnapshot.mockReturnValue({ hp: document.createElement("div") });

    expect(() => prepareBattleTurnContext()).toThrow("含 DOM 引用");
  });
});
