import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { g } from "../state/store.js";
import { AlarmEvent, runAlarmAutomation } from "./alarm.js";

beforeEach(() => {
  g("lang", 2);
});

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("alarm browser notification failures", () => {
  it("isolates synchronous browser notification permission failures", () => {
    function BlockedNotification() {}
    BlockedNotification.permission = "default";
    BlockedNotification.requestPermission = () => {
      throw new Error("permission blocked");
    };
    vi.stubGlobal("Notification", BlockedNotification);

    expect(() => runAlarmAutomation({ type: AlarmEvent.NOTIFICATION, kind: "Test" })).not.toThrow();
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastAlarmNotificationFailure"))).toMatchObject({
      capability: "alarmNotification",
      stage: "browserNotificationPermission",
      error: "permission blocked",
    });
  });

  it("isolates rejected browser notification permission requests", async () => {
    function BlockedNotification() {}
    BlockedNotification.permission = "default";
    BlockedNotification.requestPermission = () => Promise.reject(new Error("permission rejected"));
    vi.stubGlobal("Notification", BlockedNotification);

    expect(() => runAlarmAutomation({ type: AlarmEvent.NOTIFICATION, kind: "Test" })).not.toThrow();

    await Promise.resolve();
    await Promise.resolve();
    expect(JSON.parse(sessionStorage.getItem("HVAA:lastAlarmNotificationFailure"))).toMatchObject({
      capability: "alarmNotification",
      stage: "browserNotificationPermissionRejected",
      error: "permission rejected",
    });
  });
});
