import { describe, it, expect, beforeEach } from "vitest";
import { AutoTuneEvent, runAutoTuneAutomation } from "./auto-tune.js";
import { setValue, getValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { g } from "./store.js";
import { BattleTurnEvent, runBattleTurnAutomation } from "./battle-turn.js";

beforeEach(() => {
  localStorage.clear();
  g("autoTunePotionCount", 0);
  runBattleTurnAutomation({ type: BattleTurnEvent.ROUND_STARTED });
  g("option", { autoTune: true });
});

const readPad = () => runAutoTuneAutomation({ type: AutoTuneEvent.READ_PAD });
const recordBattle = (potionsUsed) =>
  runAutoTuneAutomation({ type: AutoTuneEvent.RECORD_BATTLE, potionsUsed });

describe("auto-tune safetyPad entry", () => {
  it("reads default pad when no persisted value exists", () => {
    expect(readPad()).toBe(1.3);
  });

  it("records battle observations and explores an unvisited lower neighbor after enough samples", () => {
    for (let i = 0; i < 5; i++) recordBattle(2);
    expect(getValue(STORAGE_KEYS.AUTO_TUNE_HISTORY, true)["1.30"]).toEqual({
      n: 5,
      sumPotions: 10,
    });
    expect(readPad()).toBe(1.2);
  });

  it("resets drifted non-grid pad back to the default grid center", () => {
    setValue(STORAGE_KEYS.AUTO_TUNE_PAD, 1.33);
    for (let i = 0; i < 5; i++) recordBattle(1);
    expect(readPad()).toBe(1.3);
  });

  it("resets pad and history through the same entry", () => {
    recordBattle(2);
    runAutoTuneAutomation({ type: AutoTuneEvent.RESET });
    expect(readPad()).toBe(1.3);
    expect(runAutoTuneAutomation({ type: AutoTuneEvent.READ_STATUS })).toEqual({
      currentPad: 1.3,
      history: [],
    });
  });

  it("counts potion uses and records the previous battle at round start", () => {
    runAutoTuneAutomation({ type: AutoTuneEvent.RECORD_POTION_USE });
    runAutoTuneAutomation({ type: AutoTuneEvent.RECORD_POTION_USE });
    expect(g("autoTunePotionCount")).toBe(2);

    runBattleTurnAutomation({ type: BattleTurnEvent.TURN_STARTED });
    runAutoTuneAutomation({ type: AutoTuneEvent.ROUND_STARTED });

    expect(getValue(STORAGE_KEYS.AUTO_TUNE_HISTORY, true)["1.30"]).toEqual({
      n: 1,
      sumPotions: 2,
    });
    expect(g("autoTunePotionCount")).toBe(0);
  });

  it("does not count potion uses when auto-tune is disabled", () => {
    g("option", { autoTune: false });

    runAutoTuneAutomation({ type: AutoTuneEvent.RECORD_POTION_USE });
    runBattleTurnAutomation({ type: BattleTurnEvent.TURN_STARTED });
    runAutoTuneAutomation({ type: AutoTuneEvent.ROUND_STARTED });

    expect(g("autoTunePotionCount")).toBe(0);
    expect(getValue(STORAGE_KEYS.AUTO_TUNE_HISTORY, true)).toBeNull();
  });
});
