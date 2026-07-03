import { describe, expect, it, vi } from "vitest";
import { SettingsFormOptionEvent, runSettingsFormOptionAutomation } from "./form-option.js";

const input = (overrides) => ({
  className: "",
  type: "text",
  name: "",
  id: "",
  value: "",
  placeholder: "",
  checked: false,
  hasAttribute: vi.fn(() => false),
  ...overrides,
});

describe("runSettingsFormOptionAutomation", () => {
  it("rejects invalid form option events without collecting fields", () => {
    expect(
      runSettingsFormOptionAutomation({
        type: "unknown",
        version: "10.0",
        inputs: [
          input({ className: "hvAANumber", name: "delay", value: "", placeholder: "200" }),
        ],
      })
    ).toBeUndefined();
    expect(runSettingsFormOptionAutomation(null)).toBeUndefined();
  });

  it("collects scalar settings fields into an option object", () => {
    expect(
      runSettingsFormOptionAutomation({
        type: SettingsFormOptionEvent.COLLECT_OPTION,
        version: "10.0",
        inputs: [
          input({ className: "hvAANumber", name: "delay", value: "", placeholder: "200" }),
          input({ type: "text", name: "mlEndpoint", value: "https://example.test/ml" }),
          input({ type: "select-one", name: "lang", value: "2" }),
          input({ type: "checkbox", id: "pageRefresh", checked: true }),
          input({ className: "hvAADebug", name: "roundNow", value: "3" }),
        ],
      })
    ).toEqual({
      version: "10.0",
      delay: 200,
      mlEndpoint: "https://example.test/ml",
      lang: "2",
      pageRefresh: true,
    });
  });

  it("preserves default-on false and customize grouped values", () => {
    expect(
      runSettingsFormOptionAutomation({
        type: SettingsFormOptionEvent.COLLECT_OPTION,
        version: "10.0",
        inputs: [
          input({
            type: "checkbox",
            id: "riddleHelperUi",
            checked: false,
            hasAttribute: vi.fn((name) => name === "data-default-on"),
          }),
          input({ className: "customizeInput", name: "healCondition_0", value: "mp,4,45" }),
          input({ className: "customizeInput", name: "healCondition_0", value: "!mp,4,25" }),
          input({ type: "text", name: "audio_Common", value: "https://example.test/a.ogg" }),
        ],
      })
    ).toEqual({
      version: "10.0",
      riddleHelperUi: false,
      healCondition: { 0: ["mp,4,45", "!mp,4,25"] },
      audio: { Common: "https://example.test/a.ogg" },
    });
  });

  it("classifies settings input classes by token", () => {
    expect(
      runSettingsFormOptionAutomation({
        type: SettingsFormOptionEvent.COLLECT_OPTION,
        version: "10.0",
        inputs: [
          input({
            className: "hvAADebug hvAANumber",
            name: "roundNow",
            value: "7",
            placeholder: "1",
          }),
          input({ className: "hvAANumber extra", name: "delay", value: "", placeholder: "200" }),
          input({ className: "customizeInput active", name: "healCondition_0", value: "hp,4,55" }),
          input({ className: "customizeInput active", name: "healCondition_0", value: "mp,4,35" }),
        ],
      })
    ).toEqual({
      version: "10.0",
      delay: 200,
      healCondition: { 0: ["hp,4,55", "mp,4,35"] },
    });
  });
});
