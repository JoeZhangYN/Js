// task #3-A：decideBossImperil PURE 回归锁（喂 mock snap 断言 ActionResult）。
// file-size-gate: exempt test-verbose（Boss Imperil 目标选择 + permission 门控逐例断言）
// 覆盖：命中目标 / 无 boss noop / 213 未 ready noop / AoE 窗口覆盖选择 / tie-break 优先 needy 自身。
import { describe, it, expect } from "vitest";
import { BossImperilEvent, runBossImperilAutomation } from "./decide-boss-imperil.js";
import { bossImperilFacts } from "./debuff-facts.js";

/** 最小 snap 工厂（只填 decideBossImperil 从 snap.view 读到的字段）。 */
function snap(over = {}) {
  return {
    skillReady: { 213: true },
    spellAoe: {},
    view: [],
    ...over,
  };
}

/** monster 工厂：默认非 boss、未死、无 buff。 */
function mon(over = {}) {
  return { id: 1, order: 0, isDead: false, isBoss: false, buffs: [], ...over };
}

describe("decideBossImperil", () => {
  const decideBossImperil = (opt, snap) =>
    runBossImperilAutomation({
      type: BossImperilEvent.DECIDE,
      opt,
      ...bossImperilFacts(snap),
      skipImperilForBigSkill: snap.skipImperilForBigSkill,
    });

  it("213 未 ready → noop", () => {
    const s = snap({
      skillReady: { 213: false },
      view: [mon({ id: 1, order: 0, isBoss: true })],
    });
    expect(decideBossImperil({}, s)).toEqual({ kind: "noop" });
  });

  it("无 boss → noop", () => {
    const s = snap({ view: [mon({ id: 1, order: 0, isBoss: false })] });
    expect(decideBossImperil({}, s)).toEqual({ kind: "noop" });
  });

  it("boss 已上 imperil → noop", () => {
    const s = snap({
      view: [mon({ id: 1, order: 0, isBoss: true, buffs: ["imperil"] })],
    });
    expect(decideBossImperil({}, s)).toEqual({ kind: "noop" });
  });

  it("单个 needy boss → click-skill-then-target 命中该 boss", () => {
    const s = snap({
      view: [mon({ id: 7, order: 0, isBoss: true, buffs: [] })],
    });
    expect(decideBossImperil({}, s)).toEqual({
      kind: "click-skill-then-target",
      skillId: "213",
      targetId: 7,
    });
  });

  it("死掉的 boss 不计入 → 仅剩活 boss 命中活的那只", () => {
    const s = snap({
      view: [
        mon({ id: 1, order: 0, isBoss: true, isDead: true, buffs: [] }),
        mon({ id: 2, order: 1, isBoss: true, isDead: false, buffs: [] }),
      ],
    });
    expect(decideBossImperil({}, s)).toEqual({
      kind: "click-skill-then-target",
      skillId: "213",
      targetId: 2,
    });
  });

  it("aoe=1：两个不相邻 needy boss → 选 order 较小的(c=0 先达 cov=1+selfNeed)", () => {
    // aoe=1 窗口=[c,c]，每个 c 覆盖至多 1。c=0(boss) cov=1 selfNeed → bestIdx=0；
    // 后续 c 同 cov 但 c=0 已 selfNeed，tie-break 不替换 → 命中 order 最小 boss。
    const s = snap({
      view: [
        mon({ id: 1, order: 0, isBoss: true, buffs: [] }),
        mon({ id: 2, order: 1, isBoss: false, buffs: [] }),
        mon({ id: 3, order: 2, isBoss: true, buffs: [] }),
      ],
    });
    expect(decideBossImperil({}, s)).toEqual({
      kind: "click-skill-then-target",
      skillId: "213",
      targetId: 1,
    });
  });

  it("aoe=2 backward：两个相邻 needy boss → click 后者覆盖 [前,后] cov=2", () => {
    // order 0,1 都是 needy boss。窗口 [c-1,c]：c=1 覆盖 {0,1} cov=2 > c=0 的 cov=1 → bestIdx=1。
    const s = snap({
      spellAoe: { Imperil: 2 },
      view: [
        mon({ id: 1, order: 0, isBoss: true, buffs: [] }),
        mon({ id: 2, order: 1, isBoss: true, buffs: [] }),
      ],
    });
    expect(decideBossImperil({}, s)).toEqual({
      kind: "click-skill-then-target",
      skillId: "213",
      targetId: 2, // order 1，AoE 向前覆盖 order 0
    });
  });

  it("aoe 来源 opt.debuffSkillAoe.Im（snap.spellAoe.Imperil 缺省时回退）", () => {
    const s = snap({
      view: [
        mon({ id: 1, order: 0, isBoss: true, buffs: [] }),
        mon({ id: 2, order: 1, isBoss: true, buffs: [] }),
      ],
    });
    expect(decideBossImperil({ debuffSkillAoe: { Im: 2 } }, s)).toEqual({
      kind: "click-skill-then-target",
      skillId: "213",
      targetId: 2,
    });
  });

  it("aoe=2 tie-break：cov 相同时优先 click needy boss 自身", () => {
    // order: 0=非boss, 1=needy boss, 2=非boss。aoe=2 窗口 [c-1,c]：
    // c=1 覆盖 {0,1} cov=1 selfNeed=true；c=2 覆盖 {1,2} cov=1 selfNeed=false。
    // cov 相同 → 优先 c=1（selfNeed）→ 命中 boss 自身 order 1（id 2）。
    const s = snap({
      spellAoe: { Imperil: 2 },
      view: [
        mon({ id: 1, order: 0, isBoss: false, buffs: [] }),
        mon({ id: 2, order: 1, isBoss: true, buffs: [] }),
        mon({ id: 3, order: 2, isBoss: false, buffs: [] }),
      ],
    });
    expect(decideBossImperil({}, s)).toEqual({
      kind: "click-skill-then-target",
      skillId: "213",
      targetId: 2,
    });
  });

  it("view 乱序 → aliveByOrder 复位后按 order 算窗口", () => {
    // DOM 序乱（order 2 在前），aoe=2 两个相邻 needy boss(order 1,2) → click order 2(id 9)。
    const s = snap({
      spellAoe: { Imperil: 2 },
      view: [
        mon({ id: 9, order: 2, isBoss: true, buffs: [] }),
        mon({ id: 5, order: 0, isBoss: false, buffs: [] }),
        mon({ id: 7, order: 1, isBoss: true, buffs: [] }),
      ],
    });
    expect(decideBossImperil({}, s)).toEqual({
      kind: "click-skill-then-target",
      skillId: "213",
      targetId: 9,
    });
  });
});

describe("boss Imperil permission", () => {
  const canCast = (opt, snap) =>
    runBossImperilAutomation({
      type: BossImperilEvent.CAN_CAST,
      opt,
      ...bossImperilFacts(snap),
      skipImperilForBigSkill: snap.skipImperilForBigSkill,
    });

  it("requires skill 213 ready and debuff skill enabled", () => {
    expect(canCast({}, snap({ skillReady: { 213: true } }))).toBe(true);
    expect(canCast({}, snap({ skillReady: { 213: false } }))).toBe(false);
    expect(canCast({ debuffSkillSwitch: false }, snap({ skillReady: { 213: true } }))).toBe(false);
  });

  it("blocks boss Imperil while battle is stalling", () => {
    expect(
      canCast(
        { stallMode: true },
        snap({
          oc: 100,
          roundNow: 1,
          roundAll: 3,
          skillReady: { 213: true },
          view: [mon({ id: 1, isBoss: true, hpPercent: 0.8 })],
        })
      )
    ).toBe(false);
  });

  it("blocks boss Imperil when offensive debuff says big skill should skip Imperil", () => {
    expect(
      canCast(
        {},
        snap({
          skillReady: { 213: true },
          skipImperilForBigSkill: true,
          view: [mon({ id: 1, isBoss: true, monsterId: 100, hpMax: 5000 })],
        })
      )
    ).toBe(false);
  });
});
