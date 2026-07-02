import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  setValue: vi.fn(),
}));

vi.mock("../state/storage.js", async () => {
  const actual = await vi.importActual("../state/storage.js");
  return { ...actual, setValue: mocks.setValue };
});

import { STORAGE_KEYS } from "../state/persist-keys.js";
import { g } from "../state/store.js";
import { MonsterStatusEvent, runMonsterStatusAutomation } from "./monster-status-automation.js";
import { MONSTER_STATUS_FAILURE_KEY } from "./monster-status-failure.js";

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.restoreAllMocks();
  mocks.setValue.mockReset();
  mocks.setValue.mockImplementation((item, value) => {
    window.localStorage[`hvAA_${item}`] = JSON.stringify(value);
  });
  g("monsterStatus", null);
});

function lastFailure() {
  return JSON.parse(window.sessionStorage.getItem(MONSTER_STATUS_FAILURE_KEY));
}

describe("monster status persistence failures", () => {
  it("does not publish spawn roster when monster status persistence fails", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.setValue.mockImplementation(() => {
      throw new Error("monster status blocked");
    });

    expect(
      runMonsterStatusAutomation({
        type: MonsterStatusEvent.PREPARE_ROUND_START,
        initialized: true,
        monsterAll: 1,
        battleLogRows: ["Spawned Monster A: MID=101 (Alpha) LV=10 HP=1000"],
      })
    ).toEqual({
      initialized: true,
      repaired: false,
      failed: true,
      reason: "monsterStatusPersistenceFailed",
    });

    expect(g("monsterStatus")).toBeNull();
    expect(lastFailure()).toMatchObject({
      capability: "monsterStatus",
      stage: "spawn-roster",
      failure: { kind: "storageWrite", error: "monster status blocked" },
    });
  });

  it("does not report repair success when round-start-log repair persistence fails", () => {
    document.body.innerHTML = '<div class="btm1"><div class="btm2"></div></div>';
    mocks.setValue.mockImplementation(() => {
      throw new Error("monster repair blocked");
    });

    expect(runMonsterStatusAutomation({ type: MonsterStatusEvent.REPAIR })).toBe(false);

    expect(lastFailure()).toMatchObject({
      stage: "repair-rendered-snapshot",
      failure: { error: "monster repair blocked" },
    });
  });

  it("does not throw when monster status failure evidence and warning both fail", () => {
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function setItem(key, value) {
      if (key === MONSTER_STATUS_FAILURE_KEY) throw new Error("session blocked");
      return Reflect.apply(originalSetItem, this, [key, value]);
    });
    vi.spyOn(console, "warn").mockImplementation(() => {
      throw new Error("console blocked");
    });
    mocks.setValue.mockImplementation(() => {
      throw new Error("monster status blocked");
    });

    expect(() =>
      runMonsterStatusAutomation({
        type: MonsterStatusEvent.PREPARE_ROUND_START,
        initialized: true,
        monsterAll: 1,
        battleLogRows: ["Spawned Monster A: MID=101 (Alpha) LV=10 HP=1000"],
      })
    ).not.toThrow();
  });

  it("uses the monster status storage key for failure-path persistence", () => {
    runMonsterStatusAutomation({
      type: MonsterStatusEvent.PREPARE_ROUND_START,
      initialized: true,
      monsterAll: 1,
      battleLogRows: ["Spawned Monster A: MID=101 (Alpha) LV=10 HP=1000"],
    });

    expect(mocks.setValue).toHaveBeenCalledWith(STORAGE_KEYS.MONSTER_STATUS, expect.any(Array));
  });
});
