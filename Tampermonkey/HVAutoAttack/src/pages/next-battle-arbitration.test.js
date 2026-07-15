import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanupNextBattleArbitrationFixture,
  mocks,
  resetNextBattleArbitrationFixture,
  setIdleDelay,
  START,
  waitingAfter,
} from "./next-battle-arbitration-test-fixture.js";

const {
  createNextBattleArbitrationCapability,
  NextBattleArbitrationEvent,
  NextBattleArbitrationStatus,
} = await import("./next-battle-arbitration.js");

beforeEach(() => {
  resetNextBattleArbitrationFixture();
});

afterEach(() => {
  cleanupNextBattleArbitrationFixture();
});

describe("next battle arbitration", () => {
  it("checks repair before encounter and only then starts the idle countdown", async () => {
    const capability = createNextBattleArbitrationCapability({ randomEncounter: true });

    const outcome = await capability.run({ type: NextBattleArbitrationEvent.PLAN });

    expect(outcome).toMatchObject({
      status: NextBattleArbitrationStatus.SCHEDULED,
      next: { owner: "encounter", deadlineMs: START + 5 * 60 * 1000 },
    });
    expect(mocks.runRepairAutomation.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.runEncounterAutomation.mock.invocationCallOrder[0]
    );
    expect(mocks.runEncounterAutomation.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.runIdleArenaAutomation.mock.invocationCallOrder[0]
    );
    expect(vi.getTimerCount()).toBe(1);
  });

  it("uses one exact timer and rechecks encounter before an earlier idle deadline", async () => {
    setIdleDelay(5 * 60 * 1000);
    mocks.runEncounterAutomation
      .mockResolvedValueOnce(waitingAfter(20 * 60 * 1000))
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: "waiting",
          reason: "cooldown",
          resumeAtMs: START + 20 * 60 * 1000,
        })
      );
    const capability = createNextBattleArbitrationCapability({ randomEncounter: true });
    await capability.run({ type: NextBattleArbitrationEvent.PLAN });

    await vi.advanceTimersByTimeAsync(5 * 60 * 1000 - 1);
    expect(mocks.runEncounterAutomation).toHaveBeenCalledTimes(1);
    expect(mocks.runIdleArenaAutomation).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(mocks.runEncounterAutomation).toHaveBeenCalledTimes(2);
    expect(mocks.runIdleArenaAutomation).toHaveBeenLastCalledWith({ type: "startNextBattle" });
    expect(mocks.runEncounterAutomation.mock.invocationCallOrder[1]).toBeLessThan(
      mocks.runIdleArenaAutomation.mock.invocationCallOrder[1]
    );
  });

  it("gives encounter priority when both deadlines are equal", async () => {
    const idleDelayMs = 5 * 60 * 1000;
    setIdleDelay(idleDelayMs);
    mocks.runEncounterAutomation
      .mockResolvedValueOnce(waitingAfter(idleDelayMs))
      .mockResolvedValueOnce({ status: "claimed", reason: "encounterEntered" });
    const capability = createNextBattleArbitrationCapability({ randomEncounter: true });
    await capability.run({ type: NextBattleArbitrationEvent.PLAN });

    await vi.advanceTimersByTimeAsync(idleDelayMs);

    expect(mocks.runEncounterAutomation).toHaveBeenCalledTimes(2);
    expect(mocks.runIdleArenaAutomation).toHaveBeenCalledTimes(1);
  });

  it("starts idle countdown after encounter IO and arms only the remaining exact delay", async () => {
    setIdleDelay(10 * 60 * 1000);
    mocks.runEncounterAutomation.mockImplementationOnce(async () => {
      vi.setSystemTime(START + 2 * 60 * 1000);
      return { status: "waiting", reason: "cooldown", resumeAtMs: START + 5 * 60 * 1000 };
    });
    const capability = createNextBattleArbitrationCapability({ randomEncounter: true });

    const outcome = await capability.run({ type: NextBattleArbitrationEvent.PLAN });

    expect(outcome).toMatchObject({
      status: NextBattleArbitrationStatus.SCHEDULED,
      next: { owner: "encounter", deadlineMs: START + 5 * 60 * 1000 },
    });
    expect(mocks.runIdleArenaAutomation).toHaveBeenCalledWith({
      type: "planNextBattle",
      nowMs: START + 2 * 60 * 1000,
    });
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(3 * 60 * 1000 - 1);
    expect(mocks.runEncounterAutomation).toHaveBeenCalledOnce();
  });
});
