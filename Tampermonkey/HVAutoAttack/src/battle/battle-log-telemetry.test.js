import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleLogTelemetryEvent, runBattleLogTelemetry } from "./battle-log-telemetry.js";

const mocks = vi.hoisted(() => ({
  estimatePerMonsterDps: vi.fn(() => ({ Alpha: { total: 10, perTurn: 5, count: 1 } })),
  estimatePlayerIncomingDps: vi.fn(() => ({ total: 10, sampleCount: 1 })),
  parseBattleLog: vi.fn(() => [{ kind: "player-incoming", source: "Alpha", dmg: 10 }]),
}));

vi.mock("./log-parser.js", () => ({
  estimatePerMonsterDps: mocks.estimatePerMonsterDps,
  estimatePlayerIncomingDps: mocks.estimatePlayerIncomingDps,
  parseBattleLog: mocks.parseBattleLog,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockClear();
});

describe("runBattleLogTelemetry", () => {
  it("reads battle log once and derives DPS telemetry from the same events", () => {
    const result = runBattleLogTelemetry({ type: BattleLogTelemetryEvent.READ_CURRENT, turn: 2 });

    expect(result).toEqual({
      battleLog: [{ kind: "player-incoming", source: "Alpha", dmg: 10 }],
      playerIncomingDps: { total: 10, sampleCount: 1 },
      monsterDpsByName: { Alpha: { total: 10, perTurn: 5, count: 1 } },
    });
    expect(mocks.parseBattleLog).toHaveBeenCalledTimes(1);
    expect(mocks.estimatePlayerIncomingDps).toHaveBeenCalledWith(result.battleLog, 2);
    expect(mocks.estimatePerMonsterDps).toHaveBeenCalledWith(result.battleLog, 2);
  });

  it("rejects unknown events without parsing or estimating telemetry", () => {
    expect(runBattleLogTelemetry({ type: "unknown", turn: 3 })).toEqual({
      battleLog: [],
      playerIncomingDps: {
        total: 0,
        perTurn: 0,
        p50: 0,
        p95: 0,
        hitsPerTurn: 0,
        perTurnP95: 0,
        sampleCount: 0,
      },
      monsterDpsByName: {},
    });
    expect(mocks.parseBattleLog).not.toHaveBeenCalled();
    expect(mocks.estimatePlayerIncomingDps).not.toHaveBeenCalled();
    expect(mocks.estimatePerMonsterDps).not.toHaveBeenCalled();
  });
});
