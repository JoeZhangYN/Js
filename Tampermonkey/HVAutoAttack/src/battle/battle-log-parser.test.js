import { beforeEach, describe, expect, it } from "vitest";
import { BattleLogParserEvent, runBattleLogParser } from "./battle-log-parser.js";

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("runBattleLogParser", () => {
  it("parses the current rendered battle log through one entry", () => {
    document.body.innerHTML = [
      "<table id=\"textlog\"><tbody>",
      "<tr><td>Alpha hits you for 100 fire damage</td></tr>",
      "<tr><td>You hit Alpha for 250 crushing damage</td></tr>",
      "</tbody></table>",
    ].join("");

    expect(runBattleLogParser({ type: BattleLogParserEvent.PARSE_CURRENT_LOG })).toEqual([
      {
        kind: "player-incoming",
        source: "Alpha",
        target: "you",
        dmg: 100,
        type: "fire",
      },
      {
        kind: "monster-taking",
        source: "you",
        target: "Alpha",
        dmg: 250,
        type: "crushing",
      },
    ]);
  });

  it("routes DPS and damage aggregation queries through one entry", () => {
    const events = [
      { kind: "player-incoming", source: "Alpha", target: "you", dmg: 100 },
      { kind: "monster-taking", source: "you", target: "Alpha", dmg: 250 },
    ];

    expect(
      runBattleLogParser({
        type: BattleLogParserEvent.ESTIMATE_PLAYER_INCOMING_DPS,
        events,
        turn: 2,
      })
    ).toMatchObject({ total: 100, perTurn: 50, sampleCount: 1 });
    expect(
      runBattleLogParser({
        type: BattleLogParserEvent.ESTIMATE_PER_MONSTER_DPS,
        events,
        turn: 2,
      })
    ).toEqual({ Alpha: { total: 100, count: 1, perTurn: 50 } });
    expect(
      runBattleLogParser({
        type: BattleLogParserEvent.ACCUMULATE_DAMAGE_BY_MONSTER,
        events,
      }).get("Alpha")
    ).toMatchObject({ totalDamage: 250 });
  });

  it("routes spawn roster parsing and status building through one entry", () => {
    const parsed = runBattleLogParser({
      type: BattleLogParserEvent.PARSE_MONSTER_ROSTER,
      monsterAll: 1,
      battleLogRows: [
        "Spawned Monster A: MID=101 (Alpha) LV=10 HP=1000",
        "Initializing the battle... (Round 1 / 1)",
      ],
    });
    expect(parsed.roster).toEqual([{ monsterId: 101, name: "Alpha", level: 10, maxHP: 1000 }]);
    expect(
      runBattleLogParser({
        type: BattleLogParserEvent.BUILD_MONSTER_STATUS,
        roster: parsed.roster,
      })
    ).toEqual([
      {
        order: 0,
        id: 1,
        monsterId: 101,
        name: "Alpha",
        level: 10,
        hp: 1000,
        hpInferred: false,
      },
    ]);
  });

  it("rejects unknown battle log parser events", () => {
    expect(runBattleLogParser({ type: "unknown" })).toBeUndefined();
  });
});
