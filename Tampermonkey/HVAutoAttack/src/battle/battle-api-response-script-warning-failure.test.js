import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildApiResponseScript } from "./battle-api-response-script.js";

function installApiResponse() {
  Function(
    `${buildApiResponseScript({ world: "persistent", apiJsonUrl: "https://hv/json" })}; window.__testApiResponse = api_response;`
  )();
  return window.__testApiResponse;
}

beforeEach(() => {
  window.sessionStorage.clear();
  delete window.HVAA_battleApiRecovery;
  delete window.__testApiResponse;
});

describe("battle API response script warning failures", () => {
  it("keeps rejected API responses blocked when recovery storage and warning both fail", () => {
    const apiResponse = installApiResponse();
    vi.spyOn(window.sessionStorage, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });

    expect(() =>
      apiResponse({
        readyState: 4,
        status: 200,
        responseText: JSON.stringify({ reload: true }),
      })
    ).not.toThrow();
    expect(
      apiResponse({
        readyState: 4,
        status: 200,
        responseText: JSON.stringify({ reload: true }),
      })
    ).toBe(false);
  });
});
