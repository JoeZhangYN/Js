import { beforeEach, describe, expect, it } from "vitest";
import { g } from "../state/store.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { getValue, setValue } from "../state/storage.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { BattleUsageEvent, runBattleUsageAutomation } from "./record-usage.js";

beforeEach(() => {
  localStorage.clear();
  runOptionAutomation({
    type: OptionEvent.WRITE,
    option: { version: "10.0", recordUsage: false, recordEach: false },
  });
  g("roundNow", 1);
  g("roundAll", 1);
  g("monsterAll", 3);
  g("bossAll", 1);
});

describe("runBattleUsageAutomation", () => {
  it("does not archive completion usage when record usage is disabled", () => {
    setValue(STORAGE_KEYS.STATS, { self: { _monster: 0, _boss: 0 } });

    runBattleUsageAutomation({ type: BattleUsageEvent.RECORD_COMPLETED_USAGE });

    expect(getValue(STORAGE_KEYS.STATS, true)).toEqual({ self: { _monster: 0, _boss: 0 } });
    expect(getValue(STORAGE_KEYS.STATS_OLD, true)).toBeNull();
  });

  it("archives completion usage through the usage entry when enabled", () => {
    runOptionAutomation({ type: OptionEvent.WRITE_FIELD, key: "recordUsage", value: true });
    runOptionAutomation({ type: OptionEvent.WRITE_FIELD, key: "recordEach", value: true });
    setValue(STORAGE_KEYS.BATTLE_CODE, "AR-1");
    setValue(STORAGE_KEYS.STATS, { self: { _monster: 0, _boss: 0 } });

    runBattleUsageAutomation({ type: BattleUsageEvent.RECORD_COMPLETED_USAGE });

    expect(getValue(STORAGE_KEYS.STATS, true)).toBeNull();
    expect(getValue(STORAGE_KEYS.STATS_OLD, true)).toEqual([
      {
        __name: "AR-1",
        self: {
          _boss: 1,
          _endTime: expect.any(String),
          _monster: 3,
        },
      },
    ]);
  });
});
