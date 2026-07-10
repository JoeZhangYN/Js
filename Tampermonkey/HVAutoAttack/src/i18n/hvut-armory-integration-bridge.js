import { createArmoryIntegrationCapability, ArmoryIntegrationEvent } from "./hvut-armory-integration.js";
import { createArmoryPageReader, readArmoryCategories } from "./hvut-armory-page-reader.js";

export function installHvutArmoryIntegrationBridge(target = window) {
  const bridge = Object.freeze({
    events: ArmoryIntegrationEvent,
    create(options) {
      const baseUrl = target.location.href;
      const pageReader = createArmoryPageReader({
        fetchImpl: target.fetch.bind(target),
        document: target.document,
        baseUrl,
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
