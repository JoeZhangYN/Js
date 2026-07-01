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

describe("buildApiResponseScript", () => {
  it("records blocked recovery evidence when the page bridge is missing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const apiResponse = installApiResponse({ world: "isekai", apiJsonUrl: "https://hv/isekai/json" });
    window.info = { mode: "magic", skill: 213, target: 2 };

    expect(
      apiResponse({
        readyState: 4,
        status: 200,
        responseText: JSON.stringify({ reload: true }),
      })
    ).toBe(false);

    expect(JSON.parse(window.sessionStorage.getItem("HVAA:battleApiRecovery"))).toMatchObject({
      repeatCount: 1,
      recovery: "bridgeMissing",
      detail: {
        responseKind: "jsonReload",
        status: 200,
        reload: true,
        world: { world: "isekai", apiJsonUrl: "https://hv/isekai/json" },
        action: { mode: "magic", skill: 213, target: 2 },
      },
    });
    expect(warn).toHaveBeenCalledWith(
      "[HVAA] battle API recovery bridge missing; reload blocked",
      expect.any(Object)
    );
  });

  it("routes rejected API responses through the recovery bridge when available", () => {
    const handleRejectedResponse = vi.fn();
    const apiResponse = installApiResponse();
    window.HVAA_battleApiRecovery = { handleRejectedResponse };

    expect(
      apiResponse({
        readyState: 4,
        status: 500,
        responseText: "",
      })
    ).toBe(false);

    expect(handleRejectedResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        responseKind: "httpStatus",
        status: 500,
        world: { world: "persistent", apiJsonUrl: "https://hv/json" },
      })
    );
    expect(window.sessionStorage.getItem("HVAA:battleApiRecovery")).toBeNull();
  });
});
