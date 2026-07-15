import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createNextBattleWakeSchedule } from "./next-battle-wake-schedule.js";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("next battle wake schedule", () => {
  it("keeps one exact timer for the same owner and deadline", async () => {
    const onWake = vi.fn();
    const onFailure = vi.fn();
    const schedule = createNextBattleWakeSchedule({ onWake, onFailure });
    const candidate = { owner: "encounter", deadlineMs: 5000, reason: "cooldown" };

    expect(schedule.arm(candidate, 1000)).toBe(true);
    expect(schedule.arm(candidate, 1000)).toBe(true);
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(3999);
    expect(onWake).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    expect(onWake).toHaveBeenCalledOnce();
    expect(onFailure).not.toHaveBeenCalled();
  });

  it("fails closed when a pending wake cannot be cancelled", () => {
    const onFailure = vi.fn();
    const schedule = createNextBattleWakeSchedule({ onWake: vi.fn(), onFailure });
    expect(schedule.arm({ owner: "idleArena", deadlineMs: 5000 }, 1000)).toBe(true);
    vi.stubGlobal(
      "clearTimeout",
      vi.fn(() => {
        throw new Error("cancel blocked");
      })
    );

    expect(schedule.cancel()).toBe(false);
    expect(onFailure).toHaveBeenCalledWith("cancelWake", expect.any(Error));
  });

  it("reports timer creation failure without claiming a scheduled wake", () => {
    const onFailure = vi.fn();
    const schedule = createNextBattleWakeSchedule({ onWake: vi.fn(), onFailure });
    vi.stubGlobal(
      "setTimeout",
      vi.fn(() => {
        throw new Error("timer blocked");
      })
    );

    expect(schedule.arm({ owner: "encounter", deadlineMs: 5000 }, 1000)).toBe(false);
    expect(onFailure).toHaveBeenCalledWith("scheduleWake", expect.any(Error));
  });
});
