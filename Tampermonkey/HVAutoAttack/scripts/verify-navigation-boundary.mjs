import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { stripComments } from "./lib/i18n-probe-lex.mjs";

const SRC_DIR = fileURLToPath(new URL("../src", import.meta.url));
const OWNER = "core/navigate.js";
const LEGACY_EXPORT_RE = /\bexport\s+function\s+(goto|scheduleReload|openUrl)\s*\(/;
const LEGACY_IMPORT_RE =
  /import\s*\{[^}]*\b(goto|scheduleReload|openUrl)\b[^}]*\}\s*from\s*["'][^"']*core\/navigate\.js["']/;

function collectJs(dir, base = "") {
  const out = [];
  for (const name of readdirSync(dir)) {
    const abs = `${dir}/${name}`;
    const rel = base ? `${base}/${name}` : name;
    if (statSync(abs).isDirectory()) out.push(...collectJs(abs, rel));
    else if (name.endsWith(".js")) out.push({ abs, rel });
  }
  return out;
}

const files = collectJs(SRC_DIR);
const owner = files.find((file) => file.rel === OWNER);
const violations = [];

if (!owner) {
  violations.push(`src/${OWNER} is missing`);
} else {
  const source = stripComments(readFileSync(owner.abs, "utf8"));
  if (!/\bexport\s+const\s+NavigationEvent\b/.test(source)) {
    violations.push("NavigationEvent must be the public navigation command vocabulary");
  }
  if (!/\bexport\s+function\s+runNavigationAutomation\s*\(/.test(source)) {
    violations.push("runNavigationAutomation(event) must be the only public navigation entry");
  }
  if (LEGACY_EXPORT_RE.test(source)) {
    violations.push("legacy navigation helpers must stay private: goto/scheduleReload/openUrl");
  }
  if (!source.includes("OPEN_WINDOW")) {
    violations.push("NavigationEvent must expose OPEN_WINDOW for named popup navigation");
  }
  for (const required of ["event.seconds", "event.minutes", "event.milliseconds"]) {
    if (!source.includes(required)) {
      violations.push(`NavigationEvent.SCHEDULE_RELOAD must normalize ${required}`);
    }
  }
  if (/\bevent\.sec\b/.test(source)) {
    violations.push(
      "legacy SCHEDULE_RELOAD sec field must stay deleted; use seconds/minutes/milliseconds"
    );
  }
}

for (const file of files) {
  if (file.rel === OWNER) continue;
  const source = stripComments(readFileSync(file.abs, "utf8"));
  if (LEGACY_IMPORT_RE.test(source)) {
    violations.push(`src/${file.rel} imports legacy navigation helper directly`);
  }
  if (/NavigationEvent\.SCHEDULE_RELOAD[\s\S]{0,120}\bsec\s*:/.test(source)) {
    violations.push(`src/${file.rel} uses legacy SCHEDULE_RELOAD sec field`);
  }
}

if (violations.length > 0) {
  console.error("[verify-navigation-boundary] FAIL");
  for (const violation of violations) console.error(`  - ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-navigation-boundary] OK — navigation effects route through runNavigationAutomation(event)"
);
