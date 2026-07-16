import {
  classifyEncounterGenerationResult,
  EncounterGenerationFailureReason,
} from "./encounter-generation-result.js";
import { readEncounterGenerationResponse } from "./encounter-generation-response.js";

const ENCOUNTER_GENERATION_REQUEST_TIMEOUT_MS = 15_000;

function classifyResponse(response, request, deps) {
  return classifyEncounterGenerationResult(
    readEncounterGenerationResponse(
      {
        html: response.responseText || response.response || "",
        status: response.status,
        requestedUrl: request.url,
        finalUrl: response.finalUrl,
      },
      deps
    )
  );
}

function recordTransportFailure(reason, detail, event, deps) {
  return deps.recordResult({
    ...event,
    result: classifyEncounterGenerationResult({ transportFailure: { reason, detail } }),
  });
}

function terminalRecoveryFailure(reason, detail, event, error) {
  return {
    status: "persistenceFailed",
    reason: "generationRecoveryFailed",
    result: classifyEncounterGenerationResult({ transportFailure: { reason, detail } }),
    request: event.request,
    source: event.source,
    state: event.state,
    persisted: false,
    blocked: true,
    recoveryFailure: error?.message || String(error),
  };
}

export function executeEncounterGenerationRequest(event, deps) {
  const request = event.request;
  if (!request?.url) {
    const detail = { reason: "missingGenerationRequest" };
    deps.warn("load-key-request", detail);
    return Promise.resolve(
      recordTransportFailure(EncounterGenerationFailureReason.REQUEST_FAILED, detail, event, deps)
    );
  }
  const snapshot = event.state ? { ok: true, state: event.state } : deps.readState();
  if (!snapshot?.ok) {
    return Promise.resolve(deps.recordResult({ ...event, stateSnapshot: snapshot }));
  }
  const generationEvent = { ...event, state: snapshot.state };
  return new Promise((resolve) => {
    let settled = false;
    let watchdog;
    const finish = (stage, reason, detail, produce) => {
      if (settled) return;
      settled = true;
      clearTimeout(watchdog);
      try {
        resolve(produce());
      } catch (error) {
        const failure = { ...detail, error: error?.message || String(error) };
        deps.warn("load-key-callback-exception", { stage, ...failure });
        try {
          resolve(recordTransportFailure(reason, failure, generationEvent, deps));
        } catch (recoveryError) {
          resolve(terminalRecoveryFailure(reason, failure, generationEvent, recoveryError));
        }
      }
    };
    const finishTransport = (stage, reason, detail) =>
      finish(stage, reason, detail, () => {
        deps.warn(stage, detail);
        return recordTransportFailure(reason, detail, generationEvent, deps);
      });
    watchdog = setTimeout(
      () =>
        finishTransport("load-key-timeout", EncounterGenerationFailureReason.REQUEST_TIMEOUT, {
          url: request.url,
          source: "watchdog",
        }),
      ENCOUNTER_GENERATION_REQUEST_TIMEOUT_MS
    );
    try {
      deps.gmXhr({
        method: request.method || "GET",
        url: request.url,
        responseType: "text",
        timeout: ENCOUNTER_GENERATION_REQUEST_TIMEOUT_MS,
        onload: (response) => {
          if (response.status && (response.status < 200 || response.status >= 400)) {
            const detail = { status: response.status, url: request.url };
            finishTransport(
              "load-key-http",
              EncounterGenerationFailureReason.REQUEST_REJECTED,
              detail
            );
            return;
          }
          finish("load-key-response", EncounterGenerationFailureReason.REQUEST_FAILED, {}, () =>
            deps.recordResult({
              ...generationEvent,
              result: classifyResponse(response, request, deps),
            })
          );
        },
        onerror: (failure) =>
          finishTransport(
            "load-key-error",
            EncounterGenerationFailureReason.REQUEST_FAILED,
            failure
          ),
        ontimeout: () =>
          finishTransport("load-key-timeout", EncounterGenerationFailureReason.REQUEST_TIMEOUT, {
            url: request.url,
            source: "gm",
          }),
        onabort: () =>
          finishTransport("load-key-abort", EncounterGenerationFailureReason.REQUEST_FAILED, {
            url: request.url,
          }),
      });
    } catch (error) {
      const detail = { error: error?.message || String(error), url: request.url };
      finishTransport(
        "load-key-exception",
        EncounterGenerationFailureReason.REQUEST_FAILED,
        detail
      );
    }
  });
}
