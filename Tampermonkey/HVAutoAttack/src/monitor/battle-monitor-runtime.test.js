import { describe, expect, it, vi } from "vitest";
import { BattleMonitorRuntimeEvent, runBattleMonitorRuntime } from "./battle-monitor-runtime.js";

const deps = (values) => ({
  g: vi.fn((key) => values[key]),
  readTurn: vi.fn(() => values.turn),
  readOptionField: vi.fn((key, fallback) => {
    const option = values.option || {};
    return option[key] !== undefined ? option[key] : fallback;
  }),
});

describe("runBattleMonitorRuntime", () => {
  it("reads report start context from one monitor runtime query", () => {
    const runtime = deps({ option: { recordEach: true }, roundType: "ar", roundAll: 5 });

    expect(
      runBattleMonitorRuntime({ type: BattleMonitorRuntimeEvent.REPORT_START_CONTEXT }, runtime)
    ).toEqual({ recordEach: true, roundType: "ar", roundAll: 5 });
    expect(runtime.readOptionField).toHaveBeenCalledWith("recordEach", false);
  });

  it("reads archive and usage completion context consistently", () => {
    const runtime = deps({
      option: { recordEach: true, recordUsage: true },
      roundNow: 2,
      roundAll: 2,
      monsterAll: 4,
      bossAll: 1,
    });

    expect(
      runBattleMonitorRuntime({ type: BattleMonitorRuntimeEvent.USAGE_COMPLETION_CONTEXT }, runtime)
    ).toEqual({
      recordEach: true,
      recordUsage: true,
      roundNow: 2,
      roundAll: 2,
      monsterAll: 4,
      bossAll: 1,
    });
    expect(runtime.readOptionField).toHaveBeenCalledWith("recordEach", false);
    expect(runtime.readOptionField).toHaveBeenCalledWith("recordUsage", false);
  });

  it("reads drop completion context from the same monitor runtime query", () => {
    const runtime = deps({
      option: { recordEach: true, dropMonitor: true, dropQuality: 3 },
      roundNow: 4,
      roundAll: 5,
    });

    expect(
      runBattleMonitorRuntime({ type: BattleMonitorRuntimeEvent.DROP_COMPLETION_CONTEXT }, runtime)
    ).toEqual({
      recordEach: true,
      dropMonitor: true,
      dropQuality: 3,
      roundNow: 4,
      roundAll: 5,
    });
    expect(runtime.readOptionField).toHaveBeenCalledWith("recordEach", false);
    expect(runtime.readOptionField).toHaveBeenCalledWith("dropMonitor", false);
    expect(runtime.readOptionField).toHaveBeenCalledWith("dropQuality", 0);
  });

  it("reads battle HUD context from one monitor runtime query", () => {
    const runtime = deps({
      attackStatus: 1,
      monsterAlive: 2,
      monsterAll: 3,
      roundAll: 5,
      roundNow: 4,
      roundType: "ar",
      runSpeed: 1.5,
      turn: 12,
    });

    expect(
      runBattleMonitorRuntime({ type: BattleMonitorRuntimeEvent.HUD_CONTEXT }, runtime)
    ).toEqual({
      attackStatus: 1,
      monsterAlive: 2,
      monsterAll: 3,
      roundAll: 5,
      roundNow: 4,
      roundType: "ar",
      runSpeed: 1.5,
      turn: 12,
    });
    expect(runtime.readTurn).toHaveBeenCalledTimes(1);
  });
});
