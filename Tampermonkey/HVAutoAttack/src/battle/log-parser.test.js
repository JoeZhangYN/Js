// 开局 spawn 行解析回归锁：用**真实 HV 数据**(2026-06-25 实测，console 抓取)锁住
// parseMonsterRoster 能从当前 HV 日志抓 MID/name/LV/maxHP，防退化成只取行尾 HP 丢身份。
import { describe, it, expect } from "vitest";
import { parseMonsterRoster, buildMonsterStatus, applyInferredMaxHp } from "./log-parser.js";

// 真实 spawn 行（DOM 源序 G→A，Initializing 在最后＝最底）。
const REAL_SPAWN = [
  "Spawned Monster G: MID=156409 (Holo The Wise Wolf) LV=365 HP=117600",
  "Spawned Monster F: MID=60722 (Tsukiko Tsutsukakushi) LV=365 HP=82780",
  "Spawned Monster E: MID=292145 (Svenus) LV=365 HP=86648",
  "Spawned Monster D: MID=134109 (1450817) LV=365 HP=107318",
  "Spawned Monster C: MID=80804 (Puddle Monster) LV=365 HP=109068",
  "Spawned Monster B: MID=100615 (Sssss2) LV=365 HP=86648",
  "Spawned Monster A: MID=158322 (Deep Learning) LV=365 HP=110816",
];
const realLogRows = () => [...REAL_SPAWN, "Initializing the battle... (Round 1 / 1)"];

describe("parseMonsterRoster（真实 HV spawn 行）", () => {
  it("抓全 7 怪的 MID/name/LV/maxHP；倒序遍历 → order 与 slot 字母对齐(A=0)", () => {
    const { roster, allParsed } = parseMonsterRoster(realLogRows(), 7);
    expect(allParsed).toBe(true);
    expect(roster).toHaveLength(7);
    // order0 = 战场最底 = Monster A = Deep Learning
    expect(roster[0]).toEqual({
      monsterId: 158322,
      name: "Deep Learning",
      level: 365,
      maxHP: 110816,
    });
    // order6 = Monster G = Holo
    expect(roster[6]).toEqual({
      monsterId: 156409,
      name: "Holo The Wise Wolf",
      level: 365,
      maxHP: 117600,
    });
  });

  it("怪名含数字/特殊(1450817=order3 / Sssss2=order1)不破", () => {
    const { roster } = parseMonsterRoster(realLogRows(), 7);
    // order = slot 字母(A=0)：D=order3=1450817，B=order1=Sssss2
    expect(roster[3]).toMatchObject({ monsterId: 134109, name: "1450817" });
    expect(roster[1]).toMatchObject({ monsterId: 100615, name: "Sssss2" });
  });

  it("LV ≠ maxHP 决定者验证：同 LV=365 不同怪 HP 各异", () => {
    const { roster } = parseMonsterRoster(realLogRows(), 7);
    expect(roster.every((r) => r.level === 365)).toBe(true);
    expect(new Set(roster.map((r) => r.maxHP)).size).toBeGreaterThan(1);
  });

  it("退化①：行有 HP= 但无 MID/LV(旧格式) → 仅 maxHP，allParsed=false", () => {
    const log = ["the Orc Warlord ... HP=5000", "Initializing ..."];
    const { roster, allParsed } = parseMonsterRoster(log, 1);
    expect(roster[0]).toEqual({ maxHP: 5000 });
    expect(allParsed).toBe(false);
  });

  it("退化②：行无 HP → maxHP=null(占位) + carry-forward", () => {
    const log = ["garbage line no hp", "Initializing ..."];
    const { roster, allParsed } = parseMonsterRoster(log, 1);
    expect(roster[0].maxHP).toBeNull();
    expect(allParsed).toBe(false);
  });
});

describe("buildMonsterStatus（roster → monsterStatus）", () => {
  it("monsterId/level/hp 落位 + hpInferred=false（真实解析）", () => {
    const { roster } = parseMonsterRoster(realLogRows(), 7);
    const st = buildMonsterStatus(roster);
    expect(st[0]).toMatchObject({
      order: 0,
      id: 1,
      monsterId: 158322,
      name: "Deep Learning",
      level: 365,
      hp: 110816,
      hpInferred: false,
    });
  });

  it("maxHP=null → hp=fallback + hpInferred=true（占位）；monsterId/level=undefined", () => {
    const st = buildMonsterStatus([{ maxHP: null }]);
    expect(st[0]).toMatchObject({ order: 0, id: 1, hp: 100000, hpInferred: true });
    expect(st[0].monsterId).toBeUndefined();
    expect(st[0].level).toBeUndefined();
  });

  it("id 映射保持 order===9 → id 0", () => {
    const st = buildMonsterStatus(Array.from({ length: 10 }, () => ({ maxHP: 1 })));
    expect(st[9].id).toBe(0);
  });
});

describe("applyInferredMaxHp（(MID,LV) 占位兜底）", () => {
  const lookup = (id, lv) => (id === 158322 && lv === 365 ? 110816 : 0);

  it("占位 + MID/LV 已知 + 命中 → 替换 hp 并清占位标记", () => {
    const st = [{ monsterId: 158322, level: 365, hp: 100000, hpInferred: true }];
    applyInferredMaxHp(st, lookup);
    expect(st[0]).toMatchObject({ hp: 110816, hpInferred: false });
  });

  it("真实解析(hpInferred=false) → 永不被覆盖（开局值优先）", () => {
    const st = [{ monsterId: 158322, level: 365, hp: 110816, hpInferred: false }];
    applyInferredMaxHp(st, () => 999);
    expect(st[0].hp).toBe(110816);
  });

  it("占位但 MID/LV 未知 → 不动（id 未知不兜底）", () => {
    const st = [{ hp: 100000, hpInferred: true }];
    applyInferredMaxHp(st, () => 5000);
    expect(st[0]).toMatchObject({ hp: 100000, hpInferred: true });
  });

  it("占位 + 已知但 lookup miss(≤0) → 不动", () => {
    const st = [{ monsterId: 999, level: 1, hp: 100000, hpInferred: true }];
    applyInferredMaxHp(st, lookup);
    expect(st[0]).toMatchObject({ hp: 100000, hpInferred: true });
  });
});
