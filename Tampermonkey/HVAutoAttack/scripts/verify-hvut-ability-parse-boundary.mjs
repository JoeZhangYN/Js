import fs from "node:fs";
import path from "node:path";
import { HvutAbilityRequirementCatalog } from "../src/data/hvut-ability-requirements.js";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const requirementText = fs.readFileSync(
  path.join(root, "src/i18n/hvut-ability-requirement.js"),
  "utf8"
);
const requirementTestText = fs.readFileSync(
  path.join(root, "src/i18n/hvut-ability-requirement.test.js"),
  "utf8"
);
const bridgeText = fs.readFileSync(
  path.join(root, "src/i18n/hvut-ability-requirement-bridge.js"),
  "utf8"
);
const contrastText = fs.readFileSync(
  path.join(root, "src/i18n/hvut-ability-background-contrast.js"),
  "utf8"
);
const contrastTestText = fs.readFileSync(
  path.join(root, "src/i18n/hvut-ability-background-contrast.test.js"),
  "utf8"
);
const catalogText = fs.readFileSync(path.join(root, "src/i18n/hvut-ability-catalog.js"), "utf8");
const requirementCatalogText = fs.readFileSync(
  path.join(root, "src/data/hvut-ability-requirements.js"),
  "utf8"
);
const catalogTestText = fs.readFileSync(
  path.join(root, "src/data/hvut-ability-catalog.test.js"),
  "utf8"
);
const catalogBridgeText = fs.readFileSync(
  path.join(root, "src/i18n/hvut-ability-catalog-bridge.js"),
  "utf8"
);
const mainText = fs.readFileSync(path.join(root, "src/main.js"), "utf8");
const violations = [];

function requirePart(label, body, part) {
  if (!body.includes(part)) violations.push(`${target} ${label} must include ${part}`);
}

const helperRegion =
  /var record_hvut_ability_parse_failure = function \(stage, detail\) \{[\s\S]*?\n  var reloadCurrentPage/.exec(
    text
  )?.[0] || "";
const modernInit =
  /_ab\.init = function \(\) \{[\s\S]*?\n  \};\n\n  _ab\.parse_slotbar/.exec(text)?.[0] || "";
const modernSlotbar =
  /_ab\.parse_slotbar = function \(\) \{[\s\S]*?\n  \};\n\n  _ab\.parse_treepane/.exec(text)?.[0] ||
  "";
const modernTreepane =
  /_ab\.parse_treepane = function \(\) \{[\s\S]*?\n  \};\n\n  _ab\.click/.exec(text)?.[0] || "";
const abilityRegions = [
  ...text.matchAll(
    /_ab\.point = parse_hvut_ability_points_from_top\(\$id\('ability_top'\)[\s\S]*?\n\} else\n\/\/ \[END 3\] Character - Abilities/g
  ),
].map((match) => match[0]);
const legacyRegion = abilityRegions[1] || "";

for (const [label, body] of [
  ["ability parse helper", helperRegion],
  ["modern ability init", modernInit],
  ["modern ability slotbar parser", modernSlotbar],
  ["modern ability treepane parser", modernTreepane],
  ["legacy ability region", legacyRegion],
]) {
  if (!body) violations.push(`${target} must keep ${label} visible`);
}

if (abilityRegions.length !== 2) {
  violations.push(
    `${target} must keep exactly two HVUT ability page regions, found ${abilityRegions.length}`
  );
}

for (const required of [
  "sessionStorage.setItem('HVAA:lastHvutAbilityParseFailure', JSON.stringify(evidence));",
  "var parse_hvut_ability_points = function (text) {",
  "var parse_hvut_ability_button_type = function (backgroundImage) {",
  "var parse_hvut_ability_points_from_top = function (top, stage) {",
  "record_hvut_ability_parse_failure(stage, { reason: 'abilityPointNodeMissing' })",
  "var parse_hvut_ability_button_panel = function (div, stage) {",
  "record_hvut_ability_parse_failure(stage, { reason: 'abilityButtonPanelMissing'",
  "var parse_hvut_ability_unlock_id = function (panel, stage) {",
  "var hasUnlockButton = !!$qs('div[style*=\"u.png\"]', panel);",
  "return hasUnlockButton ? record_hvut_ability_parse_failure(stage, { onclick: onclick, reason: 'unlockIdMissingForUnlockableAbility' }) : '';",
  "var mark_hvut_ability_warning = function (div, warn, stage) {",
  "record_hvut_ability_parse_failure(stage, { reason: 'abilityWarningNodeMissing'",
  "return match ? parseInt(match[1]) : record_hvut_ability_parse_failure('abilityPoints'",
  "record_hvut_ability_parse_failure('abilityButtonType'",
  "return '?';",
  "var decide_hvut_ability_rank_requirement = function",
  "var render_hvut_ability_rank_requirement = function",
  "var create_hvut_ability_catalog = function",
  "reason: 'abilityCatalogBridgeMissing'",
  "var prepare_hvut_ability_tree = function",
  "reason: 'abilityCatalogEntryMissing'",
  "reason: 'abilityRankCountMismatch'",
]) {
  requirePart("ability parse helper", helperRegion, required);
}

for (const required of [
  "if (_ab.point === null) {",
  "if (_ab.parse_slotbar() === false) {",
  "if (!$config.set('ab_level', _ab.level)) {",
  "if (_ab.parse_treepane() === false) {",
  "return false;",
]) {
  requirePart("modern ability init", modernInit, required);
}

for (const required of [
  "for (const div of $qsa('#ability_top div[onmouseover*=\"overability\"]')) {",
  "record_hvut_ability_parse_failure('abilitySlotbar'",
  "return false;",
  "continue;",
  "return true;",
]) {
  requirePart("modern ability slotbar parser", modernSlotbar, required);
}

for (const required of [
  "const entries = prepare_hvut_ability_tree(",
  "if (entries === null) {",
  "for (const { div, name, ability: ab, id, ranks, acquiredLevel } of entries) {",
  "for (const { button, decision, index } of ranks) {",
  "if (render_hvut_ability_rank_requirement(button, decision, index, { name: name }) === false) return false;",
  "mark_hvut_ability_warning(div, '未激活', 'abilityWarningNode')",
  "mark_hvut_ability_warning(div, '可升级', 'abilityWarningNode')",
  "return true;",
]) {
  requirePart("modern ability treepane parser", modernTreepane, required);
}

for (const required of [
  "_ab.point = parse_hvut_ability_points_from_top($id('ability_top'), 'legacyAbilityPointsNode');",
  "if (_ab.point === null) {",
  "for (const div of $qsa('#ability_top div[onmouseover*=\"overability\"]')) {",
  "record_hvut_ability_parse_failure('abilitySlotbar'",
  "const abilityTreeEntries = prepare_hvut_ability_tree(",
  "if (abilityTreeEntries === null) {",
  "for (const { div, name, ability: ab, id, ranks, acquiredLevel } of abilityTreeEntries) {",
  "for (const { button, decision, index } of ranks) {",
  "if (render_hvut_ability_rank_requirement(button, decision, index, { name: name }) === false) {",
  "mark_hvut_ability_warning(div, '未激活', 'legacyAbilityWarningNode')",
  "mark_hvut_ability_warning(div, '可升级', 'legacyAbilityWarningNode')",
]) {
  requirePart("legacy ability region", legacyRegion, required);
}

for (const forbidden of [
  "parseInt(/Ability Points: (\\d+)/.exec($id('ability_top').children[3].textContent)[1])",
  "const type = /(.)\\.png/.exec(button.style.backgroundImage)[1];",
  "$qsa('#ability_top div[onmouseover*=\"overability\"]').forEach((div) => {",
  "$qsa('#ability_treepane > div').forEach((div) => {",
  "$id('ability_top').children[3].textContent",
  "div.children[2].getAttribute('onclick')",
  "Array.from(div.children[2].children)",
  "div.firstElementChild.firstElementChild.classList.add('hvut-ab-warn')",
  "div.firstElementChild.firstElementChild.dataset.warn",
]) {
  if (text.includes(forbidden)) {
    violations.push(`${target} must not keep unchecked ability parse path: ${forbidden}`);
  }
}

for (const required of [
  "HvutAbilityRankState",
  "HvutAbilityRankAction",
  "HvutAbilityRequirementLayout",
  "export function decideHvutAbilityRankRequirement(input)",
  'kind: "unknownState"',
  "abilityPointsText:",
  "playerLevelText:",
  "POINTS_CENTER_LEVEL_BELOW",
  "requirement,",
]) {
  if (!requirementText.includes(required)) {
    violations.push(`ability requirement decision must contain ${required}`);
  }
}
for (const required of [
  "keeps point and level requirements for button state",
  "preserves requirements while classifying an unknown button state",
  "rejects missing catalog requirements instead of rendering empty text",
  "keeps points centered and formats the lower level with ASCII parentheses",
]) {
  if (!requirementTestText.includes(required)) {
    violations.push(`ability requirement tests must cover ${required}`);
  }
}
for (const required of [
  'Object.defineProperty(window, "HVAA_hvutAbilityRequirement"',
  "decide: decideHvutAbilityRankRequirement",
  "contrast: decideHvutAbilityPointContrast",
  "layout: HvutAbilityRequirementLayout",
  "writable: false",
]) {
  if (!bridgeText.includes(required)) {
    violations.push(`ability requirement bridge must contain ${required}`);
  }
}
if (!mainText.includes('import "./i18n/hvut-ability-requirement-bridge.js"')) {
  violations.push("main must bind ability requirement decisions before the sloppy runtime");
}
if (mainText.indexOf("hvut-ability-requirement-bridge.js") > mainText.indexOf("hv-utils.js")) {
  violations.push("ability requirement bridge must be installed before hv-utils");
}
for (const required of [
  'Object.defineProperty(window, "HVAA_hvutAbilityCatalog"',
  "create: createHvutAbilityCatalog",
  "writable: false",
]) {
  if (!catalogBridgeText.includes(required)) {
    violations.push(`ability catalog bridge must contain ${required}`);
  }
}
if (!mainText.includes('import "./i18n/hvut-ability-catalog-bridge.js"')) {
  violations.push("main must bind the ability catalog before the sloppy runtime");
}
if (mainText.indexOf("hvut-ability-catalog-bridge.js") > mainText.indexOf("hv-utils.js")) {
  violations.push("ability catalog bridge must be installed before hv-utils");
}

const renderCalls = [
  ...text.matchAll(
    /render_hvut_ability_rank_requirement\(button, decision, index, \{ name: name \}\)/g
  ),
].length;
if (renderCalls !== 2) {
  violations.push(
    `both HVUT ability worlds must use one rank requirement renderer, found ${renderCalls}`
  );
}
const prepareCalls = [...text.matchAll(/prepare_hvut_ability_tree\(\$qsa\('#ability_treepane/g)]
  .length;
if (prepareCalls !== 2) {
  violations.push(`both HVUT ability worlds must prepare the whole tree, found ${prepareCalls}`);
}
if (/if \(type === null\)/.test(text)) {
  violations.push("unknown ability button state must not leave a partially rendered tree");
}
for (const forbidden of [
  /\$element\('span', button, \[ab\.point\[i\], '\.hvut-ab-bu/,
  /\$element\('span', button, \[`\$\{ab\.point\[i\]\} \(\$\{ab\.unlock\[i\]\}\)`/,
  /decision\.requirement\.displayText/,
]) {
  if (forbidden.test(text)) {
    violations.push("ability rank requirements must not keep state-specific rendering dialects");
  }
}
for (const required of [
  "decision.requirement.abilityPointsText",
  "decision.requirement.playerLevelText",
  "window.getComputedStyle(backgroundNode).backgroundColor",
  "window.getComputedStyle(button).backgroundImage",
  "bridge.contrast({ backgroundImage: backgroundImage, backgroundColors: backgroundColors })",
  "point.dataset.contrastTone = contrast.tone",
  "point.dataset.contrastBackground = contrast.effectiveBackground",
  "point.dataset.contrastSource = contrast.source",
  "point.dataset.backgroundFamily = contrast.backgroundFamily",
  "'.hvut-ab-points'",
  "'.hvut-ab-level'",
  "reason: 'abilityRequirementLayoutUnknown'",
  "reason: contrast?.reason || 'abilityRequirementContrastRejected'",
]) {
  requirePart("ability requirement renderer", helperRegion, required);
}
if (text.includes("mix-blend-mode: difference")) {
  violations.push(
    "ability point contrast must use computed background evidence, not visual blending"
  );
}
if (
  (text.match(/\.hvut-ab-level \{ display: block; position: absolute; top: 27px;/g) || [])
    .length !== 2
) {
  violations.push("both ability worlds must place the required level below the rank button");
}
if (/\.hvut-ab-b(?:f|u|ux|x) \{ color:/.test(text)) {
  violations.push("ability point state classes must not override adaptive background contrast");
}
for (const required of [
  "export function decideHvutAbilityPointContrast(input)",
  "ABILITY_ASSET_PALETTE",
  "abilityAssetBackground(input?.backgroundImage)",
  "backgroundColors",
  "contrastRatio",
  'textColor: tone === HvutAbilityPointTone.DARK ? "#000" : "#fff"',
  'source: asset ? "abilityAsset" : parsedLayers.length ? "computedLayers" : "defaultWhite"',
  'sourceOrigin: "https://hentaiverse.org/isekai/y/ab/"',
]) {
  if (!contrastText.includes(required)) {
    violations.push(`ability background contrast decision must contain ${required}`);
  }
}
for (const required of [
  "chooses maximum contrast for %s",
  "classifies the real ability asset %s",
  '"url(/isekai/y/ab/5bf.png)"',
  '"/isekai/y/ab/7gf.png"',
  '"url(/isekai/y/ab/2rf.png)"',
  '"url(/isekai/y/ab/1pf.png)"',
  '"major red"',
  '"supportive green"',
  '"protection blue"',
  '"drain purple"',
  "composites transparent child layers over the actual ancestor background",
]) {
  if (!contrastTestText.includes(required)) {
    violations.push(`ability background contrast tests must cover ${required}`);
  }
}

const catalog = HvutAbilityRequirementCatalog;
if (Object.keys(catalog).length !== 75) {
  violations.push(
    `ability requirement catalog must contain all 75 skills, found ${Object.keys(catalog).length}`
  );
}
for (const [name, requirement] of Object.entries(catalog)) {
  if (requirement.unlock.length !== requirement.point.length) {
    violations.push(
      `ability catalog ${name} has ${requirement.unlock.length} levels but ${requirement.point.length} point costs`
    );
  }
}
for (const [name, unlock, point] of [
  ["2H Parry", [50, 200], [2, 3]],
  ["Staff Accuracy", [50, 150, 300], [1, 2, 3]],
  ["Cloth Spellacc", [0, 120, 240], [2, 3, 5]],
]) {
  if (
    JSON.stringify(catalog[name]?.unlock) !== JSON.stringify(unlock) ||
    JSON.stringify(catalog[name]?.point) !== JSON.stringify(point)
  ) {
    violations.push(`current ability requirement drifted for ${name}`);
  }
}
for (const required of [
  "file-size-gate: exempt data-table-HVUT能力等级与AP纯数据SOT",
  "freezeRequirementCatalog(CURRENT_REQUIREMENTS)",
]) {
  if (!requirementCatalogText.includes(required)) {
    violations.push(`ability requirement data authority must contain ${required}`);
  }
}
for (const required of [
  "sourceIdentity:",
  'reachability: "successful"',
  'required: "Better Immobilize"',
  'required: "Better MagNet"',
  'reason: "abilityCatalogIdentityMismatch"',
]) {
  if (!catalogText.includes(required)) {
    violations.push(`ability catalog authority must contain ${required}`);
  }
}
for (const required of [
  "hydrates every %s ability through the same requirement authority",
  "rejects partial or mixed-world catalogs instead of rendering some skills",
]) {
  if (!catalogTestText.includes(required)) {
    violations.push(`ability catalog tests must cover ${required}`);
  }
}
for (const required of [
  "_ab.abilities = create_hvut_ability_catalog('isekai', {",
  "_ab.ability = create_hvut_ability_catalog('persistent', {",
]) {
  if (!text.includes(required)) violations.push(`both ability worlds must consume ${required}`);
}
const presentationRegions = [
  /_ab\.abilities = create_hvut_ability_catalog\('isekai',[\s\S]*?'abilityCatalogCompose'\)/.exec(
    text
  )?.[0] || "",
  /_ab\.ability = create_hvut_ability_catalog\('persistent',[\s\S]*?'legacyAbilityCatalogCompose'\)/.exec(
    text
  )?.[0] || "",
];
if (presentationRegions.some((region) => /\b(?:unlock|point): \[/.test(region))) {
  violations.push("ability presentation catalogs must not fork level/AP requirements");
}

if (violations.length) {
  console.error("[verify-hvut-ability-parse-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-ability-parse-boundary] OK - ability parse failures fail closed with evidence"
);
