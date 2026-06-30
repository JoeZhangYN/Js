import { gE } from "../dom/query.js";
import { normalizeMonsterName } from "../monster/monster-identity.js";

const EVENT_PARSE_CURRENT_LOG = "parseCurrentLog";
const EVENT_ESTIMATE_PLAYER_INCOMING_DPS = "estimatePlayerIncomingDps";
const EVENT_ESTIMATE_PER_MONSTER_DPS = "estimatePerMonsterDps";
const EVENT_PARSE_MONSTER_ROSTER = "parseMonsterRoster";
const EVENT_BUILD_MONSTER_STATUS = "buildMonsterStatus";
const EVENT_ACCUMULATE_DAMAGE_BY_MONSTER = "accumulateDamageByMonster";

export const BattleLogParserEvent = Object.freeze({
  PARSE_CURRENT_LOG: EVENT_PARSE_CURRENT_LOG,
  ESTIMATE_PLAYER_INCOMING_DPS: EVENT_ESTIMATE_PLAYER_INCOMING_DPS,
  ESTIMATE_PER_MONSTER_DPS: EVENT_ESTIMATE_PER_MONSTER_DPS,
  PARSE_MONSTER_ROSTER: EVENT_PARSE_MONSTER_ROSTER,
  BUILD_MONSTER_STATUS: EVENT_BUILD_MONSTER_STATUS,
  ACCUMULATE_DAMAGE_BY_MONSTER: EVENT_ACCUMULATE_DAMAGE_BY_MONSTER,
});

const battleLogParserEventHandlers = Object.freeze({
  [EVENT_PARSE_CURRENT_LOG]: () => parseBattleLog(),
  [EVENT_ESTIMATE_PLAYER_INCOMING_DPS]: (event) =>
    estimatePlayerIncomingDps(event.events, event.turn),
  [EVENT_ESTIMATE_PER_MONSTER_DPS]: (event) => estimatePerMonsterDps(event.events, event.turn),
  [EVENT_PARSE_MONSTER_ROSTER]: (event) =>
    parseMonsterRoster(event.battleLogRows, event.monsterAll),
  [EVENT_BUILD_MONSTER_STATUS]: (event) => buildMonsterStatus(event.roster, event.fallbackHp),
  [EVENT_ACCUMULATE_DAMAGE_BY_MONSTER]: (event) => accumulateDamageByMonster(event.events),
});

export function runBattleLogParser(event = { type: EVENT_PARSE_CURRENT_LOG }) {
  return battleLogParserEventHandlers[event.type]?.(event);
}

function parseBattleLog() {
  const els = gE("#textlog>tbody>tr>td", "all");
  if (!els || !els.length) return [];
  const events = [];
  for (const el of els) {
    const text = el.textContent || "";
    let m = text.match(/^(.+?) (?:hits|crits) you for (\d+) ?(\w+)? damage/);
    if (m) {
      events.push(damageEvent("player-incoming", m[1], "you", m[2], m[3]));
      continue;
    }
    m = text.match(/^You (?:hit|crit) (.+?) for (\d+) ?(\w+)? damage/);
    if (m) {
      events.push(damageEvent("monster-taking", "you", m[1], m[2], m[3]));
      continue;
    }
    m = text.match(/^(.+?) hits (.+?) for (\d+) ?(\w+)? damage/);
    if (m && m[2].toLowerCase() !== "you") {
      events.push(damageEvent("monster-taking", m[1], m[2], m[3], m[4]));
    }
  }
  return events;
}

function damageEvent(kind, source, target, dmg, type) {
  return { kind, source: source.trim(), target: target.trim(), dmg: parseInt(dmg), type: type || "unknown" };
}

function estimatePlayerIncomingDps(events, turn) {
  const incoming = events.filter((e) => e.kind === "player-incoming");
  const dmgs = incoming.map((e) => e.dmg).sort((a, b) => a - b);
  const total = dmgs.reduce((s, d) => s + d, 0);
  const t = Math.max(1, turn || 1);
  const q = (p) =>
    dmgs.length === 0 ? 0 : dmgs[Math.min(dmgs.length - 1, Math.floor(dmgs.length * p))];
  const p50 = q(0.5);
  const p95 = q(0.95);
  const hitsPerTurn = incoming.length / t;
  return {
    total,
    perTurn: total / t,
    p50,
    p95,
    hitsPerTurn,
    perTurnP95: p95 * hitsPerTurn,
    sampleCount: incoming.length,
  };
}

function estimatePerMonsterDps(events, turn) {
  const map = {};
  const t = Math.max(1, turn || 1);
  for (const e of events) {
    if (e.kind !== "player-incoming") continue;
    if (!map[e.source]) map[e.source] = { total: 0, count: 0 };
    map[e.source].total += e.dmg;
    map[e.source].count += 1;
  }
  for (const k of Object.keys(map)) map[k].perTurn = map[k].total / t;
  return map;
}

function parseMonsterRoster(battleLogRows, monsterAll) {
  const roster = [];
  let allParsed = true;
  let lastHp = null;
  for (let i = battleLogRows.length - 2; i > battleLogRows.length - 2 - monsterAll; i -= 1) {
    const text = battleLogRows[i] || "";
    const full = text.match(/MID=(\d+) \((.+)\) LV=(\d+) HP=(\d+)$/);
    if (full) {
      lastHp = parseInt(full[4], 10);
      roster.push({ monsterId: parseInt(full[1], 10), name: full[2], level: parseInt(full[3], 10), maxHP: lastHp });
      continue;
    }
    const hpOnly = text.match(/HP=(\d+)$/);
    if (hpOnly) {
      lastHp = parseInt(hpOnly[1], 10);
      roster.push({ maxHP: lastHp });
      allParsed = false;
      continue;
    }
    roster.push({ maxHP: lastHp });
    allParsed = false;
  }
  return { roster, allParsed };
}

function buildMonsterStatus(roster, fallbackHp = 100000) {
  return roster.map((rec, order) => ({
    order, id: order === 9 ? 0 : order + 1, monsterId: rec?.monsterId, name: rec?.name,
    level: rec?.level, hp: rec?.maxHP ?? fallbackHp, hpInferred: rec?.maxHP == null,
  }));
}

function accumulateDamageByMonster(events) {
  const map = new Map();
  for (const e of events) {
    if (e.kind !== "monster-taking") continue;
    const name = normalizeMonsterName(e.target);
    if (!name) continue;
    if (!map.has(name)) map.set(name, { totalDamage: 0, events: [] });
    const entry = map.get(name);
    entry.totalDamage += e.dmg;
    entry.events.push(e);
  }
  return map;
}
