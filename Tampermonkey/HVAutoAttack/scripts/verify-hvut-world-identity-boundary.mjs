import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

for (const required of [
  "var create_hvut_world_identity = function (context) {",
  "var create_hvut_config_segment_context = function (context) {",
  "var get_hvut_config_carry_keys = function (segment) {",
  "var get_hvut_config_namespace = function (segment) {",
  "var serverName = context?.serverName || (isIsekai ? 'isekai' : 'persistent');",
  "season: context?.season || parse_hvut_world_season(isIsekai, context?.seasonStage || 'worldSeason'),",
  "const namespace = get_hvut_config_namespace(segment);",
  "var segment = create_hvut_config_segment_context(context);",
  "const ls_list = get_hvut_config_carry_keys(segment);",
  "const HVUT_WORLD = create_hvut_world_identity({ isIsekai: IS_ISEKAI, seasonStage: 'serverSeason' });",
  "const _servername = HVUT_WORLD.serverName;",
  "name: HVUT_WORLD.serverName,",
  "season: HVUT_WORLD.season || '1',",
  "init: create_hvut_config_init_entry(settings, HVUT_WORLD),",
  "init: create_hvut_config_init_entry(settings, { ...HVUT_WORLD, assignSeason: true }),",
  "run_hvut_config_settings_migration($config, $price, HVUT_WORLD",
  "return migration.kind === 'accepted';",
  "inject_hvut_config_panel_style(HVUT_WORLD);",
  "render_hvut_config_panel($config, HVUT_WORLD);",
  "skipField: (o) => is_hvut_config_field_disabled(o, HVUT_WORLD)",
]) {
  if (!text.includes(required)) {
    violations.push(`${target} must keep HVUT world identity boundary: ${required}`);
  }
}

for (const forbidden of [
  "const _servername = location.pathname.includes('/isekai/') ? 'isekai' : 'persistent';",
  "config.season = parse_hvut_world_season(location.pathname.includes('/isekai/'), 'configSeason');",
  "season: parse_hvut_world_season(_servername === 'isekai', 'serverSeason') || '1',",
  "run_hvut_config_legacy_migration($config, $price, { isIsekai: IS_ISEKAI })",
  "if (run_hvut_config_legacy_migration($config, $price, HVUT_WORLD) === false) return false;",
  "const namespace = get_hvut_config_namespace(isIsekai);",
  "const ls_list = get_hvut_config_carry_keys(isIsekai);",
  "window.HVAA_hvutConfigMigration.namespace({ isIsekai: !!isIsekai })",
  "window.HVAA_hvutConfigMigration.carryKeys({ isIsekai: !!isIsekai })",
  "inject_hvut_config_panel_style({ isIsekai: IS_ISEKAI })",
  "render_hvut_config_panel($config, { isIsekai: IS_ISEKAI })",
  "is_hvut_config_field_disabled(o, { isIsekai: IS_ISEKAI, serverName: _server.name })",
]) {
  if (text.includes(forbidden)) {
    violations.push(`${target} must not rebuild HVUT world/config identity through old path: ${forbidden}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-world-identity-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-world-identity-boundary] OK - HVUT world identity feeds config segment context");
