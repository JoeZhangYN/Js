// F5 回归锁：decideBurstControl 选择与守卫（Silence法术/Sleep物理、蹦极阈值、过控防护、已控跳过）。
import { describe, it, expect } from "vitest";
import { decideBurstControl } from "./decide-burst-control.js";

const mon = (over = {}) => ({ id: 1, order: 0, isDead: false, monsterId: 100, buffs: [], ...over });
const snap = (over = {}) => ({
  hpAbs: 1000,
  spiritOn: true,
  globalTurn: 100,
  lastSpiritToggleGlobalTurn: undefined,
  roundAll: undefined,
  roundNow: undefined,
  attackStatus: 0,
  channeling: false,
  aliveCount: 1,
  fightingStyle: "2",
  skillReady: { 232: true, 222: true, 223: true },
  oc: 0,
  spellAoe: {},
  skillOTOS: {},
  etherTapActiveX2: false,
  etherTapExpiring: false,
  view: [mon()],
  learnedBurstByMid: {},
  ...over,
});

function burstControlFacts(snap) {
  return {
    conditionFacts: snap,
    healthAbs: snap.hpAbs,
    spiritOn: snap.spiritOn,
    globalTurn: snap.globalTurn,
    lastSpiritToggleGlobalTurn: snap.lastSpiritToggleGlobalTurn,
    roundAll: snap.roundAll,
    roundNow: snap.roundNow,
    attackStatus: snap.attackStatus,
    channeling: snap.channeling,
    aliveCount: snap.aliveCount,
    fightingStyle: snap.fightingStyle,
    skillReady: snap.skillReady,
    overcharge: snap.oc,
    spellAoe: snap.spellAoe,
    skillOTOS: snap.skillOTOS,
    etherTapActiveX2: snap.etherTapActiveX2,
    etherTapExpiring: snap.etherTapExpiring,
    learnedBurstByMid: snap.learnedBurstByMid,
    monsterFacts: snap.view,
  };
}

function decide(opt, snap) {
  return decideBurstControl({ opt, ...burstControlFacts(snap) });
}

describe("decideBurstControl", () => {
  it("开关 OFF → noop", () => {
    const s = snap({ learnedBurstByMid: { 100: { maxHit: 900, type: "fire" } } });
    expect(decide({}, s)).toEqual({ kind: "noop" });
  });

  it("debuffSkillSwitch:false → noop", () => {
    const s = snap({ learnedBurstByMid: { 100: { maxHit: 900, type: "fire" } } });
    expect(decide({ burstControlSwitch: true, debuffSkillSwitch: false }, s)).toEqual({
      kind: "noop",
    });
  });

  it("法术爆发蹦极 + Silence 就绪 → 单点 Silence(232)", () => {
    const s = snap({ learnedBurstByMid: { 100: { maxHit: 600, type: "fire" } } }); // 600 ≥ 1000*0.5
    expect(decide({ burstControlSwitch: true }, s)).toEqual({
      kind: "click-skill-then-target",
      skillId: "232",
      targetId: 1,
    });
  });

  it("物理爆发 → Sleep(222)（Silence 对物理无效）", () => {
    const s = snap({ learnedBurstByMid: { 100: { maxHit: 600, type: "crushing" } } });
    expect(decide({ burstControlSwitch: true }, s).skillId).toBe("222");
  });

  it("不构成蹦极（单发 < 阈值）→ noop", () => {
    const s = snap({ learnedBurstByMid: { 100: { maxHit: 300, type: "fire" } } }); // 300 < 500
    expect(decide({ burstControlSwitch: true }, s)).toEqual({ kind: "noop" });
  });

  it("攻击阶段会用 OFC 清场 → noop（不过控）", () => {
    const s = snap({
      aliveCount: 5,
      learnedBurstByMid: { 100: { maxHit: 900, type: "fire" } },
      skillReady: { 232: true, 222: true, 223: true, 1111: true },
      oc: 250,
    });
    expect(decide({ burstControlSwitch: true, skillSwitch: true, skill_OFC: true }, s)).toEqual({
      kind: "noop",
    });
  });

  it("OFC 资源够但攻击阶段不会开火 → 仍控制蹦极源", () => {
    const s = snap({
      aliveCount: 5,
      learnedBurstByMid: { 100: { maxHit: 900, type: "fire" } },
      skillReady: { 232: true, 1111: true },
      oc: 250,
    });
    expect(decide({ burstControlSwitch: true, skill_OFC: true }, s)).toEqual({
      kind: "click-skill-then-target",
      skillId: "232",
      targetId: 1,
    });
  });

  it("已被该控制覆盖（已 silence）→ 跳该怪 → noop", () => {
    const s = snap({
      view: [mon({ buffs: ["silence"] })],
      learnedBurstByMid: { 100: { maxHit: 900, type: "fire" } },
    });
    expect(decide({ burstControlSwitch: true }, s)).toEqual({ kind: "noop" });
  });

  it("法术爆发但 Silence 未就绪 → 退 Sleep", () => {
    const s = snap({
      skillReady: { 232: false, 222: true },
      learnedBurstByMid: { 100: { maxHit: 600, type: "fire" } },
    });
    expect(decide({ burstControlSwitch: true }, s).skillId).toBe("222");
  });

  it("burstControlSilenceForSpell:false → 法术爆发也用 Sleep", () => {
    const s = snap({ learnedBurstByMid: { 100: { maxHit: 600, type: "fire" } } });
    expect(
      decide({ burstControlSwitch: true, burstControlSilenceForSpell: false }, s).skillId
    ).toBe("222");
  });
});
