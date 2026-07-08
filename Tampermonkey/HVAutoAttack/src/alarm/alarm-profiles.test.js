import { describe, expect, it } from "vitest";
import { AlarmProfileEvent, runAlarmProfileCatalog } from "./alarm-profiles.js";

describe("alarm profile catalog", () => {
  it("exposes configurable audio profiles without the notification-only test kind", () => {
    const profiles = runAlarmProfileCatalog({ type: AlarmProfileEvent.READ_AUDIO_PROFILES });

    expect(profiles.map(({ key }) => key)).toEqual([
      "Common",
      "Error",
      "Defeat",
      "Riddle",
      "Victory",
    ]);
    expect(profiles.some(({ key }) => key === "Test")).toBe(false);
  });

  it("normalizes runtime alarm kinds through the profile entry", () => {
    expect(runAlarmProfileCatalog({ type: AlarmProfileEvent.NORMALIZE_KIND, kind: "Riddle" })).toBe(
      "Riddle"
    );
    expect(
      runAlarmProfileCatalog({ type: AlarmProfileEvent.NORMALIZE_KIND, kind: "Bad Kind" })
    ).toBe("Common");
    expect(runAlarmProfileCatalog(null)).toBeUndefined();
  });
});
