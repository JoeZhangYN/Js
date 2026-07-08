import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/attack/decide-attack-action.js");
const ownerTest = path.normalize("src/battle/attack/decide-attack-action.test.js");
const attackPlan = path.normalize("src/battle/attack/attack-plan.js");
const attackDecision = path.normalize("src/battle/attack/decide-attack.js");
const attackFacts = path.normalize("src/battle/attack/attack-facts.js");
const spellAttackPlan = path.normalize("src/battle/attack/spell-attack-plan.js");
const physicalSkillScoring = path.normalize("src/battle/attack/physical-skill-scoring.js");
const physicalSkillRanking = path.normalize("src/battle/attack/physical-skill-ranking.js");
const autoElementSelection = path.normalize("src/battle/attack/auto-element-selection.js");
const actionDecision = path.normalize("src/battle/battle-action-decision.js");
const offensiveDebuff = path.normalize("src/battle/debuff/decide-offensive-debuff.js");
const violations = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function rel(relative) {
  return relative.replaceAll("\\", "/");
}

const ownerText = read(owner);
const attackFactsText = read(attackFacts);
const attackPlanText = read(attackPlan);
const actionDecisionText = read(actionDecision);

for (const required of [
  "BattleAttackActionEvent",
  "battleAttackActionEventHandlers",
  "DECIDE",
  "WILL_CLEAR_WITH_BIG_SKILL",
  "AttackDecisionEvent.WILL_CLEAR_WITH_BIG_SKILL",
  "runBattleAttackAction",
  "BattleAttackFactsEvent.READ_ACTION",
  "runBattleAttackFacts",
  "runAttackDecision",
]) {
  if (!ownerText.includes(required)) violations.push(`${rel(owner)} must own ${required}`);
}

if (
  /\bexport\s+(?:function|const)\s+(?!BattleAttackActionEvent\b|runBattleAttackAction\b)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} may export only its event entry`);
}

const entryBody =
  ownerText.match(/export function runBattleAttackAction\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (
  !/Object\.freeze\(\{[\s\S]*\[EVENT_DECIDE\][\s\S]*\[EVENT_WILL_CLEAR_WITH_BIG_SKILL\]/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${rel(owner)} entry must dispatch by handler table`);
}
if (!ownerText.includes("battleAttackActionEventHandlers[event?.type]")) {
  violations.push(`${rel(owner)} must reject null attack action events as no action`);
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover attack action contract`);
} else {
  const ownerTestText = read(ownerTest);
  if (!ownerTestText.includes("rejects unknown attack action events as no action")) {
    violations.push(`${rel(ownerTest)} must cover unknown attack action events`);
  }
  if (!ownerTestText.includes("runBattleAttackAction(null)")) {
    violations.push(`${rel(ownerTest)} must cover null attack action events`);
  }
  if (!ownerTestText.includes("rejects unknown attack facts events as empty facts")) {
    violations.push(`${rel(ownerTest)} must cover unknown attack facts events`);
  }
  if (!ownerTestText.includes("runBattleAttackFacts(null)")) {
    violations.push(`${rel(ownerTest)} must cover null attack facts events`);
  }
}

if (!attackFactsText.includes("battleAttackFactsEventHandlers[event?.type]")) {
  violations.push(`${rel(attackFacts)} must reject null attack facts events as empty facts`);
}

if (
  !actionDecisionText.includes("BattleAttackActionEvent.DECIDE") ||
  !actionDecisionText.includes("runBattleAttackAction")
) {
  violations.push(`${rel(actionDecision)} must route attack through its entry`);
}
if (/decideAttackAction\(\s*snap\s*,\s*(?:opt|actionOptions)\s*\)/.test(actionDecisionText)) {
  violations.push(`${rel(actionDecision)} must not call attack action through old two-arg path`);
}

for (const required of [
  "AttackPlanDecisionEvent",
  "attackPlanDecisionEventHandlers",
  "runAttackPlanDecision",
  "ATTACK_PLAN_STEPS",
  'capability: "focus"',
  'capability: "spiritToggle"',
  'capability: "spell"',
  'capability: "mercifulSingle"',
  'capability: "physicalUtility"',
  'capability: "defaultAttack"',
  "buildAttackPlanContext",
  "SpellAttackPlanEvent.DECIDE",
  "runSpellAttackPlan",
  "PhysicalSkillScoringEvent.SCORE_CANDIDATES",
  "runPhysicalSkillScoring",
  "PhysicalSkillRankingEvent.PICK_BY_UTILITY",
  "runPhysicalSkillRanking",
]) {
  if (!attackPlanText.includes(required)) {
    violations.push(`${rel(attackPlan)} must lock attack plan step ${required}`);
  }
}
if (
  /\bexport\s+(?:function|const)\s+(?!AttackPlanDecisionEvent\b|runAttackPlanDecision\b)/.test(
    attackPlanText
  )
) {
  violations.push(`${rel(attackPlan)} may export only its event entry`);
}
const attackPlanEntryBody =
  attackPlanText.match(/export function runAttackPlanDecision\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_DECIDE\]/.test(attackPlanText)) {
  violations.push(`${rel(attackPlan)} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(attackPlanEntryBody)) {
  violations.push(`${rel(attackPlan)} entry must dispatch by handler table`);
}
if (
  !/const ATTACK_PLAN_STEPS = Object\.freeze\(\[\s*\{[\s\S]*capability: "focus"[\s\S]*capability: "spiritToggle"[\s\S]*capability: "spell"[\s\S]*capability: "mercifulSingle"[\s\S]*capability: "physicalUtility"[\s\S]*capability: "defaultAttack"[\s\S]*\]\)/.test(
    attackPlanText
  )
) {
  violations.push(`${rel(attackPlan)} must own frozen attack plan step order`);
}
if (!/for\s*\(\s*const\s+step\s+of\s+ATTACK_PLAN_STEPS\s*\)/.test(attackPlanText)) {
  violations.push(`${rel(attackPlan)} must choose attack plans through ATTACK_PLAN_STEPS`);
}

for (const relative of ["src/battle", "src/core"]) {
  const dir = path.join(root, relative);
  for (const entry of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".js") || entry.name.endsWith(".test.js")) {
      continue;
    }
    const file = path.join(entry.parentPath, entry.name);
    const normalized = path.normalize(path.relative(root, file));
    if (
      normalized === owner ||
      normalized === actionDecision ||
      normalized === offensiveDebuff ||
      normalized === spellAttackPlan ||
      normalized === physicalSkillScoring ||
      normalized === physicalSkillRanking ||
      normalized === autoElementSelection
    ) {
      continue;
    }
    const text = fs.readFileSync(file, "utf8");
    if (/from\s+["'][^"']*attack\/decide-attack-action\.js["']/.test(text)) {
      violations.push(`${rel(normalized)} must not bypass runBattleActionDecision`);
    }
    if (/decideAttackAction\(\s*[^)]*,\s*[^)]*\)/.test(text)) {
      violations.push(`${rel(normalized)} must not call retired attack action two-arg path`);
    }
    if (
      normalized !== attackDecision &&
      /from\s+["'][^"']*attack\/attack-plan\.js["']/.test(text)
    ) {
      violations.push(
        `${rel(normalized)} must not bypass runAttackDecision for attack plan decisions`
      );
    }
    if (
      normalized !== attackPlan &&
      /from\s+["'][^"']*attack\/spell-attack-plan\.js["']/.test(text)
    ) {
      violations.push(`${rel(normalized)} must not bypass attack plan for spell decisions`);
    }
    if (
      /from\s+["'][^"']*attack\/(?:physical-skill-scoring|physical-skill-ranking|auto-element-selection)\.js["']/.test(
        text
      )
    ) {
      violations.push(`${rel(normalized)} must not bypass attack plan sub-decision entries`);
    }
    if (
      normalized !== attackDecision &&
      normalized !== attackPlan &&
      /\bdecideAttackPlan\s*\(/.test(text)
    ) {
      violations.push(`${rel(normalized)} must not call attack plan outside runAttackDecision`);
    }
    if (
      /\b(?:decideSpellAttackPlan|scorePhysicalSkillCandidates|pickByUtility|selectAutoElement)\s*\(/.test(
        text
      )
    ) {
      violations.push(`${rel(normalized)} must not call retired attack sub-decision functions`);
    }
  }
}

if (violations.length) {
  console.error("[verify-battle-attack-action-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-attack-action-boundary] OK - attack action is behind one entry");
