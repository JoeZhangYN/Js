import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const violations = [];

function requireIncludes(body, label, parts) {
  for (const part of parts) {
    if (!body.includes(part)) violations.push(`${target} ${label} must include ${part}`);
  }
}

requireIncludes(text, "config storage failure recorder", [
  "record_hvut_config_storage_failure",
  "capability: 'hvutConfigStorage'",
  "sessionStorage.setItem('HVAA:lastHvutConfigStorageFailure'",
  "HVUT config storage fallback must not depend on diagnostic storage.",
  "console.warn('[HVAA] HVUT config storage failed', evidence)",
  "show_hvut_config_storage_failure_report",
  "show_hvut_failure_report('Config storage failed', evidence)",
]);

const setMatch = /config\.set = function \(key, value[\s\S]*?\n  \};\n  config\.del/.exec(text);
const getMatch = /config\.get = function \(key[\s\S]*?\n  \};\n  config\.set/.exec(text);
const delMatch = /config\.del = function \(key[\s\S]*?\n  \};\n  config\.ls_get/.exec(text);
const lsGetMatch = /config\.ls_get = function \(key[\s\S]*?\n  \};\n  config\.ls_set/.exec(text);
const lsSetMatch = /config\.ls_set = function \(key[\s\S]*?\n  \};\n  config\.ls_del/.exec(text);
const lsDelMatch = /config\.ls_del = function \(key[\s\S]*?\n  \};\n  config\.open/.exec(text);
const saveMatch = /config\.save = function \(panel\) \{[\s\S]*?\n  \};\n  config\.text2obj/.exec(
  text
);

if (!getMatch) violations.push(`${target} config.get entry must stay visible`);
else {
  requireIncludes(getMatch[0], "config.get", [
    "try {",
    "return GM_getValue(prefix + key, dvalue);",
    "record_hvut_config_storage_failure('get'",
    "return dvalue;",
  ]);
}

if (!setMatch) violations.push(`${target} config.set entry must stay visible`);
else {
  requireIncludes(setMatch[0], "config.set", [
    "try {",
    "GM_setValue(prefix + key, value);",
    "return true;",
    "record_hvut_config_storage_failure('set'",
    "return false;",
  ]);
}

if (!delMatch) violations.push(`${target} config.del entry must stay visible`);
else {
  requireIncludes(delMatch[0], "config.del", [
    "try {",
    "GM_deleteValue(prefix + key);",
    "return true;",
    "record_hvut_config_storage_failure('delete'",
    "return false;",
  ]);
}

if (!lsGetMatch) violations.push(`${target} config.ls_get entry must stay visible`);
else {
  requireIncludes(lsGetMatch[0], "config.ls_get", [
    "try {",
    "localStorage.getItem(prefix + key)",
    "return value === null ? dvalue : JSON.parse(value);",
    "record_hvut_config_storage_failure('localStorageGet'",
    "return dvalue;",
  ]);
}

if (!lsSetMatch) violations.push(`${target} config.ls_set entry must stay visible`);
else {
  requireIncludes(lsSetMatch[0], "config.ls_set", [
    "try {",
    "localStorage.setItem(prefix + key, JSON.stringify(value));",
    "return true;",
    "record_hvut_config_storage_failure('localStorageSet'",
    "return false;",
  ]);
}

if (!lsDelMatch) violations.push(`${target} config.ls_del entry must stay visible`);
else {
  requireIncludes(lsDelMatch[0], "config.ls_del", [
    "try {",
    "localStorage.removeItem(prefix + key);",
    "return true;",
    "record_hvut_config_storage_failure('localStorageDelete'",
    "return false;",
  ]);
}

if (!saveMatch) violations.push(`${target} config.save entry must stay visible`);
else {
  requireIncludes(saveMatch[0], "config.save", [
    "if (!config.set('settings', config.settings)) {",
    "show_hvut_config_storage_failure_report('settingsSave'",
    "return false;",
    "reloadCurrentPage(hvutReloadReason('HV_UTILS_CONFIG_SAVE'))",
    "return true;",
  ]);
  if (/config\.set\('settings', config\.settings\);\n\s*if \(panel\)/.test(saveMatch[0])) {
    violations.push(`${target} config.save must not reload after unchecked settings write`);
  }
}

for (const [label, reason] of [
  ["mail log reset", "HV_UTILS_MAIL_LOG_RESET"],
  ["monster lab log reset", "HV_UTILS_MONSTER_LAB_LOG_RESET"],
  ["monster lab force update", "HV_UTILS_MONSTER_LAB_FORCE_UPDATE"],
]) {
  const index = text.indexOf(`hvutReloadReason('${reason}')`);
  const body = index >= 0 ? text.slice(Math.max(0, index - 260), index + 80) : "";
  if (!body) {
    violations.push(`${target} ${label} reload path must stay visible`);
  } else {
    requireIncludes(body, label, ["show_hvut_config_storage_failure_report", "return false;"]);
  }
}

for (const [label, stage] of [
  ["shrine log save", "shrineLogSave"],
  ["legacy shrine log save", "legacyShrineLogSave"],
  ["lottery notification toggle", "lotteryNotificationToggle"],
]) {
  if (!text.includes(`show_hvut_config_storage_failure_report('${stage}'`)) {
    violations.push(`${target} ${label} storage failure must show copyable diagnostics`);
  }
}

if (violations.length) {
  console.error("[verify-hvut-config-storage-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-config-storage-boundary] OK - HVUT config storage failures fail closed before reload"
);
