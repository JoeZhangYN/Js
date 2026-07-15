import { describe, expect, it, vi } from "vitest";
import {
  BattleSessionCheckpointEvent,
  createBattleSessionCheckpointCapability,
} from "./battle-session-checkpoint.js";
import { StorageIdentity, StorageWriteOutcome } from "./storage-io-policy.js";

function memorySessionStorage() {
  const values = new Map();
  return {
    getItem: vi.fn((key) => values.get(key) ?? null),
    setItem: vi.fn((key, value) => values.set(key, value)),
    removeItem: vi.fn((key) => values.delete(key)),
  };
}

describe("battle session checkpoint", () => {
  it("writes only every 20 turns and at changed lifecycle boundaries", () => {
    const sessionStorage = memorySessionStorage();
    const recordIo = vi.fn();
    const checkpoint = createBattleSessionCheckpointCapability(
      { sourceIdentity: "hv:persistent" },
      { sessionStorage, recordIo }
    );

    for (let globalTurn = 1; globalTurn <= 100; globalTurn += 1) {
      checkpoint.run({
        type: BattleSessionCheckpointEvent.CHECKPOINT,
        checkpoint: { version: 1, globalTurn, skillLastUsed: {} },
      });
    }
    expect(sessionStorage.setItem).toHaveBeenCalledTimes(5);
    expect(recordIo).toHaveBeenLastCalledWith(
      expect.objectContaining({
        identity: StorageIdentity.SESSION_RUNTIME_CHECKPOINT,
        outcome: StorageWriteOutcome.WRITTEN,
        sourceIdentity: "hv:persistent",
      })
    );

    const unchanged = checkpoint.run({
      type: BattleSessionCheckpointEvent.CHECKPOINT,
      lifecycleBoundary: true,
      checkpoint: { version: 1, globalTurn: 100, skillLastUsed: {} },
    });
    expect(unchanged.outcome).toBe(StorageWriteOutcome.SKIPPED_UNCHANGED);
    expect(sessionStorage.setItem).toHaveBeenCalledTimes(5);
  });

  it("keeps persistent and isekai checkpoint authorities isolated", () => {
    const sessionStorage = memorySessionStorage();
    const persistent = createBattleSessionCheckpointCapability(
      { sourceIdentity: "hv:persistent" },
      { sessionStorage, recordIo: vi.fn() }
    );
    const isekai = createBattleSessionCheckpointCapability(
      { sourceIdentity: "hv:isekai" },
      { sessionStorage, recordIo: vi.fn() }
    );
    persistent.run({
      type: BattleSessionCheckpointEvent.CHECKPOINT,
      lifecycleBoundary: true,
      checkpoint: { globalTurn: 4 },
    });

    expect(persistent.run({ type: BattleSessionCheckpointEvent.READ })).toMatchObject({
      kind: "loaded",
      checkpoint: { globalTurn: 4 },
    });
    expect(isekai.run({ type: BattleSessionCheckpointEvent.READ })).toEqual({ kind: "absent" });
  });
});
