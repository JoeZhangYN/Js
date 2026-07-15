import { beforeEach, describe, expect, it } from "vitest";
import { BattleRuntimeEvent, runBattleRuntimeAutomation } from "./battle-runtime.js";
import { getValue, setValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import {
  BattleSessionCheckpointEvent,
  runBattleSessionCheckpointAutomation,
} from "../state/battle-session-checkpoint.js";

beforeEach(() => {
  localStorage.clear();
  runBattleSessionCheckpointAutomation({ type: BattleSessionCheckpointEvent.CLEAR });
});

describe("runBattleRuntimeAutomation", () => {
  it("clears the bounded session checkpoint without touching compatibility data", () => {
    setValue(STORAGE_KEYS.BATTLE_CODE, "code");
    runBattleSessionCheckpointAutomation({
      type: BattleSessionCheckpointEvent.CHECKPOINT,
      checkpoint: { globalTurn: 5, lastUsed: {} },
      lifecycleBoundary: true,
    });

    expect(runBattleRuntimeAutomation({ type: BattleRuntimeEvent.CLEAR_SESSION })).toBe(true);

    expect(
      runBattleSessionCheckpointAutomation({ type: BattleSessionCheckpointEvent.READ })
    ).toEqual({ kind: "absent" });
    expect(getValue(STORAGE_KEYS.BATTLE_CODE)).toBe("code");
  });

  it("rejects unknown runtime events without clearing the battle session", () => {
    runBattleSessionCheckpointAutomation({
      type: BattleSessionCheckpointEvent.CHECKPOINT,
      checkpoint: { globalTurn: 3, lastUsed: {} },
      lifecycleBoundary: true,
    });

    expect(runBattleRuntimeAutomation({ type: "unknown" })).toBe(false);
    expect(runBattleRuntimeAutomation(null)).toBe(false);
    expect(
      runBattleSessionCheckpointAutomation({ type: BattleSessionCheckpointEvent.READ })
    ).toMatchObject({ kind: "loaded", checkpoint: { globalTurn: 3 } });
  });
});
