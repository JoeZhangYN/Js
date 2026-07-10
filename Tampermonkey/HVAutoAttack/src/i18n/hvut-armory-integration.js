import { ArmoryPageKind } from "./hvut-armory-page-reader.js";
import { AsyncTaskLayoutEvent, runAsyncTaskLayout } from "../core/async-task-layout.js";

export const ArmoryIntegrationEvent = Object.freeze({
  INTEGRATE_ALL: "integrateAll",
  RETRY_FAILED: "retryFailed",
});

export const ArmoryCategoryStatus = Object.freeze({
  LOADING: "loading",
  STAGED: "staged",
  EMPTY: "empty",
  FAILED: "failed",
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

async function loadCategory(deps, screen, category, index, total) {
  let result;
  try {
    const page = await loadWithRecovery(deps, screen, category);
    if (page.kind === ArmoryPageKind.TABLE) {
      const stage = await deps.stageCategory(page, screen);
      if (stage?.kind === "table") result = { status: ArmoryCategoryStatus.STAGED, stage };
      else if (stage?.kind === "empty") result = { status: ArmoryCategoryStatus.EMPTY, empty: true };
      else {
        const failure = failureOf({ ...page, kind: stage?.reason || "stageRejected" });
        deps.recordFailure("categoryStageRejected", failure);
        result = { status: ArmoryCategoryStatus.FAILED, failure };
      }
    } else if (page.kind === ArmoryPageKind.EMPTY) {
      result = { status: ArmoryCategoryStatus.EMPTY, empty: true };
    } else {
      const failure = failureOf(page);
      deps.recordFailure("categoryLoadRejected", failure);
      result = { status: ArmoryCategoryStatus.FAILED, failure };
    }
  } catch (error) {
    const failure = {
      category: category.key,
      reason: "categoryExecutionFailed",
      detail: { error: error?.message || String(error) },
    };
    deps.recordFailure("categoryExecutionFailed", failure);
    result = { status: ArmoryCategoryStatus.FAILED, failure };
  }
  deps.reportCategory({ screen, category: category.key, status: result.status, index, total });
  return { category, ...result };
}

export function createArmoryIntegrationCapability(options) {
  const deps = {
    wait: waitDefault,
    beginLoading: async () => {},
    reportCategory: () => {},
    restoreLoading: async () => {},
    completeLoading: () => {},
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

    let loadingStarted = true;
    try {
      await deps.beginLoading({ screen: event.screen, categories, retrying });
      const categoryResults = await runAsyncTaskLayout({
        type: AsyncTaskLayoutEvent.PARALLEL,
        items: categories,
        execute: (category, index) =>
          loadCategory(deps, event.screen, category, index, categories.length),
        schedule: deps.schedule,
        staggerMs: deps.requestDelayMs,
      });
      const stages = categoryResults.flatMap((result) => (result.stage ? [result.stage] : []));
      const empty = categoryResults.flatMap((result) => (result.empty ? [result.category.key] : []));
      const failures = categoryResults.flatMap((result) => (result.failure ? [result.failure] : []));

      failedCategories = categories.filter((category) =>
        failures.some((failure) => failure.category === category.key)
      );
      const outcome = failures.length
        ? stages.length || empty.length
          ? "partial"
          : "failed"
        : "complete";
      const result = { outcome, stages, empty, failures, retrying };
      if (outcome === "failed") {
        await deps.restoreLoading(result);
        loadingStarted = false;
        deps.preserve(result);
      } else {
        await deps.commit(result);
        deps.completeLoading(result);
        loadingStarted = false;
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
    } catch (error) {
      if (loadingStarted) await deps.restoreLoading({ outcome: "aborted", retrying });
      deps.recordFailure("integrationExecutionFailed", {
        screen: event.screen,
        error: error?.message || String(error),
      });
      throw error;
    }
  }

  return Object.freeze({ run: integrate });
}
