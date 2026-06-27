import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const entry = path.normalize("src/monitor/battle-monitor-automation.js");
const internalFiles = new Set(
  [
    entry,
    "src/monitor/battle-action-usage-capture.js",
    "src/monitor/battle-info.js",
    "src/monitor/battle-record-archive.js",
    "src/monitor/battle-report.js",
    "src/monitor/battle-report-view.js",
    "src/monitor/battle-monitor-runtime.js",
    "src/monitor/drop-monitor.js",
    "src/monitor/record-usage.js",
    "src/state/storage.js",
  ].map((p) => path.normalize(p))
);
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) walk(full);
    else if (item.isFile() && item.name.endsWith(".js")) checkFile(full);
  }
}

function checkFile(file) {
  const relative = path.normalize(path.relative(root, file));
  if (relative.endsWith(".test.js")) return;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) return;
    if (internalFiles.has(relative)) return;
    if (line.includes("runBattleMonitorAutomation") || line.includes("BattleMonitorEvent")) return;
    const where = `${rel(file)}:${index + 1}`;
    for (const name of [
      "refreshBattleHud",
      "recordBattleDrops",
      "runBattleUsageAutomation",
      "recordUsage2",
    ]) {
      if (new RegExp(`\\b${name}\\s*\\(`).test(line)) {
        violations.push(`${where} ${name} belongs behind runBattleMonitorAutomation(event)`);
      }
    }
    if (
      /from\s+["'](?:\.\.\/monitor\/|\.\.\/\.\.\/monitor\/|\.\/)(battle-info|battle-record-archive|battle-report|battle-report-view|drop-monitor|record-usage)\.js["']/.test(
        line
      )
    ) {
      violations.push(
        `${where} battle monitor internals are private; import runBattleMonitorAutomation(event)`
      );
    }
    if (
      /\b(?:getValue|setValue|delValue)\(\s*["'](?:battleCode|drop|dropOld|stats|statsOld)["']/.test(
        line
      )
    ) {
      violations.push(
        `${where} battle monitor storage belongs behind runBattleMonitorAutomation(event)`
      );
    }
  });
}

function checkEntry() {
  const text = fs.readFileSync(path.join(root, entry), "utf8");
  if (!/export function runBattleMonitorAutomation\(/.test(text)) {
    violations.push(`${entry.replaceAll("\\", "/")} must expose runBattleMonitorAutomation(event)`);
  }
  if (!text.includes("runBattleHudAutomation") || !text.includes("BattleHudEvent.REFRESH")) {
    violations.push(
      `${entry.replaceAll("\\", "/")} must route HUD refresh through runBattleHudAutomation(event)`
    );
  }
  if (/\brefreshBattleHud\b/.test(text)) {
    violations.push(`${entry.replaceAll("\\", "/")} must not call raw refreshBattleHud()`);
  }
  if (
    !text.includes("runBattleDropAutomation") ||
    !text.includes("BattleDropEvent.COMPLETION_REACHED")
  ) {
    violations.push(
      `${entry.replaceAll("\\", "/")} must route drop recording through runBattleDropAutomation(event)`
    );
  }
  if (!text.includes("runBattleUsageAutomation")) {
    violations.push(
      `${entry.replaceAll("\\", "/")} must route battle usage through runBattleUsageAutomation(event)`
    );
  }
  if (!text.includes("runBattleReportAutomation")) {
    violations.push(
      `${entry.replaceAll("\\", "/")} must route battle reports through runBattleReportAutomation(event)`
    );
  }
  if (!text.includes("BattleReportEvent")) {
    violations.push(
      `${entry.replaceAll("\\", "/")} must report battle-report events through BattleReportEvent`
    );
  }
  if (
    !text.includes("runBattleActionUsageCapture") ||
    !text.includes("BattleActionUsageCaptureEvent.ACTION_STARTED") ||
    !text.includes("BattleActionUsageCaptureEvent.ACTION_ENDED")
  ) {
    violations.push(
      `${entry.replaceAll("\\", "/")} must route action usage capture through runBattleActionUsageCapture(event)`
    );
  }
  for (const forbidden of [
    /\bunsafeWindow\.info\b/,
    /#pane_item/,
    /#textlog>tbody>tr>td/,
    /\bpendingUsage\b/,
  ]) {
    if (forbidden.test(text)) {
      violations.push(
        `${entry.replaceAll("\\", "/")} must not collect action usage directly; use battle-action-usage-capture`
      );
    }
  }
  if (/BattleMonitorRuntimeEvent\.REPORT_START_CONTEXT|runBattleMonitorRuntime/.test(text)) {
    violations.push(`${entry.replaceAll("\\", "/")} must not assemble battle report start context`);
  }
  if (/\brecordLabel\b|\bUTC_MONTH_DAY_LABEL\b/.test(text)) {
    violations.push(`${entry.replaceAll("\\", "/")} must not own battle report date labels`);
  }
  if (/\bg\(\s*["']option["']\s*\)|\bdropMonitor\b|\brecordUsage\b/.test(text)) {
    violations.push(
      `${entry.replaceAll("\\", "/")} monitor feature switches belong in their capability entries`
    );
  }
  for (const required of [
    "BATTLE_STARTED",
    "HUD_REFRESH",
    "ACTION_STARTED",
    "ACTION_ENDED",
    "COMPLETION_REACHED",
    "READ_DROP_REPORT",
    "READ_USAGE_REPORT",
    "CLEAR_DROP_REPORT",
    "CLEAR_USAGE_REPORT",
    "RENDER_DROP_REPORT_TABLE_BODY",
    "RENDER_USAGE_REPORT_TABLE_BODY",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${entry.replaceAll("\\", "/")} must own ${required} event wiring`);
    }
  }
}

function checkSettingsReportConsumption() {
  const settingsFile = path.join(root, "src/settings/render.js");
  const text = fs.readFileSync(settingsFile, "utf8");
  if (/\breport\.(?:mode|rows|columns|sections)\b/.test(text)) {
    violations.push(
      `${rel(settingsFile)} must not inspect battle report shape; request rendered report output`
    );
  }
  for (const required of ["RENDER_DROP_REPORT_TABLE_BODY", "RENDER_USAGE_REPORT_TABLE_BODY"]) {
    if (!text.includes(required)) {
      violations.push(`${rel(settingsFile)} must request ${required}`);
    }
  }
}

function checkActionUsageCaptureEntry() {
  const captureFile = path.join(root, "src/monitor/battle-action-usage-capture.js");
  const text = fs.readFileSync(captureFile, "utf8");
  if (!/export const BattleActionUsageCaptureEvent\s*=\s*Object\.freeze\(/.test(text)) {
    violations.push(`${rel(captureFile)} must expose BattleActionUsageCaptureEvent`);
  }
  if (!/export function runBattleActionUsageCapture\(/.test(text)) {
    violations.push(`${rel(captureFile)} must expose runBattleActionUsageCapture(event)`);
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleActionUsageCaptureEvent\b|runBattleActionUsageCapture\b)/.test(
      text
    )
  ) {
    violations.push(`${rel(captureFile)} may export only its event entry`);
  }
  for (const required of ["unsafeWindow.info", "#pane_item", "#textlog>tbody>tr>td"]) {
    if (!text.includes(required)) {
      violations.push(`${rel(captureFile)} must own action usage ${required} collection`);
    }
  }
  if (!text.includes("OptionEvent.READ_FIELD")) {
    violations.push(`${rel(captureFile)} must read recordUsage through option entry`);
  }
  if (/from\s+["']\.\.\/state\/store\.js["']/.test(text)) {
    violations.push(`${rel(captureFile)} must not import store for recordUsage option reads`);
  }
  if (/\bg\(\s*["']option["']\s*\)/.test(text) || /\bdeps\.g\(\s*["']option["']\s*\)/.test(text)) {
    violations.push(`${rel(captureFile)} must not read recordUsage option directly`);
  }
}

function checkUsageImplementation() {
  const usageFile = path.join(root, "src/monitor/record-usage.js");
  const entryText = fs.readFileSync(path.join(root, entry), "utf8");
  const text = fs.readFileSync(usageFile, "utf8");
  if (!/export function runBattleUsageAutomation\(/.test(text)) {
    violations.push(`${rel(usageFile)} must expose only runBattleUsageAutomation(event)`);
  }
  if (
    /\brecordUsage\s*\(/.test(entryText) ||
    /\b(?:export\s+)?function\s+recordUsage\s*\(/.test(text)
  ) {
    violations.push(
      `${rel(usageFile)} legacy recordUsage() bridge must stay deleted; use runBattleUsageAutomation(event)`
    );
  }
  for (const legacy of ["recordBattleActionUsage", "recordCompletedBattleUsage"]) {
    if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(text)) {
      violations.push(
        `${rel(usageFile)} legacy ${legacy} export must stay private behind runBattleUsageAutomation(event)`
      );
    }
  }
  if (/\b(?:export\s+)?function\s+recordUsage2\s*\(/.test(text)) {
    violations.push(
      `${rel(usageFile)} legacy recordUsage2() bridge must stay deleted; use runBattleUsageAutomation(event)`
    );
  }
  if (
    /\bg\(\s*["'](?:monsterAlive|monsterAll|bossAll|turn|roundNow|roundAll)["']\s*\)/.test(text) ||
    /\bg\(\s*["']option["']\s*\)\.recordEach/.test(text)
  ) {
    violations.push(
      `${rel(usageFile)} must read battle runtime context through battle-monitor-runtime`
    );
  }
  if (!text.includes("BattleMonitorRuntimeEvent.USAGE_ACTION_CONTEXT")) {
    violations.push(
      `${rel(usageFile)} must read usage action context through battle-monitor-runtime`
    );
  }
  if (!text.includes("BattleMonitorRuntimeEvent.USAGE_COMPLETION_CONTEXT")) {
    violations.push(
      `${rel(usageFile)} must read usage completion context through battle-monitor-runtime`
    );
  }
  if (!/\bcontext\.recordUsage\b/.test(text)) {
    violations.push(`${rel(usageFile)} must consume recordUsage from battle-monitor-runtime`);
  }
  if (/\bg\(\s*["']option["']\s*\)\.recordUsage/.test(text)) {
    violations.push(`${rel(usageFile)} must not read recordUsage option directly`);
  }
  if (/\b(?:getValue|setValue)\(\s*STORAGE_KEYS\.STATS\b/.test(text)) {
    violations.push(`${rel(usageFile)} must read/write usage records through battle-record-archive`);
  }
  if (/from\s+["']\.\.\/state\/storage\.js["']/.test(text)) {
    violations.push(`${rel(usageFile)} must not import storage directly`);
  }
}

function checkRecordArchiveEntry() {
  const archiveFile = path.join(root, "src/monitor/battle-record-archive.js");
  const archiveText = fs.readFileSync(archiveFile, "utf8");
  const dropText = fs.readFileSync(path.join(root, "src/monitor/drop-monitor.js"), "utf8");
  const usageText = fs.readFileSync(path.join(root, "src/monitor/record-usage.js"), "utf8");
  if (!/export const BattleRecordArchiveEvent\s*=\s*Object\.freeze\(/.test(archiveText)) {
    violations.push(`${rel(archiveFile)} must expose BattleRecordArchiveEvent`);
  }
  if (!/export function runBattleRecordArchiveAutomation\(/.test(archiveText)) {
    violations.push(`${rel(archiveFile)} must expose runBattleRecordArchiveAutomation(event)`);
  }
  if (
    !archiveText.includes("READ_OR_CREATE_CURRENT") ||
    !archiveText.includes("READ_CURRENT") ||
    !archiveText.includes("STORE_OR_ARCHIVE") ||
    !archiveText.includes("CLEAR_RECORD_SET")
  ) {
    violations.push(
      `${rel(archiveFile)} must own record reads, creation, archiving, and clearing events`
    );
  }
  for (const [label, text] of [
    ["src/monitor/drop-monitor.js", dropText],
    ["src/monitor/record-usage.js", usageText],
  ]) {
    if (!text.includes("runBattleRecordArchiveAutomation")) {
      violations.push(
        `${label} must route record archiving through runBattleRecordArchiveAutomation(event)`
      );
    }
    if (
      /recordEach[\s\S]{0,80}&&[\s\S]{0,80}roundNow[\s\S]{0,80}===[\s\S]{0,80}roundAll/.test(text)
    ) {
      violations.push(`${label} must not own final-round archive decisions`);
    }
    if (/\bLOCAL_TIMESTAMP_LABEL\b|\bTimeEvent\b|\brunTimeAutomation\b/.test(text)) {
      violations.push(`${label} must not own battle record timestamp format`);
    }
  }
}

function checkDeletedDropMonitorEntrypoint() {
  const dropFile = path.join(root, "src/monitor/drop-monitor.js");
  const entryText = fs.readFileSync(path.join(root, entry), "utf8");
  const dropText = fs.readFileSync(dropFile, "utf8");
  if (
    /\bdropMonitor\s*\(/.test(entryText) ||
    /\b(?:export\s+)?function\s+dropMonitor\s*\(/.test(dropText)
  ) {
    violations.push(
      `${rel(dropFile)} legacy dropMonitor() bridge must stay deleted; use runBattleDropAutomation(event)`
    );
  }
  if (!/export const BattleDropEvent\s*=\s*Object\.freeze\(/.test(dropText)) {
    violations.push(`${rel(dropFile)} must expose BattleDropEvent`);
  }
  if (!/export function runBattleDropAutomation\(/.test(dropText)) {
    violations.push(`${rel(dropFile)} must expose runBattleDropAutomation(event)`);
  }
  if (/export function recordBattleDrops\(/.test(dropText)) {
    violations.push(
      `${rel(dropFile)} must keep recordBattleDrops private behind runBattleDropAutomation(event)`
    );
  }
  if (/\brecordBattleDrops\s*\(/.test(entryText)) {
    violations.push(`${entry.replaceAll("\\", "/")} must not call raw recordBattleDrops()`);
  }
  if (
    /\bg\(\s*["'](?:roundNow|roundAll)["']\s*\)/.test(dropText) ||
    /\bg\(\s*["']option["']\s*\)\.recordEach/.test(dropText)
  ) {
    violations.push(`${rel(dropFile)} must read archive context through battle-monitor-runtime`);
  }
  if (!dropText.includes("BattleMonitorRuntimeEvent.DROP_COMPLETION_CONTEXT")) {
    violations.push(
      `${rel(dropFile)} must read drop completion context through battle-monitor-runtime`
    );
  }
  if (!/\bcontext\.dropMonitor\b/.test(dropText)) {
    violations.push(`${rel(dropFile)} must consume dropMonitor from battle-monitor-runtime`);
  }
  if (
    /\bg\(\s*["']option["']\s*\)/.test(dropText) ||
    /\bdeps\.g\(\s*["']option["']\s*\)/.test(dropText)
  ) {
    violations.push(`${rel(dropFile)} must not read drop options directly`);
  }
}

function checkBattleMonitorRuntimeEntry() {
  const runtimeFile = path.join(root, "src/monitor/battle-monitor-runtime.js");
  const text = fs.readFileSync(runtimeFile, "utf8");
  if (!/export const BattleMonitorRuntimeEvent\s*=\s*Object\.freeze\(/.test(text)) {
    violations.push(`${rel(runtimeFile)} must expose BattleMonitorRuntimeEvent`);
  }
  if (!/export function runBattleMonitorRuntime\(/.test(text)) {
    violations.push(`${rel(runtimeFile)} must expose runBattleMonitorRuntime(event)`);
  }
  if (!text.includes("OptionEvent.READ_FIELD")) {
    violations.push(`${rel(runtimeFile)} must read monitor option context through option entry`);
  }
  if (/\bdeps\.g\(\s*["']option["']\s*\)/.test(text)) {
    violations.push(`${rel(runtimeFile)} must not read option context directly from store`);
  }
  if (!text.includes("recordUsage")) {
    violations.push(`${rel(runtimeFile)} must expose recordUsage in usage completion context`);
  }
  for (const required of ["DROP_COMPLETION_CONTEXT", "dropMonitor", "dropQuality"]) {
    if (!text.includes(required)) {
      violations.push(`${rel(runtimeFile)} must expose ${required} in drop completion context`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleMonitorRuntimeEvent\b|runBattleMonitorRuntime\b)/.test(
      text
    )
  ) {
    violations.push(`${rel(runtimeFile)} may export only its event entry`);
  }
  for (const required of [
    "REPORT_START_CONTEXT",
    "ARCHIVE_CONTEXT",
    "USAGE_ACTION_CONTEXT",
    "USAGE_COMPLETION_CONTEXT",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${rel(runtimeFile)} must own ${required}`);
    }
  }
}

function checkDeletedBattleInfoEntrypoint() {
  const hudFile = path.join(root, "src/monitor/battle-info.js");
  const entryText = fs.readFileSync(path.join(root, entry), "utf8");
  const hudText = fs.readFileSync(hudFile, "utf8");
  if (
    /\bbattleInfo\s*\(/.test(entryText) ||
    /\b(?:export\s+)?function\s+battleInfo\s*\(/.test(hudText)
  ) {
    violations.push(
      `${rel(hudFile)} legacy battleInfo() bridge must stay deleted; use runBattleHudAutomation(event)`
    );
  }
  if (!/export const BattleHudEvent\s*=\s*Object\.freeze\(/.test(hudText)) {
    violations.push(`${rel(hudFile)} must expose BattleHudEvent`);
  }
  if (!/export function runBattleHudAutomation\(/.test(hudText)) {
    violations.push(`${rel(hudFile)} must expose runBattleHudAutomation(event)`);
  }
  if (/export function refreshBattleHud\(/.test(hudText)) {
    violations.push(
      `${rel(hudFile)} must keep refreshBattleHud private behind runBattleHudAutomation(event)`
    );
  }
}

function checkBattleReportEntry() {
  const reportFile = path.join(root, "src/monitor/battle-report.js");
  const text = fs.readFileSync(reportFile, "utf8");
  if (!/export const BattleReportEvent\s*=\s*Object\.freeze\(/.test(text)) {
    violations.push(`${rel(reportFile)} must expose BattleReportEvent`);
  }
  if (!/export function runBattleReportAutomation\(/.test(text)) {
    violations.push(`${rel(reportFile)} must expose only runBattleReportAutomation(event)`);
  }
  if (!/\bUTC_MONTH_DAY_LABEL\b/.test(text)) {
    violations.push(`${rel(reportFile)} must own battle report date label format`);
  }
  if (
    !text.includes("BattleMonitorRuntimeEvent.REPORT_START_CONTEXT") ||
    !text.includes("runBattleMonitorRuntime")
  ) {
    violations.push(`${rel(reportFile)} must read report start context through monitor runtime`);
  }
  if (!/\bfunction readReportRecordSet\b/.test(text)) {
    violations.push(
      `${rel(reportFile)} must route current/history report reads through readReportRecordSet`
    );
  }
  if (
    !text.includes("BattleReportViewEvent.RENDER_DROP_TABLE_BODY") ||
    !text.includes("BattleReportViewEvent.RENDER_USAGE_TABLE_BODY")
  ) {
    violations.push(`${rel(reportFile)} must route rendered reports through battle-report-view`);
  }
  if ((text.match(/history\.length\s*===\s*0/g) || []).length !== 1) {
    violations.push(`${rel(reportFile)} must have one current/history report mode decision`);
  }
  if (/\bdelValue\s*\(\s*STORAGE_KEYS\.(?:DROP|DROP_OLD|STATS|STATS_OLD)\b/.test(text)) {
    violations.push(
      `${rel(reportFile)} must clear battle record sets through battle-record-archive`
    );
  }
  for (const legacy of [
    "recordBattleReportStarted",
    "readDropReport",
    "readUsageReport",
    "clearDropReport",
    "clearUsageReport",
  ]) {
    if (new RegExp(`export\\s+function\\s+${legacy}\\s*\\(`).test(text)) {
      violations.push(
        `${rel(reportFile)} legacy ${legacy} export must stay private behind runBattleReportAutomation(event)`
      );
    }
  }
}

function checkBattleReportViewEntry() {
  const viewFile = path.join(root, "src/monitor/battle-report-view.js");
  const text = fs.readFileSync(viewFile, "utf8");
  if (!/export const BattleReportViewEvent\s*=\s*Object\.freeze\(/.test(text)) {
    violations.push(`${rel(viewFile)} must expose BattleReportViewEvent`);
  }
  if (!/export function runBattleReportViewAutomation\(/.test(text)) {
    violations.push(`${rel(viewFile)} must expose runBattleReportViewAutomation(event)`);
  }
}

walk(srcDir);
checkEntry();
checkSettingsReportConsumption();
checkActionUsageCaptureEntry();
checkRecordArchiveEntry();
checkUsageImplementation();
checkBattleMonitorRuntimeEntry();
checkDeletedDropMonitorEntrypoint();
checkDeletedBattleInfoEntrypoint();
checkBattleReportEntry();
checkBattleReportViewEntry();

if (violations.length) {
  console.error("[verify-battle-monitor-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-battle-monitor-boundary] OK — battle monitor workflow is behind one entry");
