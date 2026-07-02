import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  setValue: vi.fn(),
}));

vi.mock("./storage.js", async () => {
  const actual = await vi.importActual("./storage.js");
  return { ...actual, setValue: mocks.setValue };
});

import { StaminaLossLogEvent, runStaminaLossLogAutomation } from "./stamina-loss-log.js";
import { STAMINA_LOSS_LOG_FAILURE_KEY } from "./stamina-loss-log-failure.js";

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.restoreAllMocks();
  mocks.setValue.mockReset();
});

describe("stamina loss log persistence failures", () => {
  it("does not report stamina loss record success when storage write fails", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.setValue.mockImplementation(() => {
      throw new Error("stamina loss log write blocked");
    });

    expect(
      runStaminaLossLogAutomation({
        type: StaminaLossLogEvent.RECORD,
        amount: 7,
        stamp: "blocked",
      })
    ).toBe(false);

    expect(JSON.parse(window.sessionStorage.getItem(STAMINA_LOSS_LOG_FAILURE_KEY))).toMatchObject({
      capability: "staminaLossLog",
      stage: "record",
      failure: { kind: "storageWrite", error: "stamina loss log write blocked" },
    });
  });

  it("does not report stamina loss clear success when storage write fails", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.setValue.mockImplementation(() => {
      throw new Error("stamina loss log clear blocked");
    });

    expect(runStaminaLossLogAutomation({ type: StaminaLossLogEvent.CLEAR })).toBe(false);

    expect(JSON.parse(window.sessionStorage.getItem(STAMINA_LOSS_LOG_FAILURE_KEY))).toMatchObject({
      capability: "staminaLossLog",
      stage: "clear",
      failure: { kind: "storageWrite", error: "stamina loss log clear blocked" },
    });
  });

  it("does not throw when stamina loss log failure evidence and warning both fail", () => {
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === STAMINA_LOSS_LOG_FAILURE_KEY) throw new Error("session blocked");
      return Reflect.apply(originalSetItem, this, [key, value]);
    });
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });
    mocks.setValue.mockImplementation(() => {
      throw new Error("stamina loss log write blocked");
    });

    expect(() =>
      runStaminaLossLogAutomation({
        type: StaminaLossLogEvent.RECORD,
        amount: 7,
        stamp: "blocked",
      })
    ).not.toThrow();
    expect(
      runStaminaLossLogAutomation({
        type: StaminaLossLogEvent.RECORD,
        amount: 7,
        stamp: "blocked",
      })
    ).toBe(false);
  });
});
