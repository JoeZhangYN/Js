import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanupNextBattleArbitrationFixture,
  mocks,
  resetNextBattleArbitrationFixture,
  setIdleDelay,
} from "./next-battle-arbitration-test-fixture.js";

const {
  createNextBattleArbitrationCapability,
  NextBattleArbitrationEvent,
  NextBattleArbitrationStatus,
} = await import("./next-battle-arbitration.js");

beforeEach(resetNextBattleArbitrationFixture);
afterEach(cleanupNextBattleArbitrationFixture);

describe("next battle arbitration guards", () => {
  it("blocks both battle paths when repair does not become ready", async () => {
    mocks.runRepairAutomation.mockResolvedValue({ status: "blocked", reason: "repairStuck" });
    const capability = createNextBattleArbitrationCapability({ randomEncounter: true });

    const outcome = await capability.run({ type: NextBattleArbitrationEvent.PLAN });

    expect(outcome).toMatchObject({ status: NextBattleArbitrationStatus.BLOCKED });
    expect(mocks.runEncounterAutomation).not.toHaveBeenCalled();
    expect(mocks.runIdleArenaAutomation).not.toHaveBeenCalled();
  });

  it("cancels an armed wake when stamina stops automatic battles", async () => {
    const capability = createNextBattleArbitrationCapability({ randomEncounter: true });
    await capability.run({ type: NextBattleArbitrationEvent.PLAN });
    mocks.runStaminaAutomation.mockReturnValue(true);

    const outcome = await capability.run({ type: NextBattleArbitrationEvent.PLAN });

    expect(outcome).toMatchObject({
      status: NextBattleArbitrationStatus.BLOCKED,
      reason: "staminaStop",
    });
    expect(vi.getTimerCount()).toBe(0);
    expect(mocks.runEncounterAutomation).toHaveBeenCalledOnce();
  });

  it("rechecks repair and encounter after idle token preparation before starting battle", async () => {
    setIdleDelay(0);
    mocks.runEncounterAutomation
      .mockResolvedValueOnce({
        status: "waiting",
        reason: "cooldown",
        resumeAtMs: Date.now() + 300000,
      })
      .mockResolvedValueOnce({ status: "claimed", reason: "encounterEntered" });
    mocks.runIdleArenaAutomation.mockImplementation((event) =>
      event.type === "planNextBattle"
        ? { status: "planned", reason: "idleArenaDelay", deadlineMs: event.nowMs }
        : { status: "prepared", reason: "tokensReady" }
    );
    const capability = createNextBattleArbitrationCapability({ randomEncounter: true });

    const outcome = await capability.run({ type: NextBattleArbitrationEvent.PLAN });

    expect(outcome.status).toBe(NextBattleArbitrationStatus.ENCOUNTER_CLAIMED);
    expect(mocks.runRepairAutomation).toHaveBeenCalledTimes(2);
    expect(mocks.runEncounterAutomation).toHaveBeenCalledTimes(2);
    expect(mocks.runIdleArenaAutomation).toHaveBeenCalledTimes(2);
  });

  it("reports stamina recovery request separately from an idle battle request", async () => {
    setIdleDelay(0);
    mocks.runIdleArenaAutomation.mockImplementation((event) =>
      event.type === "planNextBattle"
        ? { status: "planned", reason: "idleArenaDelay", deadlineMs: event.nowMs }
        : { status: "recoveryRequested", reason: "staminaRecovery" }
    );
    const capability = createNextBattleArbitrationCapability({ randomEncounter: true });

    const outcome = await capability.run({ type: NextBattleArbitrationEvent.PLAN });

    expect(outcome.status).toBe(NextBattleArbitrationStatus.STAMINA_RECOVERY_REQUESTED);
  });

  it("binds Isekai without a reachable encounter branch", async () => {
    setIdleDelay(0);
    const capability = createNextBattleArbitrationCapability({ randomEncounter: false });

    await capability.run({ type: NextBattleArbitrationEvent.PLAN });

    expect(mocks.isAutomaticEncounterEnabled).not.toHaveBeenCalled();
    expect(mocks.runEncounterAutomation).not.toHaveBeenCalled();
  });

  it("singleflights concurrent planning through the complete repair decision", async () => {
    let finishRepair;
    mocks.runRepairAutomation.mockReturnValue(new Promise((resolve) => (finishRepair = resolve)));
    const capability = createNextBattleArbitrationCapability({ randomEncounter: true });
    const first = capability.run({ type: NextBattleArbitrationEvent.PLAN });
    const second = capability.run({ type: NextBattleArbitrationEvent.PLAN });
    await vi.waitFor(() => expect(mocks.runRepairAutomation).toHaveBeenCalledOnce());
    finishRepair({ status: "ready" });

    await Promise.all([first, second]);

    expect(mocks.runRepairAutomation).toHaveBeenCalledOnce();
    expect(mocks.runEncounterAutomation).toHaveBeenCalledOnce();
  });
});
