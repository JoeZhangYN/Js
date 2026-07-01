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
    expect(deps.scripts[0].textContent).toContain("window.sessionStorage.delay * 1");
    expect(deps.scripts[0].textContent).toContain("window.sessionStorage.delay2 * 1");
    expect(deps.scripts[0].textContent).toContain(
      'battle.battle_continue = function () {\n        return false;\n      };'
    );
    expect(deps.scripts[0].textContent).toContain('document.getElementById("eventStart").click()');
    expect(deps.scripts[0].textContent).toContain('document.getElementById("eventEnd").click()');
    expect(deps.scripts[1].textContent).toContain("api_response =");
    expect(deps.scripts[1].textContent).toContain("JSON.parse(b.responseText)");
    expect(deps.scripts[1].textContent).not.toContain("window.location.href");
  });

  it("binds native process_action callbacks to the active battle instance without native continuation", () => {
    const deps = makeDeps();

    runBattleApiBridgeAutomation({ type: BattleApiBridgeEvent.INSTALL }, deps);

    const script = deps.scripts[0].textContent;
    expect(script).not.toContain("b.onreadystatechange = d");
    expect(script).toContain("const battle = window.battle || this");
    expect(script).toContain("const nativeBattleContinue = battle.battle_continue");
    expect(script).toContain('battle.battle_continue = function () {\n        return false;\n      };');
    expect(script).toContain("return d.apply(battle, arguments)");
    expect(script).toContain("battle.battle_continue = nativeBattleContinue");
    expect(script.indexOf("b.onreadystatechange = function")).toBeLessThan(
      script.indexOf("b.onload = function")
    );
  });

  it("keeps the action event protocol around API sends", () => {
    const deps = makeDeps();

    runBattleApiBridgeAutomation({ type: BattleApiBridgeEvent.INSTALL }, deps);

    const script = deps.scripts[0].textContent;
    expect(script.indexOf('document.getElementById("eventStart").click()')).toBeLessThan(
      script.indexOf("b.send(JSON.stringify(a))")
    );
    expect(script.indexOf('document.getElementById("eventEnd").click()')).toBeGreaterThan(
      script.indexOf("b.onload = function")
    );
  });

  it("does not navigate directly from generated API response handling", () => {
    const deps = makeDeps();

    runBattleApiBridgeAutomation({ type: BattleApiBridgeEvent.INSTALL }, deps);

    const script = deps.scripts[1].textContent;
    expect(script).not.toContain("window.location.search");
    expect(script).not.toContain("location.href");
    expect(script).toContain("return a");
    expect(script).toContain("return false");
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
      fallback: 0,
    });
    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "delay2",
      fallback: 0,
    });
    expect(window.sessionStorage.delay).toBe("12");
    expect(window.sessionStorage.delay2).toBe("34");
  });

  it("normalizes missing API bridge delays before writing runtime state", () => {
    mocks.runOptionAutomation.mockReturnValue(undefined);

    expect(runBattleApiBridgeAutomation({ type: BattleApiBridgeEvent.INSTALL })).toBe(true);

    expect(window.sessionStorage.delay).toBe("0");
    expect(window.sessionStorage.delay2).toBe("0");
  });
});
