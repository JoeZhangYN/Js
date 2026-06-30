import { beforeEach, describe, expect, it, vi } from "vitest";
import { prepareBattleTurnContext } from "./turn-context.js";

const mocks = vi.hoisted(() => ({
  collectSnapshot: vi.fn(),
  g: vi.fn(),
  runBattleProgressAutomation: vi.fn(),
  runBattleStartRuntimeAutomation: vi.fn(),
  runBattleSpiritToggleAutomation: vi.fn(),
  runCdRuntimeAutomation: vi.fn(),
  runOptionAutomation: vi.fn(),
}));

vi.mock("./battle-progress.js", () => ({
  BattleProgressEvent: Object.freeze({ READ_CONTEXT: "readContext" }),
  runBattleProgressAutomation: mocks.runBattleProgressAutomation,
}));
vi.mock("./battle-start-runtime.js", () => ({
  BattleStartRuntimeEvent: Object.freeze({ READ_ATTACK_STATUS: "readAttackStatus" }),
  runBattleStartRuntimeAutomation: mocks.runBattleStartRuntimeAutomation,
}));
vi.mock("./battle-spirit-toggle.js", () => ({
  BattleSpiritToggleEvent: Object.freeze({ READ_LAST_TOGGLE: "readLastToggle" }),
  runBattleSpiritToggleAutomation: mocks.runBattleSpiritToggleAutomation,
}));
vi.mock("../state/cd-tracker.js", () => ({
  CdRuntimeEvent: Object.freeze({ INCREMENT_TURN: "incrementTurn", PERSIST: "persist" }),
  runCdRuntimeAutomation: mocks.runCdRuntimeAutomation,
}));
vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({
    READ_BATTLE_RULE_OPTIONS: "readBattleRuleOptions",
    READ_FIELD: "readField",
  }),
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
  mocks.runBattleProgressAutomation.mockReturnValue({
    monsterAlive: 3,
    roundAll: 5,
    roundNow: 2,
    roundType: "ar",
  });
  mocks.runBattleStartRuntimeAutomation.mockReturnValue(2);
  mocks.runBattleSpiritToggleAutomation.mockReturnValue(97);
  mocks.runOptionAutomation.mockImplementation((event) => {
    if (event.type === "readBattleRuleOptions") return { burstControlSwitch: false };
    if (event.type === "readField") return false;
    return undefined;
  });
});

describe("prepareBattleTurnContext", () => {
  it("prepares one turn context through the entry", () => {
    expect(prepareBattleTurnContext()).toEqual({
      snap,
      actionOptions: { burstControlSwitch: false },
    });

    expect(mocks.collectSnapshot).toHaveBeenCalledWith({ learnIncomingBurst: false });
    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({ type: "readBattleRuleOptions" });
    expect(mocks.runCdRuntimeAutomation).toHaveBeenNthCalledWith(1, { type: "incrementTurn" });
    expect(mocks.runCdRuntimeAutomation).toHaveBeenNthCalledWith(2, { type: "persist" });
    expect(mocks.g).toHaveBeenCalledWith("hp", 90);
    expect(mocks.g).toHaveBeenCalledWith("mp", 80);
    expect(mocks.g).toHaveBeenCalledWith("sp", 70);
    expect(mocks.g).toHaveBeenCalledWith("oc", 60);
  });

  it("attaches decision runtime facts through battle progress entry", () => {
    const prepared = prepareBattleTurnContext().snap;

    expect(prepared).toMatchObject({
      monsterAlive: 3,
      roundAll: 5,
      roundNow: 2,
      roundType: "ar",
      attackStatus: 2,
      lastSpiritToggleGlobalTurn: 97,
    });
    expect(mocks.runBattleProgressAutomation).toHaveBeenCalledWith({ type: "readContext" });
    expect(mocks.runBattleStartRuntimeAutomation).toHaveBeenCalledWith({
      type: "readAttackStatus",
    });
    expect(mocks.runBattleSpiritToggleAutomation).toHaveBeenCalledWith({
      type: "readLastToggle",
    });
  });

  it("passes the burst-control rule decision into snapshot collection", () => {
    mocks.runOptionAutomation.mockImplementation((event) => {
      if (event.type === "readBattleRuleOptions") return { burstControlSwitch: true };
      if (event.type === "readField") return false;
      return undefined;
    });

    prepareBattleTurnContext();

    expect(mocks.collectSnapshot).toHaveBeenCalledWith({ learnIncomingBurst: true });
  });

  it("reads debug snapshot through the option entry and accepts plain snapshot values", () => {
    mocks.runOptionAutomation.mockImplementation((event) => {
      if (event.type === "readBattleRuleOptions") return { burstControlSwitch: false };
      if (event.type === "readField") return true;
      return undefined;
    });

    prepareBattleTurnContext();

    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "debugSnapshot",
      fallback: false,
    });
  });

  it("rejects DOM references when debug snapshot checking is enabled", () => {
    mocks.runOptionAutomation.mockImplementation((event) => {
      if (event.type === "readBattleRuleOptions") return { burstControlSwitch: false };
      if (event.type === "readField") return true;
      return undefined;
    });
    mocks.collectSnapshot.mockReturnValue({ hp: document.createElement("div") });

    expect(() => prepareBattleTurnContext()).toThrow("含 DOM 引用");
  });
});
