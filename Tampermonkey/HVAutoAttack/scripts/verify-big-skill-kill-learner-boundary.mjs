import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/big-skill-kill-learner.js");
const ownerTest = path.normalize("src/state/big-skill-kill-learner.test.js");
const ownerNormalizationTest = path.normalize(
  "src/state/big-skill-kill-learner-normalization.test.js"
);
const snapshot = path.normalize("src/battle/snapshot.js");
const persistKeys = path.normalize("src/state/persist-keys.js");
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
  const source = fs.readFileSync(file, "utf8");
  const lines = source.split(/\r?\n/);
  lines.forEach((line, index) => {
    const where = `${rel(file)}:${index + 1}`;
    if (
      relative !== owner &&
      relative !== ownerTest &&
      /from\s+["'](?:\.\/|\.\.\/\.\.\/state\/|\.\.\/state\/)big-skill-kill-learner\.js["']/.test(
        line
      ) &&
      /\b(?:recordBigSkillCast|finalizeBigSkillPending|ofcWillKillBoss)\b/.test(line)
    ) {
      violations.push(`${where} legacy big skill kill learner imports are forbidden`);
    }
    if (
      relative !== owner &&
      relative !== ownerTest &&
      relative !== ownerNormalizationTest &&
      relative !== persistKeys &&
      /\bSTORAGE_KEYS\.LEARNED_BIG_KILL\b/.test(line)
    ) {
      violations.push(`${where} learned big-kill storage belongs in big skill kill learner`);
    }
  });
  for (const call of source.matchAll(/runBigSkillKillLearningAutomation\(\s*\{[\s\S]*?\}\s*\)/g)) {
    if (
      relative !== owner &&
      call[0].includes("BigSkillKillLearningEvent.RECORD_CAST") &&
      /\bsnap\s*:/.test(call[0])
    ) {
      violations.push(`${rel(file)} must pass observedBosses, not snap, to big-skill record cast`);
    }
  }
  if (
    relative !== owner &&
    /BigSkillKillLearningEvent\.FINALIZE_PENDING[\s\S]{0,220}\bsnap:\s*\{[\s\S]{0,120}\bview\s*:/.test(
      source
    )
  ) {
    violations.push(
      `${rel(file)} must pass liveMonsterIds, not full view, to big-skill kill finalize`
    );
  }
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of [
  "runBigSkillKillLearningAutomation",
  "BigSkillKillLearningEvent",
  "STORAGE_KEYS.LEARNED_BIG_KILL",
  "OptionEvent.READ_FIELD",
  "normalizeTurn",
  "normalizePending",
  "normalizeLiveMonsterIds",
  "normalizeLearnedSkill",
  "readLearnedBigKillMap",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}
if ((ownerText.match(/normalizePending\(/g) || []).length < 2) {
  violations.push(`${owner.replaceAll("\\", "/")} must normalize pending big-kill state`);
}
if ((ownerText.match(/readLearnedBigKillMap\(/g) || []).length < 3) {
  violations.push(`${owner.replaceAll("\\", "/")} must normalize learned big-kill storage reads`);
}
if (/\bg\(\s*["']option["']\s*\)/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must not read option fields directly`);
}
const finalizeBody = ownerText.match(
  /function finalizeBigSkillPending\(snap\) \{[\s\S]*?\n\}/
)?.[0];
if (!finalizeBody?.includes("snap?.liveMonsterIds")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} finalize must consume narrow liveMonsterIds, not full monster view`
  );
}
if (/\bsnap\?\.view\b|\bsnap\.view\b/.test(finalizeBody || "")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} finalize must not consume full monster view rows`
  );
}
const recordBody = ownerText.match(
  /function recordBigSkillCast\(code, event\) \{[\s\S]*?\n\}/
)?.[0];
if (!recordBody?.includes("event?.observedBosses") || !recordBody?.includes("event?.globalTurn")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} record cast must consume observedBosses and globalTurn`
  );
}
if (
  /\bsnap\?\.view\b|\bsnap\.view\b|\bsnap\?\.globalTurn\b|\bsnap\.globalTurn\b/.test(
    recordBody || ""
  )
) {
  violations.push(`${owner.replaceAll("\\", "/")} record cast must not consume full snap`);
}

const snapshotText = fs.readFileSync(path.join(root, snapshot), "utf8");
if (!snapshotText.includes("liveMonsterIds(view)")) {
  violations.push(
    `${snapshot.replaceAll("\\", "/")} must derive narrow liveMonsterIds for finalize`
  );
}
if (/FINALIZE_PENDING[\s\S]{0,120}snap:\s*\{\s*globalTurn,\s*view\s*\}/.test(snapshotText)) {
  violations.push(
    `${snapshot.replaceAll("\\", "/")} must not pass full view to big-skill kill finalize`
  );
}

for (const legacy of ["recordBigSkillCast", "finalizeBigSkillPending", "ofcWillKillBoss"]) {
  if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(ownerText)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} legacy ${legacy} export must stay private behind runBigSkillKillLearningAutomation(event)`
    );
  }
}

if (violations.length) {
  console.error("[verify-big-skill-kill-learner-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log(
  "[verify-big-skill-kill-learner-boundary] OK — big-skill kill learning is behind one entry"
);
