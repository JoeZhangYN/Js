import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { stripComments } from "./lib/i18n-probe-lex.mjs";

const SRC_DIR = fileURLToPath(new URL("../src", import.meta.url));
const OWNER = "core/time.js";
const OWNER_TEST = "core/time.test.js";
const LEGACY_IMPORT_RE = /import\s*\{[^}]*\btime\b[^}]*\}\s*from\s*["'][^"']*core\/time\.js["']/;
const LEGACY_CALL_RE = /\btime\s*\(\s*[0-3]\b/;

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
const violations = [];
const owner = files.find((file) => file.rel === OWNER);

if (!owner) {
  violations.push(`src/${OWNER} is missing`);
} else {
  const source = stripComments(readFileSync(owner.abs, "utf8"));
  if (!/\bexport\s+const\s+TimeEvent\b/.test(source)) {
    violations.push("TimeEvent must be the public time vocabulary");
  }
  if (!/\bexport\s+function\s+runTimeAutomation\s*\(/.test(source)) {
    violations.push("runTimeAutomation(event) must be the public time entry");
  }
  if (/\bexport\s+function\s+time\s*\(/.test(source)) {
    violations.push("legacy time(e) export is forbidden");
  }
  for (const required of ["LOCAL_FILE_TIMESTAMP", "ISO_TIMESTAMP", "MS_UNTIL_NEXT_UTC_DAY"]) {
    if (!source.includes(required)) {
      violations.push(`TimeEvent must expose ${required}`);
    }
  }
}

for (const file of files) {
  if (file.rel === OWNER || file.rel === OWNER_TEST) continue;
  const source = stripComments(readFileSync(file.abs, "utf8"));
  if (LEGACY_IMPORT_RE.test(source)) {
    violations.push(`src/${file.rel} imports legacy time(e) helper`);
  }
  if (LEGACY_CALL_RE.test(source)) {
    violations.push(`src/${file.rel} uses legacy time(0/1/2/3) numeric mode`);
  }
}

if (violations.length > 0) {
  console.error("[verify-time-boundary] FAIL");
  for (const violation of violations) console.error(`  - ${violation}`);
  process.exit(1);
}

console.log("[verify-time-boundary] OK — time semantics route through runTimeAutomation(event)");
