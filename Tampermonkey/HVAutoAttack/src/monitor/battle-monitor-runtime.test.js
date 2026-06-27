import { describe, expect, it, vi } from "vitest";
import { BattleMonitorRuntimeEvent, runBattleMonitorRuntime } from "./battle-monitor-runtime.js";

const deps = (values) => ({
  g: vi.fn((key) => values[key]),
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
});
