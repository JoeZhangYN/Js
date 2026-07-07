import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

for (const required of [
  "var create_hvut_armory_page_context = function (config, query) {",
  "var source = query || _query;",
  "var screen = source?.screen;",
  "var filter = source?.filter;",
  "var integrateAll = filter === 'all' && !!config?.settings?.equipmentIntegration;",
  "screen: screen,",
  "filter: filter,",
  "integrateAll: integrateAll,",
  "canOrganize: screen !== 'purchase' && filter !== 'salvaged',",
  "const armoryPage = create_hvut_armory_page_context($config);",
  "pageContext: armoryPage,",
  "$armory.page.init(null, $armory.pageContext.screen);",
  "const filter = $armory.pageContext.filter;",
  "create_hvut_armory_screen_url($armory.pageContext.screen, { filter: 'all' })",
  "if ($armory.pageContext.filter === 'all') {",
  "filter = $armory.pageContext.filter",
  "if (armoryPage.canOrganize) {",
  "if (armoryPage.screen === 'organize') {",
  "if (armoryPage.integrateAll) {",
  "if (armoryPage.screen === 'modify') {",
  "if (armoryPage.screen === 'purchase') {",
  "if (armoryPage.screen === 'sell') {",
  "if (armoryPage.screen === 'salvage') {",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must keep Armory page context boundary: ${required}`);
  }
}

const bindArmoryBody =
  /const bindArmory = function \(armory, ctx\) \{[\s\S]*?\n\};\n\nif \(IS_ISEKAI\)/.exec(text)?.[0] || "";

if (!bindArmoryBody) {
  violations.push(`${target} must keep bindArmory body visible for page context guard`);
}

for (const forbidden of [
  "$armory.page.init(null, _query.screen);",
  "let labels = $armory.type_labels[_query.filter];",
  "$armory.filters.includes(_query.filter)",
  "_query.filter === 'all'",
  "create_hvut_armory_screen_url(_query.screen, { filter: 'all' })",
  "filter = _query.filter",
  "_query.screen !== 'purchase' && _query.filter !== 'salvaged'",
  "_query.screen === 'organize'",
  "_query.screen === 'modify'",
  "_query.screen === 'purchase'",
  "_query.screen === 'sell'",
  "_query.screen === 'salvage'",
  "_query.filter === 'all' && $config.settings.equipmentIntegration",
]) {
  if (bindArmoryBody.includes(forbidden)) {
    violations.push(`${target} Armory must consume page context instead of raw query: ${forbidden}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-armory-page-context-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-armory-page-context-boundary] OK - Armory screen/filter routing uses one page context");
