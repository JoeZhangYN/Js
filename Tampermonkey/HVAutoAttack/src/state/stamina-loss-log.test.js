import { beforeEach, describe, expect, it } from "vitest";
import { StaminaLossLogEvent, runStaminaLossLogAutomation } from "./stamina-loss-log.js";
import { getValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";

beforeEach(() => {
  localStorage.clear();
});

describe("stamina loss log entry", () => {
  it("records stamina loss by timestamp", () => {
    runStaminaLossLogAutomation({
      type: StaminaLossLogEvent.RECORD,
      amount: 7,
      stamp: "2026/6/27 00:00:05",
    });

    expect(runStaminaLossLogAutomation({ type: StaminaLossLogEvent.READ })).toEqual({
      "2026/6/27 00:00:05": 7,
    });
    expect(getValue(STORAGE_KEYS.STAMINA_LOST_LOG, true)).toEqual({
      "2026/6/27 00:00:05": 7,
    });
  });

  it("clears stamina loss log", () => {
    runStaminaLossLogAutomation({
      type: StaminaLossLogEvent.RECORD,
      amount: 3,
      stamp: "t1",
    });

    runStaminaLossLogAutomation({ type: StaminaLossLogEvent.CLEAR });

    expect(runStaminaLossLogAutomation({ type: StaminaLossLogEvent.READ })).toEqual({});
  });

  it("renders the clear confirmation message newest first", () => {
    runStaminaLossLogAutomation({
      type: StaminaLossLogEvent.RECORD,
      amount: 3,
      stamp: "old",
    });
    runStaminaLossLogAutomation({
      type: StaminaLossLogEvent.RECORD,
      amount: 5,
      stamp: "new",
    });

    const message = runStaminaLossLogAutomation({
      type: StaminaLossLogEvent.CLEAR_CONFIRMATION_MESSAGE,
    });

    expect(message).toContain("总共2条记录 (There are 2 logs)");
    expect(message.indexOf("new: 5")).toBeLessThan(message.indexOf("old: 3"));
    expect(message).toContain("是否重置 (Whether to reset)?");
  });

  it("ignores unknown stamina loss log events", () => {
    expect(runStaminaLossLogAutomation({ type: "unknown" })).toBeUndefined();
    expect(getValue(STORAGE_KEYS.STAMINA_LOST_LOG, true)).toBeNull();
  });
});
