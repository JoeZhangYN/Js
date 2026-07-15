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
const presentationCatalogText = fs.readFileSync(
  path.join(root, "src/data/hvut-ability-presentation.js"),
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
const lifecycleRegion =
  /var parse_hvut_ability_slotbar = function \(page\) \{[\s\S]*?\n  var record_hvut_training_notification_failure/.exec(
    text
  )?.[0] || "";
const compositionCalls = [
  ...text.matchAll(
    /run_hvut_ability_page\(\{ state: _ab, config: \$config, player: _player, definition: abilityPageDefinition \}\)/g
  ),
];

for (const [label, body] of [
  ["ability parse helper", helperRegion],
  ["shared ability lifecycle", lifecycleRegion],
]) {
  if (!body) violations.push(`${target} must keep ${label} visible`);
}

if (compositionCalls.length !== 2) {
  violations.push(`${target} must compose one shared ability entry for both worlds`);
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
  "var create_hvut_ability_page_definition = function",
  "reason: 'abilityCatalogBridgeMissing'",
  "var prepare_hvut_ability_tree = function",
  "reason: 'abilityCatalogEntryMissing'",
  "reason: 'abilityRankCountMismatch'",
]) {
  requirePart("ability parse helper", helperRegion, required);
}

for (const required of [
  "var parse_hvut_ability_slotbar = function (page) {",
  "for (const div of $qsa('#ability_top div[onmouseover*=\"overability\"]')) {",
  "record_hvut_ability_parse_failure('abilitySlotbar'",
  "reason: 'abilityCategoryNodeMissing'",
  "continue;",
  "var render_hvut_ability_tree = function (page) {",
  "var entries = prepare_hvut_ability_tree(",
  "for (const { div, name, ability, id, ranks, acquiredLevel } of entries) {",
  "for (const { button, decision, index } of ranks) {",
  "if (render_hvut_ability_rank_requirement(button, decision, index, { name: name }) === false) return false;",
  "mark_hvut_ability_warning(div, '未激活', 'abilityWarningNode')",
  "mark_hvut_ability_warning(div, '可升级', 'abilityWarningNode')",
  "var unlock_hvut_ability_ranks = async function (page, name, to) {",
  "var create_hvut_ability_calculator = function (page) {",
  "calculator.preset('Current Set')",
  "var inject_hvut_ability_page_style = function () {",
  "var run_hvut_ability_page = async function (context) {",
  "page.points = parse_hvut_ability_points_from_top($id('ability_top'), 'abilityPointsNode')",
  "parse_hvut_ability_slotbar(page) === false",
  "!(await page.config.set_derived('ab_level', page.levels))",
  "render_hvut_ability_tree(page) === false",
  "page.state.unlock = (name, to) => unlock_hvut_ability_ranks(page, name, to)",
]) {
  requirePart("shared ability lifecycle", lifecycleRegion, required);
}

for (const forbidden of [
  /_ab\.(?:init|parse_slotbar|parse_treepane|unlock)\s*=/,
  /legacyAbility(?:Points|Tree|Button|Unlock|Rank|Warning)/,
  /\.hvut-ab-limit/,
]) {
  if (forbidden.test(text)) {
    violations.push(`${target} must retire the duplicated legacy ability lifecycle: ${forbidden}`);
  }
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
  "createDefinition: createHvutAbilityPageDefinition",
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
if (renderCalls !== 1) {
  violations.push(
    `shared HVUT ability lifecycle must render requirements once, found ${renderCalls}`
  );
}
const prepareCalls = [...text.matchAll(/prepare_hvut_ability_tree\(\$qsa\('#ability_treepane/g)]
  .length;
if (prepareCalls !== 1) {
  violations.push(
    `shared HVUT ability lifecycle must prepare the tree once, found ${prepareCalls}`
  );
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
  "'.hvut-ab-points ' + className",
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
    .length !== 1
) {
  violations.push("shared ability renderer must place the required level below the rank button");
}
if (/\.hvut-ab-b(?:f|u|ux|x) \{ color:/.test(text)) {
  violations.push("ability point state classes must not override adaptive background contrast");
}
if (text.includes("'.hvut-ab-points' + className")) {
  violations.push("ability point and state identities must be separate CSS classes");
}
for (const required of [
  "export function decideHvutAbilityPointContrast(input)",
  "ABILITY_ASSET_PALETTE",
  "abilityAssetBackground(input?.backgroundImage)",
  "backgroundColors",
  "contrastRatio",
  'textColor: tone === HvutAbilityPointTone.DARK ? "#000" : "#fff"',
  '"abilityAssetOpaque"',
  '"abilityAssetTransparent"',
  'color: "rgb(87, 153, 22)"',
]) {
  if (!contrastText.includes(required)) {
    violations.push(`ability background contrast decision must contain ${required}`);
  }
}
for (const retiredEvidence of ["HvutAbilityBackgroundPaletteEvidence", "sourceOrigin:"]) {
  if (contrastText.includes(retiredEvidence)) {
    violations.push(
      `ability contrast policy must not own stale inline evidence: ${retiredEvidence}`
    );
  }
}
for (const required of [
  "chooses maximum contrast for %s",
  "classifies the real ability asset %s",
  '"url(/isekai/y/ab/5bf.png)"',
  '"/isekai/y/ab/7gf.png"',
  '"url(/isekai/y/ab/2rf.png)"',
  '"url(/isekai/y/ab/1pf.png)"',
  '"url(/isekai/y/ab/2ru.png)"',
  "uses the real parent background under transparent unlock asset %s",
  "uses the parent background under the colorless locked asset",
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
  'coverage: "partial"',
  "HvutAbilityPresentationCatalog",
  "HvutAbilityPresetCatalog",
  'required: "Better Immobilize"',
  'required: "Better MagNet"',
  'reason: "abilityCatalogIdentityMismatch"',
]) {
  if (!catalogText.includes(required)) {
    violations.push(`ability catalog authority must contain ${required}`);
  }
}
for (const required of [
  "file-size-gate: exempt data-table-HVUT能力展示与预设纯数据SOT",
  "export const HvutAbilityPresentationCatalog",
  "export const HvutAbilityPresetCatalog",
  '"HP Tank": { category: "General", img: "3.png", pos: 0 }',
  '"Current Set": Object.freeze([])',
]) {
  if (!presentationCatalogText.includes(required)) {
    violations.push(`ability presentation data authority must contain ${required}`);
  }
}
for (const required of [
  "hydrates every %s ability through the same requirement authority",
  "rejects an unknown world before exposing a partial page definition",
  "returns fresh mutable runtime state without exposing catalog authority",
]) {
  if (!catalogTestText.includes(required)) {
    violations.push(`ability catalog tests must cover ${required}`);
  }
}
for (const required of [
  "create_hvut_ability_page_definition('isekai', 'abilityCatalogCompose')",
  "create_hvut_ability_page_definition('persistent', 'abilityCatalogCompose')",
  "run_hvut_ability_page({ state: _ab, config: $config, player: _player, definition: abilityPageDefinition })",
]) {
  if (!text.includes(required))
    violations.push(`ability page composition must consume ${required}`);
}
if (text.includes("'HP Tank': { category:")) {
  violations.push("HVUT runtime must not own a duplicated ability presentation catalog");
}
if (/create_hvut_ability_page_definition\([^)]*,\s*\{/.test(text)) {
  violations.push("ability page callers must not assemble presentation fields");
}

if (violations.length) {
  console.error("[verify-hvut-ability-parse-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-ability-parse-boundary] OK - ability parse failures fail closed with evidence"
);
