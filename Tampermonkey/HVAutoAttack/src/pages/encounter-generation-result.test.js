import { describe, expect, it } from "vitest";
import {
  classifyEncounterGenerationResult,
  EncounterGenerationFailureReason,
  isBlockingEncounterGenerationResult,
} from "./encounter-generation-result.js";

describe("encounter generation result classifier", () => {
  it("classifies available, daily reset, unavailable, and transport results in one place", () => {
    expect(
      classifyEncounterGenerationResult({
        eventpane: '<a href="?s=Battle&amp;ss=ba&amp;encounter=abc=">RE</a>',
      })
    ).toEqual({ status: "available", key: "abc=" });
    expect(
      classifyEncounterGenerationResult({ eventpane: "It is the dawn of a new day!" })
    ).toEqual({ status: "newDay", reason: "dailyResetEvent" });
    expect(classifyEncounterGenerationResult({ eventpane: "No encounter" })).toEqual({
      status: "unavailable",
      reason: "encounterKeyMissing",
    });
    expect(
      classifyEncounterGenerationResult({
        transportFailure: {
          reason: EncounterGenerationFailureReason.REQUEST_TIMEOUT,
          detail: { url: "news" },
        },
      })
    ).toEqual({
      status: "transportFailure",
      reason: "generationRequestTimeout",
      failure: { url: "news" },
    });
  });

  it("requires the owned news error surface for equipment-full classification", () => {
    expect(
      classifyEncounterGenerationResult({
        eventpane: '<p class="messagebox_error">Your equipment inventory is full</p>',
      }).reason
    ).toBe("equipmentInventoryFull");
    expect(
      classifyEncounterGenerationResult({
        eventpane: "Inventory Capacity: 54 / 500. Your equipment inventory is full?",
      }).reason
    ).toBe("encounterKeyMissing");
  });

  it("blocks equipment recovery but treats dawn as an ordinary business event", () => {
    expect(isBlockingEncounterGenerationResult({ reason: "dailyResetEvent" })).toBe(false);
    expect(isBlockingEncounterGenerationResult({ reason: "equipmentInventoryFull" })).toBe(true);
    expect(isBlockingEncounterGenerationResult({ reason: "encounterKeyMissing" })).toBe(false);
    expect(isBlockingEncounterGenerationResult({ reason: "generationRequestTimeout" })).toBe(false);
  });
});
