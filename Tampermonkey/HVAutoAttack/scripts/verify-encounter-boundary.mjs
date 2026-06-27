import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/pages/encounter.js");
const stateHelper = path.normalize("src/pages/encounter-state.js");
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
    if (
      /\b(?:getValue|setValue|delValue)\(\s*["']encounter["']/.test(line)
    ) {
      violations.push(
        `${where} legacy hvAA encounter storage is forbidden; use hvut_re through runEncounterAutomation(event)`
      );
    }
    if (
      relative !== owner &&
      relative !== stateHelper &&
      /\bhvut_re\b/.test(line)
    ) {
      violations.push(
        `${where} direct hvut_re access outside encounter boundary is forbidden`
      );
    }
    if (
      relative !== owner &&
      /from\s+["']\.\/encounter-state\.js["']/.test(line)
    ) {
      violations.push(
        `${where} encounter-state is internal; import runEncounterAutomation(event)`
      );
    }
    if (/\bencounterCheck\b/.test(line)) {
      violations.push(
        `${where} legacy encounterCheck name is forbidden; use runEncounterAutomation(event)`
      );
    }
    if (/\blastEncounter\b/.test(line)) {
      violations.push(
        `${where} legacy lastEncounter cache/UI is forbidden; use hvut_re countdown`
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
