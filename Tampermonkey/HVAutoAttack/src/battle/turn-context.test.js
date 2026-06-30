import { beforeEach, describe, expect, it, vi } from "vitest";
import { prepareBattleTurnContext } from "./turn-context.js";

const mocks = vi.hoisted(() => ({
  collectSnapshot: vi.fn(),
  runBattleDecisionRuntime: vi.fn(),
  runBattlePlayerVitals: vi.fn(),
  runCdRuntimeAutomation: vi.fn(),
  runOptionAutomation: vi.fn(),
}));

vi.mock("./battle-decision-runtime.js", () => ({
  BattleDecisionRuntimeEvent: Object.freeze({ READ_CURRENT: "readCurrent" }),
  runBattleDecisionRuntime: mocks.runBattleDecisionRuntime,
}));
vi.mock("./battle-player-vitals.js", () => ({
  BattlePlayerVitalsEvent: Object.freeze({ MIRROR_RUNTIME: "mirrorRuntime" }),
  runBattlePlayerVitals: mocks.runBattlePlayerVitals,
}));
vi.mock("../state/cd-tracker.js", () => ({
  CdRuntimeEvent: Object.freeze({ INCREMENT_TURN: "incrementTurn", PERSIST: "persist" }),
  runCdRuntimeAutomation: mocks.runCdRuntimeAutomation,
}));
vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({
    READ_BATTLE_ACTION_OPTIONS: "readBattleActionOptions",
    READ_FIELD: "readField",
  }),
  runOptionAutomation: mocks.runOptionAutomation,
}));
vi.mock("./snapshot.js", () => ({
  collectSnapshot: mocks.collectSnapshot,
}));

const snap = { hp: 90, mp: 80, sp: 70, oc: 60 };
const logTelemetry = { battleLog: [{ kind: "player-incoming", dmg: 10 }] };

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.collectSnapshot.mockReturnValue(snap);
  mocks.runBattleDecisionRuntime.mockReturnValue({
    monsterAlive: 3,
    roundAll: 5,
    roundNow: 2,
    roundType: "ar",
    attackStatus: 2,
    lastSpiritToggleGlobalTurn: 97,
  });
  mocks.runOptionAutomation.mockImplementation((event) => {
    if (event.type === "readBattleActionOptions") return { burstControlSwitch: false };
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

    expect(mocks.collectSnapshot).toHaveBeenCalledWith({
      learnIncomingBurst: false,
      logTelemetry: undefined,
    });
    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({ type: "readBattleActionOptions" });
    expect(mocks.runCdRuntimeAutomation).toHaveBeenNthCalledWith(1, { type: "incrementTurn" });
    expect(mocks.runCdRuntimeAutomation).toHaveBeenNthCalledWith(2, { type: "persist" });
    expect(mocks.runBattlePlayerVitals).toHaveBeenCalledWith({
      type: "mirrorRuntime",
      vitals: snap,
    });
  });

  it("attaches decision runtime facts through one runtime entry", () => {
    const prepared = prepareBattleTurnContext().snap;

    expect(prepared).toMatchObject({
      monsterAlive: 3,
      roundAll: 5,
      roundNow: 2,
      roundType: "ar",
      attackStatus: 2,
      lastSpiritToggleGlobalTurn: 97,
    });
    expect(mocks.runBattleDecisionRuntime).toHaveBeenCalledWith({ type: "readCurrent" });
  });

  it("passes the burst-control rule decision into snapshot collection", () => {
    mocks.runOptionAutomation.mockImplementation((event) => {
      if (event.type === "readBattleActionOptions") return { burstControlSwitch: true };
      if (event.type === "readField") return false;
      return undefined;
    });

    prepareBattleTurnContext({ logTelemetry });

    expect(mocks.collectSnapshot).toHaveBeenCalledWith({
      learnIncomingBurst: true,
      logTelemetry,
    });
  });

  it("reads debug snapshot through the option entry and accepts plain snapshot values", () => {
    mocks.runOptionAutomation.mockImplementation((event) => {
      if (event.type === "readBattleActionOptions") return { burstControlSwitch: false };
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
      if (event.type === "readBattleActionOptions") return { burstControlSwitch: false };
      if (event.type === "readField") return true;
      return undefined;
    });
    mocks.collectSnapshot.mockReturnValue({ hp: document.createElement("div") });

    expect(() => prepareBattleTurnContext()).toThrow("含 DOM 引用");
  });
});
