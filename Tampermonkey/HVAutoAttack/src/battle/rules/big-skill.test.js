// Feature 2 回归锁：shouldSkipForBigSkill「清场大招本回合已就绪即跳 Weaken」快路 +
// clearSkillReadyNow helper。钉死：就绪即跳(怪少也跳)、OC 不够不跳、开关 off 可回退、
// Im+boss 强保不变、原 OC 窗口路仍在、顶层 We 开关 false 早退。
import { describe, it, expect } from "vitest";
import { shouldSkipForBigSkill, clearSkillReadyNow } from "./big-skill.js";

const snap = (over = {}) => ({ cdMap: {}, oc: 0, aliveCount: 5, monsters: [], ...over });

describe("clearSkillReadyNow", () => {
  it("OFC 启用 + cd=0 + oc>=205 → true", () => {
    expect(clearSkillReadyNow({ skill_OFC: true }, snap({ cdMap: { OFC: 0 }, oc: 210 }))).toBe(true);
  });
  it("OFC 未启用 → false（即便就绪）", () => {
    expect(clearSkillReadyNow({}, snap({ cdMap: { OFC: 0 }, oc: 210 }))).toBe(false);
  });
  it("cd 未归零 → false", () => {
    expect(clearSkillReadyNow({ skill_OFC: true }, snap({ cdMap: { OFC: 2 }, oc: 210 }))).toBe(false);
  });
  it("OC 不够（<205）→ false", () => {
    expect(clearSkillReadyNow({ skill_OFC: true }, snap({ cdMap: { OFC: 0 }, oc: 200 }))).toBe(false);
  });
  it("FRD 启用 + cd=0 + oc>=105 → true（nested opt.skill.FRD 亦认）", () => {
    expect(clearSkillReadyNow({ skill: { FRD: true } }, snap({ cdMap: { FRD: 0 }, oc: 110 }))).toBe(true);
  });
});

describe("shouldSkipForBigSkill — Feature 2 就绪即跳 Weaken", () => {
  it("OFC 就绪 + 怪少(<=门槛) → We 跳过（钉死修复：原 aliveCount 早退会误压）", () => {
    const s = snap({ cdMap: { OFC: 0 }, oc: 210, aliveCount: 2 });
    expect(shouldSkipForBigSkill({ skill_OFC: true }, s, "We")).toBe(true);
  });

  it("OFC 就绪但 OC<205 + 怪少 → 不跳（快路不触发，落 aliveCount 早退 false）", () => {
    const s = snap({ cdMap: { OFC: 0 }, oc: 200, aliveCount: 2 });
    expect(shouldSkipForBigSkill({ skill_OFC: true }, s, "We")).toBe(false);
  });

  it("skipWeakenWhenClearReady:false → 快路关，怪少落 false（可回退锁）", () => {
    const s = snap({ cdMap: { OFC: 0 }, oc: 210, aliveCount: 2 });
    expect(shouldSkipForBigSkill({ skill_OFC: true, skipWeakenWhenClearReady: false }, s, "We")).toBe(false);
  });

  it("kind=Im + boss 存活 → false（强保 Imperil 不变）", () => {
    const s = snap({ cdMap: { OFC: 0 }, oc: 210, monsters: [{ isBoss: true, isDead: false }] });
    expect(shouldSkipForBigSkill({ skill_OFC: true }, s, "Im")).toBe(false);
  });

  it("原 OC 窗口路仍在：cd<=N + ocFutureMax>=205 + 怪多 → true", () => {
    const s = snap({ cdMap: { OFC: 2 }, oc: 190, aliveCount: 5 });
    expect(shouldSkipForBigSkill({ skill_OFC: true }, s, "We")).toBe(true);
  });

  it("skipDebuffForBigSkill_We:false → 顶层早退 false（原行为）", () => {
    const s = snap({ cdMap: { OFC: 0 }, oc: 210, aliveCount: 2 });
    expect(shouldSkipForBigSkill({ skill_OFC: true, skipDebuffForBigSkill_We: false }, s, "We")).toBe(false);
  });
});
