import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { _alert, UserFeedbackEvent, runUserFeedbackAutomation } from "./lang.js";

const mocks = vi.hoisted(() => ({
  g: vi.fn(),
}));

vi.mock("../state/store.js", () => ({ g: mocks.g }));

beforeEach(() => {
  mocks.g.mockReset();
  mocks.g.mockReturnValue(2);
  window.alert = vi.fn();
  window.confirm = vi.fn(() => true);
  window.prompt = vi.fn(() => "1");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("runUserFeedbackAutomation", () => {
  it("selects localized text through the typed feedback entry", () => {
    expect(
      runUserFeedbackAutomation({
        type: UserFeedbackEvent.TEXT,
        copy: { l0: "简", l1: "繁", l2: "English" },
      })
    ).toBe("English");
  });

  it("routes confirm and prompt through one typed browser feedback adapter", () => {
    expect(
      runUserFeedbackAutomation({
        type: UserFeedbackEvent.CONFIRM,
        copy: { l0: "重置?", l1: "重置?", l2: "Reset?" },
      })
    ).toBe(true);
    expect(window.confirm).toHaveBeenCalledWith("Reset?");

    expect(
      runUserFeedbackAutomation({
        type: UserFeedbackEvent.PROMPT,
        copy: { l0: "语言", l1: "語言", l2: "Language" },
        defaultValue: 0,
      })
    ).toBe("1");
    expect(window.prompt).toHaveBeenCalledWith("Language", 0);
  });

  it("renders blocking errors as copy-ready diagnostic prompts", () => {
    runUserFeedbackAutomation({
      type: UserFeedbackEvent.BLOCKING_ERROR,
      incident: "encounter-generation:test",
      page: "https://e-hentai.org/news.php",
      copy: { l0: "已阻断", l1: "已阻斷", l2: "Automation blocked" },
      evidence: {
        capability: "encounterGeneration",
        stage: "generationResult",
        reason: "encounterKeyMissing",
      },
    });

    expect(window.prompt).toHaveBeenCalledWith(
      "Automation blocked",
      expect.stringContaining("incident: encounter-generation:test")
    );
    expect(window.prompt.mock.calls[0][1]).toContain("reason: encounterKeyMissing");
  });

  it("keeps the legacy _alert wrapper as a compatibility delegate", () => {
    _alert(0, "提醒", "提醒", "Notice");
    expect(window.alert).toHaveBeenCalledWith("Notice");

    expect(_alert(1, "继续?", "繼續?", "Continue?")).toBe(true);
    expect(window.confirm).toHaveBeenCalledWith("Continue?");
  });
});
