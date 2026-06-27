// F4 回归锁：OFC 击杀结果记忆 + ofcWillKillBoss 守卫。钉死「跳 Imperil 需正面证据，否则保留」。
import { describe, it, expect, beforeEach } from "vitest";
import { g } from "./store.js";
import {
  BigSkillKillLearningEvent,
  runBigSkillKillLearningAutomation,
} from "./big-skill-kill-learner.js";

const boss = (over = {}) => ({ monsterId: 100, isBoss: true, isDead: false, hpMax: 5000, buffs: [], ...over });
const ready = { cdMap: { OFC: 0 }, oc: 250, view: [boss()] };

beforeEach(() => {
  localStorage.clear();
  g("bigKillPending", null);
  g("globalTurn", 0);
  g("option", {});
});

// 一次「OFC 开火 → 下回合结算」观测（killed 用 isDead 表达）。
function observe({ imperil = false, killed = true, mid = 100, hpMax = 5000, t = 0 }) {
  runBigSkillKillLearningAutomation({
    type: BigSkillKillLearningEvent.RECORD_CAST,
    code: "OFC",
    snap: { view: [boss({ monsterId: mid, hpMax, buffs: imperil ? ["imperil"] : [] })], globalTurn: t },
  });
  runBigSkillKillLearningAutomation({
    type: BigSkillKillLearningEvent.FINALIZE_PENDING,
    snap: { view: [boss({ monsterId: mid, hpMax, isDead: killed })], globalTurn: t + 1 },
  });
}
const learnHigh = () => { for (let i = 0; i < 4; i++) observe({ imperil: false, killed: true, t: i * 100 }); };
const willKill = (mid, snap, opt) =>
  runBigSkillKillLearningAutomation({ type: BigSkillKillLearningEvent.WILL_KILL_BOSS, mid, snap, opt });

describe("recordBigSkillCast", () => {
  it("非 OFC/FRD → 不记 pending", () => {
    runBigSkillKillLearningAutomation({
      type: BigSkillKillLearningEvent.RECORD_CAST,
      code: "T3",
      snap: { view: [boss()], globalTurn: 0 },
    });
    expect(g("bigKillPending")).toBeFalsy();
  });
  it("无活 boss → 不记 pending", () => {
    runBigSkillKillLearningAutomation({
      type: BigSkillKillLearningEvent.RECORD_CAST,
      code: "OFC",
      snap: { view: [boss({ isBoss: false })], globalTurn: 0 },
    });
    expect(g("bigKillPending")).toBeFalsy();
  });
  it("OFC + 活 boss → 记 pending（mid/hpMax/imperilActive）", () => {
    runBigSkillKillLearningAutomation({
      type: BigSkillKillLearningEvent.RECORD_CAST,
      code: "OFC",
      snap: { view: [boss({ buffs: ["imperil"] })], globalTurn: 5 },
    });
    expect(g("bigKillPending").bosses[0]).toMatchObject({ mid: 100, hpMax: 5000, imperilActive: true });
  });
});

describe("finalize 学击杀率 + ofcWillKillBoss 守卫", () => {
  it("无 imperil 秒杀（n≥min）→ skip:true", () => {
    learnHigh();
    expect(willKill(100, ready, { skipImperilWhenOfcKills: true }).skip).toBe(true);
  });
  it("无 imperil 未杀死 → killProbNoIm=0 → false", () => {
    for (let i = 0; i < 4; i++) observe({ imperil: false, killed: false, t: i * 100 });
    expect(willKill(100, ready, { skipImperilWhenOfcKills: true }).skip).toBe(false);
  });
  it("同回合 globalTurn 相同 → 不结算（pending 续留）", () => {
    runBigSkillKillLearningAutomation({
      type: BigSkillKillLearningEvent.RECORD_CAST,
      code: "OFC",
      snap: { view: [boss()], globalTurn: 7 },
    });
    runBigSkillKillLearningAutomation({
      type: BigSkillKillLearningEvent.FINALIZE_PENDING,
      snap: { view: [boss({ isDead: true })], globalTurn: 7 },
    });
    expect(g("bigKillPending")).toBeTruthy();
  });
  it("imperil 态击杀只动 withIm，不喂 noIm → 仍 false", () => {
    for (let i = 0; i < 4; i++) observe({ imperil: true, killed: true, t: i * 100 });
    expect(willKill(100, ready, { skipImperilWhenOfcKills: true, bigKillMinSamples: 1 }).skip).toBe(false);
  });

  it("开关 OFF → false（默认）", () => {
    learnHigh();
    expect(willKill(100, ready, {}).skip).toBe(false);
  });
  it("mid null → false", () => {
    expect(willKill(null, ready, { skipImperilWhenOfcKills: true }).skip).toBe(false);
  });
  it("OFC 未就绪（cd≠0）→ false", () => {
    learnHigh();
    expect(willKill(100, { cdMap: { OFC: 3 }, oc: 250, view: [boss()] }, { skipImperilWhenOfcKills: true }).skip).toBe(false);
  });
  it("OC<205 → false", () => {
    learnHigh();
    expect(willKill(100, { cdMap: { OFC: 0 }, oc: 200, view: [boss()] }, { skipImperilWhenOfcKills: true }).skip).toBe(false);
  });
  it("样本不足（默认 minSamples 4，仅 1 次）→ false", () => {
    observe({ imperil: false, killed: true });
    expect(willKill(100, ready, { skipImperilWhenOfcKills: true }).skip).toBe(false);
  });
  it("满血漂移超阈（升级后变厚）→ false", () => {
    learnHigh(); // lastHpMax 5000
    const drifted = { cdMap: { OFC: 0 }, oc: 250, view: [boss({ hpMax: 6000 })] }; // 6000 > 5000*1.15
    expect(willKill(100, drifted, { skipImperilWhenOfcKills: true }).skip).toBe(false);
  });
  it("未知 MID → false", () => {
    learnHigh();
    expect(willKill(999, ready, { skipImperilWhenOfcKills: true }).skip).toBe(false);
  });
});
