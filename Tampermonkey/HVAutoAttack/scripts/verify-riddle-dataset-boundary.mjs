import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/state/riddle-dataset.js");
const statusOwner = path.normalize("src/state/riddle-dataset-status.js");
const downloadOwner = path.normalize("src/state/riddle-dataset-download.js");
const failureOwner = path.normalize("src/state/riddle-dataset-failure.js");
const exportOwner = path.normalize("src/state/riddle-dataset-export.js");
const ownerTest = path.normalize("src/state/riddle-dataset.test.js");
const statusTest = path.normalize("src/state/riddle-dataset-status.test.js");
const downloadTest = path.normalize("src/state/riddle-dataset-download.test.js");
const failureTest = path.normalize("src/state/riddle-dataset-failure.test.js");
const exportTest = path.normalize("src/state/riddle-dataset-export.test.js");
const diagnosticKeys = path.normalize("src/core/diagnostic-evidence-keys.js");
const diagnosticTest = path.normalize("src/core/diagnostic-evidence.test.js");
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
  if (relative === owner || relative === ownerTest || relative === downloadTest) return;

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
const statusOwnerText = fs.readFileSync(path.join(root, statusOwner), "utf8");
const downloadOwnerText = fs.existsSync(path.join(root, downloadOwner))
  ? fs.readFileSync(path.join(root, downloadOwner), "utf8")
  : "";
const failureOwnerText = fs.readFileSync(path.join(root, failureOwner), "utf8");
const exportOwnerText = fs.readFileSync(path.join(root, exportOwner), "utf8");
for (const required of ["runRiddleDatasetAutomation", "RiddleDatasetEvent", "RiddleSampleSource"]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}
if (!/const handlers\s*=\s*Object\.freeze\(\{[\s\S]*\[EVENT_RECORD_SAMPLE\]/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must route events through a frozen handler table`
  );
}
if (/event\.type\s*===/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must dispatch by handler table`);
}
if (!ownerText.includes("handlers[event?.type]?.(event)")) {
  violations.push(`${owner.replaceAll("\\", "/")} entry must fail closed for null dataset events`);
}
for (const required of ["TimeEvent.LOCAL_FILE_TIMESTAMP", "TimeEvent.ISO_TIMESTAMP"]) {
  if (!ownerText.includes(required)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} must read dataset timestamps through time entry`
    );
  }
}
for (const required of [
  "recordRiddleDatasetFailure",
  "[HVAA][RMA] riddle dataset failed",
  "HVAA:lastRiddleDatasetFailure",
  "DiagnosticConsoleEvent.WARN",
  "runDiagnosticConsoleAutomation",
  "record-write",
  'recordRiddleDatasetFailure("export"',
  "export-download",
  "export-download-cleanup",
  "export-revoke",
]) {
  if (
    !(
      ownerText +
      exportOwnerText +
      statusOwnerText +
      downloadOwnerText +
      failureOwnerText
    ).includes(required)
  ) {
    violations.push(`${owner.replaceAll("\\", "/")} must own riddle dataset failure ${required}`);
  }
}
for (const required of [
  "RIDDLE_DATASET_STATUS_COPY",
  "reportRiddleDatasetStatus",
  "EMPTY_SAMPLE_STORE",
  "EMPTY_EXPORTABLE_SAMPLE_STORE",
  "EXPORT_SUCCESS",
]) {
  if (!(ownerText + exportOwnerText).includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must route dataset status through ${required}`);
  }
}
for (const required of [
  "RIDDLE_DATASET_STATUS_COPY",
  "reportRiddleDatasetStatus",
  "formatRiddleDatasetStatus",
  "UserFeedbackEvent.TEXT",
  "DiagnosticConsoleEvent.INFO",
  "runUserFeedbackAutomation",
  "runDiagnosticConsoleAutomation",
]) {
  if (!statusOwnerText.includes(required)) {
    violations.push(`${statusOwner.replaceAll("\\", "/")} must own ${required}`);
  }
}
for (const [text, file, label] of [
  [ownerText, owner, "dataset status"],
  [statusOwnerText, statusOwner, "dataset status"],
  [failureOwnerText, failureOwner, "dataset failure"],
]) {
  if (/\bconsole\.(?:log|warn|error|info|debug)\s*\(/.test(text)) {
    violations.push(
      `${file.replaceAll("\\", "/")} ${label} must use typed feedback/diagnostic entries`
    );
  }
}
if (!downloadOwnerText.includes("export function triggerRiddleDatasetDownload(blob)")) {
  violations.push(
    `${downloadOwner.replaceAll("\\", "/")} must own triggerRiddleDatasetDownload(blob)`
  );
}
if (!exportOwnerText.includes("if (!triggerRiddleDatasetDownload(makeStoreZip(files)))")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must not clear exported samples unless download was triggered`
  );
}
if (
  !/catch \(error\) \{[\s\S]*recordRiddleDatasetFailure\("export-download"/.test(downloadOwnerText)
) {
  violations.push(
    `${downloadOwner.replaceAll("\\", "/")} must record dataset download side-effect failures`
  );
}
for (const required of [
  "RIDDLE_DATASET_FAILURE_KEY",
  "globalThis.sessionStorage?.setItem(RIDDLE_DATASET_FAILURE_KEY",
  "Dataset fallback must not depend on diagnostic storage.",
]) {
  if (!failureOwnerText.includes(required)) {
    violations.push(`${failureOwner.replaceAll("\\", "/")} must own ${required}`);
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
    !ownerTestText.includes("rejects unknown and null events without touching storage") ||
    !ownerTestText.includes("dataset.run(null)")
  ) {
    violations.push(
      `${ownerTest.replaceAll("\\", "/")} must cover unknown and null dataset events`
    );
  }
  for (const required of [
    "writes a Blob sample and derives low confidence from random fallback",
    "returns a known failure result and discloses recovery without blocking submission",
    "registers export and confirmed migration menus exactly once",
    "HVAA:lastRiddleDatasetFailure",
    "record-write",
    "imageBlob: expect.any(Blob)",
  ]) {
    if (!ownerTestText.includes(required)) {
      violations.push(`${ownerTest.replaceAll("\\", "/")} must cover ${required}`);
    }
  }
  const statusTestText = fs.existsSync(path.join(root, statusTest))
    ? fs.readFileSync(path.join(root, statusTest), "utf8")
    : "";
  for (const required of [
    "riddle dataset status feedback",
    "localizes export status text before reporting it through typed diagnostics",
    "RIDDLE_DATASET_STATUS_COPY.EXPORT_SUCCESS",
    "runUserFeedbackAutomation",
    "runDiagnosticConsoleAutomation",
  ]) {
    if (!statusTestText.includes(required)) {
      violations.push(`${statusTest.replaceAll("\\", "/")} must cover ${required}`);
    }
  }
  const downloadTestText = fs.existsSync(path.join(root, downloadTest))
    ? fs.readFileSync(path.join(root, downloadTest), "utf8")
    : "";
  for (const required of [
    "returns false and records evidence when the browser blocks the click",
    "revokes the object URL after a successful trigger",
    "HVAA:lastRiddleDatasetFailure",
    "export-download",
  ]) {
    if (!downloadTestText.includes(required)) {
      violations.push(`${downloadTest.replaceAll("\\", "/")} must cover ${required}`);
    }
  }
  const failureTestText = fs.existsSync(path.join(root, failureTest))
    ? fs.readFileSync(path.join(root, failureTest), "utf8")
    : "";
  for (const required of [
    "does not throw when failure evidence storage is unavailable",
    "RIDDLE_DATASET_FAILURE_KEY",
    'throw new Error("quota")',
    "recordRiddleDatasetFailure",
  ]) {
    if (!failureTestText.includes(required)) {
      violations.push(`${failureTest.replaceAll("\\", "/")} must cover ${required}`);
    }
  }
  const exportTestText = fs.existsSync(path.join(root, exportTest))
    ? fs.readFileSync(path.join(root, exportTest), "utf8")
    : "";
  for (const required of [
    "deletes exported identities only after the browser accepts the download",
    "keeps user samples when the browser blocks the download",
    "RiddleSampleStoreEvent.DELETE_EXPORTED",
    "expect(runStore).toHaveBeenCalledTimes(1)",
  ]) {
    if (!exportTestText.includes(required)) {
      violations.push(`${exportTest.replaceAll("\\", "/")} must cover ${required}`);
    }
  }
}

const diagnosticKeysText = fs.readFileSync(path.join(root, diagnosticKeys), "utf8");
for (const required of [
  'RIDDLE_DATASET_FAILURE: "HVAA:lastRiddleDatasetFailure"',
  'source("riddleDatasetFailure", DiagnosticEvidenceKey.RIDDLE_DATASET_FAILURE)',
]) {
  if (!diagnosticKeysText.includes(required)) {
    violations.push(`${diagnosticKeys.replaceAll("\\", "/")} must expose ${required}`);
  }
}
const diagnosticTestText = fs.readFileSync(path.join(root, diagnosticTest), "utf8");
for (const required of [
  "HVAA:lastRiddleDatasetFailure",
  'riddleDatasetFailure: { capability: "riddleDataset", stage: "export-list" }',
]) {
  if (!diagnosticTestText.includes(required)) {
    violations.push(`${diagnosticTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}

if (violations.length) {
  console.error("[verify-riddle-dataset-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-riddle-dataset-boundary] OK — riddle dataset is behind one entry");
