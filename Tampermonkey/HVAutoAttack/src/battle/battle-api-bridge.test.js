import { describe, expect, it, vi } from "vitest";
import { BattleApiBridgeEvent, runBattleApiBridgeAutomation } from "./battle-api-bridge.js";

function makeDeps() {
  const scripts = [];
  return {
    scripts,
    readOption: vi.fn(() => ({ delay: 120, delay2: 340 })),
    sessionStorage: {},
    createScript: vi.fn(() => ({ textContent: "" })),
    appendHead: vi.fn((script) => scripts.push(script)),
    mainUrl: "https://example.test/",
  };
}

describe("runBattleApiBridgeAutomation", () => {
  it("installs battle api call and response scripts from one entry", () => {
    const deps = makeDeps();

    expect(runBattleApiBridgeAutomation({ type: BattleApiBridgeEvent.INSTALL }, deps)).toBe(true);

    expect(deps.sessionStorage).toMatchObject({ delay: 120, delay2: 340 });
    expect(deps.createScript).toHaveBeenCalledTimes(2);
    expect(deps.appendHead).toHaveBeenCalledTimes(2);
    expect(deps.scripts[0].textContent).toContain("api_call =");
    expect(deps.scripts[0].textContent).toContain('b.open("POST", "https://example.test/json")');
    expect(deps.scripts[1].textContent).toContain("api_response =");
    expect(deps.scripts[1].textContent).toContain("JSON.parse(b.responseText)");
  });

  it("rejects unknown events", () => {
    expect(runBattleApiBridgeAutomation({ type: "unknown" }, makeDeps())).toBe(false);
  });
});
