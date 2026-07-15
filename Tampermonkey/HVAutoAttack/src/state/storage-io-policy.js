// 持久化业务身份的唯一策略目录。业务入口只传身份，不传 storage kind 或 durability flag。
export const StorageIdentity = Object.freeze({
  WORLD_SMALL_VALUE: "worldSmallValue",
  SESSION_RUNTIME_CHECKPOINT: "sessionRuntimeCheckpoint",
  RIDDLE_SAMPLE: "riddleSample",
  RIDDLE_RUNTIME_LOG: "riddleRuntimeLog",
  BATTLE_REPORT: "battleReport",
  STAMINA_LOSS: "staminaLoss",
  LEARNED_MONSTER_IDENTITY: "learnedMonsterIdentity",
  MONSTER_KNOWLEDGE: "monsterKnowledge",
  HVUT_CONFIG: "hvutConfig",
  HVUT_DERIVED_RECORD: "hvutDerivedRecord",
  DIAGNOSTIC_EVIDENCE: "diagnosticEvidence",
});

export const StorageAuthority = Object.freeze({
  GM: "gm",
  SESSION: "session",
  INDEXED_DB: "indexedDb",
  MEMORY: "memory",
});

export const StorageWriteMode = Object.freeze({
  WRITE_IF_CHANGED: "writeIfChanged",
  BOUNDED_CHECKPOINT: "boundedCheckpoint",
  APPEND_RECORD: "appendRecord",
  CONTENT_AWARE_SYNC: "contentAwareSync",
  MEMORY_FIRST: "memoryFirst",
});

export const StorageWriteOutcome = Object.freeze({
  WRITTEN: "written",
  DELETED: "deleted",
  SKIPPED_UNCHANGED: "skippedUnchanged",
  REJECTED_BUDGET: "rejectedBudget",
  FAILED: "failed",
});

const policies = new Map(
  [
    [
      StorageIdentity.WORLD_SMALL_VALUE,
      {
        authority: StorageAuthority.GM,
        writeMode: StorageWriteMode.WRITE_IF_CHANGED,
        worldBound: true,
        budget: null,
      },
    ],
    [
      StorageIdentity.SESSION_RUNTIME_CHECKPOINT,
      {
        authority: StorageAuthority.SESSION,
        writeMode: StorageWriteMode.BOUNDED_CHECKPOINT,
        worldBound: true,
        budget: Object.freeze({ everyTurns: 20, lifecycleBoundaries: true }),
      },
    ],
    [
      StorageIdentity.RIDDLE_SAMPLE,
      {
        authority: StorageAuthority.INDEXED_DB,
        writeMode: StorageWriteMode.APPEND_RECORD,
        worldBound: false,
        budget: Object.freeze({ completedRecords: 512, bytes: 128 * 1024 * 1024 }),
      },
    ],
    [
      StorageIdentity.RIDDLE_RUNTIME_LOG,
      {
        authority: StorageAuthority.INDEXED_DB,
        writeMode: StorageWriteMode.APPEND_RECORD,
        worldBound: false,
        budget: Object.freeze({ rows: 80 }),
      },
    ],
    [
      StorageIdentity.BATTLE_REPORT,
      {
        authority: StorageAuthority.INDEXED_DB,
        writeMode: StorageWriteMode.APPEND_RECORD,
        worldBound: true,
        budget: Object.freeze({ rows: 200, compactAt: 225 }),
      },
    ],
    [
      StorageIdentity.STAMINA_LOSS,
      {
        authority: StorageAuthority.INDEXED_DB,
        writeMode: StorageWriteMode.APPEND_RECORD,
        worldBound: true,
        budget: Object.freeze({ days: 365, rows: 1000, compactAt: 1100 }),
      },
    ],
    [
      StorageIdentity.LEARNED_MONSTER_IDENTITY,
      {
        authority: StorageAuthority.INDEXED_DB,
        writeMode: StorageWriteMode.APPEND_RECORD,
        worldBound: true,
        budget: Object.freeze({ rows: 4096, compactAt: 4352 }),
      },
    ],
    [
      StorageIdentity.MONSTER_KNOWLEDGE,
      {
        authority: StorageAuthority.INDEXED_DB,
        writeMode: StorageWriteMode.CONTENT_AWARE_SYNC,
        worldBound: true,
        budget: null,
      },
    ],
    [
      StorageIdentity.HVUT_CONFIG,
      {
        authority: StorageAuthority.GM,
        writeMode: StorageWriteMode.WRITE_IF_CHANGED,
        worldBound: true,
        budget: null,
      },
    ],
    [
      StorageIdentity.HVUT_DERIVED_RECORD,
      {
        authority: StorageAuthority.INDEXED_DB,
        writeMode: StorageWriteMode.APPEND_RECORD,
        worldBound: true,
        budget: null,
      },
    ],
    [
      StorageIdentity.DIAGNOSTIC_EVIDENCE,
      {
        authority: StorageAuthority.MEMORY,
        writeMode: StorageWriteMode.MEMORY_FIRST,
        worldBound: false,
        budget: Object.freeze({ events: 128, bytes: 64 * 1024 }),
      },
    ],
  ].map(([identity, policy]) => [identity, Object.freeze({ identity, ...policy })])
);

export function storageIoPolicyOf(identity) {
  const policy = policies.get(identity);
  if (!policy) throw new TypeError(`Unknown storage identity: ${String(identity)}`);
  return policy;
}
