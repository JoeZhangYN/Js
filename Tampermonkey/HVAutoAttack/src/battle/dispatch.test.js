// Commit 3：dispatch 各 kind 行为回归锁（happy-dom 提供 DOM）。
// 覆盖核心 DOM-click 系 kind；alert-and-pause 是现有工具的薄封装，留 HV 运行时验证。
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { dispatch } from "./dispatch.js";
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
  runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0" } });
  vi.useFakeTimers(); // 防 click-then-reload 的 scheduleReload 真触发 goto
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe("dispatch", () => {
  it("noop → 不动作，返 false", () => {
    expect(dispatch({ kind: "noop" })).toBe(false);
  });

  it("click 可用按钮 → 命中 click，返 true", () => {
    const btn = mkBtn("111");
    expect(dispatch({ kind: "click", selector: "111" })).toBe(true);
    expect(btn.click).toHaveBeenCalledOnce();
  });

  it("click 禁用按钮(opacity .5) → 返 false 不 click", () => {
    const btn = mkBtn("111", { disabled: true });
    expect(dispatch({ kind: "click", selector: "111" })).toBe(false);
    expect(btn.click).not.toHaveBeenCalled();
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

    expect(dispatch({ kind: "item-command", itemId: 12101 })).toBe(true);

    expect(item.click).toHaveBeenCalledTimes(1);
  });

  it("skill-command → clicks a ready skill through the skill command entry", () => {
    const skill = mkBtn("412");

    expect(dispatch({ kind: "skill-command", skillId: "412" })).toBe(true);

    expect(skill.click).toHaveBeenCalledOnce();
  });

  it("toggle-spirit → 走 Spirit toggle command，click 并记录", () => {
    const spirit = mkBtn("ckey_spirit");
    expect(dispatch({ kind: "toggle-spirit" })).toBe(true);
    expect(spirit.click).toHaveBeenCalledOnce();
  });

  it("click-skill-then-target(无 preCastSS) → skill+target 双击，返 true", () => {
    const skill = mkBtn("213");
    const target = document.createElement("div");
    target.id = "mkey_3";
    target.click = vi.fn();
    document.body.appendChild(target);
    const r = dispatch({ kind: "click-skill-then-target", skillId: "213", targetId: 3 });
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
    const r = dispatch({ kind: "click-skill-then-target", skillId: "213", targetId: 3 });
    expect(r).toBe(false);
    expect(skill.click).not.toHaveBeenCalled();
  });

  it("click-then-reload → click 逃跑按钮，返 true", () => {
    const flee = mkBtn("1001");
    expect(dispatch({ kind: "click-then-reload", selector: "1001", delaySec: 3 })).toBe(true);
    expect(flee.click).toHaveBeenCalledOnce();
  });

  it("pause → pause automation 暂停，返 true", () => {
    expect(dispatch({ kind: "pause" })).toBe(true);
  });

  it("halt → 返 true", () => {
    expect(dispatch({ kind: "halt", reason: "acted" })).toBe(true);
  });

  it("未知 kind → 返 false（default 兜底）", () => {
    expect(dispatch({ kind: "??" })).toBe(false);
  });
});
