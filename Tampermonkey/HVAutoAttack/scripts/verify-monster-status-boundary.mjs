import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src/battle");
const entry = path.normalize("src/battle/monster-status-automation.js");
const entryTest = path.normalize("src/battle/monster-status-automation.test.js");
const statusView = path.normalize("src/battle/monster-status-view.js");
const statusViewTest = path.normalize("src/battle/monster-status-view.test.js");
const hpImpl = path.normalize("src/battle/monster-status-hp.js");
const hpImplTest = path.normalize("src/battle/monster-status-hp.test.js");
const maxHpInference = path.normalize("src/battle/monster-max-hp-inference.js");
const maxHpInferenceTest = path.normalize("src/battle/monster-max-hp-inference.test.js");
const targetWeight = path.normalize("src/battle/monster-target-weight.js");
const targetWeightTest = path.normalize("src/battle/monster-target-weight.test.js");
const parserEntry = path.normalize("src/battle/battle-log-parser.js");
const parserEntryTest = path.normalize("src/battle/battle-log-parser.test.js");
const roundStart = path.normalize("src/battle/battle-round-start.js");
const actionEventBridge = path.normalize("src/battle/battle-action-event-bridge.js");
const evidence = path.normalize("src/battle/monster-status-repair-evidence.js");
const evidenceTest = path.normalize("src/battle/monster-status-repair-evidence.test.js");
const diagnosticKeys = path.normalize("src/core/diagnostic-evidence-keys.js");
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
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) return;
    const where = `${rel(file)}:${index + 1}`;
    if (/\bfixMonsterStatus\b/.test(line)) {
      violations.push(`${where} legacy fixMonsterStatus path is forbidden`);
    }
    if (
      (relative === roundStart || relative === actionEventBridge) &&
      /btm1|btm2|nbardead|g\(\s*["'](?:monsterAll|monsterAlive|bossAll|bossAlive)["']\s*,/.test(
        line
      ) &&
      !line.includes("runMonsterStatusAutomation") &&
      !line.includes("MonsterStatusEvent")
    ) {
      violations.push(`${where} combatant counts belong behind runMonsterStatusAutomation(event)`);
    }
    if (/\bcountMonsterHP\b/.test(line)) {
      violations.push(`${where} legacy countMonsterHP path is forbidden`);
    }
    if (relative !== entry && relative !== hpImpl && /\bupdateMonsterHpRuntime\b/.test(line)) {
      violations.push(
        `${where} monster HP updates belong behind runMonsterStatusAutomation(event)`
      );
    }
    if (/\b(?:getValue|setValue)\(\s*["']monsterStatus["']/.test(line)) {
      violations.push(
        `${where} monsterStatus persistence belongs in runMonsterStatusAutomation(event)`
      );
    }
    if (relative === hpImpl && /\bg\(\s*["']option["']/.test(line)) {
      violations.push(`${where} monster HP target weights must read options through option entry`);
    }
  });
}

function checkEntry() {
  const text = fs.readFileSync(path.join(root, entry), "utf8");
  if (!/export function runMonsterStatusAutomation\(/.test(text)) {
    violations.push(`${entry.replaceAll("\\", "/")} must expose runMonsterStatusAutomation(event)`);
  }
  if (!text.includes("STORAGE_KEYS.MONSTER_STATUS")) {
    violations.push(`${entry.replaceAll("\\", "/")} must use STORAGE_KEYS.MONSTER_STATUS`);
  }
  for (const required of [
    "DEFAULT_COMBATANT_COUNT",
    "monsterStatusEventHandlers",
    "normalizeCombatantCount",
    "combatantCounts",
    "MonsterStatusHpRuntimeEvent.UPDATE",
    "runMonsterStatusHpRuntime",
    "BattleLogParserEvent.PARSE_MONSTER_ROSTER",
    "BattleLogParserEvent.BUILD_MONSTER_STATUS",
    "runBattleLogParser",
    "monsterStatus",
    "REFRESH_COMBATANT_COUNTS",
    "PREPARE_ROUND_START",
    "READ_COMBATANT_COUNTS",
    "READ_IDS_BY_ORDER",
    "READ_STATUS",
    'source: "monsterStatusRepair"',
    "REPAIR_SOURCE_ROUND_START_LOG",
    "REPAIR_SOURCE_RENDERED_SNAPSHOT",
    "runMonsterStatusRepairEvidence",
    "MonsterStatusRepairEvidenceEvent.RECORD_REPAIR",
    "reloadRepairDetail",
    "navigationResult: false",
    "navigationError",
    "unknownMonsterStatusEvent",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${entry.replaceAll("\\", "/")} must own ${required} wiring`);
    }
  }
  if ((text.match(/combatantCounts\(/g) || []).length < 3) {
    violations.push(
      `${entry.replaceAll("\\", "/")} must normalize combatant counts on refresh and read`
    );
  }
  for (const forbidden of ["gE(", "btm1", "btm2", "nbardead"]) {
    if (text.includes(forbidden)) {
      violations.push(
        `${entry.replaceAll("\\", "/")} must read combatant DOM facts through monster-status-view`
      );
    }
  }
  for (const required of [
    "MonsterStatusViewEvent.READ_COMBATANT_COUNTS",
    "MonsterStatusViewEvent.READ_REPAIR_SNAPSHOT",
    "runMonsterStatusView",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${entry.replaceAll("\\", "/")} must consume ${required}`);
    }
  }
  if (/RECORD_SPAWN_ROSTER/.test(text)) {
    violations.push(`${entry.replaceAll("\\", "/")} must keep spawn roster behind prepare event`);
  }
  const roundStartText = fs.readFileSync(path.join(root, roundStart), "utf8");
  if (/MonsterStatusEvent\.(?:RECORD_SPAWN_ROSTER|ENSURE_READY)/.test(roundStartText)) {
    violations.push(`${roundStart.replaceAll("\\", "/")} must use PREPARE_ROUND_START`);
  }
  if (/battleLog:/.test(roundStartText)) {
    violations.push(`${roundStart.replaceAll("\\", "/")} must pass text rows, not raw battleLog`);
  }
  if (!text.includes("battleLogRows")) {
    violations.push(`${entry.replaceAll("\\", "/")} must parse spawn rosters from text rows`);
  }
  if (!text.includes("BattleRoundStartLogEvent.READ_CURRENT")) {
    violations.push(
      `${entry.replaceAll("\\", "/")} repair must read textlog through round-start log entry`
    );
  }
  if (/#textlog|textContent/.test(text)) {
    violations.push(`${entry.replaceAll("\\", "/")} must not read textlog DOM directly`);
  }
  const entryBody =
    text.match(/export function runMonsterStatusAutomation\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_ENSURE_READY\]/.test(text)) {
    violations.push(
      `${entry.replaceAll("\\", "/")} must route events through a frozen handler table`
    );
  }
  if (/event\.type\s*===/.test(entryBody)) {
    violations.push(`${entry.replaceAll("\\", "/")} entry must dispatch by handler table`);
  }
  if (!fs.existsSync(path.join(root, entryTest))) {
    violations.push(`${entryTest.replaceAll("\\", "/")} must cover monster status entry`);
  } else {
    const testText = fs.readFileSync(path.join(root, entryTest), "utf8");
    if (!testText.includes("rejects unknown monster status events without side effects")) {
      violations.push(
        `${entryTest.replaceAll("\\", "/")} must cover unknown monster status events`
      );
    }
    if (!testText.includes("rejects null monster status events without side effects")) {
      violations.push(`${entryTest.replaceAll("\\", "/")} must cover null monster status events`);
    }
    if (!testText.includes("HVAA:lastBattleMonsterStatusRepair")) {
      violations.push(
        `${entryTest.replaceAll("\\", "/")} must assert monster status repair evidence`
      );
    }
  }
  const repairLogTest = path.normalize("src/battle/monster-status-repair-log.test.js");
  const repairLogTestText = fs.existsSync(path.join(root, repairLogTest))
    ? fs.readFileSync(path.join(root, repairLogTest), "utf8")
    : "";
  if (
    !repairLogTestText.includes("keeps repaired monster status when reload scheduling throws") ||
    !repairLogTestText.includes('navigationError: "navigation bridge failed"')
  ) {
    violations.push(
      `${repairLogTest.replaceAll("\\", "/")} must cover thrown repair reload scheduling with evidence`
    );
  }
  const evidenceText = fs.existsSync(path.join(root, evidence))
    ? fs.readFileSync(path.join(root, evidence), "utf8")
    : "";
  if (!evidenceText.includes("DiagnosticEvidenceKey.BATTLE_MONSTER_STATUS_REPAIR")) {
    violations.push(`${evidence.replaceAll("\\", "/")} must write diagnostic evidence`);
  }
  if (!evidenceText.includes("monsterStatusRepairEvidenceEventHandlers[event?.type]")) {
    violations.push(`${evidence.replaceAll("\\", "/")} must reject null evidence events`);
  }
  const evidenceTestText = fs.existsSync(path.join(root, evidenceTest))
    ? fs.readFileSync(path.join(root, evidenceTest), "utf8")
    : "";
  if (
    !evidenceTestText.includes(
      "rejects unknown and null evidence events without writing diagnostics"
    ) ||
    !evidenceTestText.includes(
      "keeps monster status repair evidence visible when storage is unavailable"
    ) ||
    !evidenceTestText.includes(
      "keeps monster status repair evidence stored when debug output fails"
    ) ||
    !evidenceTestText.includes('storageWriteError: "quota"') ||
    !evidenceTestText.includes("console blocked") ||
    !evidenceTestText.includes("runMonsterStatusRepairEvidence(null") ||
    !evidenceTestText.includes("HVAA:lastBattleMonsterStatusRepair")
  ) {
    violations.push(
      `${evidenceTest.replaceAll("\\", "/")} must cover invalid repair evidence events`
    );
  }
  const diagnosticText = fs.readFileSync(path.join(root, diagnosticKeys), "utf8");
  for (const required of [
    'BATTLE_MONSTER_STATUS_REPAIR: "HVAA:lastBattleMonsterStatusRepair"',
    'source("battleMonsterStatusRepair", DiagnosticEvidenceKey.BATTLE_MONSTER_STATUS_REPAIR)',
  ]) {
    if (!diagnosticText.includes(required)) {
      violations.push(`${diagnosticKeys.replaceAll("\\", "/")} must include ${required}`);
    }
  }
}

function checkParser() {
  const entryText = fs.readFileSync(path.join(root, parserEntry), "utf8");
  const entryBody =
    entryText.match(/export function runBattleLogParser\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
  for (const required of [
    "BattleLogParserEvent",
    "battleLogParserEventHandlers",
    "runBattleLogParser",
    "PARSE_CURRENT_LOG",
    "ESTIMATE_PLAYER_INCOMING_DPS",
    "ESTIMATE_PER_MONSTER_DPS",
    "PARSE_MONSTER_ROSTER",
    "BUILD_MONSTER_STATUS",
    "ACCUMULATE_DAMAGE_BY_MONSTER",
  ]) {
    if (!entryText.includes(required)) {
      violations.push(`${parserEntry.replaceAll("\\", "/")} must own ${required}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!BattleLogParserEvent\b|runBattleLogParser\b)/.test(
      entryText
    )
  ) {
    violations.push(`${parserEntry.replaceAll("\\", "/")} may export only its event entry`);
  }
  if (/battleLogParserEventHandlers\[event\.type\]/.test(entryBody)) {
    violations.push(
      `${parserEntry.replaceAll("\\", "/")} must fail closed for invalid parser events`
    );
  }
  if (!/battleLogParserEventHandlers\[event\?\.type\]/.test(entryBody)) {
    violations.push(
      `${parserEntry.replaceAll("\\", "/")} must dispatch invalid parser events through optional type`
    );
  }
  if (!fs.existsSync(path.join(root, parserEntryTest))) {
    violations.push(`${parserEntryTest.replaceAll("\\", "/")} must cover battle log parser entry`);
  } else {
    const testText = fs.readFileSync(path.join(root, parserEntryTest), "utf8");
    if (!testText.includes("rejects invalid battle log parser events without reading log DOM")) {
      violations.push(`${parserEntryTest.replaceAll("\\", "/")} must cover invalid parser events`);
    }
    if (!/runBattleLogParser\(null\)/.test(testText)) {
      violations.push(`${parserEntryTest.replaceAll("\\", "/")} must cover null parser events`);
    }
  }
  const parserImpl = path.normalize("src/battle/log-parser.js");
  if (fs.existsSync(path.join(root, parserImpl))) {
    violations.push(`${parserImpl.replaceAll("\\", "/")} legacy parser helpers must stay retired`);
  }
  if (!/function parseMonsterRoster\(battleLogRows, monsterAll\)/.test(entryText)) {
    violations.push(
      `${parserEntry.replaceAll("\\", "/")} must name spawn parser input battleLogRows`
    );
  }
  const rosterBody = entryText.slice(
    entryText.indexOf("function parseMonsterRoster"),
    entryText.indexOf("function buildMonsterStatus")
  );
  if (/textContent|typeof\s+battleLogRows\[i\]/.test(rosterBody)) {
    violations.push(
      `${parserEntry.replaceAll("\\", "/")} parseMonsterRoster must not accept DOM rows`
    );
  }
}

function checkStatusView() {
  const text = fs.readFileSync(path.join(root, statusView), "utf8");
  for (const required of [
    "export const MonsterStatusViewEvent",
    "export function runMonsterStatusView",
    "monsterStatusViewEventHandlers",
    "READ_COMBATANT_COUNTS",
    "READ_REPAIR_SNAPSHOT",
    "READ_HP_RUNTIME_SNAPSHOT",
    'gE("div.btm1"',
    'gE("div.btm4>div.btm5:nth-child(1)"',
    "activeDebuffKeys",
    'img[src*="nbardead"]',
    'gE("div.btm2"',
  ]) {
    if (!text.includes(required)) {
      violations.push(`${statusView.replaceAll("\\", "/")} must own ${required}`);
    }
  }
  for (const forbidden of ["../state/store.js", "../state/storage.js", "setValue(", "g("]) {
    if (text.includes(forbidden)) {
      violations.push(`${statusView.replaceAll("\\", "/")} must only snapshot rendered DOM facts`);
    }
  }
  const entryBody =
    text.match(/export function runMonsterStatusView\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_READ_COMBATANT_COUNTS\]/.test(text)) {
    violations.push(
      `${statusView.replaceAll("\\", "/")} must route events through a frozen handler table`
    );
  }
  if (/event\.type\s*===/.test(entryBody)) {
    violations.push(`${statusView.replaceAll("\\", "/")} entry must dispatch by handler table`);
  }
  if (/monsterStatusViewEventHandlers\[event\.type\]/.test(entryBody)) {
    violations.push(
      `${statusView.replaceAll("\\", "/")} entry must fail closed for invalid status view events`
    );
  }
  if (!/monsterStatusViewEventHandlers\[event\?\.type\]/.test(entryBody)) {
    violations.push(
      `${statusView.replaceAll("\\", "/")} entry must dispatch invalid status view events through optional type`
    );
  }
  if (!fs.existsSync(path.join(root, statusViewTest))) {
    violations.push(`${statusViewTest.replaceAll("\\", "/")} must cover monster status view entry`);
  } else {
    const testText = fs.readFileSync(path.join(root, statusViewTest), "utf8");
    if (
      !testText.includes("rejects unknown monster status view events without reading rendered DOM")
    ) {
      violations.push(
        `${statusViewTest.replaceAll("\\", "/")} must cover unknown status view events`
      );
    }
    if (!/runMonsterStatusView\(null\)/.test(testText)) {
      violations.push(`${statusViewTest.replaceAll("\\", "/")} must cover null status view events`);
    }
  }
}

function checkHpImpl() {
  const text = fs.readFileSync(path.join(root, hpImpl), "utf8");
  for (const required of ["OptionEvent.READ_FIELD", "runOptionAutomation"]) {
    if (!text.includes(required)) {
      violations.push(
        `${hpImpl.replaceAll("\\", "/")} must read target weight options through ${required}`
      );
    }
  }
  for (const required of [
    "MonsterStatusHpRuntimeEvent",
    "monsterStatusHpRuntimeEventHandlers",
    "runMonsterStatusHpRuntime",
    "UPDATE",
    "MonsterStatusViewEvent.READ_HP_RUNTIME_SNAPSHOT",
    "BattleLogTelemetryEvent.READ_CURRENT",
    "MonsterMaxHpInferenceEvent.APPLY_DEATHS",
    "MonsterTargetWeightEvent.APPLY",
    "runBattleLogTelemetry",
    "runMonsterMaxHpInference",
    "runMonsterStatusView",
    "runMonsterTargetWeight",
    "statusByOrder",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${hpImpl.replaceAll("\\", "/")} must update HP from ${required}`);
    }
  }
  if (
    /\bexport\s+(?:function|const)\s+(?!MonsterStatusHpRuntimeEvent\b|runMonsterStatusHpRuntime\b)/.test(
      text
    )
  ) {
    violations.push(`${hpImpl.replaceAll("\\", "/")} may export only its event entry`);
  }
  const entryBody =
    text.match(/export function runMonsterStatusHpRuntime\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_UPDATE\]/.test(text)) {
    violations.push(
      `${hpImpl.replaceAll("\\", "/")} must route events through a frozen handler table`
    );
  }
  if (/event\.type\s*===/.test(entryBody)) {
    violations.push(`${hpImpl.replaceAll("\\", "/")} entry must dispatch by handler table`);
  }
  if (/monsterStatusHpRuntimeEventHandlers\[event\.type\]/.test(entryBody)) {
    violations.push(
      `${hpImpl.replaceAll("\\", "/")} entry must fail closed for invalid HP runtime events`
    );
  }
  if (!/monsterStatusHpRuntimeEventHandlers\[event\?\.type\]/.test(entryBody)) {
    violations.push(
      `${hpImpl.replaceAll("\\", "/")} entry must dispatch invalid HP runtime events through optional type`
    );
  }
  if (!fs.existsSync(path.join(root, hpImplTest))) {
    violations.push(`${hpImplTest.replaceAll("\\", "/")} must cover HP runtime entry`);
  } else {
    const testText = fs.readFileSync(path.join(root, hpImplTest), "utf8");
    if (
      !testText.includes("rejects unknown monster status HP runtime events without side effects")
    ) {
      violations.push(`${hpImplTest.replaceAll("\\", "/")} must cover unknown HP runtime events`);
    }
    if (!/runMonsterStatusHpRuntime\(null\)/.test(testText)) {
      violations.push(`${hpImplTest.replaceAll("\\", "/")} must cover null HP runtime events`);
    }
  }
  for (const forbidden of ["gE(", "btm1", "btm4", "btm5", "btm6", "nbardead"]) {
    if (text.includes(forbidden)) {
      violations.push(`${hpImpl.replaceAll("\\", "/")} must not read monster status DOM directly`);
    }
  }
  for (const forbidden of [
    "parseBattleLog",
    "accumulateDamageByMonster",
    "normalizeMonsterName",
    "MonsterDbStoreEvent.HP_READ",
    "MonsterDbStoreEvent.HP_WRITE",
    "inferredThisPage",
    "weightFactor",
  ]) {
    if (text.includes(forbidden)) {
      violations.push(
        `${hpImpl.replaceAll("\\", "/")} max HP learning and target weighting belong in sub-capability entries`
      );
    }
  }
}

function checkMaxHpInference() {
  const text = fs.readFileSync(path.join(root, maxHpInference), "utf8");
  for (const required of [
    "export const MonsterMaxHpInferenceEvent",
    "export function runMonsterMaxHpInference",
    "monsterMaxHpInferenceEventHandlers",
    "APPLY_DEATHS",
    "BattleLogParserEvent.ACCUMULATE_DAMAGE_BY_MONSTER",
    "runBattleLogParser",
    "MonsterDbStoreEvent.HP_READ",
    "MonsterDbStoreEvent.HP_WRITE",
    "inferredThisPage",
    "event.battleLog",
    "recordMonsterKnowledgePersistenceFailure",
    "death-inference-store-hp",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${maxHpInference.replaceAll("\\", "/")} must own ${required}`);
    }
  }
  if (/parseBattleLog/.test(text)) {
    violations.push(
      `${maxHpInference.replaceAll("\\", "/")} must consume event battleLog, not parse textlog directly`
    );
  }
  const entryBody =
    text.match(/export function runMonsterMaxHpInference\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_APPLY_DEATHS\]/.test(text)) {
    violations.push(
      `${maxHpInference.replaceAll("\\", "/")} must route events through a frozen handler table`
    );
  }
  if (/event\.type\s*===/.test(entryBody)) {
    violations.push(`${maxHpInference.replaceAll("\\", "/")} entry must dispatch by handler table`);
  }
  if (/monsterMaxHpInferenceEventHandlers\[event\.type\]/.test(entryBody)) {
    violations.push(
      `${maxHpInference.replaceAll("\\", "/")} entry must fail closed for invalid max HP inference events`
    );
  }
  if (!/monsterMaxHpInferenceEventHandlers\[event\?\.type\]/.test(entryBody)) {
    violations.push(
      `${maxHpInference.replaceAll("\\", "/")} entry must dispatch invalid max HP inference events through optional type`
    );
  }
  if (!fs.existsSync(path.join(root, maxHpInferenceTest))) {
    violations.push(
      `${maxHpInferenceTest.replaceAll("\\", "/")} must cover max HP inference entry`
    );
  } else {
    const testText = fs.readFileSync(path.join(root, maxHpInferenceTest), "utf8");
    if (
      !testText.includes(
        "rejects unknown monster max HP inference events without reading or writing"
      )
    ) {
      violations.push(
        `${maxHpInferenceTest.replaceAll("\\", "/")} must cover unknown max HP inference events`
      );
    }
    if (!/runMonsterMaxHpInference\(null/.test(testText)) {
      violations.push(
        `${maxHpInferenceTest.replaceAll("\\", "/")} must cover null max HP inference events`
      );
    }
  }
  const failureTest = path.normalize("src/battle/monster-max-hp-inference-failure.test.js");
  const failureTestText = fs.existsSync(path.join(root, failureTest))
    ? fs.readFileSync(path.join(root, failureTest), "utf8")
    : "";
  for (const required of [
    "records stored HP read failures without throwing from inference",
    "records stored HP write failures without throwing from inference",
  ]) {
    if (!failureTestText.includes(required)) {
      violations.push(`${failureTest.replaceAll("\\", "/")} must cover ${required}`);
    }
  }
}

function checkTargetWeight() {
  const text = fs.readFileSync(path.join(root, targetWeight), "utf8");
  for (const required of [
    "export const MonsterTargetWeightEvent",
    "export function runMonsterTargetWeight",
    "monsterTargetWeightEventHandlers",
    "APPLY",
    "finitePositive",
    "optionWeight",
    "Infinity",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${targetWeight.replaceAll("\\", "/")} must own ${required}`);
    }
  }
  for (const forbidden of [
    "../state/store.js",
    "../state/option.js",
    "g(",
    "runOptionAutomation",
  ]) {
    if (text.includes(forbidden)) {
      violations.push(`${targetWeight.replaceAll("\\", "/")} must stay a pure weighting core`);
    }
  }
  const entryBody =
    text.match(/export function runMonsterTargetWeight\([^)]*\) \{[\s\S]*?\n\}/)?.[0] || "";
  if (!/Object\.freeze\(\{[\s\S]*\[EVENT_APPLY\]/.test(text)) {
    violations.push(
      `${targetWeight.replaceAll("\\", "/")} must route events through a frozen handler table`
    );
  }
  if (/event\.type\s*===/.test(entryBody)) {
    violations.push(`${targetWeight.replaceAll("\\", "/")} entry must dispatch by handler table`);
  }
  if (/monsterTargetWeightEventHandlers\[event\.type\]/.test(entryBody)) {
    violations.push(
      `${targetWeight.replaceAll("\\", "/")} entry must fail closed for invalid target weight events`
    );
  }
  if (!/monsterTargetWeightEventHandlers\[event\?\.type\]/.test(entryBody)) {
    violations.push(
      `${targetWeight.replaceAll("\\", "/")} entry must dispatch invalid target weight events through optional type`
    );
  }
  if (!fs.existsSync(path.join(root, targetWeightTest))) {
    violations.push(`${targetWeightTest.replaceAll("\\", "/")} must cover target weight entry`);
  } else {
    const testText = fs.readFileSync(path.join(root, targetWeightTest), "utf8");
    if (!testText.includes("rejects unknown monster target weight events")) {
      violations.push(
        `${targetWeightTest.replaceAll("\\", "/")} must cover unknown target weight events`
      );
    }
    if (!/runMonsterTargetWeight\(null\)/.test(testText)) {
      violations.push(
        `${targetWeightTest.replaceAll("\\", "/")} must cover null target weight events`
      );
    }
  }
}

function checkLogParserImports() {
  const allowed = new Set([
    parserEntry,
    parserEntryTest,
    path.normalize("src/battle/log-parser.test.js"),
  ]);
  for (const item of fs.readdirSync(srcDir, { recursive: true, withFileTypes: true })) {
    if (!item.isFile() || !item.name.endsWith(".js")) continue;
    const file = path.join(item.parentPath, item.name);
    const relative = path.normalize(path.relative(root, file));
    if (allowed.has(relative)) continue;
    const text = fs.readFileSync(file, "utf8");
    if (/from\s+["'][^"']*(?:^|[\\/])log-parser\.js["']/.test(text)) {
      violations.push(
        `${relative.replaceAll("\\", "/")} must parse battle logs through runBattleLogParser`
      );
    }
  }
}

walk(srcDir);
checkEntry();
checkStatusView();
checkHpImpl();
checkMaxHpInference();
checkTargetWeight();
checkParser();
checkLogParserImports();

if (violations.length) {
  console.error("[verify-monster-status-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-monster-status-boundary] OK — monster status lifecycle is behind one entry");
