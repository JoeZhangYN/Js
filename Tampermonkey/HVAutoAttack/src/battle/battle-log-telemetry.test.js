import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleLogTelemetryEvent, runBattleLogTelemetry } from "./battle-log-telemetry.js";

const mocks = vi.hoisted(() => ({
  runBattleLogParser: vi.fn((event) => {
    if (event.type === "parseCurrentLog") {
      return [{ kind: "player-incoming", source: "Alpha", dmg: 10 }];
    }
    if (event.type === "estimatePlayerIncomingDps") {
      return { total: 10, sampleCount: 1 };
    }
    if (event.type === "estimatePerMonsterDps") {
      return { Alpha: { total: 10, perTurn: 5, count: 1 } };
    }
    return undefined;
  }),
}));

vi.mock("./battle-log-parser.js", () => ({
  BattleLogParserEvent: Object.freeze({
    PARSE_CURRENT_LOG: "parseCurrentLog",
    ESTIMATE_PLAYER_INCOMING_DPS: "estimatePlayerIncomingDps",
    ESTIMATE_PER_MONSTER_DPS: "estimatePerMonsterDps",
  }),
  runBattleLogParser: mocks.runBattleLogParser,
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
    expect(mocks.runBattleLogParser).toHaveBeenCalledWith({ type: "parseCurrentLog" });
    expect(mocks.runBattleLogParser).toHaveBeenCalledWith({
      type: "estimatePlayerIncomingDps",
      events: result.battleLog,
      turn: 2,
    });
    expect(mocks.runBattleLogParser).toHaveBeenCalledWith({
      type: "estimatePerMonsterDps",
      events: result.battleLog,
      turn: 2,
    });
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
    expect(mocks.runBattleLogParser).not.toHaveBeenCalled();
  });
});
