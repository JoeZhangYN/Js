import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/pages/encounter.js");
const stateHelper = path.normalize("src/pages/encounter-state.js");
const policyFile = path.normalize("src/pages/encounter-policy.js");
const bridgeFile = path.normalize("src/pages/encounter-bridge.js");
const hvUtilsFile = path.normalize("src/i18n/hv-utils.js");
const violations = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      checkFile(full);
    }
  }
}

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function checkFile(file) {
  const relative = path.normalize(path.relative(root, file));
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    const where = `${rel(file)}:${index + 1}`;
    if (/\b(?:getValue|setValue|delValue)\(\s*["']encounter["']/.test(line)) {
      violations.push(
        `${where} legacy hvAA encounter storage is forbidden; use hvut_re through runEncounterAutomation(event)`
      );
    }
    if (
      relative !== owner &&
      relative !== stateHelper &&
      relative !== policyFile &&
      relative !== bridgeFile &&
      /\bhvut_re\b/.test(line)
    ) {
      violations.push(`${where} direct hvut_re access outside encounter boundary is forbidden`);
    }
    if (
      relative !== owner &&
      relative !== bridgeFile &&
      /from\s+["']\.\/encounter-state\.js["']/.test(line)
    ) {
      violations.push(`${where} encounter-state is internal; import runEncounterAutomation(event)`);
    }
    if (relative !== owner && /from\s+["']\.\/encounter-widget\.js["']/.test(line)) {
      violations.push(
        `${where} encounter widget implementation is internal; import runEncounterAutomation(event)`
      );
    }
    if (/\bencounterCheck\b/.test(line)) {
      violations.push(
        `${where} legacy encounterCheck name is forbidden; use runEncounterAutomation(event)`
      );
    }
    if (/\blastEncounter\b/.test(line)) {
      violations.push(`${where} legacy lastEncounter cache/UI is forbidden; use hvut_re countdown`);
    }
    if (relative !== policyFile && /\b1800000\b|30\s*\*\s*60\s*\*\s*1000/.test(line)) {
      violations.push(`${where} encounter interval belongs in encounter-policy.js`);
    }
    if (relative !== policyFile && /\bcount\s*>=\s*24\b/.test(line)) {
      violations.push(`${where} encounter daily limit belongs in encounter-policy.js`);
    }
    if (
      relative !== policyFile &&
      /Date\.UTC\(.*getUTCFullYear\(\).*getUTCMonth\(\).*getUTCDate\(\)\s*\+\s*1/.test(line)
    ) {
      violations.push(`${where} encounter midnight scheduling belongs in encounter-policy.js`);
    }
    if (relative !== policyFile && /encounter=\(\[A-Za-z0-9=\]\+\)/.test(line)) {
      violations.push(`${where} encounter key parsing belongs in encounter-policy.js`);
    }
    if (relative === owner && /\bsetTimeout\s*\(/.test(line)) {
      violations.push(
        `${where} encounter must return nextCheckMs; lobby automation owns scheduling`
      );
    }
    if (
      relative === bridgeFile &&
      /\b(markEncounter|normalizeEncounter|parseEncounter|planEncounter|readEncounter|resetEncounter)/.test(
        line
      )
    ) {
      violations.push(`${where} encounter bridge may expose only runEncounterAutomation(event)`);
    }
    if (
      relative === hvUtilsFile &&
      /HVAA_encounter\??\.(?:mark|normalize|parse|plan|read|reset)/.test(line)
    ) {
      violations.push(
        `${where} hv-utils must call HVAA_encounter.run(event), not encounter policy helpers`
      );
    }
  });
}

walk(srcDir);

if (violations.length) {
  console.error("[verify-encounter-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-encounter-boundary] OK — encounter business state has one owner");
