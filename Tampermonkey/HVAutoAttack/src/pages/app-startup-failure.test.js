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
  sessionStorage.clear();
  globalThis.GM_info = { script: { version: "10.0.1" } };
  mocks.g.mockImplementation((key, value) => (value === undefined ? "10.0" : value));
  mocks.gE.mockReturnValue(null);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("runAppStartup failure fallback", () => {
  it("does not report startup success when failure evidence and warning both fail", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === APP_STARTUP_FAILURE_KEY) throw new Error("quota");
      return Reflect.apply(Storage.prototype.setItem, this, [key, value]);
    });
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });
    mocks.runCdRuntimeAutomation.mockImplementation(() => {
      throw new Error("cd load blocked");
    });

    expect(runAppStartup({ type: AppStartupEvent.USERSCRIPT_START })).toBe(false);
    expect(mocks.runRiddleDatasetAutomation).not.toHaveBeenCalled();
  });
});
