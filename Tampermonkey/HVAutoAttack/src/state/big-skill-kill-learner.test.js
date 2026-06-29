// F4 回归锁：OFC 击杀结果记忆 + ofcWillKillBoss 守卫。钉死「跳 Imperil 需正面证据，否则保留」。
import { describe, it, expect, beforeEach, vi } from "vitest";
import { g } from "./store.js";
import {
  BigSkillKillLearningEvent,
  runBigSkillKillLearningAutomation,
} from "./big-skill-kill-learner.js";

const mocks = vi.hoisted(() => ({
  runOptionAutomation: vi.fn(),
}));

vi.mock("./option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));

const boss = (over = {}) => ({
  monsterId: 100,
  isBoss: true,
  isDead: false,
  hpMax: 5000,
  buffs: [],
  ...over,
});
const ready = { ofcCooldown: 0, overcharge: 250, bossHpMax: 5000 };
const observedBoss = { mid: 100, hpMax: 5000, imperilActive: false };
const finalizeSnap = ({ mid = 100, killed = true, t = 1 } = {}) => ({
  globalTurn: t,
  liveMonsterIds: killed ? [] : [mid],
});

beforeEach(() => {
  localStorage.clear();
  g("bigKillPending", null);
  mocks.runOptionAutomation.mockReset();
  mocks.runOptionAutomation.mockReturnValue(false);
});

// 一次「OFC 开火 → 下回合结算」观测（killed 用 isDead 表达）。
function observe({ imperil = false, killed = true, mid = 100, hpMax = 5000, t = 0 }) {
  runBigSkillKillLearningAutomation({
    type: BigSkillKillLearningEvent.RECORD_CAST,
    code: "OFC",
    globalTurn: t,
    observedBosses: [{ ...observedBoss, mid, hpMax, imperilActive: imperil }],
  });
  runBigSkillKillLearningAutomation({
    type: BigSkillKillLearningEvent.FINALIZE_PENDING,
    ...finalizeSnap({ mid, killed, t: t + 1 }),
  });
}
const learnHigh = () => {
  for (let i = 0; i < 4; i++) observe({ imperil: false, killed: true, t: i * 100 });
};
const willKill = (mid, facts, opt) =>
  runBigSkillKillLearningAutomation({
    type: BigSkillKillLearningEvent.WILL_KILL_BOSS,
    mid,
    ...facts,
    opt,
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
      observedBosses: [observedBoss],
      globalTurn: 7,
    });
    runBigSkillKillLearningAutomation({
      type: BigSkillKillLearningEvent.FINALIZE_PENDING,
      ...finalizeSnap({ t: 7 }),
    });
    expect(g("bigKillPending")).toBeTruthy();
  });
  it("imperil 态击杀只动 withIm，不喂 noIm → 仍 false", () => {
    for (let i = 0; i < 4; i++) observe({ imperil: true, killed: true, t: i * 100 });
    expect(willKill(100, ready, { skipImperilWhenOfcKills: true, bigKillMinSamples: 1 }).skip).toBe(
      false
    );
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
    expect(
      willKill(
        100,
        { ofcCooldown: 3, overcharge: 250, bossHpMax: 5000 },
        { skipImperilWhenOfcKills: true }
      ).skip
    ).toBe(false);
  });
  it("OC<205 → false", () => {
    learnHigh();
    expect(
      willKill(
        100,
        { ofcCooldown: 0, overcharge: 200, bossHpMax: 5000 },
        { skipImperilWhenOfcKills: true }
      ).skip
    ).toBe(false);
  });
  it("样本不足（默认 minSamples 4，仅 1 次）→ false", () => {
    observe({ imperil: false, killed: true });
    expect(willKill(100, ready, { skipImperilWhenOfcKills: true }).skip).toBe(false);
  });
  it("满血漂移超阈（升级后变厚）→ false", () => {
    learnHigh(); // lastHpMax 5000
    expect(
      willKill(
        100,
        { ofcCooldown: 0, overcharge: 250, bossHpMax: boss({ hpMax: 6000 }).hpMax },
        { skipImperilWhenOfcKills: true }
      ).skip
    ).toBe(false);
  });
  it("未知 MID → false", () => {
    learnHigh();
    expect(willKill(999, ready, { skipImperilWhenOfcKills: true }).skip).toBe(false);
  });

  it("日志开关通过 option entry 读取", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    mocks.runOptionAutomation.mockReturnValue(true);

    observe({ imperil: false, killed: true });

    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "dynamicBigKillLog",
      fallback: false,
    });
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("[big-kill] settle OFC:"),
      expect.any(String)
    );
    log.mockRestore();
  });
});
