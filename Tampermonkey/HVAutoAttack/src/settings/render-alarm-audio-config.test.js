import { describe, expect, it } from "vitest";
import { renderAlarmAudioProfileRows } from "./render.js";

describe("renderAlarmAudioProfileRows", () => {
  it("derives alarm audio controls from alarm profile identity", () => {
    const html = renderAlarmAudioProfileRows();

    expect(html).toContain('id="audioEnable_Common"');
    expect(html).toContain('name="audio_Common"');
    expect(html).toContain('id="audioEnable_Riddle"');
    expect(html).toContain('name="audio_Riddle"');
    expect(html).toContain('id="audioEnable_Victory"');
    expect(html).not.toContain("audioEnable_Test");
    expect(html.match(/id="audioEnable_/g)).toHaveLength(5);
  });
});
