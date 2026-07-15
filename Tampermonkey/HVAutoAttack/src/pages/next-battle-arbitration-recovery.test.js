import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanupNextBattleArbitrationFixture,
  mocks,
  resetNextBattleArbitrationFixture,
  setIdleDelay,
  setNextBattleOption,
  START,
} from "./next-battle-arbitration-test-fixture.js";

const {
  createNextBattleArbitrationCapability,
  NextBattleArbitrationEvent,
  NextBattleArbitrationStatus,
} = await import("./next-battle-arbitration.js");

beforeEach(resetNextBattleArbitrationFixture);
afterEach(cleanupNextBattleArbitrationFixture);

describe("next battle recovery arbitration", () => {
  it("allows an already-due idle battle while encounter recovery is degraded", async () => {
    setIdleDelay(0);
    mocks.runEncounterAutomation.mockResolvedValue({
      status: "degraded",
      reason: "generationBackoff",
      resumeAtMs: START + 5 * 60 * 1000,
    });
    const capability = createNextBattleArbitrationCapability({ randomEncounter: true });

    const outcome = await capability.run({ type: NextBattleArbitrationEvent.PLAN });

    expect(outcome).toMatchObject({
      status: NextBattleArbitrationStatus.IDLE_ARENA_START_REQUESTED,
      encounter: { status: "degraded" },
    });
  });

  it("keeps idle arena available after encounters stop for the day", async () => {
    setIdleDelay(0);
    mocks.runEncounterAutomation.mockResolvedValue({
      status: "stoppedForDay",
      reason: "stoppedForDay",
      resumeAtMs: START + 23 * 60 * 60 * 1000,
    });
    const capability = createNextBattleArbitrationCapability({ randomEncounter: true });

    const outcome = await capability.run({ type: NextBattleArbitrationEvent.PLAN });

    expect(outcome.status).toBe(NextBattleArbitrationStatus.IDLE_ARENA_START_REQUESTED);
  });

  it("schedules the encounter retry before a later idle deadline after encounter rejection", async () => {
    setIdleDelay(10 * 60 * 1000);
    mocks.runEncounterAutomation.mockRejectedValue(new Error("encounter rejected"));
    const capability = createNextBattleArbitrationCapability({ randomEncounter: true });

    const outcome = await capability.run({ type: NextBattleArbitrationEvent.PLAN });

    expect(outcome).toMatchObject({
      status: NextBattleArbitrationStatus.SCHEDULED,
      next: { owner: "encounter", deadlineMs: START + 5 * 60 * 1000 },
    });
  });

  it("keeps an encounter retry wake when idle arena is disabled", async () => {
    setNextBattleOption("idleArena", false);
    mocks.runEncounterAutomation.mockRejectedValue(new Error("encounter rejected"));
    const capability = createNextBattleArbitrationCapability({ randomEncounter: true });

    const outcome = await capability.run({ type: NextBattleArbitrationEvent.PLAN });

    expect(outcome).toMatchObject({
      status: NextBattleArbitrationStatus.SCHEDULED,
      next: { owner: "encounter", deadlineMs: START + 5 * 60 * 1000 },
    });
    expect(vi.getTimerCount()).toBe(1);
  });

  it("does not report idle success when no idle candidate can start", async () => {
    setIdleDelay(0);
    mocks.runIdleArenaAutomation.mockImplementation((event) =>
      event.type === "planNextBattle"
        ? { status: "planned", reason: "idleArenaDelay", deadlineMs: event.nowMs }
        : { status: "unavailable", reason: "noCandidate" }
    );
    const capability = createNextBattleArbitrationCapability({ randomEncounter: true });

    const outcome = await capability.run({ type: NextBattleArbitrationEvent.PLAN });

    expect(outcome).toMatchObject({
      status: NextBattleArbitrationStatus.SCHEDULED,
      idleArena: { status: "unavailable" },
      next: { owner: "encounter", deadlineMs: START + 5 * 60 * 1000 },
    });
  });
});
