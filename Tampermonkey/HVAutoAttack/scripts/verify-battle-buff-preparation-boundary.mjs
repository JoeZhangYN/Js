import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const owner = path.normalize("src/battle/buff/decide-buff-preparation.js");
const ownerTest = path.normalize("src/battle/buff/decide-buff-preparation.test.js");
const actionDecision = path.normalize("src/battle/battle-action-decision.js");
const infusionDecision = path.normalize("src/battle/buff/decide-infusion.js");
const channelDecision = path.normalize("src/battle/buff/decide-channel.js");
const buffDecision = path.normalize("src/battle/buff/decide-buff.js");
const buffFacts = path.normalize("src/battle/buff/buff-facts.js");
const buffFactsTest = path.normalize("src/battle/buff/buff-facts.test.js");
const violations = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function rel(relative) {
  return relative.replaceAll("\\", "/");
}

const ownerText = read(owner);
const actionDecisionText = read(actionDecision);
const infusionText = read(path.normalize("src/battle/buff/decide-infusion.js"));
const buffText = read(path.normalize("src/battle/buff/decide-buff.js"));
const buffFactsText = read(buffFacts);

for (const required of [
  "BattleBuffPreparationEvent",
  "battleBuffPreparationEventHandlers",
  "DECIDE",
  "runBattleBuffPreparation",
  "BUFF_PREPARATION_STEPS",
  'capability: "infusion"',
  'capability: "channel"',
  'capability: "buff"',
  "BattleBuffFactsEvent.READ_PREPARATION",
  "runBattleBuffFacts",
  "BattleInfusionDecisionEvent.DECIDE",
  "runBattleInfusionDecision",
  "BattleChannelDecisionEvent.DECIDE",
  "runBattleChannelDecision",
  "BattleBuffDecisionEvent.DECIDE",
  "runBattleBuffDecision",
  "isEmptyDecision",
  "EMPTY_DECISION_PREDICATES",
  "EMPTY_CHANNEL_PLAN_PREDICATES",
  "isEmptyChannelPlanDecision",
]) {
  if (!ownerText.includes(required)) violations.push(`${rel(owner)} must own ${required}`);
}

if (
  !/const BUFF_PREPARATION_STEPS = Object\.freeze\(\[\s*\{[\s\S]*capability: "infusion"[\s\S]*capability: "channel"[\s\S]*capability: "buff"[\s\S]*\]\)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} must own frozen explicit buff preparation priority order`);
}

if (/for \(const decide of \[/.test(ownerText)) {
  violations.push(`${rel(owner)} must not hide buff preparation priority in an anonymous array`);
}
if (!/const INFUSION_LIB = Object\.freeze\(\[/.test(infusionText)) {
  violations.push("src/battle/buff/decide-infusion.js must own frozen infusion item table");
}
if (
  /\bexport\s+(?:function|const)\s+(?!BattleInfusionDecisionEvent\b|runBattleInfusionDecision\b)/.test(
    infusionText
  )
) {
  violations.push("src/battle/buff/decide-infusion.js may export only its event entry");
}
if (!/const DRAUGHT_PACK = Object\.freeze\(\[/.test(buffText)) {
  violations.push("src/battle/buff/decide-buff.js must own frozen draught decision table");
}
if (
  /\bexport\s+(?:function|const)\s+(?!BattleBuffDecisionEvent\b|runBattleBuffDecision\b)/.test(
    buffText
  )
) {
  violations.push("src/battle/buff/decide-buff.js may export only its event entry");
}
const channelText = read(path.normalize("src/battle/buff/decide-channel.js"));
if (
  /\bexport\s+(?:function|const)\s+(?!BattleChannelDecisionEvent\b|runBattleChannelDecision\b)/.test(
    channelText
  )
) {
  violations.push("src/battle/buff/decide-channel.js may export only its event entry");
}
for (const required of [
  "noop: () => true",
  '"channel-plan": isEmptyChannelPlanDecision',
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${rel(owner)} must lock empty buff preparation decision ${required}`);
  }
}
const emptyDecisionBody =
  ownerText.match(/function isEmptyDecision\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (/result\.kind\s*===|plan\.type\s*===/.test(emptyDecisionBody)) {
  violations.push(`${rel(owner)} must route empty buff preparation decisions through predicate tables`);
}

if (
  /\bexport\s+(?:function|const)\s+(?!BattleBuffPreparationEvent\b|runBattleBuffPreparation\b)/.test(
    ownerText
  )
) {
  violations.push(`${rel(owner)} may export only its event entry`);
}
for (const required of [
  "BattleBuffFactsEvent",
  "battleBuffFactsEventHandlers",
  "READ_PREPARATION",
  "runBattleBuffFacts",
  "buffPreparationFacts",
]) {
  if (!buffFactsText.includes(required)) {
    violations.push(`${rel(buffFacts)} must own buff facts query ${required}`);
  }
}
if (
  /\bexport\s+(?:function|const)\s+(?!BattleBuffFactsEvent\b|runBattleBuffFacts\b)/.test(
    buffFactsText
  )
) {
  violations.push(`${rel(buffFacts)} may export only its event query entry`);
}
const buffFactsEntryBody =
  buffFactsText.match(/export function runBattleBuffFacts\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_READ_PREPARATION\]/.test(buffFactsText)) {
  violations.push(`${rel(buffFacts)} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(buffFactsEntryBody)) {
  violations.push(`${rel(buffFacts)} entry must dispatch by handler table`);
}
if (!fs.existsSync(path.join(root, buffFactsTest))) {
  violations.push(`${rel(buffFactsTest)} must cover buff facts contract`);
} else {
  const buffFactsTestText = read(buffFactsTest);
  if (!buffFactsTestText.includes("rejects unknown buff facts events")) {
    violations.push(`${rel(buffFactsTest)} must cover unknown buff facts events`);
  }
}

const entryBody =
  ownerText.match(/export function runBattleBuffPreparation\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (!/Object\.freeze\(\{[\s\S]*\[EVENT_DECIDE\]/.test(ownerText)) {
  violations.push(`${rel(owner)} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${rel(owner)} entry must dispatch by handler table`);
}
if (!ownerText.includes("battleBuffPreparationEventHandlers[event?.type]")) {
  violations.push(`${rel(owner)} must reject null buff preparation events as no action`);
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${rel(ownerTest)} must cover buff preparation contract`);
} else {
  const ownerTestText = read(ownerTest);
  if (!ownerTestText.includes("rejects unknown buff preparation events as no action")) {
    violations.push(`${rel(ownerTest)} must cover unknown buff preparation events`);
  }
  if (!ownerTestText.includes("runBattleBuffPreparation(null)")) {
    violations.push(`${rel(ownerTest)} must cover null buff preparation events`);
  }
}

if (
  !actionDecisionText.includes("BattleBuffPreparationEvent.DECIDE") ||
  !actionDecisionText.includes("runBattleBuffPreparation")
) {
  violations.push(`${rel(actionDecision)} must route buff preparation through its entry`);
}
if (/decideBuffPreparation\(\s*snap\s*,\s*(?:opt|actionOptions)\s*\)/.test(actionDecisionText)) {
  violations.push(`${rel(actionDecision)} must not call buff preparation through old two-arg path`);
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
      normalized === buffFacts ||
      normalized === actionDecision ||
      normalized === infusionDecision ||
      normalized === channelDecision ||
      normalized === buffDecision
    ) {
      continue;
    }
    const text = fs.readFileSync(file, "utf8");
    if (/from\s+["'][^"']*buff\/decide-buff-preparation\.js["']/.test(text)) {
      violations.push(`${rel(normalized)} must not bypass runBattleActionDecision`);
    }
    if (/decideBuffPreparation\(\s*[^)]*,\s*[^)]*\)/.test(text)) {
      violations.push(`${rel(normalized)} must not call retired buff preparation two-arg path`);
    }
    if (
      /from\s+["'][^"']*buff\/decide-(?:infusion|channel|buff)\.js["']/.test(text) ||
      /\b(?:decideInfusion|decideChannel|decideBuff)\s*\(/.test(text)
    ) {
      violations.push(`${rel(normalized)} must not bypass buff preparation sub-decision entries`);
    }
  }
}

if (violations.length) {
  console.error("[verify-battle-buff-preparation-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-buff-preparation-boundary] OK - buff preparation is behind one entry");
