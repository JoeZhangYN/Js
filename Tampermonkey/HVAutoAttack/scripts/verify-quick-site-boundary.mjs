import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/arena/quick-site.js");
const ownerTest = path.normalize("src/arena/quick-site.test.js");
const lobby = path.normalize("src/pages/lobby-automation.js");
const settings = path.normalize("src/settings/render.js");
const style = path.normalize("src/style/inject.js");
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
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const where = `${rel(file)}:${index + 1}`;
    if (
      relative !== owner &&
      relative !== ownerTest &&
      /from\s+["'](?:\.\/|\.\.\/arena\/)quick-site\.js["']/.test(line) &&
      !/\bQuickSiteEvent\b/.test(line)
    ) {
      violations.push(`${where} quick site consumers must use runQuickSiteAutomation(event)`);
    }
    if (
      relative !== owner &&
      relative !== ownerTest &&
      relative !== style &&
      /\bquickSiteBar\b/.test(line)
    ) {
      violations.push(`${where} quick site DOM belongs in arena/quick-site.js`);
    }
    if (
      relative !== owner &&
      relative !== ownerTest &&
      relative !== settings &&
      relative !== lobby &&
      /\bquickSite\b/.test(line)
    ) {
      violations.push(`${where} quick site business belongs in runQuickSiteAutomation(event)`);
    }
    if (relative === lobby && /if\s*\([^)]*quickSite/.test(line)) {
      violations.push(`${where} lobby must not branch on quickSite option`);
    }
    if (relative === settings && /\b_option\.quickSite\b/.test(line)) {
      violations.push(`${where} settings must render quickSite through QuickSiteEvent`);
    }
    if (relative === settings && /\bi\.(?:fav|name|url)\b/.test(line)) {
      violations.push(`${where} settings must not know quickSite row fields`);
    }
    if (
      relative === settings &&
      /<td><input class=["']hvAADebug["'] type=["']text["']>/.test(line)
    ) {
      violations.push(`${where} settings must request quickSite row HTML from QuickSiteEvent`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of ["runQuickSiteAutomation", "QuickSiteEvent"]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}
const settingsText = fs.readFileSync(path.join(root, settings), "utf8");
if (!settingsText.includes("QuickSiteEvent.RENDER_SETTINGS_TABLE_BODY")) {
  violations.push(
    `${settings.replaceAll("\\", "/")} must render quick site settings through the entry`
  );
}
if (!settingsText.includes("QuickSiteEvent.COLLECT_SETTINGS_INPUTS")) {
  violations.push(
    `${settings.replaceAll("\\", "/")} must collect quick site settings through the entry`
  );
}
if (!settingsText.includes("QuickSiteEvent.RENDER_SETTINGS_EMPTY_ROW")) {
  violations.push(
    `${settings.replaceAll("\\", "/")} must request quick site empty rows through the entry`
  );
}
if (/export\s+function\s+quickSite\s*\(/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} legacy quickSite export is forbidden`);
}
if (/from\s+["']\.\.\/state\/store\.js["']/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must not import store for lobby rendering`);
}
if (!ownerText.includes("OptionEvent.READ")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must read lobby quickSite option through option entry`
  );
}
if (/EVENT_LOBBY_READY[\s\S]*renderQuickSite\(\s*event\.option\s*\)/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} lobby quick site rendering must not use caller option`
  );
}

if (violations.length) {
  console.error("[verify-quick-site-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-quick-site-boundary] OK — quick site rendering is behind one entry");
