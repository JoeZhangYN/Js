import { describe, it, expect, beforeEach } from "vitest";
import { AutoTuneEvent, runAutoTuneAutomation } from "./auto-tune.js";
import { setValue, getValue } from "./storage.js";
import { STORAGE_KEYS } from "./persist-keys.js";
import { g } from "./store.js";
import { BattleTurnEvent, runBattleTurnAutomation } from "./battle-turn.js";
import { OptionEvent, runOptionAutomation } from "./option.js";

beforeEach(() => {
  localStorage.clear();
  g("autoTunePotionCount", 0);
  runBattleTurnAutomation({ type: BattleTurnEvent.ROUND_STARTED });
  runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", autoTune: true } });
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
    runOptionAutomation({ type: OptionEvent.WRITE_FIELD, key: "autoTune", value: false });

    runAutoTuneAutomation({ type: AutoTuneEvent.RECORD_POTION_USE });
    runBattleTurnAutomation({ type: BattleTurnEvent.TURN_STARTED });
    runAutoTuneAutomation({ type: AutoTuneEvent.ROUND_STARTED });

    expect(g("autoTunePotionCount")).toBe(0);
    expect(getValue(STORAGE_KEYS.AUTO_TUNE_HISTORY, true)).toBeNull();
  });

  it("ignores invalid auto-tune events without changing pad, history, or counter", () => {
    setValue(STORAGE_KEYS.AUTO_TUNE_PAD, 1.6);
    setValue(STORAGE_KEYS.AUTO_TUNE_HISTORY, { "1.60": { n: 2, sumPotions: 4 } });
    g("autoTunePotionCount", 3);
    expect([runAutoTuneAutomation({ type: "unknown" }), runAutoTuneAutomation(null)]).toEqual([
      undefined,
      undefined,
    ]);
    expect([
      getValue(STORAGE_KEYS.AUTO_TUNE_PAD, true),
      getValue(STORAGE_KEYS.AUTO_TUNE_HISTORY, true),
      g("autoTunePotionCount"),
    ]).toEqual([1.6, { "1.60": { n: 2, sumPotions: 4 } }, 3]);
  });
});
