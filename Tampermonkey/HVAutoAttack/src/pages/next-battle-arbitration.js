// 下一场战斗唯一仲裁入口：修理门控后，按绝对截止时间统一遭遇战与闲置竞技场。
import { IdleArenaEvent, runIdleArenaAutomation } from "../arena/idle-arena.js";
import { IdleArenaStartStatus } from "../arena/idle-arena-outcome.js";
import { RepairEvent, RepairStatus, runRepairAutomation } from "../repair/repair-orchestrator.js";
import { StaminaEvent, runStaminaAutomation } from "../state/stamina.js";
import { EncounterLobbyStatus } from "./encounter.js";
import { recordNextBattleArbitrationFailure } from "./next-battle-arbitration-failure.js";
import { createNextBattleEncounterCheck } from "./next-battle-encounter-check.js";
import {
  chooseNextBattleCandidate,
  readIdleArenaClaim,
  readEncounterBattleCandidate,
} from "./next-battle-policy.js";
import { createNextBattleWakeSchedule } from "./next-battle-wake-schedule.js";
import { isNextBattleOptionEnabled } from "./next-battle-option.js";
import {
  createIdleArenaRequestOutcome,
  createIdleArenaUnavailableOutcome,
  NextBattleArbitrationStatus,
} from "./next-battle-outcome.js";

const EVENT_PLAN = "plan";

export const NextBattleArbitrationEvent = Object.freeze({
  PLAN: EVENT_PLAN,
});

export { NextBattleArbitrationStatus } from "./next-battle-outcome.js";

export function createNextBattleArbitrationCapability({ randomEncounter }) {
  let idlePlan = null;
  let pendingPlan = null;
  let capability;
  const wakeSchedule = createNextBattleWakeSchedule({
    onWake: () => capability.run({ type: EVENT_PLAN, source: "timer" }),
    onFailure: recordNextBattleArbitrationFailure,
  });
  const checkEncounter = createNextBattleEncounterCheck({
    randomEncounter,
    onFailure: recordNextBattleArbitrationFailure,
  });

  async function checkRepair() {
    if (!isNextBattleOptionEnabled("repair")) {
      return { status: RepairStatus.READY, reason: "disabled" };
    }
    return runRepairAutomation({ type: RepairEvent.START });
  }

  function ensureIdlePlan(nowMs) {
    if (!isNextBattleOptionEnabled("idleArena")) {
      idlePlan = null;
      return undefined;
    }
    if (!idlePlan) {
      const plan = runIdleArenaAutomation({ type: IdleArenaEvent.PLAN_NEXT_BATTLE, nowMs });
      if (plan?.status !== "planned" || !Number.isFinite(plan.deadlineMs)) return undefined;
      idlePlan = plan;
    }
    return { owner: "idleArena", deadlineMs: idlePlan.deadlineMs, reason: idlePlan.reason };
  }

  async function startIdleArena(encounter) {
    if (!wakeSchedule.cancel()) {
      return {
        status: NextBattleArbitrationStatus.UNKNOWN,
        reason: "timerCancelRejected",
        encounter,
      };
    }
    idlePlan = null;
    const idleArena = await runIdleArenaAutomation({ type: IdleArenaEvent.START_NEXT_BATTLE });
    if (idleArena?.status === IdleArenaStartStatus.PREPARED) {
      idlePlan = { deadlineMs: Date.now(), reason: "idleArenaPrepared" };
      return planNextBattle();
    }
    const decisionNowMs = Date.now();
    const retry = readEncounterBattleCandidate(encounter, decisionNowMs);
    const claim = readIdleArenaClaim(idleArena);
    if (!claim) {
      const scheduled = retry ? wakeSchedule.arm(retry, decisionNowMs) : false;
      return createIdleArenaUnavailableOutcome(encounter, idleArena, retry, scheduled);
    }
    return createIdleArenaRequestOutcome(encounter, idleArena, claim);
  }

  async function planNextBattle() {
    if (runStaminaAutomation({ type: StaminaEvent.SHOULD_STOP_AUTOMATIC_BATTLE })) {
      wakeSchedule.cancel();
      idlePlan = null;
      return {
        status: NextBattleArbitrationStatus.BLOCKED,
        reason: "staminaStop",
      };
    }
    const repair = await checkRepair();
    if (repair?.status !== RepairStatus.READY) {
      wakeSchedule.cancel();
      return {
        status: NextBattleArbitrationStatus.BLOCKED,
        reason: repair?.reason || "repairNotReady",
        repair,
      };
    }

    const encounter = await checkEncounter(Date.now());
    if (encounter?.status === EncounterLobbyStatus.CLAIMED) {
      wakeSchedule.cancel();
      idlePlan = null;
      return {
        status: NextBattleArbitrationStatus.ENCOUNTER_CLAIMED,
        reason: encounter.reason,
        repair,
        encounter,
      };
    }

    const decisionNowMs = Date.now();
    const idle = ensureIdlePlan(decisionNowMs);
    if (idle && idle.deadlineMs <= decisionNowMs) return startIdleArena(encounter);

    const next = chooseNextBattleCandidate(
      readEncounterBattleCandidate(encounter, decisionNowMs),
      idle
    );
    if (!next) {
      wakeSchedule.cancel();
      return {
        status:
          encounter?.status === EncounterLobbyStatus.DEGRADED
            ? NextBattleArbitrationStatus.UNKNOWN
            : NextBattleArbitrationStatus.INACTIVE,
        reason: encounter?.reason || "noBattleCandidate",
        repair,
        encounter,
      };
    }
    const scheduled = wakeSchedule.arm(next, decisionNowMs);
    return {
      status: scheduled
        ? NextBattleArbitrationStatus.SCHEDULED
        : NextBattleArbitrationStatus.UNKNOWN,
      reason: scheduled ? next.reason : "timerRejected",
      repair,
      encounter,
      next: { owner: next.owner, deadlineMs: next.deadlineMs },
    };
  }

  capability = Object.freeze({
    run(event = { type: EVENT_PLAN }) {
      if (event?.type !== EVENT_PLAN) return Promise.resolve(undefined);
      if (pendingPlan) return pendingPlan;
      pendingPlan = Promise.resolve()
        .then(planNextBattle)
        .finally(() => {
          pendingPlan = null;
        });
      return pendingPlan;
    },
  });
  return capability;
}
