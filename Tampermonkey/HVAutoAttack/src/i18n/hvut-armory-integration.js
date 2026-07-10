import { ArmoryPageKind } from "./hvut-armory-page-reader.js";

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
      const stages = [];
      const empty = [];
      const failures = [];
      for (let index = 0; index < categories.length; index += 1) {
        const category = categories[index];
        let status = ArmoryCategoryStatus.FAILED;
        try {
          const page = await loadWithRecovery(deps, event.screen, category);
          if (page.kind === ArmoryPageKind.TABLE) {
            const stage = await deps.stageCategory(page, event.screen);
            if (stage?.kind === "table") {
              stages.push(stage);
              status = ArmoryCategoryStatus.STAGED;
            } else if (stage?.kind === "empty") {
              empty.push(category.key);
              status = ArmoryCategoryStatus.EMPTY;
            } else {
              const failure = failureOf({ ...page, kind: stage?.reason || "stageRejected" });
              failures.push(failure);
              deps.recordFailure("categoryStageRejected", failure);
            }
          } else if (page.kind === ArmoryPageKind.EMPTY) {
            empty.push(category.key);
            status = ArmoryCategoryStatus.EMPTY;
          } else {
            const failure = failureOf(page);
            failures.push(failure);
            deps.recordFailure("categoryLoadRejected", failure);
          }
        } catch (error) {
          const failure = {
            category: category.key,
            reason: "categoryExecutionFailed",
            detail: { error: error?.message || String(error) },
          };
          failures.push(failure);
          deps.recordFailure("categoryExecutionFailed", failure);
        }
        deps.reportCategory({
          screen: event.screen,
          category: category.key,
          status,
          index,
          total: categories.length,
        });
        if (index < categories.length - 1) await deps.wait(deps.requestDelayMs);
      }

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
