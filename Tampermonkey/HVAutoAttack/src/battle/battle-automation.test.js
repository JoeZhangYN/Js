import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleEvent, runBattleAutomation } from "./battle-automation.js";

const mocks = vi.hoisted(() => ({
  cE: vi.fn((tag) => document.createElement(tag)),
  g: vi.fn(),
  gE: vi.fn(),
  installBattleActionEventBridge: vi.fn(),
  runBattleMonitorAutomation: vi.fn(),
  runBattlePauseAutomation: vi.fn(),
  runBattleRoundStartAutomation: vi.fn(),
  runBattleTurnAutomation: vi.fn(),
  runMonsterKnowledgeAutomation: vi.fn(),
  time: vi.fn(() => 123),
}));

vi.mock("../dom/query.js", () => ({ cE: mocks.cE, gE: mocks.gE }));
vi.mock("../state/store.js", () => ({ g: mocks.g }));
vi.mock("../core/time.js", () => ({ time: mocks.time }));
vi.mock("./reloader.js", () => ({ installBattleActionEventBridge: mocks.installBattleActionEventBridge }));
vi.mock("./new-round.js", () => ({
  BattleRoundStartEvent: Object.freeze({ ROUND_STARTED: "roundStarted" }),
  runBattleRoundStartAutomation: mocks.runBattleRoundStartAutomation,
}));
vi.mock("./main-loop.js", () => ({ runBattleTurnAutomation: mocks.runBattleTurnAutomation }));
vi.mock("./pause-automation.js", () => ({
  BattlePauseEvent: Object.freeze({ TOGGLE: "toggle" }),
  runBattlePauseAutomation: mocks.runBattlePauseAutomation,
}));
vi.mock("./monster-knowledge-automation.js", () => ({
  MonsterKnowledgeEvent: Object.freeze({ BATTLE_STARTED: "battleStarted" }),
  runMonsterKnowledgeAutomation: mocks.runMonsterKnowledgeAutomation,
}));
vi.mock("../monitor/battle-monitor-automation.js", () => ({
  BattleMonitorEvent: Object.freeze({ BATTLE_STARTED: "battleStarted" }),
  runBattleMonitorAutomation: mocks.runBattleMonitorAutomation,
}));

beforeEach(() => {
  document.body.innerHTML = '<div id="battle_main"></div>';
  for (const fn of Object.values(mocks)) fn.mockClear();
  mocks.g.mockImplementation((key) => {
    if (key === "option") return { attackStatus: "magic", pauseButton: false, pauseHotkey: false };
    return undefined;
  });
  mocks.gE.mockImplementation((selector) => document.querySelector(selector));
  mocks.time.mockReturnValue(123);
});

describe("runBattleAutomation", () => {
  it("starts battle page capabilities through the event entry", () => {
    runBattleAutomation({ type: BattleEvent.PAGE_READY });

    expect(mocks.installBattleActionEventBridge).toHaveBeenCalledTimes(1);
    expect(mocks.g).toHaveBeenCalledWith("attackStatus", "magic");
    expect(mocks.g).toHaveBeenCalledWith("timeNow", 123);
    expect(mocks.g).toHaveBeenCalledWith("runSpeed", 1);
    expect(mocks.runBattleRoundStartAutomation).toHaveBeenCalledWith({ type: "roundStarted" });
    expect(mocks.runMonsterKnowledgeAutomation).toHaveBeenCalledWith({ type: "battleStarted" });
    expect(mocks.runBattleMonitorAutomation).toHaveBeenCalledWith({ type: "battleStarted" });
    expect(mocks.runBattleTurnAutomation).toHaveBeenCalledTimes(1);
  });

  it("ignores unknown events", () => {
    expect(runBattleAutomation({ type: "unknown" })).toBeUndefined();
    expect(mocks.installBattleActionEventBridge).not.toHaveBeenCalled();
  });
});
