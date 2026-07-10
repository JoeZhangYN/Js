import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/core/lang.js");
const ownerTest = path.normalize("src/core/lang.test.js");
const legacyHvutFiles = new Set([path.normalize("src/i18n/hv-utils.js")]);
const equipTranslate = path.normalize("src/i18n/equip-translate.js");
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith(".js") && !entry.name.endsWith(".test.js")) {
      checkFile(full);
    }
  }
}

function checkFile(file) {
  const relative = path.normalize(path.relative(root, file));
  if (relative === owner || legacyHvutFiles.has(relative)) return;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) return;
    const where = `${rel(file)}:${index + 1}`;
    if (/\bwindow\.(?:alert|confirm|prompt)\s*\(/.test(line)) {
      violations.push(`${where} browser feedback must use runUserFeedbackAutomation(event)`);
    }
    if (/(?<![\w$.])(?:alert|prompt)\s*\(/.test(line) && !/\b_alert\s*\(/.test(line)) {
      violations.push(`${where} raw alert/prompt must use runUserFeedbackAutomation(event)`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of [
  "UserFeedbackEvent",
  "runUserFeedbackAutomation",
  "readLocalizedFeedback",
  "EVENT_ALERT",
  "EVENT_CONFIRM",
  "EVENT_PROMPT",
  "EVENT_BLOCKING_ERROR",
  "buildBlockingErrorReport",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}

if (!/window\.alert\(message\)/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must keep alert side effect in feedback entry`);
}
if (!/window\.confirm\(message\)/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must keep confirm side effect in feedback entry`);
}
if (!/window\.prompt\(message,\s*event\.defaultValue\)/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must keep prompt side effect in feedback entry`);
}
if (
  !/runUserFeedbackAutomation\(\{\s*type:\s*UserFeedbackEvent\.PROMPT/.test(
    fs.readFileSync(path.join(root, "src/pages/app-startup.js"), "utf8")
  )
) {
  violations.push("src/pages/app-startup.js must request initial language through typed feedback");
}
if (
  !/runUserFeedbackAutomation\(\{\s*type:\s*UserFeedbackEvent\.CONFIRM/.test(
    fs.readFileSync(path.join(root, "src/settings/render.js"), "utf8")
  )
) {
  violations.push("src/settings/render.js must confirm stamina log reset through typed feedback");
}

const equipTranslateText = fs.readFileSync(path.join(root, equipTranslate), "utf8");
for (const required of [
  "UserFeedbackEvent.ALERT",
  "runUserFeedbackAutomation",
  "reportEquipHideInitFailure",
]) {
  if (!equipTranslateText.includes(required)) {
    violations.push(
      `${equipTranslate.replaceAll("\\", "/")} must route equip UI failures through ${required}`
    );
  }
}

const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
for (const required of [
  "selects localized text through the typed feedback entry",
  "routes confirm and prompt through one typed browser feedback adapter",
  "renders blocking errors as copy-ready diagnostic prompts",
  "keeps the legacy _alert wrapper as a compatibility delegate",
]) {
  if (!ownerTestText.includes(required)) {
    violations.push(`${ownerTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-user-feedback-boundary] FAIL");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(
  "[verify-user-feedback-boundary] OK — user-visible feedback uses one i18n-backed entry"
);
