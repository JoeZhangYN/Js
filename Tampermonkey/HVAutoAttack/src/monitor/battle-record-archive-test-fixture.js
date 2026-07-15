import {
  BattleSessionCheckpointEvent,
  BattleSessionCheckpointSlice,
  createBattleSessionCheckpointCapability,
} from "../state/battle-session-checkpoint.js";
import { StorageWriteOutcome } from "../state/storage-io-policy.js";

function createMemorySessionStorage() {
  const values = new Map();
  let writes = 0;
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      writes += 1;
      values.set(key, value);
    },
    removeItem: (key) => values.delete(key),
    writeCount: () => writes,
  };
}

export function createBattleRecordArchiveTestDeps(values = {}) {
  const sessionStorage = createMemorySessionStorage();
  const checkpoint = createBattleSessionCheckpointCapability(
    { sourceIdentity: "test:battle" },
    { sessionStorage, recordIo: () => undefined }
  );
  const histories = new Map([
    ["drop", []],
    ["usage", []],
  ]);
  const deps = {
    values,
    histories,
    getValue: (key) => values[key],
    delValue: (key) => delete values[key],
    readLocalTimestampLabel: () => "finished",
    randomId: () => "battle-session",
    sessionWriteCount: () => sessionStorage.writeCount(),
    runCheckpoint: (event) => checkpoint.run(event),
    async runHistory(event) {
      const rows = histories.get(event.family);
      if (event.type === "list") return rows.map((envelope) => envelope.record);
      if (event.type === "append") {
        if (rows.some((envelope) => envelope.id === event.envelope.id)) {
          return { outcome: StorageWriteOutcome.SKIPPED_UNCHANGED };
        }
        rows.push(event.envelope);
        return { outcome: StorageWriteOutcome.WRITTEN };
      }
      if (event.type === "clear") {
        rows.length = 0;
        return { outcome: StorageWriteOutcome.DELETED };
      }
      return undefined;
    },
    readRuntime() {
      return checkpoint.run({
        type: BattleSessionCheckpointEvent.READ_SLICE,
        slice: BattleSessionCheckpointSlice.BATTLE_REPORT,
      });
    },
  };
  return deps;
}
