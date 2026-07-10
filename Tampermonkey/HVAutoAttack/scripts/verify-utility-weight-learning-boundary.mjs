import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const learner = read("src/state/utility-weight-learner.js");
const persistence = read("src/state/utility-weight-persistence.js");
const model = read("src/state/utility-weight-model.js");
const observation = read("src/state/utility-weight-observation.js");
const evaluation = read("src/state/utility-weight-evaluation.js");
const transitions = read("src/state/utility-weight-transitions.js");
const battleEvaluation = read("src/state/utility-weight-battle-evaluation.js");
const scoring = read("src/battle/attack/physical-skill-scoring.js");
const bookkeeping = read("src/battle/attack/physical-skill-bookkeeping.js");
const lifecycle = read("src/battle/battle-action-lifecycle.js");
const completion = read("src/battle/battle-completion.js");
const settings = read("src/settings/schema.js");
const tests = [
  "src/state/utility-weight-observation.test.js",
  "src/state/utility-weight-evaluation.test.js",
  "src/state/utility-weight-transitions.test.js",
  "src/state/utility-weight-learner.test.js",
  "src/battle/attack/physical-skill-scoring.test.js",
  "src/battle/attack/execute-attack-utility-observation.test.js",
]
  .map(read)
  .join("\n");
const violations = [];

function requireText(label, text, values) {
  for (const value of values) {
    if (!text.includes(value)) violations.push(`${label} must contain ${value}`);
  }
}

requireText("factory-bound learner", learner, [
  "createUtilityWeightLearningCapability",
  "CURRENT_WORLD_POLICY.auditIdentity",
  "readUtilityWeightPolicy",
  "UtilityWeightTransitionEvent",
  "utilityWeightLearningDisabled",
]);
requireText("learner persistence", persistence, [
  "STORAGE_KEYS.UTILITY_WEIGHT_LEARNING",
  'readOptionField("fightingStyle", "1")',
  'readOptionField("utilityWeightLearning", false)',
  "storage.getValue",
  "storage.setValue",
]);
requireText("utility model", model, [
  'UTILITY_SKILL_CODES = Object.freeze(["OFC", "FRD", "T3", "T2", "T1"])',
  "clamp(multiplier, 0.8, 1.2)",
  "styles",
]);
requireText("action observation", observation, [
  "damage / preActionAliveMaxHp + killed / preActionAliveCount",
  "progress / Math.max(1, pending.ocCost / 30)",
  "hpAbsNow",
]);
requireText("shadow evaluation", evaluation, [
  "UTILITY_SAMPLE_COUNT = 20",
  "UTILITY_BATTLE_WINDOW = 20",
  "MAX_MULTIPLIER_STEP = 0.05",
  "ocPerProgressWorseThan10Percent",
  "potionsPerBattleWorseThan10Percent",
  "turnsPerBattleWorseThan20Percent",
  'for (const key of ["flee", "pause", "recovery"])',
]);
requireText("utility transitions", transitions, [
  "createUtilityActionPending",
  "settleUtilityActionObservation",
  "maybeCreateShadow",
  "settleUtilityBattle",
]);
requireText("battle evaluation", battleEvaluation, [
  'kind: "candidateApplied"',
  'kind: "rolledBack"',
  'kind: "accepted"',
  "candidate.evaluation.length < UTILITY_BATTLE_WINDOW",
]);
requireText("ordinary score application", scoring, [
  'ordinaryMultiplier(opt, "OFC")',
  'ordinaryMultiplier(opt, "FRD")',
  'ordinaryMultiplier(opt, "T3")',
  'ordinaryMultiplier(opt, "T2")',
  'ordinaryMultiplier(opt, "T1")',
  "overrides.T3_execute ?? 1000",
  "overrides.T2_combo ?? 200",
]);
requireText("cast bookkeeping", bookkeeping, [
  "UtilityWeightLearningEvent.RECORD_PHYSICAL_CAST",
  "ocCost: event.ocCost",
  "view: event.view",
]);
requireText("action-ended settlement", lifecycle, ["finalizeUtilityObservation"]);
requireText("terminal evaluation", completion, [
  "UtilityWeightLearningEvent.BATTLE_COMPLETED",
  "completeUtilityLearning",
]);
requireText("default-off setting", settings, [
  'key: "utilityWeightLearning"',
  'group: "Skill"',
  "default: false",
]);
requireText("utility behavior tests", tests, [
  "isolates World through bound storage and style inside each World document",
  "requires 20 samples per skill and limits each proposal step to 0.05",
  "rolls it back after 20 worse battles",
  "applies learned multipliers only to ordinary base scores",
]);

if (/event\?*\.world|location\.(?:host|pathname)|isIsekai/.test(learner + persistence)) {
  violations.push("utility learning must consume factory-bound World authority, not rediscover it");
}
if (/utility-weight-learner\.js/.test(scoring)) {
  violations.push("pure physical scoring must consume derived multipliers, not read learner state");
}
if (/auto-tune\.js/.test(learner + persistence + transitions + battleEvaluation)) {
  violations.push("utility weight learning must stay independent from safetyPad auto-tune");
}

if (violations.length) {
  console.error("[verify-utility-weight-learning-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-utility-weight-learning-boundary] OK - World/style utility learning is shadowed, bounded, and rollback-safe"
);
