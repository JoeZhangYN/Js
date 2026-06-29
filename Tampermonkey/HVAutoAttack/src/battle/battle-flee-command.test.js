import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { BattleFleeCommandEvent, runBattleFleeCommand } from "./battle-flee-command.js";

function mkFleeButton() {
  const el = document.createElement("div");
  el.id = "1001";
  el.click = vi.fn();
  document.body.appendChild(el);
  return el;
}

beforeEach(() => {
  document.body.innerHTML = "";
  vi.useFakeTimers();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe("runBattleFleeCommand", () => {
  it("clicks the flee button and schedules the battle reload", () => {
    const flee = mkFleeButton();

    expect(runBattleFleeCommand({ type: BattleFleeCommandEvent.CLICK_AND_RELOAD })).toBeTruthy();

    expect(flee.click).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(1);
  });

  it("does not schedule reload when the flee button is missing", () => {
    expect(runBattleFleeCommand({ type: BattleFleeCommandEvent.CLICK_AND_RELOAD })).toBe(false);

    expect(vi.getTimerCount()).toBe(0);
  });
});
