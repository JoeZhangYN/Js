import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BattleActionEventBridgeEvent,
  runBattleActionEventBridgeAutomation,
} from "./battle-action-event-bridge.js";

const mocks = vi.hoisted(() => ({
  cE: vi.fn((tag) => document.createElement(tag)),
  gE: vi.fn((selector) => document.querySelector(selector)),
  runBattleActionLifecycleAutomation: vi.fn(),
  runBattleActionLifecycleEvidence: vi.fn(),
  runBattleApiBridgeAutomation: vi.fn(),
}));

vi.mock("../dom/query.js", () => ({
  cE: mocks.cE,
  gE: mocks.gE,
}));
vi.mock("./battle-action-lifecycle.js", () => ({
  BattleActionLifecycleEvent: Object.freeze({
    ACTION_STARTED: "actionStarted",
    ACTION_ENDED: "actionEnded",
  }),
  runBattleActionLifecycleAutomation: mocks.runBattleActionLifecycleAutomation,
}));
vi.mock("./battle-action-lifecycle-evidence.js", () => ({
  BattleActionLifecycleEvidenceEvent: Object.freeze({ RECORD_LIFECYCLE: "recordLifecycle" }),
  runBattleActionLifecycleEvidence: mocks.runBattleActionLifecycleEvidence,
}));
vi.mock("./battle-api-bridge.js", () => ({
  BattleApiBridgeEvent: Object.freeze({ INSTALL: "install" }),
  runBattleApiBridgeAutomation: mocks.runBattleApiBridgeAutomation,
}));

beforeEach(() => {
  document.body.innerHTML = "";
  for (const fn of Object.values(mocks)) fn.mockClear();
  mocks.runBattleApiBridgeAutomation.mockReturnValue(undefined);
});

describe("runBattleActionEventBridgeAutomation", () => {
  it("installs action event nodes and the API bridge through one entry", () => {
    mocks.runBattleApiBridgeAutomation.mockReturnValue(true);

    expect(
      runBattleActionEventBridgeAutomation({ type: BattleActionEventBridgeEvent.INSTALL })
    ).toBe(true);

    expect(mocks.cE).toHaveBeenCalledWith("a");
    expect(document.getElementById("eventStart")).toBeTruthy();
    expect(document.getElementById("eventEnd")).toBeTruthy();
    expect(mocks.runBattleApiBridgeAutomation).toHaveBeenCalledWith({ type: "install" });
  });

  it("returns the API bridge installation result instead of claiming startup succeeded", () => {
    mocks.runBattleApiBridgeAutomation.mockReturnValue(false);

    expect(
      runBattleActionEventBridgeAutomation({ type: BattleActionEventBridgeEvent.INSTALL })
    ).toBe(false);

    expect(document.getElementById("eventStart")).toBeTruthy();
    expect(document.getElementById("eventEnd")).toBeTruthy();
  });

  it("routes action start and end node clicks to the lifecycle entry", () => {
    runBattleActionEventBridgeAutomation({ type: BattleActionEventBridgeEvent.INSTALL });

    document.getElementById("eventStart").click();
    document.getElementById("eventEnd").click();

    expect(mocks.runBattleActionLifecycleAutomation).toHaveBeenCalledWith({
      type: "actionStarted",
    });
    expect(mocks.runBattleActionLifecycleAutomation).toHaveBeenCalledWith({
      type: "actionEnded",
    });
  });

  it("rejects unknown events", () => {
    expect(runBattleActionEventBridgeAutomation({ type: "unknown" })).toBe(false);

    expect(mocks.runBattleApiBridgeAutomation).not.toHaveBeenCalled();
    expect(mocks.runBattleActionLifecycleAutomation).not.toHaveBeenCalled();
    expect(mocks.runBattleActionLifecycleEvidence).toHaveBeenCalledWith({
      type: "recordLifecycle",
      phase: "unknownActionEventBridgeEvent",
      result: {
        outcome: "rejected",
        reason: "unknownActionEventBridgeEvent",
        eventType: "unknown",
      },
      steps: [
        {
          step: "routeEvent",
          result: false,
          reason: "unknownActionEventBridgeEvent",
          eventType: "unknown",
        },
      ],
    });
  });

  it("rejects null events through bridge evidence instead of throwing", () => {
    expect(runBattleActionEventBridgeAutomation(null)).toBe(false);

    expect(mocks.runBattleApiBridgeAutomation).not.toHaveBeenCalled();
    expect(mocks.runBattleActionLifecycleAutomation).not.toHaveBeenCalled();
    expect(mocks.runBattleActionLifecycleEvidence).toHaveBeenCalledWith({
      type: "recordLifecycle",
      phase: "unknownActionEventBridgeEvent",
      result: {
        outcome: "rejected",
        reason: "unknownActionEventBridgeEvent",
        eventType: null,
      },
      steps: [
        {
          step: "routeEvent",
          result: false,
          reason: "unknownActionEventBridgeEvent",
          eventType: null,
        },
      ],
    });
  });
});
