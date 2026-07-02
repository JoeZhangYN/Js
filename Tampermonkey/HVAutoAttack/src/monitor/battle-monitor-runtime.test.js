import { describe, expect, it, vi } from "vitest";
import { BattleMonitorRuntimeEvent, runBattleMonitorRuntime } from "./battle-monitor-runtime.js";

const deps = (values) => ({
  g: vi.fn((key) => values[key]),
  readAttackStatus: vi.fn(() => values.attackStatus),
  readBattleProgress: vi.fn(() => ({
    bossAll: values.bossAll,
    monsterAlive: values.monsterAlive,
    monsterAll: values.monsterAll,
    roundAll: values.roundAll,
    roundNow: values.roundNow,
    roundType: values.roundType,
    ...values.progress,
  })),
  readRunSpeed: vi.fn(() => values.runSpeed),
  readTurn: vi.fn(() => values.turn),
  readOptionField: vi.fn((key, fallback) => {
    const option = values.option || {};
    return option[key] !== undefined ? option[key] : fallback;
  }),
});

describe("runBattleMonitorRuntime", () => {
  it("rejects unknown and null runtime events without reading runtime context", () => {
    const runtime = deps({ option: { recordEach: true }, roundNow: 1, roundAll: 2 });

    expect(runBattleMonitorRuntime({ type: "unknown" }, runtime)).toBeUndefined();
    expect(runBattleMonitorRuntime(null, runtime)).toBeUndefined();

    expect(runtime.readOptionField).not.toHaveBeenCalled();
    expect(runtime.readBattleProgress).not.toHaveBeenCalled();
    expect(runtime.readAttackStatus).not.toHaveBeenCalled();
    expect(runtime.readRunSpeed).not.toHaveBeenCalled();
    expect(runtime.readTurn).not.toHaveBeenCalled();
  });

  it("defaults to archive context when no event is provided", () => {
    const runtime = deps({ option: { recordEach: true }, roundNow: 1, roundAll: 2 });

    expect(runBattleMonitorRuntime(undefined, runtime)).toEqual({
      recordEach: true,
      roundNow: 1,
      roundAll: 2,
    });
  });

  it("reads report start context from one monitor runtime query", () => {
    const runtime = deps({ option: { recordEach: true }, roundType: "ar", roundAll: 5 });

    expect(
      runBattleMonitorRuntime({ type: BattleMonitorRuntimeEvent.REPORT_START_CONTEXT }, runtime)
    ).toEqual({ recordEach: true, roundType: "ar", roundAll: 5 });
    expect(runtime.readOptionField).toHaveBeenCalledWith("recordEach", false);
    expect(runtime.readBattleProgress).toHaveBeenCalledTimes(1);
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
    expect(runtime.readBattleProgress).toHaveBeenCalledTimes(1);
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
    expect(runtime.readBattleProgress).toHaveBeenCalledTimes(1);
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
    expect(runtime.readBattleProgress).toHaveBeenCalledTimes(1);
    expect(runtime.readAttackStatus).toHaveBeenCalledTimes(1);
    expect(runtime.readRunSpeed).toHaveBeenCalledTimes(1);
    expect(runtime.readTurn).toHaveBeenCalledTimes(1);
  });
});
