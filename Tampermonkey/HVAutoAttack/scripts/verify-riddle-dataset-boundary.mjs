import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/riddle-dataset.js");
const ownerTest = path.normalize("src/state/riddle-dataset.test.js");
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith(".js")) checkFile(full);
  }
}

function checkFile(file) {
  const relative = path.normalize(path.relative(root, file));
  const text = fs.readFileSync(file, "utf8");
  if (relative === owner || relative === ownerTest) return;

  const importRe =
    /import\s+\{([^}]+)\}\s+from\s+["'](?:\.\/|\.\.\/state\/)riddle-dataset\.js["']/g;
  for (const match of text.matchAll(importRe)) {
    const names = match[1].split(",").map((name) => name.trim().split(/\s+as\s+/)[0]);
    for (const legacy of [
      "recordRiddleSample",
      "exportRiddleDataset",
      "registerExportMenu",
      "SAMPLE_SOURCE",
    ]) {
      if (names.includes(legacy)) {
        violations.push(
          `${rel(file)} imports legacy ${legacy}; use runRiddleDatasetAutomation(event)`
        );
      }
    }
    if (!names.includes("runRiddleDatasetAutomation") || !names.includes("RiddleDatasetEvent")) {
      violations.push(
        `${rel(file)} riddle dataset consumers must use runRiddleDatasetAutomation(event)`
      );
    }
  }

  text.split(/\r?\n/).forEach((line, index) => {
    const where = `${rel(file)}:${index + 1}`;
    if (
      /\bGM_(?:setValue|getValue|deleteValue|listValues)\b/.test(line) &&
      /\bsaved_(?:pony_|riddle_)/.test(line)
    ) {
      violations.push(`${where} riddle dataset storage belongs in state/riddle-dataset.js`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of ["runRiddleDatasetAutomation", "RiddleDatasetEvent", "RiddleSampleSource"]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}
const entryBody =
  ownerText.match(/export function runRiddleDatasetAutomation\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
if (!/const riddleDatasetEventHandlers\s*=\s*Object\.freeze\(\{[\s\S]*\[EVENT_RECORD_SAMPLE\]/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must route events through a frozen handler table`);
}
if (/event\.type\s*===/.test(entryBody)) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must dispatch by handler table`);
}
if (/\bevent\.type\b/.test(entryBody) || !/\bevent\?\.type\b/.test(entryBody)) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must fail closed for null dataset events`);
}
for (const required of ["TimeEvent.LOCAL_FILE_TIMESTAMP", "TimeEvent.ISO_TIMESTAMP"]) {
  if (!ownerText.includes(required)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} must read dataset timestamps through time entry`
    );
  }
}
if (/\bnew Date\s*\(/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must not build dataset timestamps directly`);
}

for (const legacy of ["recordRiddleSample", "exportRiddleDataset", "registerExportMenu"]) {
  if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(ownerText)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} legacy ${legacy} export must stay private behind runRiddleDatasetAutomation(event)`
    );
  }
}

if (/export\s+const\s+SAMPLE_SOURCE\b/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} SAMPLE_SOURCE export was replaced by RiddleSampleSource`
  );
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${ownerTest.replaceAll("\\", "/")} must cover riddle dataset entry`);
} else {
  const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
  if (
    !ownerTestText.includes("rejects invalid dataset events without writing samples or registering menus") ||
    !ownerTestText.includes("runRiddleDatasetAutomation(null)")
  ) {
    violations.push(`${ownerTest.replaceAll("\\", "/")} must cover unknown and null dataset events`);
  }
}

if (violations.length) {
  console.error("[verify-riddle-dataset-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-riddle-dataset-boundary] OK — riddle dataset is behind one entry");
