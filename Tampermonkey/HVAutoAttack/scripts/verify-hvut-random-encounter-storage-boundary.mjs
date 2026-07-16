import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.normalize("src/i18n/hv-utils.js");
const text = fs.readFileSync(path.join(root, target), "utf8");
const keysText = fs.readFileSync(path.join(root, "src/core/diagnostic-evidence-keys.js"), "utf8");
const violations = [];

function body(pattern, label) {
  const match = pattern.exec(text);
  if (!match) violations.push(`${target} must keep ${label} visible`);
  return match?.[0] || "";
}

function requireParts(label, value, parts) {
  for (const part of parts) {
    if (!value.includes(part)) violations.push(`${target} ${label} must include ${part}`);
  }
}

const bindRe = body(
  /const bindRe = function \(re, ctx\) \{[\s\S]*?\n\};\n\n\/\/ \$price/,
  "bindRe"
);
const encounterBridge = body(
  /const run_hvut_encounter_bridge = function \(eventName, event\) \{[\s\S]*?\n  \};\n  const applyEncounterState/,
  "run_hvut_encounter_bridge"
);
const applyState = body(
  /const applyEncounterState = function \(outcome\) \{[\s\S]*?\n  \};\n  re\.init/,
  "applyEncounterState"
);
const init = body(/re\.init = function \(\) \{[\s\S]*?\n  \};\n  re\.clock/, "re.init");
const clock = body(/re\.clock = function \(button\) \{[\s\S]*?\n  \};\n  re\.hv/, "re.clock");
const hv = body(/re\.hv = function \(\) \{[\s\S]*?\n  \};\n  re\.ba/, "re.hv");
const ba = body(/re\.ba = function \(\) \{[\s\S]*?\n  \};\n  re\.eh/, "re.ba");
const eh = body(/re\.eh = function \(\) \{[\s\S]*?\n  \};\n  re\.get/, "re.eh");
const refresh = body(/re\.refresh = function \(\) \{[\s\S]*?\n  \};\n  re\.run/, "re.refresh");
const run = body(/re\.run = async function \(\) \{[\s\S]*?\n  \};\n  re\.load/, "re.run");
const load = body(/re\.load = async function \(href\) \{[\s\S]*?\n  \};\n  re\.start/, "re.load");

requireParts("applyEncounterState", applyState, [
  "if (!ctx.config.set('re', outcome.state, 'hvut_')) {",
  "show_hvut_generic_error();",
  "return false;",
  "re.json = outcome.state;",
  "return true;",
]);

requireParts("run_hvut_encounter_bridge", encounterBridge, [
  "const bridge = typeof window !== 'undefined' ? window.HVAA_encounter : undefined",
  "const type = bridge?.Event?.[eventName]",
  "record_hvut_random_encounter_failure('widgetEncounterBridgeMissing', { eventName })",
  "return bridge.run({ ...event, type })",
  "record_hvut_random_encounter_failure('widgetEncounterBridgeFailed'",
  "return undefined",
]);

requireParts("re.init", init, ["ctx.hvPageType", "return re.get();"]);
if (/\bisIsekai\b|\bIS_ISEKAI\b/.test(bindRe)) {
  violations.push(
    `${target} bindRe must not forward world identity through invariant widget events`
  );
}
requireParts("re.clock", clock, [
  "if (re.init() === false) return false;",
  "re.button.addEventListener('click', () => { re.run(); });",
  "re.start();",
  "return true;",
]);
requireParts("re.hv", hv, ["if (re.init() === false) return false;", "return re.clock(button);"]);
requireParts("re.ba", ba, [
  "if (re.init() === false) return false;",
  "if (re.check() === false) return false;",
  "if (re.clock(button) === false) return false;",
  "if (!button.isConnected && $id('csp')) {",
]);
requireParts("re.eh", eh, [
  "if (re.init() === false) return false;",
  "const linkState = run_hvut_encounter_bridge('WIDGET_LINK_FOUND', { state: re.json, search: onclick });",
  "if (applyEncounterState(linkState) === false) return false;",
  "return re.clock(button);",
  "return true;",
]);
requireParts("re.run", run, [
  "html = await $ajax.fetch('https://hentaiverse.org/');",
  "record_hvut_random_encounter_failure('widgetHvAvailabilityFetch'",
  "run_hvut_encounter_bridge('WIDGET_GENERATION_FAILED'",
  "if (applyEncounterState(outcome) === false) return false;",
  "checkMode: 'manual'",
  "re.start();",
  "return false;",
  "hvAvailable: true",
]);
requireParts("re.load", load, [
  "if (re.get() === false) return false;",
  "$ajax.fetch(href || 'https://e-hentai.org/news.php')",
  "record_hvut_random_encounter_failure('widgetNewsLoadFetch'",
  "run_hvut_encounter_bridge('WIDGET_GENERATION_FAILED'",
  "re.start();",
  "return false;",
  "if (applyEncounterState(outcome) === false) return false;",
  "eventpanePresent: Boolean(eventpaneNode)",
  "checkMode: 'manual'",
  "return true;",
]);

requireParts("re.refresh", refresh, [
  "const readiness = re.get();",
  "readiness.recoveryStatus === 'countdown'",
  "play_beep(...ctx.config.settings.reBeep);",
]);
for (const forbidden of ["WIDGET_TIMER_ELAPSED", "re.load(", "re.run("]) {
  if (refresh.includes(forbidden)) {
    violations.push(`${target} re.refresh must stay projection-only: ${forbidden}`);
  }
}

requireParts("bindRe encounter bridge calls", bindRe, [
  "run_hvut_encounter_bridge('WIDGET_TICK', { state: re.json })",
  "run_hvut_encounter_bridge('WIDGET_LINK_FOUND', { state: re.json, key })",
  "run_hvut_encounter_bridge('WIDGET_RESET_DAY')",
  "run_hvut_encounter_bridge('WIDGET_STARTED_ENCOUNTER', { state: re.json, search: location.search, pageType: re.type })",
  "run_hvut_encounter_bridge('WIDGET_CLICKED'",
  "run_hvut_encounter_bridge('WIDGET_NEWS_LOADED'",
  "run_hvut_encounter_bridge('WIDGET_GENERATION_FAILED'",
]);
if (bindRe.includes("WIDGET_TIMER_ELAPSED")) {
  violations.push(`${target} must not restore widget timer expiry as an automatic entry`);
}

requireParts("random encounter failure recorder", text, [
  "var record_hvut_random_encounter_failure = function (stage, detail) {",
  "capability: 'hvutRandomEncounter'",
  "sessionStorage.setItem('HVAA:lastHvutRandomEncounterFailure'",
]);

requireParts("diagnostic evidence keys", keysText, [
  'HVUT_RANDOM_ENCOUNTER_FAILURE: "HVAA:lastHvutRandomEncounterFailure"',
  'source("hvutRandomEncounterFailure", DiagnosticEvidenceKey.HVUT_RANDOM_ENCOUNTER_FAILURE)',
]);

for (const forbidden of [
  "re.json = outcome.state;\n    ctx.config.set('re', re.json, 'hvut_');",
  "ctx.config.set('re', re.json, 'hvut_');",
  "ctx.config.set('re', outcome.state, 'hvut_');\n    re.json = outcome.state;",
  "re.check();",
  "re.get();\n    re.button.textContent = '加载中...';",
  "re.button.textContent = '检查中...';\n      const html = await $ajax.fetch('https://hentaiverse.org/');",
  "button.parentNode.parentNode",
  "const encounterEvent = () => window.HVAA_encounter?.Event || {};",
  "const runEncounter = (event) => window.HVAA_encounter?.run(event);",
  "encounterEvent().",
  "runEncounter({",
]) {
  if (bindRe.includes(forbidden)) {
    violations.push(
      `${target} bindRe must not ignore random encounter state persistence: ${forbidden}`
    );
  }
}

if (violations.length) {
  console.error("[verify-hvut-random-encounter-storage-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-hvut-random-encounter-storage-boundary] OK - random encounter state failures fail closed"
);
