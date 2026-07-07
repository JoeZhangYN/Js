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

const migrationBodies = [...text.matchAll(/migration: function \(\) \{[\s\S]*?\n  \},\n  \/\/ reset\/get\/set\/del\/ls_get\/ls_set\/ls_del/g)].map(
  (match) => match[0]
);

if (migrationBodies.length !== 2) violations.push(`${target} must keep both config migration entries visible`);

for (const required of [
  "var create_hvut_config_init_entry = function (defaultSettings, context) {",
  "return run_hvut_config_init(this, defaultSettings, context);",
  "init: create_hvut_config_init_entry(settings, HVUT_WORLD),",
  "init: create_hvut_config_init_entry(settings, { ...HVUT_WORLD, assignSeason: true }),",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must keep config init behind shared segment entry: ${required}`);
  }
}

for (const forbidden of [
  "init: function () {\n    return run_hvut_config_init($config, settings, { isIsekai: IS_ISEKAI });\n  },",
  "init: function () {\n    return run_hvut_config_init($config, settings, { assignSeason: true, isIsekai: IS_ISEKAI });\n  },",
]) {
  if (text.includes(forbidden)) {
    violations.push(`${target} must not keep parallel config init function body: ${forbidden}`);
  }
}

for (const required of [
  "var record_hvut_config_parse_failure = function (stage, detail) {",
  "sessionStorage.setItem('HVAA:lastHvutConfigParseFailure', JSON.stringify(evidence));",
  "var parse_hvut_world_season = function (isIsekai, stage) {",
  "var create_hvut_world_identity = function (context) {",
  "var create_hvut_config_segment_context = function (context) {",
  "var run_hvut_config_init = function (config, defaultSettings, context) {",
  "var create_hvut_config_init_entry = function (defaultSettings, context) {",
  "var segment = create_hvut_config_segment_context(context);",
  "if (segment.assignSeason) {",
  "config.season = segment.season;",
  "const namespace = get_hvut_config_namespace(isIsekai);",
  "config.prefix = config.ns + '_';",
  "config.settings = config.get('settings', {});",
  "if (config.settings.version !== config.version) {",
  "if (config.migration() === false) {",
  "alert(isIsekai ? 'An error has occurred.' : '发生了一个错误.');",
  "var get_hvut_config_carry_keys = function (isIsekai) {",
  "var get_hvut_config_namespace = function (isIsekai) {",
  "var build_hvut_legacy_equipdata = function (inEquipdata, inJson) {",
  "var normalize_hvut_legacy_equip_code = function (equipCode) {",
  "var normalize_hvut_config_settings = function (settings, defaults) {",
  "var migrate_hvut_monster_lab_log = function (mlLog) {",
  "var normalize_hvut_legacy_prices = function (prices) {",
  "window.HVAA_hvutConfigMigration.namespace({ isIsekai: !!isIsekai })",
  "window.HVAA_hvutConfigMigration.buildEquipData(inEquipdata, inJson)",
  "window.HVAA_hvutConfigMigration.normalizeEquipCode(equipCode)",
  "window.HVAA_hvutConfigMigration.normalizeSettings(settings, defaults)",
  "window.HVAA_hvutConfigMigration.migrateMonsterLabLog(mlLog)",
  "window.HVAA_hvutConfigMigration.normalizePrices(prices)",
  "record_hvut_config_parse_failure('configNamespaceBridgeMissing'",
  "record_hvut_config_parse_failure('configEquipDataBridgeMissing'",
  "record_hvut_config_parse_failure('configEquipCodeBridgeMissing'",
  "record_hvut_config_parse_failure('configSettingsBridgeMissing'",
  "record_hvut_config_parse_failure('configMonsterLabLogBridgeMissing'",
  "record_hvut_config_parse_failure('configPricesBridgeMissing'",
  "window.HVAA_hvutConfigMigration.carryKeys({ isIsekai: !!isIsekai })",
  "record_hvut_config_parse_failure('configCarryKeysBridgeMissing'",
  "if (!isIsekai) return false;",
  "return match ? match[1] : (record_hvut_config_parse_failure(stage, { text: text }), '1');",
  "const HVUT_WORLD = create_hvut_world_identity({ isIsekai: IS_ISEKAI, seasonStage: 'serverSeason' });",
  "const _servername = HVUT_WORLD.serverName;",
  "season: HVUT_WORLD.season || '1',",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must keep HVUT world season parse boundary: ${required}`);
  }
}

for (const [index, body] of migrationBodies.entries()) {
  for (const part of [
    "if (run_hvut_config_legacy_migration($config, $price, HVUT_WORLD) === false) return false;",
    "const normalizedSettings = normalize_hvut_config_settings($config.settings, $config.default);",
    "if (!normalizedSettings) return false;",
    "$config.settings = normalizedSettings;",
    "if ($config.save() === false) return false;",
    "return true;",
  ]) {
    requirePart(`config migration[${index}]`, body, part);
  }
  for (const forbidden of [
    "const in_equipdata = $config.ls_get('in_equipdata');",
    "const in_json = $config.ls_get('in_json');",
    "const prices = $config.ls_get('prices');",
    "const ml_log = $config.ls_get('ml_log');",
    "const ls_list = get_hvut_config_carry_keys(IS_ISEKAI);",
    "for (let i = localStorage.length - 1; i >= 0; i--)",
  ]) {
    if (body.includes(forbidden)) {
      violations.push(`${target} config migration[${index}] must delegate legacy carry flow: ${forbidden}`);
    }
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
  "Object.entries(prices).forEach(([key, value]) => {",
  "Object.assign(prices, value);",
  "delete prices[key];",
  "const equipdata = { version: 1 };",
  "Object.assign(equipdata, in_equipdata, in_json);",
  "in_equipcode.replace(/(\\{\\$\\w+):/g, '$1?').replace(/\\$bbcode/g, '$namecode')",
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
  "var run_hvut_config_legacy_migration = function (config, price, context) {",
  "if (config.settings.version) return true;",
  "config.reset();",
  "const in_equipdata = config.ls_get('in_equipdata');",
  "const in_json = config.ls_get('in_json');",
  "const equipdata = build_hvut_legacy_equipdata(in_equipdata, in_json);",
  "if (!config.set('equipdata', equipdata)) return false;",
  "const equipCode = normalize_hvut_legacy_equip_code(in_equipcode);",
  "config.settings.equipCode = equipCode;",
  "const normalizedPrices = normalize_hvut_legacy_prices(prices);",
  "price.set(normalizedPrices);",
  "const migrated_ml_log = migrate_hvut_monster_lab_log(ml_log);",
  "if (!config.set('ml_log', migrated_ml_log)) return false;",
  "if (!config.ls_del('ml_log')) return false;",
  "const ls_list = get_hvut_config_carry_keys(isIsekai);",
  "if (!ls_list) return false;",
  "for (const key of ls_list) {",
  "if (!config.set(key, value)) return false;",
  "if (!config.ls_del(key.slice(config.prefix.length))) return false;",
  "return true;",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must keep shared legacy config migration step: ${required}`);
  }
}

for (const required of [
  "const COMMON_CARRY_KEYS = Object.freeze([\"equipset\", \"ch_style\", \"se_settings\", \"ss_log\", \"ml_log\"]);",
  "const PERSISTENT_CARRY_KEYS = Object.freeze([\"equipnames\", ...COMMON_CARRY_KEYS]);",
  "export function getHvutConfigNamespace(segment) {",
  "return segment?.isIsekai ? \"hvuti\" : \"hvut\";",
  "export function getHvutConfigCarryKeys(segment) {",
  "return segment?.isIsekai ? [...COMMON_CARRY_KEYS] : [...PERSISTENT_CARRY_KEYS];",
  "export function buildLegacyHvutEquipData(inEquipdata, inJson) {",
  "return { version: 1, ...(inEquipdata || {}), ...(inJson || {}) };",
  "export function normalizeLegacyHvutEquipCode(equipCode) {",
  "return equipCode.replace(/(\\{\\$\\w+):/g, \"$1?\").replace(/\\$bbcode/g, \"$namecode\");",
  "export function migrateLegacyHvutMonsterLabLog(mlLog) {",
  "if (!mlLog || mlLog[0]) return null;",
  "migrated[0] = { version: 1 };",
  "log.gifts.push(...log.gifts.splice(28, 6, ...log.gifts.splice(40, 5)));",
  "export function normalizeLegacyHvutPrices(prices) {",
  "if (!prices) return null;",
  "Object.assign(normalized, value);",
  "delete normalized[key];",
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
  "buildLegacyHvutEquipData",
  "getHvutConfigCarryKeys",
  "getHvutConfigNamespace",
  "migrateLegacyHvutMonsterLabLog",
  "normalizeLegacyHvutEquipCode",
  "normalizeLegacyHvutPrices",
  "normalizeHvutConfigSettings",
  "from \"./hvut-config-migration.js\";",
  "window.HVAA_hvutConfigMigration = Object.freeze({",
  "buildEquipData: buildLegacyHvutEquipData",
  "carryKeys: getHvutConfigCarryKeys",
  "migrateMonsterLabLog: migrateLegacyHvutMonsterLabLog",
  "namespace: getHvutConfigNamespace",
  "normalizeEquipCode: normalizeLegacyHvutEquipCode",
  "normalizePrices: normalizeLegacyHvutPrices",
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
  !migrationTestText.includes("builds legacy equipment data from split old stores") ||
  !migrationTestText.includes("normalizes legacy equipment code templates") ||
  !migrationTestText.includes("upgrades legacy equipCode string and aligns settings with defaults") ||
  !migrationTestText.includes("migrates legacy Monster Lab logs without mutating the original") ||
  !migrationTestText.includes("flattens legacy nested price groups without mutating the original")
) {
  violations.push(`${migrationTestTarget} must cover persistent and Isekai carry key segmentation`);
}

if (violations.length) {
  console.error("[verify-hvut-config-migration-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-config-migration-boundary] OK - config migration failures fail closed");
