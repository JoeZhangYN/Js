import { UserFeedbackEvent, runUserFeedbackAutomation } from "../core/lang.js";
import {
  EncounterGenerationIncidentEvent,
  runEncounterGenerationIncident,
} from "./encounter-generation-incident.js";

function buildIncident(generation, source) {
  const attemptKey = generation.state?.generationAttemptKey || "unknown";
  const sourceIdentity =
    typeof source === "string" ? source : source?.identity || source?.pageKind || "unknown";
  const recoveryEpisode =
    generation.recoveryEpisode || generation.state?.generationFailureCount || "entry";
  return {
    schemaVersion: 1,
    id: `encounter-generation:${attemptKey}:${generation.reason || "unknown"}:${sourceIdentity}:${recoveryEpisode}`,
    capability: "encounterGeneration",
    stage: "generationResult",
    reason: generation.reason,
    sourceIdentity,
    request: generation.request,
    response: generation.result,
    recovery: generation.recovery,
    persistence: generation.persistence,
    attemptKey,
    recoveryEpisode,
    blockedAt: Date.now(),
    page: globalThis.location?.href || "unknown",
    display: { status: "pending" },
  };
}

export function showEncounterGenerationBlock(generation, source) {
  const incident = buildIncident(generation, source);
  const incidentPersistence = runEncounterGenerationIncident({
    type: EncounterGenerationIncidentEvent.RECORD,
    incident,
    requiresShared: generation.source?.pageKind === "ehentai",
  });
  const evidence = {
    capability: "encounterGeneration",
    stage: "generationResult",
    reason: generation.reason,
    source,
    generation,
    incident,
    incidentPersistence,
  };
  if (incidentPersistence.kind === "alreadyActive") {
    evidence.feedbackDeduplicated = true;
    return { action: "blocked", blocked: true, claimed: false, handled: true, evidence };
  }
  try {
    runUserFeedbackAutomation({
      type: UserFeedbackEvent.BLOCKING_ERROR,
      incident: incident.id,
      copy: {
        l0: "自动遭遇战已阻断，请复制诊断信息后反馈。",
        l1: "自動遭遇戰已阻斷，請複製診斷資訊後回報。",
        l2: "Automatic encounter was blocked. Copy the diagnostic report for support.",
      },
      evidence,
    });
    evidence.feedbackShown = true;
    evidence.displayPersistence = runEncounterGenerationIncident({
      type: EncounterGenerationIncidentEvent.MARK_DISPLAYED,
      incident,
      status: "shown",
    });
  } catch (error) {
    evidence.feedbackShown = false;
    evidence.feedbackError = error?.message || String(error);
    evidence.displayPersistence = runEncounterGenerationIncident({
      type: EncounterGenerationIncidentEvent.MARK_DISPLAYED,
      incident,
      status: "failed",
      error: evidence.feedbackError,
    });
  }
  return { action: "blocked", blocked: true, claimed: false, handled: true, evidence };
}
