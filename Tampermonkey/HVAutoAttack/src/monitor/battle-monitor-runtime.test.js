import { describe, expect, it, vi } from "vitest";
import { BattleMonitorRuntimeEvent, runBattleMonitorRuntime } from "./battle-monitor-runtime.js";

const deps = (values) => ({
  g: vi.fn((key) => values[key]),
});

describe("runBattleMonitorRuntime", () => {
  it("reads report start context from one monitor runtime query", () => {
    expect(
      runBattleMonitorRuntime(
        { type: BattleMonitorRuntimeEvent.REPORT_START_CONTEXT },
        deps({ option: { recordEach: true }, roundType: "ar", roundAll: 5 })
      )
    ).toEqual({ recordEach: true, roundType: "ar", roundAll: 5 });
  });

  it("reads archive and usage completion context consistently", () => {
    expect(
      runBattleMonitorRuntime(
        { type: BattleMonitorRuntimeEvent.USAGE_COMPLETION_CONTEXT },
        deps({
          option: { recordEach: true },
          roundNow: 2,
          roundAll: 2,
          monsterAll: 4,
          bossAll: 1,
        })
      )
    ).toEqual({ recordEach: true, roundNow: 2, roundAll: 2, monsterAll: 4, bossAll: 1 });
  });
});
