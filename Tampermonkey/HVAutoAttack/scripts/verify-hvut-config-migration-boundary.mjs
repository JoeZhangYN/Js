import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const mainTarget = path.normalize("src/main.js");
const migrationTarget = path.normalize("src/i18n/hvut-config-migration.js");
const migrationBridgeTarget = path.normalize("src/i18n/hvut-config-migration-bridge.js");
const migrationTestTarget = path.normalize("src/i18n/hvut-config-migration.test.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const mainText = fs.readFileSync(path.join(root, mainTarget), "utf8");
const migrationText = fs.readFileSync(path.join(root, migrationTarget), "utf8");
const migrationBridgeText = fs.readFileSync(path.join(root, migrationBridgeTarget), "utf8");
const migrationTestText = fs.readFileSync(path.join(root, migrationTestTarget), "utf8");
const violations = [];

function requirePart(label, body, part) {
  if (!body.includes(part)) violations.push(`${target} ${label} must include ${part}`);
}

const initBodies = [...text.matchAll(/init: function \(\) \{[\s\S]*?\n  \},\n  migration:/g)].map(
  (match) => match[0]
);
const migrationBodies = [...text.matchAll(/migration: function \(\) \{[\s\S]*?\n  \},\n  \/\/ reset\/get\/set\/del\/ls_get\/ls_set\/ls_del/g)].map(
  (match) => match[0]
);

if (initBodies.length !== 2) violations.push(`${target} must keep both config init entries visible`);
if (migrationBodies.length !== 2) violations.push(`${target} must keep both config migration entries visible`);

for (const [index, body] of initBodies.entries()) {
  for (const part of [
    "const namespace = get_hvut_config_namespace(IS_ISEKAI);",
    "if (!namespace) {",
    "$config.ns = namespace;",
    "$config.prefix = $config.ns + '_';",
    "if ($config.migration() === false) {",
    "alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');",
    "return false;",
    "return true;",
  ]) {
    requirePart(`config init[${index}]`, body, part);
  }
  if (/\$config\.migration\(\);\n\s*\}/.test(body)) {
    violations.push(`${target} config init[${index}] must not ignore migration result`);
  }
  if (body.includes("$config.season") && !body.includes("$config.season = parse_hvut_world_season(location.pathname.includes('/isekai/'), 'configSeason');")) {
    violations.push(`${target} config init[${index}] must parse season through parse_hvut_world_season`);
  }
  if (/world_text[^;\n]+match\([^;\n]+\)\[1\]/.test(body)) {
    violations.push(`${target} config init[${index}] must not parse world_text season directly`);
  }
}

for (const required of [
  "var record_hvut_config_parse_failure = function (stage, detail) {",
  "sessionStorage.setItem('HVAA:lastHvutConfigParseFailure', JSON.stringify(evidence));",
  "var parse_hvut_world_season = function (isIsekai, stage) {",
  "var get_hvut_config_carry_keys = function (isIsekai) {",
  "var get_hvut_config_namespace = function (isIsekai) {",
  "var normalize_hvut_config_settings = function (settings, defaults) {",
  "var migrate_hvut_monster_lab_log = function (mlLog) {",
  "window.HVAA_hvutConfigMigration.namespace({ isIsekai: !!isIsekai })",
  "window.HVAA_hvutConfigMigration.normalizeSettings(settings, defaults)",
  "window.HVAA_hvutConfigMigration.migrateMonsterLabLog(mlLog)",
  "record_hvut_config_parse_failure('configNamespaceBridgeMissing'",
  "record_hvut_config_parse_failure('configSettingsBridgeMissing'",
  "record_hvut_config_parse_failure('configMonsterLabLogBridgeMissing'",
  "window.HVAA_hvutConfigMigration.carryKeys({ isIsekai: !!isIsekai })",
  "record_hvut_config_parse_failure('configCarryKeysBridgeMissing'",
  "if (!isIsekai) return false;",
  "return match ? match[1] : (record_hvut_config_parse_failure(stage, { text: text }), '1');",
  "season: parse_hvut_world_season(_servername === 'isekai', 'serverSeason') || '1',",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must keep HVUT world season parse boundary: ${required}`);
  }
}

for (const [index, body] of migrationBodies.entries()) {
  for (const part of [
    "if (!$config.set('equipdata', equipdata)) return false;",
    "const migrated_ml_log = migrate_hvut_monster_lab_log(ml_log);",
    "if (migrated_ml_log) {",
    "if (!$config.set('ml_log', migrated_ml_log)) return false;",
    "if (!$config.ls_del('ml_log')) return false;",
    "const ls_list = get_hvut_config_carry_keys(IS_ISEKAI);",
    "if (!ls_list) return false;",
    "for (const key of ls_list) {",
    "if (!$config.set(key, value)) return false;",
    "if (!$config.ls_del(key.slice($config.prefix.length))) return false;",
    "const normalizedSettings = normalize_hvut_config_settings($config.settings, $config.default);",
    "if (!normalizedSettings) return false;",
    "$config.settings = normalizedSettings;",
    "if ($config.save() === false) return false;",
    "return true;",
  ]) {
    requirePart(`config migration[${index}]`, body, part);
  }
}

for (const forbidden of [
  "$config.set('equipdata', equipdata);",
  "$config.set('ml_log', ml_log);\n        $config.ls_del('ml_log');",
  "ls_list.forEach((key) =>",
  "$config.set(key, value);",
  "localStorage.removeItem(key);",
  "$config.save();",
  "const ls_list = ['equipset', 'ch_style', 'se_settings', 'ss_log', 'ml_log'];",
  "const ls_list = ['equipnames', 'equipset', 'ch_style', 'se_settings', 'ss_log', 'ml_log'];",
  "$config.ns = !IS_ISEKAI ? 'hvut' : 'hvuti';",
  "$config.ns = IS_ISEKAI ? 'hvuti' : 'hvut';",
  "const equipcode = $config.settings.equipCode;",
  "$config.settings.equipCode = JSON.parse(JSON.stringify($config.default.equipCode));",
  "Object.keys($config.settings).forEach((key) => {",
  "Object.entries($config.default).forEach(([key, value]) => {",
  "log.pa = log.pa.map((e) => [e.value, e.to]);",
  "log.er = log.er.map((e) => [e.value, e.to]);",
  "log.ct = log.ct.map((e) => [e.value, e.to, e.max]);",
  "log.gifts = log.gift;",
  "log.gifts.push(...log.gifts.splice(28, 6, ...log.gifts.splice(40, 5)));",
]) {
  if (migrationBodies.some((body) => body.includes(forbidden))) {
    violations.push(`${target} config migration must not keep unchecked path: ${forbidden}`);
  }
}

for (const required of [
  "const COMMON_CARRY_KEYS = Object.freeze([\"equipset\", \"ch_style\", \"se_settings\", \"ss_log\", \"ml_log\"]);",
  "const PERSISTENT_CARRY_KEYS = Object.freeze([\"equipnames\", ...COMMON_CARRY_KEYS]);",
  "export function getHvutConfigNamespace(segment) {",
  "return segment?.isIsekai ? \"hvuti\" : \"hvut\";",
  "export function getHvutConfigCarryKeys(segment) {",
  "return segment?.isIsekai ? [...COMMON_CARRY_KEYS] : [...PERSISTENT_CARRY_KEYS];",
  "export function migrateLegacyHvutMonsterLabLog(mlLog) {",
  "if (!mlLog || mlLog[0]) return null;",
  "migrated[0] = { version: 1 };",
  "log.gifts.push(...log.gifts.splice(28, 6, ...log.gifts.splice(40, 5)));",
  "export function normalizeHvutConfigSettings(settings, defaults) {",
  "normalized.equipCode = cloneConfigValue(defaultSettings.equipCode);",
  "delete normalized[key];",
  "normalized[key] = cloneConfigValue(value);",
]) {
  if (!migrationText.includes(required)) {
    violations.push(`${migrationTarget} must own HVUT config carry key segmentation with ${required}`);
  }
}

for (const required of [
  "getHvutConfigCarryKeys",
  "getHvutConfigNamespace",
  "migrateLegacyHvutMonsterLabLog",
  "normalizeHvutConfigSettings",
  "from \"./hvut-config-migration.js\";",
  "window.HVAA_hvutConfigMigration = Object.freeze({",
  "carryKeys: getHvutConfigCarryKeys",
  "migrateMonsterLabLog: migrateLegacyHvutMonsterLabLog",
  "namespace: getHvutConfigNamespace",
  "normalizeSettings: normalizeHvutConfigSettings",
]) {
  if (!migrationBridgeText.includes(required)) {
    violations.push(`${migrationBridgeTarget} must expose HVUT config migration bridge with ${required}`);
  }
}

if (!mainText.includes("import \"./i18n/hvut-config-migration-bridge.js\";")) {
  violations.push(`${mainTarget} must load HVUT config migration bridge before hv-utils`);
}

if (
  !migrationTestText.includes("selects the storage namespace from segment identity") ||
  !migrationTestText.includes("keeps persistent-only legacy equipment names") ||
  !migrationTestText.includes("does not carry persistent-only legacy equipment names") ||
  !migrationTestText.includes("upgrades legacy equipCode string and aligns settings with defaults") ||
  !migrationTestText.includes("migrates legacy Monster Lab logs without mutating the original")
) {
  violations.push(`${migrationTestTarget} must cover persistent and Isekai carry key segmentation`);
}

if (violations.length) {
  console.error("[verify-hvut-config-migration-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-config-migration-boundary] OK - config migration failures fail closed");
