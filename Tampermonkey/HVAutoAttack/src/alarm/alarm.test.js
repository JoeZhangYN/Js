import { beforeEach, describe, expect, it, vi } from "vitest";
import { AlarmEvent, runAlarmAutomation } from "./alarm.js";
import { g } from "../state/store.js";

beforeEach(() => {
  document.body.innerHTML = "";
  g("lang", 2);
  g("option", {
    alert: true,
    notification: false,
    audioEnable: { Error: true },
    audio: {},
  });
  vi.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(() => {});
  vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});

describe("alarm entry", () => {
  it("triggers configured audio alarm through the entry", () => {
    runAlarmAutomation({ type: AlarmEvent.TRIGGER, kind: "Error" });

    const audio = document.getElementById("hvAAAlert-Error");
    expect(audio).toBeTruthy();
    expect(audio.tagName).toBe("AUDIO");
    expect(audio.play).toHaveBeenCalled();
  });

  it("can trigger audio-only alarms through the same entry", () => {
    runAlarmAutomation({ type: AlarmEvent.AUDIO, kind: "Riddle" });

    const audio = document.getElementById("hvAAAlert-Riddle");
    expect(audio.loop).toBe(true);
    expect(audio.play).toHaveBeenCalled();
  });

  it("can trigger notification-only alarms through the same entry", () => {
    const gmNotification = vi.fn();
    vi.stubGlobal("GM_notification", gmNotification);

    runAlarmAutomation({ type: AlarmEvent.NOTIFICATION, kind: "Test" });

    expect(gmNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "testText",
        title: "HentaiVerse Notification",
        timeout: 3000,
      })
    );
    vi.unstubAllGlobals();
  });

  it("previews configured audio URLs through the alarm entry", () => {
    document.body.innerHTML = '<div id="hvAATab-Alarm"></div>';

    expect(
      runAlarmAutomation({
        type: AlarmEvent.PREVIEW_AUDIO_URL,
        url: "https://example.test/alarm.ogg",
      })
    ).toMatchObject({ ok: true, message: expect.objectContaining({ l2: expect.any(String) }) });

    const audio = document.querySelector("#hvAATab-Alarm audio");
    expect(audio.src).toBe("https://example.test/alarm.ogg");
    expect(audio.controls).toBe(true);
    expect(audio.play).toHaveBeenCalled();
  });

  it("rejects unsupported preview audio URLs through the alarm entry", () => {
    document.body.innerHTML = '<div id="hvAATab-Alarm"></div>';

    expect(
      runAlarmAutomation({
        type: AlarmEvent.PREVIEW_AUDIO_URL,
        url: "javascript:alert(1)",
      })
    ).toMatchObject({ ok: false, message: expect.objectContaining({ l2: expect.any(String) }) });

    expect(document.querySelector("#hvAATab-Alarm audio")).toBeNull();
  });
});
