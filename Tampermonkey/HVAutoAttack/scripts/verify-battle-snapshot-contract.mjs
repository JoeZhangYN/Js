import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const snapshot = path.normalize("src/battle/snapshot.js");
const snapshotTest = path.normalize("src/battle/snapshot.test.js");
const snapshotLogTelemetryTest = path.normalize("src/battle/snapshot-log-telemetry.test.js");
const physicalScoring = path.normalize("src/battle/attack/physical-skill-scoring.js");
const types = path.normalize("src/core/types.js");
const violations = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function requireText(relative, required) {
  const text = read(relative);
  for (const token of required) {
    if (!text.includes(token)) {
      violations.push(`${relative.replaceAll("\\", "/")} must use ${token}`);
    }
  }
  return text;
}

const snapshotText = requireText(snapshot, [
  "BattleSnapshotEvent",
  "READ_CURRENT",
  "battleSnapshotEventHandlers",
  "runBattleSnapshot",
  "collectCurrentSnapshot",
  "learnIncomingBurst",
  "BattleObservationLearningEvent.FINALIZE_TURN_OBSERVATIONS",
  "runBattleObservationLearning",
  "BattleSkillReadinessEvent.READ_READY_MAP",
  "runBattleSkillReadiness",
  "BattlePlayerVitalsEvent.READ_CURRENT",
  "runBattlePlayerVitals",
  "BattlePlayerEffectsEvent.READ_CURRENT",
  "runBattlePlayerEffects",
  "BattleItemSurfaceEvent.READ_GEM_NAME",
  "runBattleItemSurface",
  "BattleMonsterSurfaceEvent.READ_CURRENT",
  "runBattleMonsterSurface",
  "BattleLogTelemetryEvent.READ_CURRENT",
  "runBattleLogTelemetry",
  "event.logTelemetry",
  "BattleSpiritToggleEvent.READ_ACTIVE",
  "runBattleSpiritToggleAutomation",
  "BattleMonsterViewEvent.READ_VIEW",
  "BattleSkillUsageEvent.READ_USAGE",
]);
const scoringText = requireText(physicalScoring, ["opt.fightingStyle", "skillLib"]);
requireText(snapshotTest, [
  "learnIncomingBurst",
  "BattleSnapshotEvent",
  "runBattleSnapshot",
  "rejects unknown snapshot events",
]);
requireText(snapshotLogTelemetryTest, [
  "reuses prelude battle log telemetry when supplied",
  "not.toHaveBeenCalled",
]);

if (
  /\bexport\s+(?:function|const)\s+(?!BattleSnapshotEvent\b|runBattleSnapshot\b)/.test(
    snapshotText
  )
) {
  violations.push(`${snapshot.replaceAll("\\", "/")} may export only its event entry`);
}
const snapshotEntryBody =
  snapshotText.match(/export function runBattleSnapshot\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_READ_CURRENT\]/.test(snapshotText)) {
  violations.push(`${snapshot.replaceAll("\\", "/")} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(snapshotEntryBody)) {
  violations.push(`${snapshot.replaceAll("\\", "/")} entry must dispatch by handler table`);
}
if (/battleSnapshotEventHandlers\[event\.type\]/.test(snapshotEntryBody)) {
  violations.push(`${snapshot.replaceAll("\\", "/")} must fail closed before handler dispatch`);
}
if (!/battleSnapshotEventHandlers\[event\?\.type\]/.test(snapshotEntryBody)) {
  violations.push(`${snapshot.replaceAll("\\", "/")} must dispatch with optional event type`);
}
if (!/runBattleSnapshot\(null\)/.test(fs.readFileSync(path.join(root, snapshotTest), "utf8"))) {
  violations.push(`${snapshotTest.replaceAll("\\", "/")} must lock invalid snapshot events`);
}
if (/\bcollectSnapshot\b/.test(snapshotText)) {
  violations.push(`${snapshot.replaceAll("\\", "/")} must not keep the retired collectSnapshot name`);
}
if (/fightingStyle/.test(snapshotText)) {
  violations.push(
    `${snapshot.replaceAll("\\", "/")} must not duplicate fightingStyle option reads`
  );
}
if (/OptionEvent|runOptionAutomation|burstControlSwitch/.test(snapshotText)) {
  violations.push(`${snapshot.replaceAll("\\", "/")} must not read battle action options directly`);
}
if (
  /BattleStartRuntimeEvent\.READ_ATTACK_STATUS|runBattleStartRuntimeAutomation/.test(snapshotText)
) {
  violations.push(`${snapshot.replaceAll("\\", "/")} must not read attackStatus directly`);
}
if (
  /MonsterStatusEvent\.READ_STATUS|MonsterCacheEvent\.READ_DB|joinMonsterView/.test(snapshotText)
) {
  violations.push(`${snapshot.replaceAll("\\", "/")} must not assemble monster view directly`);
}
if (/monsterHpVars|\.filter\(\s*\(?\w+\)?\s*=>\s*!\w+\.isDead/.test(snapshotText)) {
  violations.push(`${snapshot.replaceAll("\\", "/")} must not derive monster view summary`);
}
for (const forbidden of [
  "runRecoveryLearningAutomation",
  "runCdLearningAutomation",
  "runBigSkillKillLearningAutomation",
  "runIncomingBurstLearningAutomation",
]) {
  if (snapshotText.includes(forbidden)) {
    violations.push(
      `${snapshot.replaceAll("\\", "/")} must finalize observations through runBattleObservationLearning`
    );
  }
}
if (/monsterStatus/.test(snapshotText)) {
  violations.push(`${snapshot.replaceAll("\\", "/")} must not pass full monsterStatus downstream`);
}
if (
  /document\.getElementById|style\.opacity !== ["']0\.5["']|BATTLE_SKILL_IDS/.test(snapshotText)
) {
  violations.push(
    `${snapshot.replaceAll("\\", "/")} must read skillReady through battle skill readiness entry`
  );
}
if (/#vbh|#dvbh|#dvrhd|#dvrm|#dvrs|readPlayerVitals/.test(snapshotText)) {
  violations.push(
    `${snapshot.replaceAll("\\", "/")} must read player vitals through battle player vitals entry`
  );
}
if (/#pane_effects|etherTapActiveX2:\s*!!gE|playerBuffs:\s*playerEffects\.map/.test(snapshotText)) {
  violations.push(
    `${snapshot.replaceAll("\\", "/")} must read player effects through battle player effects entry`
  );
}
if (/#ikey_p|gemName:\s*gE/.test(snapshotText)) {
  violations.push(
    `${snapshot.replaceAll("\\", "/")} must read gemName through battle item surface entry`
  );
}
if (/readMonsters|readMonsterBuffs|div\.btm1|\.btm5|\.btm6|nbargreen|nbardead/.test(snapshotText)) {
  violations.push(
    `${snapshot.replaceAll("\\", "/")} must read monsters through battle monster surface entry`
  );
}
if (/parseBattleLog|estimatePlayerIncomingDps|estimatePerMonsterDps/.test(snapshotText)) {
  violations.push(
    `${snapshot.replaceAll("\\", "/")} must read battle log telemetry through one entry`
  );
}
if (/#ckey_spirit|isSpiritActive/.test(snapshotText)) {
  violations.push(
    `${snapshot.replaceAll("\\", "/")} must read Spirit active state through battle spirit entry`
  );
}
if (/snap\.fightingStyle/.test(scoringText)) {
  violations.push(`${physicalScoring.replaceAll("\\", "/")} must use opt.fightingStyle`);
}
if (/fightingStyle/.test(read(types))) {
  violations.push(`${types.replaceAll("\\", "/")} snapshot contract must not expose fightingStyle`);
}

if (violations.length) {
  console.error("[verify-battle-snapshot-contract] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-snapshot-contract] OK - snapshot option facts are converged");
