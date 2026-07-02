import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  setValue: vi.fn(),
}));

vi.mock("../state/storage.js", async () => {
  const actual = await vi.importActual("../state/storage.js");
  return { ...actual, setValue: mocks.setValue };
});

import { STORAGE_KEYS } from "../state/persist-keys.js";
import { BattleRoundEvent, runBattleRoundAutomation } from "./battle-round.js";
import { BATTLE_ROUND_FAILURE_KEY } from "./battle-round-failure.js";

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.restoreAllMocks();
  mocks.setValue.mockReset();
  mocks.setValue.mockImplementation((item, value) => {
    window.localStorage[`hvAA_${item}`] =
      typeof value === "string" ? value : JSON.stringify(value);
  });
});

function lastFailure() {
  return JSON.parse(window.sessionStorage.getItem(BATTLE_ROUND_FAILURE_KEY));
}

describe("battle round persistence failures", () => {
  it("does not report round type success when type persistence fails", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.setValue.mockImplementation(() => {
      throw new Error("round type blocked");
    });

    expect(
      runBattleRoundAutomation({ type: BattleRoundEvent.RECORD_TYPE, roundType: "ar" })
    ).toBe(false);

    expect(lastFailure()).toMatchObject({
      capability: "battleRound",
      stage: "record-type",
      key: STORAGE_KEYS.ROUND_TYPE,
      failure: { kind: "storageWrite", error: "round type blocked" },
    });
  });

  it("does not report round count success when round-all persistence fails", () => {
    mocks.setValue.mockImplementation((item, value) => {
      if (item === STORAGE_KEYS.ROUND_ALL) throw new Error("round all blocked");
      window.localStorage[`hvAA_${item}`] = JSON.stringify(value);
    });

    expect(
      runBattleRoundAutomation({
        type: BattleRoundEvent.RECORD_COUNT,
        roundNow: 2,
        roundAll: 5,
      })
    ).toBe(false);

    expect(lastFailure()).toMatchObject({
      stage: "record-count-all",
      key: STORAGE_KEYS.ROUND_ALL,
      failure: { error: "round all blocked" },
    });
  });

  it("does not report debug field success when count persistence fails", () => {
    mocks.setValue.mockImplementation((item, value) => {
      if (item === STORAGE_KEYS.ROUND_NOW) throw new Error("round now blocked");
      window.localStorage[`hvAA_${item}`] = JSON.stringify(value);
    });

    expect(
      runBattleRoundAutomation({
        type: BattleRoundEvent.RECORD_DEBUG_FIELDS,
        fields: [
          { name: "roundType", value: "ar", placeholder: "" },
          { name: "roundNow", value: "2", placeholder: "" },
          { name: "roundAll", value: "5", placeholder: "" },
        ],
      })
    ).toBe(false);

    expect(lastFailure()).toMatchObject({
      stage: "record-count-now",
      key: STORAGE_KEYS.ROUND_NOW,
      failure: { error: "round now blocked" },
    });
  });

  it("classifies startup context as unstarted when round type persistence fails", () => {
    mocks.setValue.mockImplementation(() => {
      throw new Error("round type blocked");
    });

    expect(
      runBattleRoundAutomation({
        type: BattleRoundEvent.RECORD_START_CONTEXT,
        initializingText: "Initializing random encounter",
      })
    ).toEqual({
      initialized: true,
      roundType: "",
      randomEncounterStarted: false,
      reason: "roundPersistenceFailed",
    });
  });

  it("does not throw when round failure evidence and warning both fail", () => {
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === BATTLE_ROUND_FAILURE_KEY) throw new Error("session blocked");
      return Reflect.apply(originalSetItem, this, [key, value]);
    });
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });
    mocks.setValue.mockImplementation(() => {
      throw new Error("round type blocked");
    });

    expect(() =>
      runBattleRoundAutomation({ type: BattleRoundEvent.RECORD_TYPE, roundType: "ar" })
    ).not.toThrow();
  });
});
