import { ArmoryPageKind } from "./hvut-armory-page-reader.js";

export const ArmoryIntegrationEvent = Object.freeze({
  INTEGRATE_ALL: "integrateAll",
  RETRY_FAILED: "retryFailed",
});

const TRANSIENT_KINDS = new Set([ArmoryPageKind.LIMITED, ArmoryPageKind.REQUEST_FAILED]);

function waitDefault(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadWithRecovery(deps, screen, category) {
  let result = await deps.pageReader.read({ screen, category });
  if (!TRANSIENT_KINDS.has(result.kind)) return result;
  await deps.wait(deps.retryDelayMs);
  result = await deps.pageReader.read({ screen, category });
  return result;
}

function failureOf(result) {
  return {
    category: result.category?.key || result.detail?.category || "unknown",
    reason: result.kind,
    detail: result.detail || {},
  };
}

export function createArmoryIntegrationCapability(options) {
  const deps = {
    wait: waitDefault,
    requestDelayMs: 300,
    retryDelayMs: 1200,
    ...options,
  };
  let failedCategories = [];

  async function integrate(event) {
    const retrying = event.type === ArmoryIntegrationEvent.RETRY_FAILED;
    const categories = retrying ? failedCategories : deps.readCategories();
    if (!categories.length) {
      const detail = { screen: event.screen, reason: "categoryCatalogEmpty" };
      deps.recordFailure("categoryCatalogEmpty", detail);
      deps.preserve({ outcome: "failed", failures: [detail] });
      return { outcome: "failed", stages: [], failures: [detail] };
    }

    const stages = [];
    const empty = [];
    const failures = [];
    for (let index = 0; index < categories.length; index += 1) {
      const category = categories[index];
      const page = await loadWithRecovery(deps, event.screen, category);
      if (page.kind === ArmoryPageKind.TABLE) {
        const stage = await deps.stageCategory(page, event.screen);
        if (stage?.kind === "table") stages.push(stage);
        else if (stage?.kind === "empty") empty.push(category.key);
        else failures.push(failureOf({ ...page, kind: stage?.reason || "stageRejected" }));
      } else if (page.kind === ArmoryPageKind.EMPTY) {
        empty.push(category.key);
      } else {
        failures.push(failureOf(page));
        deps.recordFailure("categoryLoadRejected", failureOf(page));
      }
      if (index < categories.length - 1) await deps.wait(deps.requestDelayMs);
    }

    failedCategories = categories.filter((category) =>
      failures.some((failure) => failure.category === category.key)
    );
    const outcome = failures.length ? (stages.length || empty.length ? "partial" : "failed") : "complete";
    const result = { outcome, stages, empty, failures, retrying };
    if (outcome === "failed") deps.preserve(result);
    else {
      await deps.commit(result);
      deps.retranslate();
    }
    if (failures.length) {
      deps.recordFailure("integrateIncomplete", {
        screen: event.screen,
        outcome,
        failedFilters: failures.map((failure) => failure.category),
        failures,
      });
    }
    return result;
  }

  return Object.freeze({ run: integrate });
}
