import { describe, expect, it } from "vitest";
import { renderLocalizationSettingsFields } from "./render.js";

describe("localization settings surface", () => {
  it("owns language, percentile lifecycle and shared custom dictionary controls", () => {
    const html = renderLocalizationSettingsFields();

    expect(html).toContain('select name="lang"');
    expect(html).toContain('name="equipPercentileMode"');
    expect(html).toContain("hvAACustomDictionary");
    expect(html).toContain("hvAACustomDictionaryImport");
    expect(html).toContain("group, source");
  });
});
