import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleActionEventBridgeEvent,
  runBattleActionEventBridgeAutomation,
} from "./battle-action-event-bridge.js";

const mocks = vi.hoisted(() => ({
  cE: vi.fn((tag) => document.createElement(tag)),
  gE: vi.fn((selector) => document.querySelector(selector)),
  runBattleActionEndAutomation: vi.fn(),
  runBattleActionStartAutomation: vi.fn(),
  runBattleApiBridgeAutomation: vi.fn(),
}));

vi.mock("../dom/query.js", () => ({
  cE: mocks.cE,
  gE: mocks.gE,
}));
vi.mock("./battle-action-end.js", () => ({
  BattleActionEndEvent: Object.freeze({ ACTION_ENDED: "actionEnded" }),
  runBattleActionEndAutomation: mocks.runBattleActionEndAutomation,
}));
vi.mock("./battle-action-start.js", () => ({
  BattleActionStartEvent: Object.freeze({ ACTION_STARTED: "actionStarted" }),
  runBattleActionStartAutomation: mocks.runBattleActionStartAutomation,
}));
vi.mock("./battle-api-bridge.js", () => ({
  BattleApiBridgeEvent: Object.freeze({ INSTALL: "install" }),
  runBattleApiBridgeAutomation: mocks.runBattleApiBridgeAutomation,
}));

beforeEach(() => {
  document.body.innerHTML = "";
  for (const fn of Object.values(mocks)) fn.mockClear();
});

describe("runBattleActionEventBridgeAutomation", () => {
  it("installs action event nodes and the API bridge through one entry", () => {
    expect(
      runBattleActionEventBridgeAutomation({ type: BattleActionEventBridgeEvent.INSTALL })
    ).toBe(true);

    expect(mocks.cE).toHaveBeenCalledWith("a");
    expect(document.getElementById("eventStart")).toBeTruthy();
    expect(document.getElementById("eventEnd")).toBeTruthy();
    expect(mocks.runBattleApiBridgeAutomation).toHaveBeenCalledWith({ type: "install" });
  });

  it("routes action start and end node clicks to their entries", () => {
    runBattleActionEventBridgeAutomation({ type: BattleActionEventBridgeEvent.INSTALL });

    document.getElementById("eventStart").click();
    document.getElementById("eventEnd").click();

    expect(mocks.runBattleActionStartAutomation).toHaveBeenCalledWith({ type: "actionStarted" });
    expect(mocks.runBattleActionEndAutomation).toHaveBeenCalledWith({ type: "actionEnded" });
  });

  it("rejects unknown events", () => {
    expect(runBattleActionEventBridgeAutomation({ type: "unknown" })).toBe(false);

    expect(mocks.runBattleApiBridgeAutomation).not.toHaveBeenCalled();
  });
});
