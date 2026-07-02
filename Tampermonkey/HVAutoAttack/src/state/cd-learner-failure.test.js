import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  setValue: vi.fn(),
  runOptionAutomation: vi.fn(),
}));

vi.mock("./storage.js", async () => {
  const actual = await vi.importActual("./storage.js");
  return { ...actual, setValue: mocks.setValue };
});

vi.mock("./option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));

import { CdLearningEvent, runCdLearningAutomation } from "./cd-learner.js";
import { CD_LEARNING_FAILURE_KEY } from "./cd-learner-failure.js";
import { g } from "./store.js";

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.restoreAllMocks();
  mocks.setValue.mockReset();
  mocks.runOptionAutomation.mockReset();
  mocks.runOptionAutomation.mockReturnValue(false);
  g("cdLearnPending", {});
});

function fireAndSettleWithFailingStorage() {
  runCdLearningAutomation({
    type: CdLearningEvent.RECORD_FIRE,
    code: "OFC",
    id: "1111",
    globalTurn: 10,
  });
  return runCdLearningAutomation({
    type: CdLearningEvent.FINALIZE_PENDING,
    globalTurn: 35,
    readySkillIds: ["1111"],
  });
}

describe("CD learning persistence failures", () => {
  it("does not report learned CD success when storage write fails", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.setValue.mockImplementation(() => {
      throw new Error("cd learning write blocked");
    });

    expect(fireAndSettleWithFailingStorage()).toBe(false);

    expect(JSON.parse(window.sessionStorage.getItem(CD_LEARNING_FAILURE_KEY))).toMatchObject({
      capability: "cdLearning",
      stage: "update-learned",
      failure: { kind: "storageWrite", error: "cd learning write blocked" },
    });
    expect(g("cdLearnPending")).toEqual({});
  });

  it("does not throw when CD learning failure evidence and warning both fail", () => {
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === CD_LEARNING_FAILURE_KEY) throw new Error("session blocked");
      return Reflect.apply(originalSetItem, this, [key, value]);
    });
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });
    mocks.setValue.mockImplementation(() => {
      throw new Error("cd learning write blocked");
    });

    expect(() => fireAndSettleWithFailingStorage()).not.toThrow();
    expect(fireAndSettleWithFailingStorage()).toBe(false);
  });
});
