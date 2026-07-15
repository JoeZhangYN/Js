import { describe, expect, it } from "vitest";
import {
  storageIoPolicyOf,
  StorageAuthority,
  StorageIdentity,
  StorageWriteMode,
} from "./storage-io-policy.js";

describe("storage IO policy", () => {
  it("binds small values and bulk records to distinct authorities", () => {
    expect(storageIoPolicyOf(StorageIdentity.WORLD_SMALL_VALUE)).toMatchObject({
      authority: StorageAuthority.GM,
      writeMode: StorageWriteMode.WRITE_IF_CHANGED,
      worldBound: true,
    });
    expect(storageIoPolicyOf(StorageIdentity.RIDDLE_SAMPLE)).toMatchObject({
      authority: StorageAuthority.INDEXED_DB,
      budget: { completedRecords: 512, bytes: 128 * 1024 * 1024 },
    });
    expect(storageIoPolicyOf(StorageIdentity.SESSION_RUNTIME_CHECKPOINT)).toMatchObject({
      authority: StorageAuthority.SESSION,
      budget: { everyTurns: 20, lifecycleBoundaries: true },
    });
  });

  it("locks the declared retention budgets", () => {
    expect(storageIoPolicyOf(StorageIdentity.BATTLE_REPORT).budget).toEqual({
      rows: 200,
      compactAt: 225,
    });
    expect(storageIoPolicyOf(StorageIdentity.STAMINA_LOSS).budget).toEqual({
      days: 365,
      rows: 1000,
      compactAt: 1100,
    });
    expect(storageIoPolicyOf(StorageIdentity.LEARNED_MONSTER_IDENTITY).budget).toEqual({
      rows: 4096,
      compactAt: 4352,
    });
  });

  it("rejects storage identities outside the catalog", () => {
    expect(() => storageIoPolicyOf("looseStorageKind")).toThrow("Unknown storage identity");
  });
});
