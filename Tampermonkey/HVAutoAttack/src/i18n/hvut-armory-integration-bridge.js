import { createArmoryIntegrationCapability, ArmoryIntegrationEvent } from "./hvut-armory-integration.js";
import {
  ARMORY_CATEGORY_KEYS,
  createArmoryPageReader,
  readArmoryCategories,
} from "./hvut-armory-page-reader.js";
import { readArmoryPageFacts } from "./hvut-armory-page-facts.js";
import { createArmoryLoadingView } from "./hvut-armory-loading-view.js";

export function installHvutArmoryIntegrationBridge(target = window) {
  const bridge = Object.freeze({
    events: ArmoryIntegrationEvent,
    readPageFacts: readArmoryPageFacts,
    create(options) {
      const baseUrl = target.location.href;
      const pageReader = createArmoryPageReader({
        fetchImpl: target.fetch.bind(target),
        document: target.document,
        baseUrl,
        recordFailure: options.recordPageFailure,
      });
      const loadingView = createArmoryLoadingView({
        document: target.document,
        table: options.table,
        categoryOrder: ARMORY_CATEGORY_KEYS,
      });
      return createArmoryIntegrationCapability({
        ...options,
        pageReader,
        readCategories: () =>
          readArmoryCategories(target.document.getElementById("filterbar"), baseUrl),
        beginLoading: loadingView.begin,
        reportCategory: loadingView.progress,
        restoreLoading: loadingView.restore,
        completeLoading: loadingView.complete,
      });
    },
  });
  target.HVAA_armoryIntegration = bridge;
  return bridge;
}

if (typeof window !== "undefined") installHvutArmoryIntegrationBridge(window);
