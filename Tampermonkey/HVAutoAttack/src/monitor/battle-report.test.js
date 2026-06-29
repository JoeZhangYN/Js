import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setValue, getValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { BattleRoundEvent, runBattleRoundAutomation } from "../battle/battle-round.js";
import { BattleMonitorEvent, runBattleMonitorAutomation } from "./battle-monitor-automation.js";

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-27T12:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

function setRoundContext(roundType, roundNow, roundAll) {
  runBattleRoundAutomation({ type: BattleRoundEvent.RECORD_TYPE, roundType });
  runBattleRoundAutomation({ type: BattleRoundEvent.RECORD_COUNT, roundNow, roundAll });
  runBattleRoundAutomation({ type: BattleRoundEvent.SYNC_RUNTIME });
}

describe("battle report query", () => {
  it("records battle report code once when per-battle records are enabled", () => {
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", recordEach: true } });
    setRoundContext("ar", 1, 5);

    runBattleMonitorAutomation({ type: BattleMonitorEvent.BATTLE_STARTED });
    expect(getValue(STORAGE_KEYS.BATTLE_CODE)).toMatch(/: AR-5$/);

    const firstCode = getValue(STORAGE_KEYS.BATTLE_CODE);
    setRoundContext("rb", 1, 1);
    runBattleMonitorAutomation({ type: BattleMonitorEvent.BATTLE_STARTED });
    expect(getValue(STORAGE_KEYS.BATTLE_CODE)).toBe(firstCode);
  });

  it("reads battle-start context inside the battle report entry", () => {
    runOptionAutomation({
      type: OptionEvent.WRITE,
      option: { version: "10.0", recordEach: false },
    });
    setRoundContext("ar", 1, 5);
    runBattleMonitorAutomation({ type: BattleMonitorEvent.BATTLE_STARTED });
    expect(getValue(STORAGE_KEYS.BATTLE_CODE)).toBeNull();

    runOptionAutomation({ type: OptionEvent.WRITE_FIELD, key: "recordEach", value: true });
    setRoundContext("ar", 1, 5);

    runBattleMonitorAutomation({ type: BattleMonitorEvent.BATTLE_STARTED });

    expect(getValue(STORAGE_KEYS.BATTLE_CODE)).toBe("6/27: AR-5");
  });

  it("owns the battle report date label format", () => {
    runOptionAutomation({ type: OptionEvent.WRITE, option: { version: "10.0", recordEach: true } });
    setRoundContext("ar", 1, 5);

    runBattleMonitorAutomation({ type: BattleMonitorEvent.BATTLE_STARTED });

    expect(getValue(STORAGE_KEYS.BATTLE_CODE)).toBe("6/27: AR-5");
  });

  it("renders a single drop report from the active record", () => {
    setValue(STORAGE_KEYS.DROP, { "#Credit": 12, "Health Potion": 1 });

    expect(
      runBattleMonitorAutomation({ type: BattleMonitorEvent.RENDER_DROP_REPORT_TABLE_BODY })
    ).toBe(
      '<tbody><tr class="hvAATh"><td></td><td><l0>数量</l0><l1>數量</l1><l2>Amount</l2></td></tr><tr><td>#Credit</td><td>12</td></tr><tr><td>Health Potion</td><td>1</td></tr></tbody>'
    );
  });

  it("renders archived and active drop records for history view", () => {
    setValue(STORAGE_KEYS.BATTLE_CODE, "now");
    setValue(STORAGE_KEYS.DROP, { "#Credit": 12 });
    setValue(STORAGE_KEYS.DROP_OLD, [{ __name: "old", "#EXP": 20 }]);

    expect(
      runBattleMonitorAutomation({ type: BattleMonitorEvent.RENDER_DROP_REPORT_TABLE_BODY })
    ).toBe(
      '<tbody><tr class="hvAATh"><td class="selectTable"></td><td>now</td><td>old</td></tr><tr><td>#Credit</td><td>12</td><td></td></tr><tr><td>#EXP</td><td></td><td>20</td></tr></tbody>'
    );
  });

  it("renders usage sections and tolerates missing sections", () => {
    setValue(STORAGE_KEYS.BATTLE_CODE, "now");
    setValue(STORAGE_KEYS.STATS, { self: { _turn: 3 }, magic: { Fireball: 2 } });
    setValue(STORAGE_KEYS.STATS_OLD, [{ __name: "old", self: { _turn: 1 } }]);

    const html = runBattleMonitorAutomation({
      type: BattleMonitorEvent.RENDER_USAGE_REPORT_TABLE_BODY,
    });

    expect(html).toContain('<td colspan="3"><l0>自身 (次数)</l0>');
    expect(html).toContain("<tr><td>_turn</td><td>3</td><td>1</td></tr>");
    expect(html).toContain('<td colspan="3"><l0>技能 (次数)</l0>');
    expect(html).toContain("<tr><td>Fireball</td><td>2</td><td></td></tr>");
  });

  it("clears battle report storage through monitor-owned commands", () => {
    setValue(STORAGE_KEYS.DROP, { a: 1 });
    setValue(STORAGE_KEYS.DROP_OLD, [{ a: 2 }]);
    setValue(STORAGE_KEYS.STATS, { self: {} });
    setValue(STORAGE_KEYS.STATS_OLD, [{ self: {} }]);

    runBattleMonitorAutomation({ type: BattleMonitorEvent.CLEAR_DROP_REPORT });
    runBattleMonitorAutomation({ type: BattleMonitorEvent.CLEAR_USAGE_REPORT });

    expect(getValue(STORAGE_KEYS.DROP, true)).toBeNull();
    expect(getValue(STORAGE_KEYS.DROP_OLD, true)).toBeNull();
    expect(getValue(STORAGE_KEYS.STATS, true)).toBeNull();
    expect(getValue(STORAGE_KEYS.STATS_OLD, true)).toBeNull();
  });
});
