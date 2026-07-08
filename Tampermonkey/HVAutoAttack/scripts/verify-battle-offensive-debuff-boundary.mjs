import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/debuff/decide-offensive-debuff.js");
const ownerTest = path.normalize("src/battle/debuff/decide-offensive-debuff.test.js");
const actionDecision = path.normalize("src/battle/battle-action-decision.js");
const burstControl = path.normalize("src/battle/debuff/decide-burst-control.js");
const castAll = path.normalize("src/battle/debuff/decide-cast-all.js");
const deSkill = path.normalize("src/battle/debuff/decide-de-skill.js");
const violations = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function rel(relative) {
  return relative.replaceAll("\\", "/");
}

const ownerText = read(owner);
const actionDecisionText = read(actionDecision);
const burstControlText = read(path.normalize("src/battle/debuff/decide-burst-control.js"));
const castAllText = read(path.normalize("src/battle/debuff/decide-cast-all.js"));

for (const required of [
  "BattleOffensiveDebuffEvent",
  "battleOffensiveDebuffEventHandlers",
  "DECIDE",
  "runBattleOffensiveDebuff",
  "OFFENSIVE_DEBUFF_STEPS",
  'capability: "burstControl"',
  'capability: "bossImperil"',
  'capability: "weakenAll"',
  'capability: "imperilAll"',
  'capability: "singleTargetDebuff"',
  "BattleAttackActionEvent.WILL_CLEAR_WITH_BIG_SKILL",
  "runBattleAttackAction",
  "willClearWithBigSkill",
  "BigSkillDebuffEvent.SHOULD_SKIP_DEBUFF",
  "runBigSkillDebuffAutomation",
  "BattleStallModeEvent.READ_ACTIVE",
  "runBattleStallModeAutomation",
  "stallActive",
  "skipWeakenForBigSkill",
  "skipImperilForBigSkill",
  "BattleDebuffFactsEvent.READ_BURST_CONTROL",
  "BattleDebuffFactsEvent.READ_BOSS_IMPERIL",
  "BattleDebuffFactsEvent.READ_DEBUFF_ACTION",
  "runBattleDebuffFacts",
  "BattleBurstControlDecisionEvent.DECIDE",
  "runBattleBurstControlDecision",
  "runBossImperilAutomation",
  "BattleAllDebuffDecisionEvent.DECIDE",
  "runBattleAllDebuffDecision",
  "BattleDeSkillDecisionEvent.DECIDE",
  "runBattleDeSkillDecision",
  'debuffKey: "We"',
  'debuffKey: "Im"',
  "isEmptyDecision",
  "EMPTY_DECISION_PREDICATES",
]) {
  if (!ownerText.includes(required)) violations.push(`${rel(owner)} must own ${required}`);
}

if (
  !/const OFFENSIVE_DEBUFF_STEPS = Object\.freeze\(\[\s*\{[\s\S]*capability: "burstControl"[\s\S]*capability: "bossImperil"[\s\S]*capability: "weakenAll"[\s\S]*capability: "imperilAll"[\s\S]*capability: "singleTargetDebuff"[\s\S]*\]\)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} must own frozen explicit offensive debuff priority order`);
}

if (/for \(const decide of \[/.test(ownerText)) {
  violations.push(`${rel(owner)} must not hide offensive debuff priority in an anonymous array`);
}
if (
  !/const PHYSICAL_TYPES = Object\.freeze\(\{/.test(burstControlText) ||
  !/const CONTROL_IMG = Object\.freeze\(\{/.test(burstControlText)
) {
  violations.push(
    "src/battle/debuff/decide-burst-control.js must own frozen burst-control decision tables"
  );
}
if (
  /\bexport\s+(?:function|const)\s+(?!BattleBurstControlDecisionEvent\b|runBattleBurstControlDecision\b)/.test(
    burstControlText
  )
) {
  violations.push("src/battle/debuff/decide-burst-control.js may export only its event entry");
}
if (!/const ALL_DEBUFF_GATES = Object\.freeze\(\{/.test(castAllText)) {
  violations.push("src/battle/debuff/decide-cast-all.js must own frozen all-debuff gate table");
}
if (
  /\bexport\s+(?:function|const)\s+(?!BattleAllDebuffDecisionEvent\b|runBattleAllDebuffDecision\b)/.test(
    castAllText
  )
) {
  violations.push("src/battle/debuff/decide-cast-all.js may export only its event entry");
}
const deSkillText = read(path.normalize("src/battle/debuff/decide-de-skill.js"));
if (
  /\bexport\s+(?:function|const)\s+(?!BattleDeSkillDecisionEvent\b|runBattleDeSkillDecision\b)/.test(
    deSkillText
  )
) {
  violations.push("src/battle/debuff/decide-de-skill.js may export only its event entry");
}
for (const required of ["noop: () => true"]) {
  if (!ownerText.includes(required)) {
    violations.push(`${rel(owner)} must lock empty offensive debuff decision ${required}`);
  }
}
const emptyDecisionBody =
  ownerText.match(/function isEmptyDecision\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (/result\.kind\s*===|result\.kind\s*!==/.test(emptyDecisionBody)) {
  violations.push(
    `${rel(owner)} must route empty offensive debuff decisions through predicate tables`
  );
}

if (
  /\bexport\s+(?:function|const)\s+(?!BattleOffensiveDebuffEvent\b|runBattleOffensiveDebuff\b)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} may export only its event entry`);
}

const entryBody =
  ownerText.match(/export function runBattleOffensiveDebuff\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_DECIDE\]/.test(ownerText)) {
  violations.push(`${rel(owner)} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${rel(owner)} entry must dispatch by handler table`);
}
if (!ownerText.includes("battleOffensiveDebuffEventHandlers[event?.type]")) {
  violations.push(`${rel(owner)} must reject null offensive debuff events as no action`);
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover offensive debuff contract`);
} else {
  const ownerTestText = read(ownerTest);
  if (!ownerTestText.includes("rejects unknown offensive debuff events as no action")) {
    violations.push(`${rel(ownerTest)} must cover unknown offensive debuff events`);
  }
  if (!ownerTestText.includes("runBattleOffensiveDebuff(null)")) {
    violations.push(`${rel(ownerTest)} must cover null offensive debuff events`);
  }
}

if (
  !actionDecisionText.includes("BattleOffensiveDebuffEvent.DECIDE") ||
  !actionDecisionText.includes("runBattleOffensiveDebuff")
) {
  violations.push(`${rel(actionDecision)} must route offensive debuffs through their entry`);
}
if (/decideOffensiveDebuff\(\s*snap\s*,\s*(?:opt|actionOptions)\s*\)/.test(actionDecisionText)) {
  violations.push(`${rel(actionDecision)} must not call offensive debuff through old two-arg path`);
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
      normalized === burstControl ||
      normalized === castAll ||
      normalized === deSkill
    ) {
      continue;
    }
    const text = fs.readFileSync(file, "utf8");
    if (/from\s+["'][^"']*debuff\/decide-offensive-debuff\.js["']/.test(text)) {
      violations.push(`${rel(normalized)} must not bypass runBattleActionDecision`);
    }
    if (/decideOffensiveDebuff\(\s*[^)]*,\s*[^)]*\)/.test(text)) {
      violations.push(`${rel(normalized)} must not call retired offensive debuff two-arg path`);
    }
    if (
      /from\s+["'][^"']*debuff\/decide-(?:burst-control|cast-all|de-skill)\.js["']/.test(text) ||
      /\b(?:decideBurstControl|decideCastDebuffOnAll|decideDeSkill)\s*\(/.test(text)
    ) {
      violations.push(`${rel(normalized)} must not bypass offensive debuff sub-decision entries`);
    }
  }
}

if (violations.length) {
  console.error("[verify-battle-offensive-debuff-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log(
  "[verify-battle-offensive-debuff-boundary] OK - offensive debuffs are behind one entry"
);
