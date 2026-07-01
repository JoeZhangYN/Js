import { beforeEach, describe, expect, it, vi } from "vitest";
import { BattleApiBridgeEvent, runBattleApiBridgeAutomation } from "./battle-api-bridge.js";

const mocks = vi.hoisted(() => ({
  runOptionAutomation: vi.fn(),
  runBattleApiWorldContext: vi.fn(),
}));

vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));
vi.mock("./battle-api-world-context.js", () => ({
  BattleApiWorldContextEvent: Object.freeze({ READ_CURRENT: "readCurrent" }),
  runBattleApiWorldContext: mocks.runBattleApiWorldContext,
}));

function makeDeps() {
  const scripts = [];
  return {
    scripts,
    readOptionField: vi.fn((key) => ({ delay: 120, delay2: 340 })[key]),
    sessionStorage: window.sessionStorage,
    createScript: vi.fn(() => ({ textContent: "" })),
    appendHead: vi.fn((script) => scripts.push(script)),
    readBattleApiWorldContext: vi.fn(() => ({
      world: "persistent", apiBaseUrl: "https://example.test/", apiJsonUrl: "https://example.test/json",
    })),
    installApiResponseRecovery: vi.fn(() => true),
  };
}

function expectContains(text, tokens) {
  for (const token of tokens) expect(text).toContain(token);
}

beforeEach(() => {
  document.head.innerHTML = "";
  delete window.HVAA_battleApiRecovery; delete globalThis.unsafeWindow;
  window.sessionStorage.clear();
  mocks.runOptionAutomation.mockReset();
  mocks.runOptionAutomation.mockReturnValue({});
  mocks.runBattleApiWorldContext.mockReset();
  mocks.runBattleApiWorldContext.mockReturnValue({
    world: "isekai", apiBaseUrl: "https://hentaiverse.org/isekai/", apiJsonUrl: "https://hentaiverse.org/isekai/json",
  });
});

describe("runBattleApiBridgeAutomation", () => {
  it("installs battle api call and response scripts from one entry", () => {
    const deps = makeDeps();

    expect(runBattleApiBridgeAutomation({ type: BattleApiBridgeEvent.INSTALL }, deps)).toBe(true);

    expect(window.sessionStorage.delay).toBe("120");
    expect(window.sessionStorage.delay2).toBe("340");
    expect(deps.installApiResponseRecovery).toHaveBeenCalledTimes(1);
    expect(deps.readBattleApiWorldContext).toHaveBeenCalledTimes(1);
    expect(deps.createScript).toHaveBeenCalledTimes(2);
    expect(deps.appendHead).toHaveBeenCalledTimes(2);
    expect(deps.scripts[0].textContent).toContain("api_call =");
    expect(deps.scripts[0].textContent).toContain(
      'typeof MAIN_URL !== "undefined" ? MAIN_URL + "json" : "https://example.test/json"'
    );
    expect(deps.scripts[0].textContent).toContain('b.open("POST", apiJsonUrl)');
    expect(deps.scripts[0].textContent).toContain("window.sessionStorage.delay * 1");
    expect(deps.scripts[0].textContent).toContain("window.sessionStorage.delay2 * 1");
    expectContains(deps.scripts[0].textContent, ["window.battle.battle_continue", "window.HVAA_navigation", "BATTLE_API_CALLBACK_FALLBACK", "missingBattleContinue"]);
    expect(deps.scripts[0].textContent).not.toContain("document.location");
    expect(deps.scripts[0].textContent).toContain('clickActionEventNode("start", "eventStart")');
    expect(deps.scripts[0].textContent).toContain('clickActionEventNode("end", "eventEnd")');
    expect(deps.scripts[0].textContent).toContain("HVAA:lastBattleApiBridge");
    expect(deps.scripts[1].textContent).toContain("api_response =");
    expect(deps.scripts[1].textContent).toContain("parseApiJsonResponse");
    expect(deps.scripts[1].textContent).toContain('responseKind: "malformedJson"');
    expect(deps.scripts[1].textContent).toContain("reloadFromApiResponse");
    expect(deps.scripts[1].textContent).toContain("window.HVAA_battleApiRecovery");
    expectContains(deps.scripts[1].textContent, ["responseKind", '"world":"persistent"', "actionDetail"]);
    expect(deps.scripts[1].textContent).not.toContain("window.location.href");
  });

  it("binds native process_action callbacks to the active battle instance", () => {
    const deps = makeDeps();

    runBattleApiBridgeAutomation({ type: BattleApiBridgeEvent.INSTALL }, deps);

    const script = deps.scripts[0].textContent;
    expect(script).not.toContain("b.onreadystatechange = d");
    expect(script.indexOf("b.onreadystatechange = function")).toBeLessThan(
      script.indexOf("b.onload = function")
    );
  });

  it("keeps the action event protocol around API sends", () => {
    const deps = makeDeps();

    runBattleApiBridgeAutomation({ type: BattleApiBridgeEvent.INSTALL }, deps);

    const script = deps.scripts[0].textContent;
    expect(script.indexOf('clickActionEventNode("start", "eventStart")')).toBeLessThan(
      script.indexOf('return sendApiRequest("send")')
    );
    expect(script.indexOf('clickActionEventNode("end", "eventEnd")')).toBeGreaterThan(
      script.indexOf("b.onload = function")
    );
  });

  it("does not navigate directly from generated API response handling", () => {
    const deps = makeDeps();

    runBattleApiBridgeAutomation({ type: BattleApiBridgeEvent.INSTALL }, deps);

    const script = deps.scripts[1].textContent;
    expect(script).not.toContain("window.location.search");
    expect(script).not.toContain("location.href");
    expect(script).toContain("recovery.handleRejectedResponse");
    expect(script).toContain("return a");
    expect(script).toContain("return false");
  });

  it("blocks native process_action for API reload and error responses", () => {
    const deps = makeDeps();

    runBattleApiBridgeAutomation({ type: BattleApiBridgeEvent.INSTALL }, deps);

    const script = deps.scripts[1].textContent;
    expect(script).toContain("a.error || a.reload");
    expect(script).toContain("reloadFromApiResponse({");
    expect(script).toContain("return false;");
  });

  it("records API response reload evidence for diagnostics", () => {
    const deps = makeDeps();

    runBattleApiBridgeAutomation({ type: BattleApiBridgeEvent.INSTALL }, deps);

    const script = deps.scripts[1].textContent;
    expect(script).toContain('responseKind: a.reload ? "jsonReload" : "jsonError"');
    expect(script).toContain('responseKind: "httpStatus"');
    expect(script).toContain("world: worldContext");
    expect(script).toContain("action: actionDetail()");
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
    expect([window.sessionStorage.delay, window.sessionStorage.delay2]).toEqual(["12", "34"]);
    expect(mocks.runBattleApiWorldContext).toHaveBeenCalledWith({ type: "readCurrent" });
  });

  it("uses the current battle world API endpoint on the default path", () => {
    mocks.runOptionAutomation.mockImplementation((event) => ({ delay: 12, delay2: 34 })[event.key]);

    expect(runBattleApiBridgeAutomation({ type: BattleApiBridgeEvent.INSTALL })).toBe(true);

    expect(document.head.lastChild.textContent).toContain("api_response =");
    expect(document.head.children[document.head.children.length - 2].textContent).toContain('MAIN_URL + "json" : "https://hentaiverse.org/isekai/json"');
  });

  it("normalizes missing API bridge delays before writing runtime state", () => {
    mocks.runOptionAutomation.mockReturnValue(undefined);

    expect(runBattleApiBridgeAutomation({ type: BattleApiBridgeEvent.INSTALL })).toBe(true);

    expect(window.sessionStorage.delay).toBe("0");
    expect(window.sessionStorage.delay2).toBe("0");
  });
});
