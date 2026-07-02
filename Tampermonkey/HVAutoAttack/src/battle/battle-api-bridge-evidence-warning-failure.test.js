import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleApiBridgeEvent, runBattleApiBridgeAutomation } from "./battle-api-bridge.js";

function installApiCall() {
  const scripts = [];
  runBattleApiBridgeAutomation(
    { type: BattleApiBridgeEvent.INSTALL },
    {
      readOptionField: vi.fn(() => 0),
      sessionStorage: window.sessionStorage,
      createScript: vi.fn(() => ({ textContent: "" })),
      appendHead: vi.fn((script) => scripts.push(script)),
      installApiResponseRecovery: vi.fn(() => true),
      readBattleApiWorldContext: vi.fn(() => ({
        world: "persistent",
        apiJsonUrl: "https://fallback.test/json",
      })),
    }
  );
  Function(`${scripts[0].textContent}; window.__testApiCall = api_call;`)();
}

beforeEach(() => {
  document.body.innerHTML = '<a id="eventEnd"></a>';
  window.sessionStorage.clear();
  delete window.__testApiCall;
});

describe("battle API bridge evidence warning failures", () => {
  it("keeps API send blocked when bridge evidence storage and warning both fail", () => {
    installApiCall();
    vi.spyOn(window.sessionStorage, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });
    const xhr = { open: vi.fn(), setRequestHeader: vi.fn(), send: vi.fn() };

    expect(() =>
      window.__testApiCall(xhr, { type: "battle", method: "action" }, vi.fn())
    ).not.toThrow();
    expect(window.__testApiCall(xhr, { type: "battle", method: "action" }, vi.fn())).toBe(false);
    expect(xhr.send).not.toHaveBeenCalled();
  });
});
