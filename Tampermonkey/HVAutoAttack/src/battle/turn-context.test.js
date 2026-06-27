import { beforeEach, describe, expect, it, vi } from "vitest";
import { prepareBattleTurnContext } from "./turn-context.js";

const mocks = vi.hoisted(() => ({
  assertNoDomRefs: vi.fn(),
  collectSnapshot: vi.fn(),
  g: vi.fn(),
  runCdRuntimeAutomation: vi.fn(),
  runOptionAutomation: vi.fn(),
}));

vi.mock("../state/cd-tracker.js", () => ({
  CdRuntimeEvent: Object.freeze({ INCREMENT_TURN: "incrementTurn", PERSIST: "persist" }),
  runCdRuntimeAutomation: mocks.runCdRuntimeAutomation,
}));
vi.mock("../state/option.js", () => ({
  OptionEvent: Object.freeze({ READ_FIELD: "readField" }),
  runOptionAutomation: mocks.runOptionAutomation,
}));
vi.mock("../state/store.js", () => ({ g: mocks.g }));
vi.mock("./snapshot.js", () => ({
  assertNoDomRefs: mocks.assertNoDomRefs,
  collectSnapshot: mocks.collectSnapshot,
}));

const snap = { hp: 90, mp: 80, sp: 70, oc: 60 };

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.collectSnapshot.mockReturnValue(snap);
  mocks.runOptionAutomation.mockReturnValue(false);
});

describe("prepareBattleTurnContext", () => {
  it("prepares one turn context through the entry", () => {
    expect(prepareBattleTurnContext()).toBe(snap);

    expect(mocks.runCdRuntimeAutomation).toHaveBeenNthCalledWith(1, { type: "incrementTurn" });
    expect(mocks.runCdRuntimeAutomation).toHaveBeenNthCalledWith(2, { type: "persist" });
    expect(mocks.g).toHaveBeenCalledWith("hp", 90);
    expect(mocks.g).toHaveBeenCalledWith("mp", 80);
    expect(mocks.g).toHaveBeenCalledWith("sp", 70);
    expect(mocks.g).toHaveBeenCalledWith("oc", 60);
  });

  it("reads debug snapshot through the option entry", () => {
    mocks.runOptionAutomation.mockReturnValue(true);

    prepareBattleTurnContext();

    expect(mocks.runOptionAutomation).toHaveBeenCalledWith({
      type: "readField",
      key: "debugSnapshot",
      fallback: false,
    });
    expect(mocks.assertNoDomRefs).toHaveBeenCalledWith(snap);
  });
});
