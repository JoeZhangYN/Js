import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const snapshot = path.normalize("src/battle/snapshot.js");
const snapshotTest = path.normalize("src/battle/snapshot.test.js");
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
  "collectSnapshot",
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
  "BattleMonsterViewEvent.READ_VIEW",
  "BattleSkillUsageEvent.READ_USAGE",
]);
const scoringText = requireText(physicalScoring, ["opt.fightingStyle", "skillLib"]);
requireText(snapshotTest, ["learnIncomingBurst", "collectSnapshot"]);

if (/\bexport\s+(?:function|const)\s+(?!collectSnapshot\b)/.test(snapshotText)) {
  violations.push(`${snapshot.replaceAll("\\", "/")} may export only collectSnapshot`);
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
