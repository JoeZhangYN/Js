import { describe, expect, it, vi } from "vitest";
import { BattleActionStartEvent, runBattleActionStartAutomation } from "./battle-action-start.js";

describe("runBattleActionStartAutomation", () => {
  it("starts action delay before monitor action tracking", () => {
    const deps = {
      startDelay: vi.fn(),
      monitorActionStarted: vi.fn(),
    };

    expect(
      runBattleActionStartAutomation({ type: BattleActionStartEvent.ACTION_STARTED }, deps)
    ).toBe(true);

    expect(deps.startDelay).toHaveBeenCalledTimes(1);
    expect(deps.monitorActionStarted).toHaveBeenCalledTimes(1);
    expect(deps.startDelay.mock.invocationCallOrder[0]).toBeLessThan(
      deps.monitorActionStarted.mock.invocationCallOrder[0]
    );
  });

  it("rejects unknown events", () => {
    expect(runBattleActionStartAutomation({ type: "unknown" })).toBe(false);
  });
});
