// task #3-A：decideBossImperil PURE 回归锁（喂 mock snap 断言 ActionResult）。
// 覆盖：命中目标 / 无 boss noop / 213 未 ready noop / AoE 窗口覆盖选择 / tie-break 优先 needy 自身。
import { describe, it, expect } from "vitest";
import { decideBossImperil } from "./decide-boss-imperil.js";

/** 最小 snap 工厂（只填 decideBossImperil + aliveMonstersByOrder 读到的字段）。 */
function snap(over = {}) {
  return {
    skillReady: { "213": true },
    spellAoe: {},
    monsters: [],
    ...over,
  };
}

/** monster 工厂：默认非 boss、未死、无 buff。 */
function mon(over = {}) {
  return { id: 1, order: 0, isDead: false, isBoss: false, buffs: [], ...over };
}

describe("decideBossImperil", () => {
  it("213 未 ready → noop", () => {
    const s = snap({
      skillReady: { "213": false },
      monsters: [mon({ id: 1, order: 0, isBoss: true })],
    });
    expect(decideBossImperil({}, s)).toEqual({ kind: "noop" });
  });

  it("无 boss → noop", () => {
    const s = snap({ monsters: [mon({ id: 1, order: 0, isBoss: false })] });
    expect(decideBossImperil({}, s)).toEqual({ kind: "noop" });
  });

  it("boss 已上 imperil → noop", () => {
    const s = snap({
      monsters: [mon({ id: 1, order: 0, isBoss: true, buffs: ["imperil"] })],
    });
    expect(decideBossImperil({}, s)).toEqual({ kind: "noop" });
  });

  it("单个 needy boss → click-skill-then-target 命中该 boss", () => {
    const s = snap({
      monsters: [mon({ id: 7, order: 0, isBoss: true, buffs: [] })],
    });
    expect(decideBossImperil({}, s)).toEqual({
      kind: "click-skill-then-target",
      skillSel: "213",
      targetSel: "#mkey_7",
    });
  });

  it("死掉的 boss 不计入 → 仅剩活 boss 命中活的那只", () => {
    const s = snap({
      monsters: [
        mon({ id: 1, order: 0, isBoss: true, isDead: true, buffs: [] }),
        mon({ id: 2, order: 1, isBoss: true, isDead: false, buffs: [] }),
      ],
    });
    expect(decideBossImperil({}, s)).toEqual({
      kind: "click-skill-then-target",
      skillSel: "213",
      targetSel: "#mkey_2",
    });
  });

  it("aoe=1：两个不相邻 needy boss → 选 order 较小的(c=0 先达 cov=1+selfNeed)", () => {
    // aoe=1 窗口=[c,c]，每个 c 覆盖至多 1。c=0(boss) cov=1 selfNeed → bestIdx=0；
    // 后续 c 同 cov 但 c=0 已 selfNeed，tie-break 不替换 → 命中 order 最小 boss。
    const s = snap({
      monsters: [
        mon({ id: 1, order: 0, isBoss: true, buffs: [] }),
        mon({ id: 2, order: 1, isBoss: false, buffs: [] }),
        mon({ id: 3, order: 2, isBoss: true, buffs: [] }),
      ],
    });
    expect(decideBossImperil({}, s)).toEqual({
      kind: "click-skill-then-target",
      skillSel: "213",
      targetSel: "#mkey_1",
    });
  });

  it("aoe=2 backward：两个相邻 needy boss → click 后者覆盖 [前,后] cov=2", () => {
    // order 0,1 都是 needy boss。窗口 [c-1,c]：c=1 覆盖 {0,1} cov=2 > c=0 的 cov=1 → bestIdx=1。
    const s = snap({
      spellAoe: { Imperil: 2 },
      monsters: [
        mon({ id: 1, order: 0, isBoss: true, buffs: [] }),
        mon({ id: 2, order: 1, isBoss: true, buffs: [] }),
      ],
    });
    expect(decideBossImperil({}, s)).toEqual({
      kind: "click-skill-then-target",
      skillSel: "213",
      targetSel: "#mkey_2", // order 1，AoE 向前覆盖 order 0
    });
  });

  it("aoe 来源 opt.debuffSkillAoe.Im（snap.spellAoe.Imperil 缺省时回退）", () => {
    const s = snap({
      monsters: [
        mon({ id: 1, order: 0, isBoss: true, buffs: [] }),
        mon({ id: 2, order: 1, isBoss: true, buffs: [] }),
      ],
    });
    expect(decideBossImperil({ debuffSkillAoe: { Im: 2 } }, s)).toEqual({
      kind: "click-skill-then-target",
      skillSel: "213",
      targetSel: "#mkey_2",
    });
  });

  it("aoe=2 tie-break：cov 相同时优先 click needy boss 自身", () => {
    // order: 0=非boss, 1=needy boss, 2=非boss。aoe=2 窗口 [c-1,c]：
    // c=1 覆盖 {0,1} cov=1 selfNeed=true；c=2 覆盖 {1,2} cov=1 selfNeed=false。
    // cov 相同 → 优先 c=1（selfNeed）→ 命中 boss 自身 order 1（id 2）。
    const s = snap({
      spellAoe: { Imperil: 2 },
      monsters: [
        mon({ id: 1, order: 0, isBoss: false, buffs: [] }),
        mon({ id: 2, order: 1, isBoss: true, buffs: [] }),
        mon({ id: 3, order: 2, isBoss: false, buffs: [] }),
      ],
    });
    expect(decideBossImperil({}, s)).toEqual({
      kind: "click-skill-then-target",
      skillSel: "213",
      targetSel: "#mkey_2",
    });
  });

  it("monsters 乱序 → aliveMonstersByOrder 复位后按 order 算窗口", () => {
    // DOM 序乱（order 2 在前），aoe=2 两个相邻 needy boss(order 1,2) → click order 2(id 9)。
    const s = snap({
      spellAoe: { Imperil: 2 },
      monsters: [
        mon({ id: 9, order: 2, isBoss: true, buffs: [] }),
        mon({ id: 5, order: 0, isBoss: false, buffs: [] }),
        mon({ id: 7, order: 1, isBoss: true, buffs: [] }),
      ],
    });
    expect(decideBossImperil({}, s)).toEqual({
      kind: "click-skill-then-target",
      skillSel: "213",
      targetSel: "#mkey_9",
    });
  });
});
