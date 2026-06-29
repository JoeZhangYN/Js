import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppStartupEvent, runAppStartup } from "./app-startup.js";

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
vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({ SYNC_STARTUP_OPTION: "syncStartupOption" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));
vi.mock("../core/lang.js", () => ({ _alert: mocks.alert }));
vi.mock("../style/inject.js", () => ({ addStyle: mocks.addStyle }));
vi.mock("../state/riddle-dataset.js", () => ({
  RiddleDatasetEvent: Object.freeze({ REGISTER_EXPORT_MENU: "registerExportMenu" }),
  runRiddleDatasetAutomation: mocks.runRiddleDatasetAutomation,
}));
vi.mock("../state/cd-tracker.js", () => ({
  CdRuntimeEvent: Object.freeze({ LOAD: "load" }),
  runCdRuntimeAutomation: mocks.runCdRuntimeAutomation,
}));
vi.mock("./ability-page.js", () => ({
  AbilityAoeEvent: Object.freeze({ LOAD_STORED_AOE: "loadStoredAoe" }),
  runAbilityAoeAutomation: mocks.runAbilityAoeAutomation,
}));

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  globalThis.GM_info = { script: { version: "10.0.1" } };
  globalThis.unsafeWindow = undefined;
  window.prompt = vi.fn(() => "1");
  mocks.g.mockImplementation((key, value) => (value === undefined ? "10.0" : value));
  mocks.gE.mockReturnValue(null);
});

describe("runAppStartup", () => {
  it("loads global startup capabilities through their entries", () => {
    expect(runAppStartup({ type: AppStartupEvent.USERSCRIPT_START })).toBe(true);

    expect(mocks.runCdRuntimeAutomation).toHaveBeenCalledWith({ type: "load" });
    expect(mocks.runRiddleDatasetAutomation).toHaveBeenCalledWith({
      type: "registerExportMenu",
    });
  });

  it("delegates option version and language sync to the option entry", () => {
    mocks.runOptionAutomation.mockReturnValue({
      configured: true,
      lang: "2",
      previousVersion: "9.9",
      currentVersion: "10.0",
      versionUpdated: true,
    });

    expect(runAppStartup({ type: AppStartupEvent.GAME_PAGE_READY })).toBe(true);

    expect(mocks.g).toHaveBeenCalledWith("version", "10.0");
    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "syncStartupOption",
      currentVersion: "10.0",
    });
    expect(mocks.addStyle).toHaveBeenCalledWith("2");
    expect(mocks.runAbilityAoeAutomation).toHaveBeenCalledWith({ type: "loadStoredAoe" });
  });

  it("requests initial config when the option entry reports missing config", () => {
    const click = vi.fn();
    mocks.runOptionAutomation.mockReturnValue({ configured: false });
    mocks.gE.mockImplementation((selector) => (selector === ".hvAAButton" ? { click } : null));

    expect(runAppStartup({ type: AppStartupEvent.GAME_PAGE_READY })).toBe(false);

    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "syncStartupOption",
      currentVersion: "10.0",
    });
    expect(mocks.g).toHaveBeenCalledWith("lang", "1");
    expect(click).toHaveBeenCalled();
  });
});
