import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildApiResponseScript } from "./battle-api-response-script.js";

function installApiResponse(worldContext = { world: "persistent", apiJsonUrl: "https://hv/json" }) {
  Function(`${buildApiResponseScript(worldContext)}; window.__testApiResponse = api_response;`)();
  return window.__testApiResponse;
}

beforeEach(() => {
  window.sessionStorage.clear();
  delete window.HVAA_battleApiRecovery;
  delete window.__testApiResponse;
  delete window.info;
});

describe("buildApiResponseScript malformed JSON recovery", () => {
  it("routes malformed JSON responses through the recovery bridge instead of throwing", () => {
    const handleRejectedResponse = vi.fn();
    const apiResponse = installApiResponse();
    window.info = { mode: "attack", target: 4 };
    window.HVAA_battleApiRecovery = { handleRejectedResponse };

    expect(() =>
      apiResponse({
        readyState: 4,
        status: 200,
        responseText: "<html>not json</html>",
      })
    ).not.toThrow();

    expect(handleRejectedResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        responseKind: "malformedJson",
        status: 200,
        parseError: expect.any(String),
        responseTextPreview: "<html>not json</html>",
        world: { world: "persistent", apiJsonUrl: "https://hv/json" },
        action: { mode: "attack", target: 4 },
      })
    );
  });
});
