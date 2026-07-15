import { storageValueFingerprint } from "./storage-value.js";

export function selectChangedMonsterProfiles(existingProfiles, incomingProfiles) {
  const existing = new Map(existingProfiles.map((info) => [info.monsterId, info]));
  const incoming = new Map(
    incomingProfiles.filter((info) => info?.monsterId != null).map((info) => [info.monsterId, info])
  );
  const changed = [...incoming.values()].filter(
    (info) =>
      storageValueFingerprint(existing.get(info.monsterId)) !== storageValueFingerprint(info)
  );
  return Object.freeze({
    changed,
    received: incoming.size,
    unchanged: incoming.size - changed.length,
  });
}
