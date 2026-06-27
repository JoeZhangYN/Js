import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleApiBridgeEvent, runBattleApiBridgeAutomation } from "./battle-api-bridge.js";

const mocks = vi.hoisted(() => ({
  runOptionAutomation: vi.fn(),
}));

vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));

function makeDeps() {
  const scripts = [];
  return {
    scripts,
    readOptionField: vi.fn((key) => ({ delay: 120, delay2: 340 })[key]),
    sessionStorage: {},
    createScript: vi.fn(() => ({ textContent: "" })),
    appendHead: vi.fn((script) => scripts.push(script)),
    mainUrl: "https://example.test/",
  };
}

beforeEach(() => {
  window.sessionStorage.clear();
  mocks.runOptionAutomation.mockReset();
  mocks.runOptionAutomation.mockReturnValue({});
});

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

  it("reads API bridge delay options through the option entry on the default path", () => {
    mocks.runOptionAutomation.mockImplementation((event) => ({ delay: 12, delay2: 34 })[event.key]);

    expect(runBattleApiBridgeAutomation({ type: BattleApiBridgeEvent.INSTALL })).toBe(true);

    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "delay",
      fallback: undefined,
    });
    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "delay2",
      fallback: undefined,
    });
    expect(window.sessionStorage.delay).toBe("12");
    expect(window.sessionStorage.delay2).toBe("34");
  });
});
