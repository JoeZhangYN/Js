# HVAutoAttack Storage IO Governance

## Objective

Eliminate sustained storage write amplification across the complete HVAutoAttack bundle, including embedded HVUT, without weakening configuration durability, cross-site recovery, battle safety, riddle submission, or user-owned archive semantics.

## Authoritative design

- GM storage owns only small, low-frequency, cross-origin or user-authored values. Writes are canonicalized and skipped when unchanged.
- Page runtime owns per-action and per-turn state. A single bounded session checkpoint is written every 20 turns and at lifecycle boundaries.
- Incremental business histories and learned identities use world-bound IndexedDB record stores with explicit retention and content-aware writes.
- Riddle images use a shared IndexedDB Blob store. No image Base64 or unbounded aggregate may be written to GM storage.
- Diagnostic evidence is memory-first and persists only bounded failure/recovery snapshots or values required by the page/userscript bridge.
- Storage authority is bound at composition. Business entries never accept raw storage kinds, world flags or loose durability booleans.

## Retention and failure policy

- Riddle samples: 512 completed records or 128 MiB; stop capture and disclose export recovery at the limit, never silently evict unexported samples.
- Battle reports: 200 per family and world; prune from 225 to 200.
- Stamina loss: 365 days and 1000 rows; compact after 1100 rows or expiry.
- Automatically learned monster identities: 4096 per family and world; prune from 4352 to 4096 by last use.
- Riddle runtime log: 80 rows. Diagnostic journal: 128 events and 64 KiB.
- User-owned archives are not silently evicted. At their declared budget, reject new writes with export/cleanup recovery.
- Bulk-store failure never falls back to a large GM write. Optional recording fails visibly while game automation continues.

## Migration contract

- Migration is previewed on a non-battle, non-riddle page and starts only after user confirmation.
- Each idle batch handles at most 8 records or 8 MiB.
- For every source: write target, read back, verify identity/metadata/size/hash, record receipt, then delete the old source.
- Migration receipts live in the target IndexedDB and make copied, verified and source-deleted states resumable and idempotent.
- Normal code stops reading retired formats after migration. Only the compatibility migrator may read/delete them; old writes are mechanically denied.

## Delivery boundaries

1. Storage identities, write outcomes, in-memory IO metrics and raw-write guards.
2. Small GM write-if-changed and bounded session evidence/checkpoints.
3. Riddle Blob store, submit gate, export and verified legacy migration.
4. Battle runtime accumulation, incremental reports and stamina retention.
5. Incremental learning stores and content-aware monster database synchronization.
6. HVUT aggregate-store migration and removal of dead localStorage mirrors.
7. Maintenance UI, end-to-end migration/retention evidence and Edge IO acceptance.

Each boundary is independently committed, pushed to `backup/main`, and read back before the next boundary.

## Completion evidence

- Existing behavior tests remain green; new failure, migration, retention, world isolation and exactly-once tests pass.
- Ordinary 100-turn battle performs zero GM writes after initialization and at most five session checkpoints.
- Unchanged GM writes and unchanged monster snapshots perform zero physical adapter writes.
- Final source and bundle guards contain no retired GM Base64/aggregate/per-turn writes.
- After one-time migration/compaction, a representative Edge run shows application-attributed logical GM bytes reduced by at least 99%; unexplained writes with zero app metrics are classified as external Tampermonkey/Edge state, not script success.
