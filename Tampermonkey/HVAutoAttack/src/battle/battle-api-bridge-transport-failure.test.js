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
  document.body.innerHTML = '<a id="eventStart"></a><a id="eventEnd"></a>';
  window.sessionStorage.clear();
  delete window.__testApiCall;
});

describe("battle API bridge transport failure evidence", () => {
  it("records transport open failures before clicking the start event", () => {
    installApiCall();
    document.getElementById("eventStart").click = vi.fn();
    const xhr = {
      open: vi.fn(() => {
        throw new Error("open failed");
      }),
      setRequestHeader: vi.fn(),
      send: vi.fn(),
    };

    expect(window.__testApiCall(xhr, { type: "battle", method: "action" }, vi.fn())).toBe(false);

    expect(document.getElementById("eventStart").click).not.toHaveBeenCalled();
    expect(xhr.send).not.toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleApiBridge"))).toMatchObject({
      phase: "transport",
      nodeId: null,
      result: "rejected",
      reason: "apiTransportFailed",
      detail: { reason: "apiTransportFailed", step: "open", error: "open failed" },
    });
  });

  it("records transport send failures after the start event is clicked", () => {
    installApiCall();
    document.getElementById("eventStart").click = vi.fn();
    const xhr = {
      open: vi.fn(),
      setRequestHeader: vi.fn(),
      send: vi.fn(() => {
        throw new Error("send failed");
      }),
    };

    expect(window.__testApiCall(xhr, { type: "battle", method: "action" }, vi.fn())).toBe(false);

    expect(document.getElementById("eventStart").click).toHaveBeenCalledTimes(1);
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleApiBridge"))).toMatchObject({
      phase: "transport",
      nodeId: null,
      result: "rejected",
      reason: "apiTransportFailed",
      detail: { reason: "apiTransportFailed", step: "send", error: "send failed" },
    });
  });
});
