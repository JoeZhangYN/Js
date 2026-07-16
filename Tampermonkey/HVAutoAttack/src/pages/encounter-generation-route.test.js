import { describe, expect, it } from "vitest";
import {
  EncounterGenerationRouteEvent,
  runEncounterGenerationRoute,
} from "./encounter-generation-route.js";

describe("encounter generation route authority", () => {
  it("creates only the canonical news-page request", () => {
    expect(
      runEncounterGenerationRoute({ type: EncounterGenerationRouteEvent.CREATE_REQUEST })
    ).toEqual({
      method: "GET",
      url: "https://e-hentai.org/news.php",
      routeIdentity: "persistentEncounterNews",
    });
  });

  it("rejects unknown route events without exposing a fallback URL", () => {
    expect(runEncounterGenerationRoute({ type: "unknown" })).toBeNull();
    expect(runEncounterGenerationRoute(null)).toBeNull();
  });
});
