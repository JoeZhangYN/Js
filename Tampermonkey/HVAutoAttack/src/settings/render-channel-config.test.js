import { describe, expect, it } from "vitest";

import { renderChannelFallbackEnableSchemaField } from "./render.js";

describe("renderChannelFallbackEnableSchemaField", () => {
  it("derives the Channel fallback enable switch from schema", () => {
    const html = renderChannelFallbackEnableSchemaField();

    expect(html).toContain('id="channelSkill2" type="checkbox"');
    expect(html).toContain('for="channelSkill2"');
    expect(html).toContain("<l2>Then use fallback skills</l2>");
    expect(html).not.toContain("<l0><b>再使用技能</b></label>");
  });
});
