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
  delete window.MAIN_URL;
  delete window.battle;
  delete window.HVAA_navigation;
  delete window.__testApiCall;
});

describe("battle API bridge runtime protocol", () => {
  it("binds process_action to a battle_continue-capable target when window.battle is missing", () => {
    installApiCall();
    const reloadCurrentPage = vi.fn();
    window.HVAA_navigation = {
      ReloadReason: { BATTLE_API_CALLBACK_FALLBACK: "battleApiCallbackFallback" },
      reloadCurrentPage,
    };
    const xhr = {
      open: vi.fn(),
      setRequestHeader: vi.fn(),
      send: vi.fn(),
    };
    const callback = vi.fn(function () {
      expect(typeof this.battle_continue).toBe("function");
      this.battle_continue();
    });

    window.__testApiCall(xhr, { type: "battle", method: "action" }, callback);
    xhr.onreadystatechange();

    expect(callback).toHaveBeenCalledTimes(1);
    expect(reloadCurrentPage).toHaveBeenCalledWith("battleApiCallbackFallback", {
      source: "battleApiBridge",
      reason: "missingBattleContinue",
    });
    expect(xhr.open).toHaveBeenCalledWith("POST", "https://fallback.test/json");
  });

  it("does not bind process_action callbacks to a non-capable window.battle object", () => {
    installApiCall();
    window.battle = {};
    const reloadCurrentPage = vi.fn();
    window.HVAA_navigation = {
      ReloadReason: { BATTLE_API_CALLBACK_FALLBACK: "battleApiCallbackFallback" },
      reloadCurrentPage,
    };
    const xhr = {
      open: vi.fn(),
      setRequestHeader: vi.fn(),
      send: vi.fn(),
    };
    const callback = vi.fn(function () {
      expect(typeof this.battle_continue).toBe("function");
      this.battle_continue();
    });

    window.__testApiCall(xhr, { type: "battle", method: "action" }, callback);
    xhr.onreadystatechange();

    expect(callback).toHaveBeenCalledTimes(1);
    expect(reloadCurrentPage).toHaveBeenCalledWith("battleApiCallbackFallback", {
      source: "battleApiBridge",
      reason: "missingBattleContinue",
    });
  });

  it("blocks fallback callback reload when the navigation bridge is missing", () => {
    installApiCall();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const xhr = {
      open: vi.fn(),
      setRequestHeader: vi.fn(),
      send: vi.fn(),
    };
    const callback = vi.fn(function () {
      expect(this.battle_continue()).toBe(false);
    });

    window.__testApiCall(xhr, { type: "battle", method: "action" }, callback);
    xhr.onreadystatechange();

    expect(callback).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      "[HVAA] battle API callback fallback reload blocked; navigation bridge missing"
    );
  });

  it("uses the page MAIN_URL protocol when the current hvc runtime exposes it", () => {
    installApiCall();
    window.MAIN_URL = "https://hentaiverse.org/isekai/";
    const xhr = { open: vi.fn(), setRequestHeader: vi.fn(), send: vi.fn() };

    window.__testApiCall(xhr, { type: "battle", method: "action" }, vi.fn());

    expect(xhr.open).toHaveBeenCalledWith("POST", "https://hentaiverse.org/isekai/json");
  });

  it("records missing action start event nodes and blocks API send", () => {
    installApiCall();
    document.getElementById("eventStart").remove();
    const xhr = { open: vi.fn(), setRequestHeader: vi.fn(), send: vi.fn() };

    expect(window.__testApiCall(xhr, { type: "battle", method: "action" }, vi.fn())).toBe(false);

    expect(xhr.send).not.toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleApiBridge"))).toMatchObject({
      phase: "start",
      nodeId: "eventStart",
      result: "rejected",
      reason: "eventNodeMissing",
      detail: { reason: "eventNodeMissing" },
    });
  });

  it("records action end event node click failures", () => {
    installApiCall();
    document.getElementById("eventEnd").click = vi.fn(() => {
      throw new Error("blocked");
    });
    const xhr = { open: vi.fn(), setRequestHeader: vi.fn(), send: vi.fn() };

    window.__testApiCall(xhr, { type: "battle", method: "action" }, vi.fn());
    xhr.onload();

    expect(JSON.parse(sessionStorage.getItem("HVAA:lastBattleApiBridge"))).toMatchObject({
      phase: "end",
      nodeId: "eventEnd",
      result: "rejected",
      reason: "eventNodeClickFailed",
      detail: { reason: "eventNodeClickFailed", error: "blocked" },
    });
  });
});
