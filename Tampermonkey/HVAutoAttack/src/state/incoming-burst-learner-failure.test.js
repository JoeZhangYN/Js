import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  setValue: vi.fn(),
}));

vi.mock("./storage.js", async () => {
  const actual = await vi.importActual("./storage.js");
  return { ...actual, setValue: mocks.setValue };
});

import {
  IncomingBurstLearningEvent,
  runIncomingBurstLearningAutomation,
} from "./incoming-burst-learner.js";
import { INCOMING_BURST_LEARNING_FAILURE_KEY } from "./incoming-burst-learner-failure.js";

const event = {
  type: IncomingBurstLearningEvent.RECORD_EVENTS,
  events: [{ kind: "player-incoming", source: "Orc", dmg: 500, type: "cold" }],
  monsterIdentities: [{ monsterId: 100, name: "Orc" }],
};

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.restoreAllMocks();
  mocks.setValue.mockReset();
});

describe("incoming burst learning persistence failures", () => {
  it("does not report learned incoming burst success when storage write fails", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.setValue.mockImplementation(() => {
      throw new Error("incoming burst learning write blocked");
    });

    expect(runIncomingBurstLearningAutomation(event)).toBe(false);

    expect(
      JSON.parse(window.sessionStorage.getItem(INCOMING_BURST_LEARNING_FAILURE_KEY))
    ).toMatchObject({
      capability: "incomingBurstLearning",
      stage: "update-learned",
      failure: { kind: "storageWrite", error: "incoming burst learning write blocked" },
    });
  });

  it("does not throw when incoming burst failure evidence and warning both fail", () => {
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === INCOMING_BURST_LEARNING_FAILURE_KEY) throw new Error("session blocked");
      return Reflect.apply(originalSetItem, this, [key, value]);
    });
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });
    mocks.setValue.mockImplementation(() => {
      throw new Error("incoming burst learning write blocked");
    });

    expect(() => runIncomingBurstLearningAutomation(event)).not.toThrow();
    expect(runIncomingBurstLearningAutomation(event)).toBe(false);
  });
});
