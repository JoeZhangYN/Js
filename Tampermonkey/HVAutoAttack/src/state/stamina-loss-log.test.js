import { beforeEach, describe, expect, it } from "vitest";
import { clearStaminaLossLog, readStaminaLossLog, recordStaminaLoss } from "./stamina-loss-log.js";
import { getValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";

beforeEach(() => {
  localStorage.clear();
});

describe("stamina loss log entry", () => {
  it("records stamina loss by timestamp", () => {
    recordStaminaLoss(7, "2026/6/27 00:00:05");

    expect(readStaminaLossLog()).toEqual({ "2026/6/27 00:00:05": 7 });
    expect(getValue(STORAGE_KEYS.STAMINA_LOST_LOG, true)).toEqual({
      "2026/6/27 00:00:05": 7,
    });
  });

  it("clears stamina loss log", () => {
    recordStaminaLoss(3, "t1");

    clearStaminaLossLog();

    expect(readStaminaLossLog()).toEqual({});
  });
});
