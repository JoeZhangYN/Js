import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/arena/idle-arena.js");
const failureOwner = path.normalize("src/arena/idle-arena-failure.js");
const ownerTest = path.normalize("src/arena/idle-arena.test.js");
const diagnosticKeys = path.normalize("src/core/diagnostic-evidence-keys.js");
const diagnosticTest = path.normalize("src/core/diagnostic-evidence.test.js");
const settings = path.normalize("src/settings/render.js");
const storageKeys = path.normalize("src/state/persist-keys.js");
const violations = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith(".js")) checkFile(full);
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
    if (relative !== owner && /import\s+\{[^}]*\bidleArena\b/.test(line)) {
      violations.push(
        `${where} idleArena implementation import is forbidden; use runIdleArenaAutomation(event)`
      );
    }
    if (
      relative !== owner &&
      relative !== ownerTest &&
      relative !== settings &&
      /\bidleArenaTime\b/.test(line)
    ) {
      violations.push(`${where} idleArenaTime scheduling is owned by idle-arena boundary`);
    }
    if (relative !== owner && /setTimeout\(\s*idleArena\b/.test(line)) {
      violations.push(
        `${where} direct idleArena scheduling is forbidden; use SCHEDULE_NEXT_BATTLE`
      );
    }
    if (
      relative !== owner &&
      relative !== ownerTest &&
      /\b(?:getValue|setValue|delValue)\(\s*["']arena["']/.test(line)
    ) {
      violations.push(`${where} arena storage key must use STORAGE_KEYS.ARENA`);
    }
    if (
      relative !== owner &&
      relative !== ownerTest &&
      relative !== storageKeys &&
      /\bSTORAGE_KEYS\.ARENA\b/.test(line)
    ) {
      violations.push(`${where} arena storage belongs in idle-arena boundary`);
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
const failureOwnerText = fs.readFileSync(path.join(root, failureOwner), "utf8");
const diagnosticKeysText = fs.readFileSync(path.join(root, diagnosticKeys), "utf8");
const diagnosticTestText = fs.readFileSync(path.join(root, diagnosticTest), "utf8");
if (!ownerText.includes("STORAGE_KEYS.ARENA")) {
  violations.push(`${owner.replaceAll("\\", "/")} must use STORAGE_KEYS.ARENA`);
}
if (!ownerText.includes("OptionEvent.READ_FIELD")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must read idle arena options through option entry`
  );
}
if (/from\s+["']\.\.\/state\/store\.js["']/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must not import store for idle arena options`);
}
if (/\bg\(\s*["']option["']\s*\)/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must not read idle arena options directly`);
}
if (!ownerText.includes("RESET_PROGRESS")) {
  violations.push(`${owner.replaceAll("\\", "/")} must expose RESET_PROGRESS event`);
}
if (!ownerText.includes("delValue(STORAGE_KEYS.ARENA)")) {
  violations.push(`${owner.replaceAll("\\", "/")} must own arena reset storage deletion`);
}
for (const required of [
  "recordIdleArenaRequestFailure",
  "recordIdleArenaFailure",
  "capability: \"idleArena\"",
  "HVAA:lastIdleArenaFailure",
  "[HVAA] idle arena request failed",
  "IDLE_ARENA_TOKEN_URLS",
  "token-fetch",
  "battle-start",
]) {
  if (!(ownerText + failureOwnerText).includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own idle arena HTTP failure ${required}`);
  }
}
for (const required of [
  "IDLE_ARENA_FAILURE_KEY",
  "globalThis.sessionStorage?.setItem(IDLE_ARENA_FAILURE_KEY",
  "Idle arena recovery must not depend on diagnostic storage.",
]) {
  if (!failureOwnerText.includes(required)) {
    violations.push(`${failureOwner.replaceAll("\\", "/")} must own ${required}`);
  }
}
for (const required of [
  "IDLE_ARENA_FAILURE: \"HVAA:lastIdleArenaFailure\"",
  "source(\"idleArenaFailure\", DiagnosticEvidenceKey.IDLE_ARENA_FAILURE)",
]) {
  if (!diagnosticKeysText.includes(required)) {
    violations.push(`${diagnosticKeys.replaceAll("\\", "/")} must expose ${required}`);
  }
}
for (const required of [
  "HVAA:lastIdleArenaFailure",
  "idleArenaFailure: { capability: \"idleArena\", stage: \"battle-start\" }",
]) {
  if (!diagnosticTestText.includes(required)) {
    violations.push(`${diagnosticTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}
const tokenFetchStart = ownerText.indexOf("IDLE_ARENA_TOKEN_URLS.forEach");
const tokenFetchEnd = ownerText.indexOf("// 轮询", tokenFetchStart);
const tokenFetchBlock =
  tokenFetchStart >= 0 && tokenFetchEnd > tokenFetchStart
    ? ownerText.slice(tokenFetchStart, tokenFetchEnd)
    : "";
if (
  !tokenFetchBlock.includes("post(") ||
  !tokenFetchBlock.includes("href") ||
  !tokenFetchBlock.includes("failTokenFetch")
) {
  violations.push(`${owner.replaceAll("\\", "/")} token fetch requests must pass failure callbacks`);
}
if (!/recordIdleArenaRequestFailure\("battle-start",\s*arenaBeforeStart,\s*failure\)/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} battle start failures must preserve pre-start progress`
  );
}
if (!ownerText.includes("const idleArenaEventHandlers")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must route idle arena events through a handler table`
  );
}
const entryMatch = ownerText.match(/export function runIdleArenaAutomation[\s\S]*?\n}/);
if (!entryMatch) {
  violations.push(`${owner.replaceAll("\\", "/")} must expose runIdleArenaAutomation(event)`);
} else {
  const entryBody = entryMatch[0];
  if (/if\s*\(\s*event\.type\s*===/.test(entryBody)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} entry must not reintroduce an event.type if-chain`
    );
  }
  for (const internal of ["scheduleNextBattle(", "resetProgress(", "startNextBattle("]) {
    if (entryBody.includes(internal)) {
      violations.push(
        `${owner.replaceAll("\\", "/")} entry must dispatch through idleArenaEventHandlers`
      );
    }
  }
  if (/\|\|\s*idleArenaEventHandlers\[EVENT_START_NEXT_BATTLE\]/.test(entryBody)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} explicit unknown idle arena events must not start battles`
    );
  }
  if (!entryBody.includes("?? false")) {
    violations.push(
      `${owner.replaceAll("\\", "/")} unknown idle arena events must reject as false`
    );
  }
}
if (!fs.existsSync(path.join(root, ownerTest))) {
  violations.push(`${ownerTest.replaceAll("\\", "/")} must cover idle arena entry behavior`);
} else {
  const ownerTestText = fs.readFileSync(path.join(root, ownerTest), "utf8");
  for (const required of [
    "rejects unknown idle arena events without starting a battle",
    "runIdleArenaAutomation(null)",
    "expect(mocks.post).not.toHaveBeenCalled()",
    "expect(vi.getTimerCount()).toBe(0)",
    "records token fetch request failures and stops waiting for all token pages",
    "records battle start request failures without advancing arena progress",
    "HVAA:lastIdleArenaFailure",
    "[HVAA] idle arena request failed",
    "capability: \"idleArena\"",
    "stage: \"token-fetch\"",
    "stage: \"battle-start\"",
  ]) {
    if (!ownerTestText.includes(required)) {
      violations.push(`${ownerTest.replaceAll("\\", "/")} must cover ${required}`);
    }
  }
}

if (violations.length) {
  console.error("[verify-idle-arena-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-idle-arena-boundary] OK — idle arena scheduling has one owner");
