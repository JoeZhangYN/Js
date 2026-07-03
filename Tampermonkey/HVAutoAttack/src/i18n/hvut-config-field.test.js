import { describe, expect, it } from "vitest";
import {
  formatHvutConfigFieldDescription,
  formatHvutConfigFieldHelpText,
  getHvutConfigFieldInputKind,
  isHvutConfigFieldDisabled,
} from "./hvut-config-field.js";

describe("HVUT config field applicability", () => {
  it("uses server ownership for Isekai config fields", () => {
    expect(isHvutConfigFieldDisabled({ server: "isekai" }, { isIsekai: true, serverName: "isekai" })).toBe(false);
    expect(isHvutConfigFieldDisabled({ server: "persistent" }, { isIsekai: true, serverName: "isekai" })).toBe(true);
  });

  it("uses disabled flags for persistent config fields", () => {
    expect(isHvutConfigFieldDisabled({ disabled: "persistent" }, { isIsekai: false })).toBe(true);
    expect(isHvutConfigFieldDisabled({ disabled: "isekai" }, { isIsekai: false })).toBe(false);
  });

  it("classifies config field input kind once", () => {
    expect(getHvutConfigFieldInputKind({ input: "textarea", type: "string" })).toBe("textarea");
    expect(getHvutConfigFieldInputKind({ input: "select", type: "string" })).toBe("select");
    expect(getHvutConfigFieldInputKind({ type: "boolean" })).toBe("checkbox");
    expect(getHvutConfigFieldInputKind({ type: "number" })).toBe("number");
    expect(getHvutConfigFieldInputKind({ type: "string" })).toBe("text");
  });

  it("formats field help text once", () => {
    expect(formatHvutConfigFieldHelpText("  first\n    second")).toBe("first<br>second");
    expect(formatHvutConfigFieldHelpText("")).toBeNull();
  });

  it("formats field descriptions into button and html once", () => {
    expect(formatHvutConfigFieldDescription("  Syntax\n    line one\n    line two")).toEqual({
      button: "Syntax",
      html: "line one<br>line two",
    });
    expect(formatHvutConfigFieldDescription(null)).toBeNull();
  });
});
