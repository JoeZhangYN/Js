import { createArmoryIntegrationCapability, ArmoryIntegrationEvent } from "./hvut-armory-integration.js";
import { createArmoryPageReader, readArmoryCategories } from "./hvut-armory-page-reader.js";
import { readArmoryPageFacts } from "./hvut-armory-page-facts.js";

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
      return createArmoryIntegrationCapability({
        ...options,
        pageReader,
        readCategories: () =>
          readArmoryCategories(target.document.getElementById("filterbar"), baseUrl),
      });
    },
  });
  target.HVAA_armoryIntegration = bridge;
  return bridge;
}

if (typeof window !== "undefined") installHvutArmoryIntegrationBridge(window);
