import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  RIDDLE_ML_ANSWER_FAILURE_KEY,
  recordRiddleMlAnswerFailure,
} from "./riddle-ml-answer-failure.js";

const mocks = vi.hoisted(() => ({ runRiddleLogAutomation: vi.fn() }));

vi.mock("../state/riddle-log.js", () => ({
  RiddleLogEvent: Object.freeze({ PUSH: "push" }),
  runRiddleLogAutomation: mocks.runRiddleLogAutomation,
}));

function lastFailure() {
  return JSON.parse(sessionStorage.getItem(RIDDLE_ML_ANSWER_FAILURE_KEY));
}

beforeEach(() => {
  sessionStorage.clear();
  mocks.runRiddleLogAutomation.mockReset();
});

describe("recordRiddleMlAnswerFailure", () => {
  it("records top-level ML answer rejection as project diagnostic evidence", () => {
    const evidence = recordRiddleMlAnswerFailure(new Error("ml blocked"));

    expect(evidence).toMatchObject({
      capability: "riddleMlAnswer",
      stage: "answerFlow",
      reason: "promiseRejected",
      fallback: "random",
      error: "ml blocked",
    });
    expect(lastFailure()).toMatchObject(evidence);
    expect(mocks.runRiddleLogAutomation).toHaveBeenCalledWith({
      type: "push",
      message: "ml answer failed error=ml blocked fallback=random",
    });
  });

  it("keeps random fallback when evidence, log, and warning diagnostics fail", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("session blocked");
    });
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });
    mocks.runRiddleLogAutomation.mockImplementation(() => {
      throw new Error("log blocked");
    });

    expect(() => recordRiddleMlAnswerFailure(new Error("ml blocked"))).not.toThrow();
    console.warn.mockRestore();
    Storage.prototype.setItem.mockRestore();
  });
});
