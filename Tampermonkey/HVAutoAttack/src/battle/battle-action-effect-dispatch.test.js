// 行动效果分发各 kind 行为回归锁（happy-dom 提供 DOM）。
// 覆盖核心 command/plan kind；alert-and-pause 是现有工具的薄封装，留 HV 运行时验证。
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  BattleActionEffectDispatchEvent,
  runBattleActionEffectDispatch,
} from "./battle-action-effect-dispatch.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";

/** 在 happy-dom 造按钮。opacity!=="0.5" → isOn 视为可用。 */
function mkBtn(id, { disabled = false } = {}) {
  const el = document.createElement("div");
  el.id = id;
  el.style.opacity = disabled ? "0.5" : "1";
  el.click = vi.fn();
  document.body.appendChild(el);
  return el;
}

beforeEach(() => {
  document.body.innerHTML = "";
  window.sessionStorage.clear();
  runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0" } });
  vi.useFakeTimers(); // 防 flee-command 的 scheduleReload 真触发 goto
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

function applyResult(result, snap) {
  return runBattleActionEffectDispatch({
    type: BattleActionEffectDispatchEvent.APPLY_ACTION_RESULT,
    result,
    snap,
  });
}

describe("runBattleActionEffectDispatch", () => {
  it("noop → 不动作，返 false", () => {
    expect(applyResult({ kind: "noop" })).toBe(false);
  });

  it("item-command → clicks the item by id through the item command entry", () => {
    const item = document.createElement("div");
    item.setAttribute("onmouseover", "item 12101");
    item.className = "";
    item.click = vi.fn();
    const slot = document.createElement("div");
    slot.className = "bti3";
    slot.appendChild(item);
    document.body.appendChild(slot);

    expect(applyResult({ kind: "item-command", itemId: 12101 })).toBe(true);

    expect(item.click).toHaveBeenCalledTimes(1);
  });

  it("skill-command → clicks a ready skill through the skill command entry", () => {
    const skill = mkBtn("412");

    expect(applyResult({ kind: "skill-command", skillId: "412" })).toBe(true);

    expect(skill.click).toHaveBeenCalledOnce();
  });

  it("defend-command → clicks Defend through the defend command entry", () => {
    const defend = mkBtn("ckey_defend");

    expect(applyResult({ kind: "defend-command" })).toBe(true);

    expect(defend.click).toHaveBeenCalledOnce();
  });

  it("toggle-spirit → 走 Spirit toggle command，click 并记录", () => {
    const spirit = mkBtn("ckey_spirit");
    expect(applyResult({ kind: "toggle-spirit" })).toBe(true);
    expect(spirit.click).toHaveBeenCalledOnce();
  });

  it("click-skill-then-target(无 preCastSS) → skill+target 双击，返 true", () => {
    const skill = mkBtn("213");
    const target = document.createElement("div");
    target.id = "mkey_3";
    target.click = vi.fn();
    document.body.appendChild(target);
    const r = applyResult({ kind: "click-skill-then-target", skillId: "213", targetId: 3 });
    expect(r).toBe(true);
    expect(skill.click).toHaveBeenCalledOnce();
    expect(target.click).toHaveBeenCalledOnce();
  });

  it("click-skill-then-target 目标已死(nbardead) → 返 false 不发 skill", () => {
    const skill = mkBtn("213");
    const target = document.createElement("div");
    target.id = "mkey_3";
    target.innerHTML = '<img src="x/nbardead.png">';
    target.click = vi.fn();
    document.body.appendChild(target);
    const r = applyResult({ kind: "click-skill-then-target", skillId: "213", targetId: 3 });
    expect(r).toBe(false);
    expect(skill.click).not.toHaveBeenCalled();
  });

  it("flee-command → click 逃跑按钮，返 true", () => {
    const flee = mkBtn("1001");
    expect(applyResult({ kind: "flee-command" })).toBe(true);
    expect(flee.click).toHaveBeenCalledOnce();
  });

  it("pause → pause automation 暂停，返 true", () => {
    expect(applyResult({ kind: "pause" })).toBe(true);
  });

  it("retired halt kind → 返 false", () => {
    expect(applyResult({ kind: "halt", reason: "acted" })).toBe(false);
  });

  it("未知 kind → 返 false（default 兜底）", () => {
    expect(applyResult({ kind: "??" })).toBe(false);
  });

  it("retired generic click kind → 返 false", () => {
    const btn = mkBtn("111");

    expect(applyResult({ kind: "click", selector: "111" })).toBe(false);

    expect(btn.click).not.toHaveBeenCalled();
  });

  it("rejects unknown events", () => {
    expect(runBattleActionEffectDispatch({ type: "unknown" })).toBe(false);
    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleActionEffect"))).toMatchObject({
      result: {
        kind: "unknown-dispatch-event",
        reason: "unknownActionEffectDispatchEvent",
        eventType: "unknown",
      },
      acted: false,
    });
  });

  it("rejects null events with structured evidence instead of throwing", () => {
    expect(runBattleActionEffectDispatch(null)).toBe(false);
    expect(JSON.parse(window.sessionStorage.getItem("HVAA:lastBattleActionEffect"))).toMatchObject({
      result: {
        kind: "unknown-dispatch-event",
        reason: "unknownActionEffectDispatchEvent",
        eventType: null,
      },
      acted: false,
    });
  });
});
