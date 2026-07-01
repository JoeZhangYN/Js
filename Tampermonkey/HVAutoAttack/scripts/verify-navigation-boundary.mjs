import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { stripComments } from "./lib/i18n-probe-lex.mjs";

const SRC_DIR = fileURLToPath(new URL("../src", import.meta.url));
const OWNER = "core/navigate.js";
const RAW_NAVIGATION_EXEMPT = new Set([
  "core/navigate.js",
  "battle/battle-api-bridge.js",
]);
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
  if (!/\bexport\s+const\s+NavigationReloadReason\b/.test(source)) {
    violations.push("NavigationReloadReason must be the public reload reason vocabulary");
  }
  if (!/\bexport\s+const\s+NavigationRedirectReason\b/.test(source)) {
    violations.push("NavigationRedirectReason must be the public redirect reason vocabulary");
  }
  if (!source.includes("isReloadReasonAllowed")) {
    violations.push("reloadNow/scheduleReload must validate an allowed reload reason");
  }
  if (!source.includes("isRedirectReasonAllowed")) {
    violations.push("openUrl must validate an allowed redirect reason");
  }
  const auditSource = files.find((file) => file.rel === "core/navigation-audit.js");
  if (!auditSource) {
    violations.push("core/navigation-audit.js is missing");
  } else {
    const auditText = stripComments(readFileSync(auditSource.abs, "utf8"));
    if (!source.includes("writeNavigationAudit")) {
      violations.push("navigation execution must record an audit before navigating");
    }
    if (!auditText.includes("sessionStorage.setItem") || !auditText.includes("reportPreviousNavigationAudit")) {
      violations.push("navigation audit must persist and replay across page reloads");
    }
    if (!auditText.includes("recordExternalUnload") || !auditText.includes("outsideNavigationEntry")) {
      violations.push("navigation audit must record unloads that bypass the navigation entry");
    }
    if (!auditText.includes('console.warn(`[HVAA] ${kind}`')) {
      violations.push("navigation audit must warn before navigating");
    }
    if (!auditText.includes("lastAction: readJson(NAVIGATION_CONTEXT_KEY)")) {
      violations.push("navigation audit must include the last recorded action context");
    }
    if (!/\bexport\s+function\s+recordNavigationContext\b/.test(auditText)) {
      violations.push("navigation audit must expose recordNavigationContext");
    }
  }
  if (!/Number\.isFinite\(delayMs\)\s*&&\s*delayMs\s*>\s*0/.test(source)) {
    violations.push("scheduled reload delay must be finite and positive");
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
  if (!source.includes("const navigationEventHandlers")) {
    violations.push("runNavigationAutomation(event) must route through navigationEventHandlers");
  }
  const entry = source.match(/export function runNavigationAutomation[\s\S]*?\n}/)?.[0] || "";
  if (/if\s*\(\s*event\.type\s*===/.test(entry)) {
    violations.push("runNavigationAutomation(event) must not reintroduce an event.type if-chain");
  }
  for (const internal of ["goto(", "scheduleReload(", "openUrl(", "openWindow("]) {
    if (entry.includes(internal)) {
      violations.push("runNavigationAutomation(event) must dispatch through navigationEventHandlers");
    }
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
  if (
    !RAW_NAVIGATION_EXEMPT.has(file.rel) &&
    /\b(?:window\.)?location\.href\s*=|\bwindow\.open\s*\(/.test(source)
  ) {
    violations.push(
      `src/${file.rel} must route navigation effects through runNavigationAutomation(event)`
    );
  }
  if (!file.rel.endsWith(".test.js")) {
    const reloadEvents = source.matchAll(
      /type\s*:\s*NavigationEvent\.(?:RELOAD_NOW|SCHEDULE_RELOAD)/g
    );
    for (const match of reloadEvents) {
      const eventBody = source.slice(match.index, match.index + 220);
      if (!/\breason\b/.test(eventBody)) {
        violations.push(`src/${file.rel} reload navigation events must carry reason`);
      }
    }
    const redirectEvents = source.matchAll(/type\s*:\s*NavigationEvent\.OPEN_URL/g);
    for (const match of redirectEvents) {
      const eventBody = source.slice(match.index, match.index + 220);
      if (!/\breason\b/.test(eventBody)) {
        violations.push(`src/${file.rel} redirect navigation events must carry reason`);
      }
    }
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
