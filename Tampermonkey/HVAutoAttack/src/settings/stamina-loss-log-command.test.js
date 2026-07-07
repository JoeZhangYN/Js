import { beforeEach, describe, expect, it } from "vitest";
import { StaminaLossLogEvent, runStaminaLossLogAutomation } from "../state/stamina-loss-log.js";
import {
  SettingsStaminaLossLogCommandEvent,
  runSettingsStaminaLossLogCommand,
} from "./stamina-loss-log-command.js";

beforeEach(() => {
  localStorage.clear();
});

describe("settings stamina loss log command entry", () => {
  it("renders the clear confirmation message through one settings command", () => {
    runStaminaLossLogAutomation({
      type: StaminaLossLogEvent.RECORD,
      amount: 3,
      stamp: "old",
    });

    const message = runSettingsStaminaLossLogCommand({
      type: SettingsStaminaLossLogCommandEvent.CLEAR_CONFIRMATION_MESSAGE,
    });

    expect(message).toContain("总共1条记录 (There are 1 logs)");
    expect(message).toContain("old: 3");
  });

  it("clears stamina loss logs as a typed settings command", () => {
    runStaminaLossLogAutomation({
      type: StaminaLossLogEvent.RECORD,
      amount: 5,
      stamp: "gone",
    });

    expect(
      runSettingsStaminaLossLogCommand({ type: SettingsStaminaLossLogCommandEvent.CLEAR })
    ).toEqual({ ok: true, type: SettingsStaminaLossLogCommandEvent.CLEAR });
    expect(
      runSettingsStaminaLossLogCommand({
        type: SettingsStaminaLossLogCommandEvent.CLEAR_CONFIRMATION_MESSAGE,
      })
    ).toContain("总共0条记录");
  });

  it("fails closed for unknown stamina loss log commands", () => {
    expect(runSettingsStaminaLossLogCommand({ type: "unknown" })).toBeUndefined();
    expect(runSettingsStaminaLossLogCommand(null)).toBeUndefined();
  });
});
