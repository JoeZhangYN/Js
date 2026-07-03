import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
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
    "if (!$config.set('ml_log', ml_log)) return false;",
    "if (!$config.ls_del('ml_log')) return false;",
    "for (const key of ls_list) {",
    "if (!$config.set(key, value)) return false;",
    "if (!$config.ls_del(key.slice($config.prefix.length))) return false;",
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
]) {
  if (migrationBodies.some((body) => body.includes(forbidden))) {
    violations.push(`${target} config migration must not keep unchecked path: ${forbidden}`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-config-migration-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("[verify-hvut-config-migration-boundary] OK - config migration failures fail closed");
