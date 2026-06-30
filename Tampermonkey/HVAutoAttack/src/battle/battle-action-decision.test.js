// file-size-gate: exempt test-verbose（行动规则顺序 + 短路 + 关键规则契约迁移锁）
import { describe, expect, it, vi } from "vitest";
import { runBattleActionDecision } from "./battle-action-decision.js";

const mocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
}));

vi.mock("./dispatch.js", () => ({ dispatch: mocks.dispatch }));

function dispatchedResults(snap = {}, opt = {}) {
  mocks.dispatch.mockClear();
  mocks.dispatch.mockReturnValue(false);
  runBattleActionDecision({ snap, actionOptions: opt });
  return mocks.dispatch.mock.calls.map((call) => call[0]);
}

describe("runBattleActionDecision", () => {
  it("owns the full action rule order", () => {
    const results = dispatchedResults();
    expect(results).toHaveLength(4);
    expect(results.map((result) => result.kind)).toEqual(["noop", "noop", "noop", "attack-plan"]);
    expect(results[3].plan).toBeTruthy();
  });

  it("short-circuits after the first acted dispatch", () => {
    mocks.dispatch.mockClear();
    mocks.dispatch.mockImplementation((result) => result.kind === "flee-command");

    runBattleActionDecision({ snap: {}, actionOptions: { autoFlee: true } });

    expect(mocks.dispatch).toHaveBeenCalledTimes(1);
    expect(mocks.dispatch.mock.calls[0][0]).toEqual({ kind: "flee-command" });
  });

  it("passes the same snap to dispatch for bookkeeping", () => {
    const snap = { hp: 70 };
    dispatchedResults(snap, {});
    expect(mocks.dispatch.mock.calls[0][1]).toBe(snap);
  });
});

describe("runBattleActionDecision rule contracts", () => {
  it("basic gates belong to rule entries, not the action chain", () => {
    expect(dispatchedResults({}, { autoFlee: true })[0]).toEqual({
      kind: "flee-command",
    });
    expect(dispatchedResults({}, { autoPause: true })[0]).toEqual({
      kind: "pause",
    });
    expect(dispatchedResults({}, { defend: true })[0]).toEqual({
      kind: "defend-command",
    });
    expect(dispatchedResults()[0]).toEqual({ kind: "noop" });
    expect(dispatchedResults({ attackStatus: 2, playerBuffs: [] })[1]).toEqual({
      kind: "noop",
    });
    expect(dispatchedResults({ channeling: true })[1]).toEqual({
      kind: "noop",
    });
    expect(dispatchedResults({ view: [] })[2]).toEqual({
      kind: "noop",
    });
    expect(dispatchedResults({ skillReady: { 213: false }, view: [] })[2]).toEqual({
      kind: "noop",
    });
  });

  it("no action result uses the retired delegate bridge", () => {
    expect(
      dispatchedResults({ monsters: [], skillReady: {}, playerEffects: [] }).map(
        (result) => result.kind
      )
    ).not.toContain("delegate");
  });
});

describe("runBattleActionDecision stall Imperil contract", () => {
  const stallSnap = (over = {}) => ({
    skillReady: { 213: true },
    oc: 100,
    monsterAlive: 1,
    roundAll: 3,
    roundNow: 1,
    view: [{ id: 1, order: 0, isDead: false, isBoss: true, hpPercent: 0.6, buffs: [] }],
    monsters: [{ id: 1, order: 0, isDead: false, isBoss: true }],
    ...over,
  });

  it("stall 中 debuff 入口跳过 boss imperil 和全体 Imperil", () => {
    const results = dispatchedResults(stallSnap(), {
      stallMode: true,
      debuffSkillSwitch: true,
      debuffSkillAllIm: true,
    });

    expect(results[2]).toEqual({ kind: "noop" });
  });

  it("stallMode:false 时 bossImperil 恢复", () => {
    expect(dispatchedResults(stallSnap(), { stallMode: false })[2]).toEqual({
      kind: "click-skill-then-target",
      skillId: "213",
      targetId: 1,
    });
  });

  it("非 stall 时 bossImperil 不受影响", () => {
    expect(
      dispatchedResults({
        skillReady: { 213: true },
        view: [{ id: 1, order: 0, isDead: false, isBoss: true, buffs: [] }],
      })[2]
    ).toEqual({
      kind: "click-skill-then-target",
      skillId: "213",
      targetId: 1,
    });
  });

  it("burstControl 未开启时入口自行返回 noop", () => {
    expect(dispatchedResults()[2]).toEqual({ kind: "noop" });
  });
});
