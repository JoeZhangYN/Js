import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APP_STARTUP_FAILURE_KEY, AppStartupEvent, runAppStartup } from "./app-startup.js";

const mocks = vi.hoisted(() => ({
  g: vi.fn(),
  gE: vi.fn(),
  runOptionAutomation: vi.fn(),
  addStyle: vi.fn(),
  runRiddleDatasetAutomation: vi.fn(),
  runCdRuntimeAutomation: vi.fn(),
  runAbilityAoeAutomation: vi.fn(),
  alert: vi.fn(),
}));

vi.mock("../dom/query.js", () => ({ gE: mocks.gE }));
vi.mock("../state/store.js", () => ({ g: mocks.g }));
vi.mock("../state/option.js", () => ({ OptionEvent: Object.freeze({ SYNC_STARTUP_OPTION: "syncStartupOption" }), runOptionAutomation: mocks.runOptionAutomation }));
vi.mock("../core/lang.js", () => ({ _alert: mocks.alert }));
vi.mock("../style/inject.js", () => ({ addStyle: mocks.addStyle }));
vi.mock("../state/riddle-dataset.js", () => ({ RiddleDatasetEvent: Object.freeze({ REGISTER_EXPORT_MENU: "registerExportMenu" }), runRiddleDatasetAutomation: mocks.runRiddleDatasetAutomation }));
vi.mock("../state/cd-tracker.js", () => ({ CdRuntimeEvent: Object.freeze({ LOAD: "load" }), runCdRuntimeAutomation: mocks.runCdRuntimeAutomation }));
vi.mock("./ability-page.js", () => ({ AbilityAoeEvent: Object.freeze({ LOAD_STORED_AOE: "loadStoredAoe" }), runAbilityAoeAutomation: mocks.runAbilityAoeAutomation }));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  sessionStorage.clear();
  globalThis.GM_info = { script: { version: "10.0.1" } };
  globalThis.unsafeWindow = undefined;
  window.prompt = vi.fn(() => "1");
  mocks.g.mockImplementation((key, value) => (value === undefined ? "10.0" : value));
  mocks.gE.mockReturnValue(null);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function lastStartupFailure() {
  return JSON.parse(sessionStorage.getItem(APP_STARTUP_FAILURE_KEY));
}

describe("runAppStartup", () => {
  it("loads global startup capabilities through their entries", () => {
    expect(runAppStartup({ type: AppStartupEvent.USERSCRIPT_START })).toBe(true);

    expect(mocks.runCdRuntimeAutomation).toHaveBeenCalledWith({ type: "load" });
    expect(mocks.runRiddleDatasetAutomation).toHaveBeenCalledWith({ type: "registerExportMenu" });
  });

  it("runs userscript startup in business order", () => {
    runAppStartup({ type: AppStartupEvent.USERSCRIPT_START });

    const actualOrder = [
      mocks.runCdRuntimeAutomation.mock.invocationCallOrder[0],
      mocks.runRiddleDatasetAutomation.mock.invocationCallOrder[0],
    ];
    expect(actualOrder).toEqual([...actualOrder].sort((a, b) => a - b));
  });

  it("delegates option version and language sync to the option entry", () => {
    mocks.runOptionAutomation.mockReturnValue({ configured: true, lang: "2", previousVersion: "9.9", currentVersion: "10.0", versionUpdated: true });

    expect(runAppStartup({ type: AppStartupEvent.GAME_PAGE_READY })).toBe(true);

    expect(mocks.g).toHaveBeenCalledWith("version", "10.0");
    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({ type: "syncStartupOption", currentVersion: "10.0" });
    expect(mocks.addStyle).toHaveBeenCalledWith("2");
    expect(mocks.runAbilityAoeAutomation).toHaveBeenCalledWith({ type: "loadStoredAoe" });
  });

  it("runs configured game-page startup in business order", () => {
    mocks.runOptionAutomation.mockReturnValue({ configured: true, lang: "2", versionUpdated: false });

    expect(runAppStartup({ type: AppStartupEvent.GAME_PAGE_READY })).toBe(true);

    const actualOrder = [
      mocks.runOptionAutomation.mock.invocationCallOrder[0],
      mocks.addStyle.mock.invocationCallOrder[0],
      mocks.runAbilityAoeAutomation.mock.invocationCallOrder[0],
    ];
    expect(actualOrder).toEqual([...actualOrder].sort((a, b) => a - b));
  });

  it("requests initial config when the option entry reports missing config", () => {
    const click = vi.fn();
    mocks.runOptionAutomation.mockReturnValue({ configured: false });
    mocks.gE.mockImplementation((selector) => (selector === ".hvAAButton" ? { click } : null));

    expect(runAppStartup({ type: AppStartupEvent.GAME_PAGE_READY })).toBe(false);

    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({ type: "syncStartupOption", currentVersion: "10.0" });
    expect(mocks.g).toHaveBeenCalledWith("lang", "1");
    expect(click).toHaveBeenCalled();
    expect(mocks.runAbilityAoeAutomation).not.toHaveBeenCalled();
  });

  it("rejects unknown startup events as no-op", () => {
    expect(runAppStartup({ type: "unknown" })).toBe(false);
    expect(runAppStartup(null)).toBe(false);
    expect(mocks.runCdRuntimeAutomation).not.toHaveBeenCalled();
    expect(mocks.runOptionAutomation).not.toHaveBeenCalled();
    expect(mocks.runAbilityAoeAutomation).not.toHaveBeenCalled();
  });

  it("does not report userscript startup success when a startup step throws", () => {
    mocks.runCdRuntimeAutomation.mockImplementation(() => {
      throw new Error("cd load blocked");
    });

    expect(runAppStartup({ type: AppStartupEvent.USERSCRIPT_START })).toBe(false);

    expect(APP_STARTUP_FAILURE_KEY).toBe("HVAA:lastAppStartupFailure");
    expect(lastStartupFailure()).toMatchObject({
      capability: "appStartup",
      stage: "loadCdRuntimeState",
      reason: "stepException",
      error: "cd load blocked",
    });
    expect(mocks.runRiddleDatasetAutomation).not.toHaveBeenCalled();
  });

  it("records missing config button evidence when initial config cannot open settings", () => {
    mocks.runOptionAutomation.mockReturnValue({ configured: false });
    mocks.gE.mockReturnValue(null);

    expect(runAppStartup({ type: AppStartupEvent.GAME_PAGE_READY })).toBe(false);

    expect(lastStartupFailure()).toMatchObject({
      capability: "appStartup",
      stage: "requestInitialConfig",
      reason: "missingConfigButton",
    });
    expect(mocks.runAbilityAoeAutomation).not.toHaveBeenCalled();
  });

  it("isolates default-font warning failures and continues startup", () => {
    mocks.runOptionAutomation.mockReturnValue({ configured: true, lang: "2", versionUpdated: false });
    mocks.gE.mockImplementation((selector) => (selector === '[class^="c5"],[class^="c4"]' ? {} : null));
    mocks.alert.mockImplementation(() => {
      throw new Error("alert blocked");
    });

    expect(runAppStartup({ type: AppStartupEvent.GAME_PAGE_READY })).toBe(true);

    expect(lastStartupFailure()).toMatchObject({
      capability: "appStartup",
      stage: "warnDefaultFont",
      reason: "warningFailed",
      error: "alert blocked",
    });
    expect(mocks.runAbilityAoeAutomation).toHaveBeenCalledWith({ type: "loadStoredAoe" });
  });

  it("keeps startup failure evidence when diagnostic console is blocked", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });
    mocks.runRiddleDatasetAutomation.mockImplementation(() => {
      throw new Error("menu blocked");
    });

    expect(runAppStartup({ type: AppStartupEvent.USERSCRIPT_START })).toBe(false);

    expect(lastStartupFailure()).toMatchObject({
      capability: "appStartup",
      stage: "registerRiddleDatasetExportMenu",
      reason: "stepException",
      error: "menu blocked",
    });
  });
});
