import { beforeEach, describe, expect, it } from "vitest";
import { StaminaLossLogEvent, runStaminaLossLogAutomation } from "./stamina-loss-log.js";
import { getValue, setValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";

beforeEach(() => {
  localStorage.clear();
});

describe("stamina loss log entry", () => {
  it("records stamina loss by timestamp without rewriting the legacy aggregate", async () => {
    await runStaminaLossLogAutomation({
      type: StaminaLossLogEvent.RECORD,
      amount: 7,
      stamp: "2026/6/27 00:00:05",
    });

    expect(await runStaminaLossLogAutomation({ type: StaminaLossLogEvent.READ })).toEqual({
      "2026/6/27 00:00:05": 7,
    });
    expect(getValue(STORAGE_KEYS.STAMINA_LOST_LOG, true)).toBeNull();
  });

  it("clears incremental and legacy stamina loss logs", async () => {
    setValue(STORAGE_KEYS.STAMINA_LOST_LOG, { legacy: 2 });
    await runStaminaLossLogAutomation({
      type: StaminaLossLogEvent.RECORD,
      amount: 3,
      stamp: "t1",
    });

    await runStaminaLossLogAutomation({ type: StaminaLossLogEvent.CLEAR });

    expect(await runStaminaLossLogAutomation({ type: StaminaLossLogEvent.READ })).toEqual({});
    expect(getValue(STORAGE_KEYS.STAMINA_LOST_LOG, true)).toBeNull();
  });

  it("renders the clear confirmation message newest first", async () => {
    await runStaminaLossLogAutomation({
      type: StaminaLossLogEvent.RECORD,
      amount: 3,
      stamp: "old",
    });
    await runStaminaLossLogAutomation({
      type: StaminaLossLogEvent.RECORD,
      amount: 5,
      stamp: "new",
    });

    const message = await runStaminaLossLogAutomation({
      type: StaminaLossLogEvent.CLEAR_CONFIRMATION_MESSAGE,
    });

    expect(message).toContain("总共2条记录 (There are 2 logs)");
    expect(message.indexOf("new: 5")).toBeLessThan(message.indexOf("old: 3"));
    expect(message).toContain("是否重置 (Whether to reset)?");
  });

  it("ignores invalid stamina loss log events without changing stored logs", async () => {
    await runStaminaLossLogAutomation({
      type: StaminaLossLogEvent.RECORD,
      amount: 4,
      stamp: "kept",
    });

    expect(runStaminaLossLogAutomation({ type: "unknown" })).toBeUndefined();
    expect(runStaminaLossLogAutomation(null)).toBeUndefined();
    expect(await runStaminaLossLogAutomation({ type: StaminaLossLogEvent.READ })).toEqual({
      kept: 4,
    });
  });
});
