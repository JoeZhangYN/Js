import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/pages/encounter.js");
const entryExecutionFile = path.normalize("src/pages/encounter-entry-execution.js");
const entryExecutionFailureTest = path.normalize(
  "src/pages/encounter-entry-execution-failure.test.js"
);
const stateHelper = path.normalize("src/pages/encounter-state.js");
const stateTest = path.normalize("src/pages/encounter-state.test.js");
const stateDawnRecoveryTest = path.normalize("src/pages/encounter-state-dawn-recovery.test.js");
const stateEvidenceTest = path.normalize("src/pages/encounter-state-evidence.test.js");
const stateFailureFile = path.normalize("src/pages/encounter-state-failure.js");
const stateFailureTest = path.normalize("src/pages/encounter-state-failure.test.js");
const entryPolicyFile = path.normalize("src/pages/encounter-entry-policy.js");
const generationRecoveryFile = path.normalize("src/pages/encounter-generation-recovery.js");
const generationRecoveryTest = path.normalize("src/pages/encounter-generation-recovery.test.js");
const isekaiEntryTest = path.normalize("src/pages/encounter-isekai-entry.test.js");
const policyFile = path.normalize("src/pages/encounter-policy.js");
const policyTest = path.normalize("src/pages/encounter-policy.test.js");
const policyRouteTest = path.normalize("src/pages/encounter-policy-route.test.js");
const policyCorruptStateTest = path.normalize("src/pages/encounter-policy-corrupt-state.test.js");
const routingTest = path.normalize("src/pages/encounter-routing.test.js");
const rejectionFile = path.normalize("src/pages/encounter-rejection.js");
const bridgeFile = path.normalize("src/pages/encounter-bridge.js");
const hvUtilsFile = path.normalize("src/i18n/hv-utils.js");
const legacyWidgetFile = path.normalize("src/pages/encounter-widget.js");
const widgetPolicyFile = path.normalize("src/pages/encounter-widget-policy.js");
const widgetPolicyTest = path.normalize("src/pages/encounter-widget-policy.test.js");
const widgetMainWorldTest = path.normalize("src/pages/encounter-widget-main-world.test.js");
const widgetGenerationRecoveryTest = path.normalize(
  "src/pages/encounter-widget-generation-recovery.test.js"
);
const lobbyScheduleFile = path.normalize("src/pages/encounter-lobby-schedule.js");
const lobbyScheduleTest = path.normalize("src/pages/encounter-lobby-schedule.test.js");
const optionGateFile = path.normalize("src/pages/encounter-option-gate.js");
const dayRecordFile = path.normalize("src/state/day-record.js");
const timeFile = path.normalize("src/core/time.js");
const diagnosticKeys = path.normalize("src/core/diagnostic-evidence-keys.js");
const diagnosticTest = path.normalize("src/core/diagnostic-evidence.test.js");
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

  if (relative === legacyWidgetFile) {
    violations.push(
      `${rel(file)} legacy encounter widget implementation must stay collapsed into runEncounterAutomation(event)`
    );
  }

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
      relative !== stateTest &&
      relative !== stateDawnRecoveryTest &&
      relative !== stateEvidenceTest &&
      relative !== stateFailureTest &&
      relative !== policyFile &&
      relative !== bridgeFile &&
      /\bhvut_re\b/.test(line)
    ) {
      violations.push(`${where} direct hvut_re access outside encounter boundary is forbidden`);
    }
    if (
      relative !== owner &&
      relative !== entryExecutionFile &&
      relative !== stateTest &&
      relative !== stateDawnRecoveryTest &&
      relative !== stateEvidenceTest &&
      relative !== bridgeFile &&
      /from\s+["']\.\/encounter-state\.js["']/.test(line)
    ) {
      violations.push(`${where} encounter-state is internal; import runEncounterAutomation(event)`);
    }
    if (
      relative === stateHelper &&
      /export function (?:writeReState|readCurrentReState|markRandomEncounterStarted|loadEncounterKey)\b/.test(
        line
      )
    ) {
      violations.push(
        `${where} encounter state IO must stay private behind runEncounterStateAutomation(event)`
      );
    }
    if (
      relative === stateHelper &&
      !/\brunEncounterStateAutomation\b|\bEncounterStateEvent\b/.test(line) &&
      /export (?:function|const)\b/.test(line)
    ) {
      violations.push(`${where} encounter-state may export only its event entry`);
    }
    if (/from\s+["']\.\/encounter-widget\.js["']/.test(line)) {
      violations.push(
        `${where} encounter widget implementation is internal; import runEncounterAutomation(event)`
      );
    }
    if (
      relative !== owner &&
      relative !== widgetPolicyTest &&
      relative !== widgetMainWorldTest &&
      relative !== widgetGenerationRecoveryTest &&
      /from\s+["']\.\/encounter-widget-policy\.js["']/.test(line)
    ) {
      violations.push(
        `${where} encounter widget policy is internal to runEncounterAutomation(event)`
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
    if (
      relative !== policyFile &&
      relative !== policyTest &&
      /\b1800000\b|30\s*\*\s*60\s*\*\s*1000/.test(line)
    ) {
      violations.push(`${where} encounter interval belongs in encounter-policy.js`);
    }
    if (relative !== policyFile && relative !== policyTest && /\bcount\s*>=\s*24\b/.test(line)) {
      violations.push(`${where} encounter daily limit belongs in encounter-policy.js`);
    }
    if (
      relative !== policyFile &&
      relative !== dayRecordFile &&
      relative !== timeFile &&
      /Date\.UTC\(.*getUTCFullYear\(\).*getUTCMonth\(\).*getUTCDate\(\)\s*\+\s*1/.test(line)
    ) {
      violations.push(`${where} encounter midnight scheduling belongs in encounter-policy.js`);
    }
    if (
      relative !== policyFile &&
      relative !== entryPolicyFile &&
      /encounter=\(\[A-Za-z0-9=\]\+\)/.test(line)
    ) {
      violations.push(`${where} encounter key parsing belongs in encounter-policy.js`);
    }
    if (relative !== owner && /\bnextCheckMs\b/.test(line)) {
      violations.push(
        `${where} encounter check timing belongs inside runEncounterAutomation(event)`
      );
    }
    if (relative !== owner && /\bscheduleNextLobbyAutomation\b/.test(line)) {
      violations.push(`${where} lobby must not own encounter retry timers`);
    }
    if (
      relative === widgetPolicyFile &&
      /\b(?:setTimeout|setInterval|location\.href|window\.open)\b/.test(line)
    ) {
      violations.push(`${where} encounter widget policy must stay pure; effects belong to callers`);
    }
    if (
      relative === policyFile &&
      /\bexport\s+(?:function|const)\s+(?!EncounterPolicyEvent\b|runEncounterPolicy\b)/.test(line)
    ) {
      violations.push(
        `${where} encounter policy may export only EncounterPolicyEvent and runEncounterPolicy(event)`
      );
    }
    if (
      relative !== policyFile &&
      relative !== policyTest &&
      relative !== lobbyScheduleFile &&
      relative !== lobbyScheduleTest &&
      /\b(defaultEncounterState|resetEncounterDay|normalizeEncounterState|msUntilEncounterReady|canEnterEncounterState|readEncounterReadiness|readEncounterClock|countdownEncounterClock|msUntilNextEncounterCheck|planNextEncounterCheck|planEncounterActivation|parseEncounterKeyFromEventpaneHtml|parseEncounterKeyFromSearch|buildEncounterUrl|markEncounterKeyAvailable|markEncounterStarted)\b/.test(
        line
      )
    ) {
      violations.push(
        `${where} encounter policy helper usage is forbidden; use runEncounterPolicy(event)`
      );
    }
    if (
      relative === owner &&
      /\bscheduledLobbyTick\b|\bsetTimeout\b|\bclearTimeout\b|EncounterPolicyEvent\.PLAN_NEXT_CHECK/.test(
        line
      )
    ) {
      violations.push(
        `${where} encounter lobby retry scheduling belongs in runEncounterLobbySchedule(event)`
      );
    }
    if (
      relative !== owner &&
      relative !== lobbyScheduleFile &&
      relative !== lobbyScheduleTest &&
      /from\s+["']\.\/encounter-lobby-schedule\.js["']/.test(line)
    ) {
      violations.push(
        `${where} encounter lobby schedule is internal to runEncounterAutomation(event)`
      );
    }
    if (
      relative === lobbyScheduleFile &&
      /\bexport\s+(?:function|const)\s+(?!EncounterLobbyScheduleEvent\b|runEncounterLobbySchedule\b)/.test(
        line
      )
    ) {
      violations.push(`${where} encounter lobby schedule may export only its event entry`);
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
    if (
      relative === hvUtilsFile &&
      /\bexecuteEncounterAction\b|outcome\?\.action === ['"](?:navigate|open)['"]|location\.href = outcome\.href|window\.open\(outcome\.href/.test(
        line
      )
    ) {
      violations.push(
        `${where} encounter widget navigation effects belong in runEncounterAutomation(event)`
      );
    }
    if (
      /\bWIDGET_ENGAGE\b|\bwidgetEngage\b|\bre\.engage\b/.test(line) ||
      ((relative === hvUtilsFile || relative === widgetPolicyFile) &&
        /action:\s*["']enter["']|outcome\?\.action === ["']enter["']/.test(line))
    ) {
      violations.push(
        `${where} legacy encounter widget enter bridge is forbidden; WIDGET_CLICKED must be handled by runEncounterAutomation(event)`
      );
    }
  });
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
const entryExecutionText = fs.readFileSync(path.join(root, entryExecutionFile), "utf8");
const stateHelperText = fs.readFileSync(path.join(root, stateHelper), "utf8");
const stateFailureText = fs.readFileSync(path.join(root, stateFailureFile), "utf8");
const stateFailureTestText = fs.readFileSync(path.join(root, stateFailureTest), "utf8");
const stateEvidenceTestText = fs.readFileSync(path.join(root, stateEvidenceTest), "utf8");
const diagnosticKeysText = fs.readFileSync(path.join(root, diagnosticKeys), "utf8");
const diagnosticTestText = fs.readFileSync(path.join(root, diagnosticTest), "utf8");
const policyText = fs.readFileSync(path.join(root, policyFile), "utf8");
const entryPolicyText = fs.readFileSync(path.join(root, entryPolicyFile), "utf8");
const generationRecoveryText = fs.readFileSync(path.join(root, generationRecoveryFile), "utf8");
const policyTestText = [
  policyTest,
  policyRouteTest,
  generationRecoveryTest,
  isekaiEntryTest,
].map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
const policyCorruptStateTestText = fs.existsSync(path.join(root, policyCorruptStateTest))
  ? fs.readFileSync(path.join(root, policyCorruptStateTest), "utf8")
  : "";
const rejectionText = fs.readFileSync(path.join(root, rejectionFile), "utf8");
const hvUtilsText = fs.readFileSync(path.join(root, hvUtilsFile), "utf8");
const widgetPolicyText = fs.readFileSync(path.join(root, widgetPolicyFile), "utf8");
const widgetUnavailableText = fs.readFileSync(
  path.join(root, "src/pages/encounter-widget-unavailable.js"),
  "utf8"
);
const widgetPolicyTestText = [
  widgetPolicyTest,
  widgetMainWorldTest,
  widgetGenerationRecoveryTest,
].map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
const entryExecutionFailureTestText = fs.readFileSync(
  path.join(root, entryExecutionFailureTest),
  "utf8"
);
if (!/\bfunction executeEncounterEntry\b/.test(entryExecutionText)) {
  violations.push(
    `${entryExecutionFile.replaceAll("\\", "/")} must execute manual and automatic encounter entry through one function`
  );
}
if (
  !entryExecutionText.includes("navigationFailed") ||
  !entryExecutionText.includes("handled: false")
) {
  violations.push(
    `${entryExecutionFile.replaceAll("\\", "/")} must not claim handled encounter entry when navigation fails`
  );
}
for (const required of [
  "does not claim a widget encounter when navigation is blocked",
  "does not claim a gallery encounter when opening the battle tab is blocked",
  "navigationFailed",
  "handled: false",
  "clear: false",
]) {
  if (!entryExecutionFailureTestText.includes(required)) {
    violations.push(
      `${entryExecutionFailureTest.replaceAll("\\", "/")} must cover failed encounter navigation without claiming success: ${required}`
    );
  }
}
for (const [label, action] of [
  ["navigate", "const navigated = runNavigationAutomation"],
  ["open", "const opened = runNavigationAutomation"],
]) {
  const actionIndex = entryExecutionText.indexOf(action);
  const markIndex = entryExecutionText.indexOf("markEncounterAttempted", actionIndex);
  if (actionIndex < 0 || markIndex < 0 || markIndex < actionIndex) {
    violations.push(
      `${entryExecutionFile.replaceAll("\\", "/")} must mark encounter attempted only after ${label} navigation succeeds`
    );
  }
}
for (const required of ["isAutomaticEncounterEnabled", "EVENT_RANDOM_ENCOUNTER_STARTED"]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}
if (!ownerText.includes('source: event.source')) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must pass typed random-encounter start authority into encounter state`
  );
}
if (!fs.readFileSync(path.join(root, "src/battle/battle-round-start.js"), "utf8").includes('source: "battleRoundStart"')) {
  violations.push("src/battle/battle-round-start.js must mark random encounters with battleRoundStart evidence");
}
if (!policyText.includes('source === "battleRoundStart"') || !policyText.includes("if (!key && !hasBattleStartEvidence) return next")) {
  violations.push(
    `${policyFile.replaceAll("\\", "/")} must require an encounter key or battle-start evidence before starting cooldown/count`
  );
}
for (const required of ["EncounterStateEvent.MARK_ATTEMPTED", "markEncounterAttempted"]) {
  if (!entryExecutionText.includes(required)) {
    violations.push(`${entryExecutionFile.replaceAll("\\", "/")} must own ${required}`);
  }
}
const widgetEngageBody =
  widgetPolicyText.match(/function planWidgetEngage\(event\) \{[\s\S]*?\n\}/)?.[0] || "";
if (widgetEngageBody.includes("MARK_STARTED")) {
  violations.push(
    `${widgetPolicyFile.replaceAll("\\", "/")} widget open planning must not mark an encounter attempted before navigation succeeds`
  );
}
if (!ownerText.includes("const encounterEventHandlers")) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must route encounter events through a handler table`
  );
}
const ownerEntryMatch = ownerText.match(/export function runEncounterAutomation[\s\S]*?\n}/);
if (!ownerEntryMatch) {
  violations.push(`${owner.replaceAll("\\", "/")} must expose runEncounterAutomation(event)`);
} else {
  const entryBody = ownerEntryMatch[0];
  if (
    /if\s*\(\s*event\.type\s*===/.test(entryBody) ||
    /event\.type\?\.startsWith/.test(entryBody)
  ) {
    violations.push(
      `${owner.replaceAll("\\", "/")} entry must not reintroduce event.type branching`
    );
  }
  for (const internal of ["runLobbyTick(", "markRandomEncounterStarted(", "executeWidgetEvent("]) {
    if (entryBody.includes(internal)) {
      violations.push(
        `${owner.replaceAll("\\", "/")} entry must dispatch through encounterEventHandlers`
      );
    }
  }
  if (/\|\|\s*encounterEventHandlers\[EVENT_LOBBY_TICK\]/.test(entryBody)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} explicit unknown encounter events must not run lobby tick`
    );
  }
  if (!entryBody.includes("rejectUnknownEncounterEvent")) {
    violations.push(
      `${owner.replaceAll("\\", "/")} unknown encounter events must use typed rejection`
    );
  }
}
for (const required of ["rejectUnknownEncounterEvent", "unknownEncounterEvent", "rejected: true"]) {
  if (!rejectionText.includes(required)) {
    violations.push(`${rejectionFile.replaceAll("\\", "/")} must own ${required}`);
  }
}
if (!fs.existsSync(path.join(root, routingTest))) {
  violations.push(`${routingTest.replaceAll("\\", "/")} must cover encounter event routing`);
} else {
  const routingTestText = fs.readFileSync(path.join(root, routingTest), "utf8");
  for (const required of [
    "rejects unknown encounter events without scheduling lobby checks",
    "unknownEncounterEvent",
    "expect(vi.getTimerCount()).toBe(0)",
  ]) {
    if (!routingTestText.includes(required)) {
      violations.push(`${routingTest.replaceAll("\\", "/")} must cover ${required}`);
    }
  }
}
if (!stateHelperText.includes("const encounterStateEventHandlers")) {
  violations.push(
    `${stateHelper.replaceAll("\\", "/")} must route encounter state events through a handler table`
  );
}
const stateEntryMatch = stateHelperText.match(
  /export function runEncounterStateAutomation[\s\S]*?\n}/
);
if (!stateEntryMatch) {
  violations.push(
    `${stateHelper.replaceAll("\\", "/")} must expose runEncounterStateAutomation(event)`
  );
} else {
  const entryBody = stateEntryMatch[0];
  if (entryBody.includes("event.type")) {
    violations.push(
      `${stateHelper.replaceAll("\\", "/")} entry must reject null events without throwing`
    );
  }
  if (!entryBody.includes("event?.type")) {
    violations.push(
      `${stateHelper.replaceAll("\\", "/")} entry must fail closed for unknown or null events`
    );
  }
  if (/if\s*\(\s*event\.type\s*===/.test(entryBody)) {
    violations.push(
      `${stateHelper.replaceAll("\\", "/")} entry must not reintroduce an event.type if-chain`
    );
  }
  for (const internal of [
    "readCurrentReState(",
    "markRandomEncounterStarted(",
    "loadEncounterKey(",
  ]) {
    if (entryBody.includes(internal)) {
      violations.push(
        `${stateHelper.replaceAll("\\", "/")} entry must dispatch through encounterStateEventHandlers`
      );
    }
  }
}
const stateTestText = [
  stateTest,
  stateDawnRecoveryTest,
].map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
if (
  !stateTestText.includes(
    "rejects unknown and null state events without reading or writing encounter state"
  ) ||
  !stateTestText.includes("runEncounterStateAutomation(null)")
) {
  violations.push(`${stateTest.replaceAll("\\", "/")} must cover unknown and null state events`);
}
for (const required of [
  "returns null without writing encounter state when news key loading fails",
  "returns null without writing encounter state when news key loading times out",
  "fails closed to default state when stored encounter JSON is corrupted",
  "falls back to localStorage when GM encounter state read fails",
  "falls back to localStorage when GM encounter state write fails",
  "records encounter local state write failures without throwing",
  "[HVAA] encounter state failed",
  "read-local-json",
  "read-gm",
  "write-gm",
  "write-local",
  "load-key-error",
  "load-key-timeout",
  "onerror({ status: 0 })",
  "ontimeout()",
]) {
  if (!stateTestText.includes(required))
    violations.push(`${stateTest.replaceAll("\\", "/")} must cover ${required}`);
}
for (const required of [
  "warnEncounterStateFailure",
  "recordEncounterStateFailure",
  "parseStoredReState",
  "read-local-json",
  "read-gm",
  "write-gm",
  "write-local",
  "load-key-error",
  "load-key-timeout",
]) {
  if (!stateHelperText.includes(required)) {
    violations.push(
      `${stateHelper.replaceAll("\\", "/")} must own encounter state failure ${required}`
    );
  }
}
for (const required of [
  "ENCOUNTER_STATE_FAILURE_KEY",
  "HVAA:lastEncounterStateFailure",
  'capability: "encounterState"',
  'source: "encounterState"',
  "storage?.setItem",
  'warn("[HVAA] encounter state failed"',
]) {
  if (!stateFailureText.includes(required)) {
    violations.push(
      `${stateFailureFile.replaceAll("\\", "/")} must own encounter failure evidence ${required}`
    );
  }
}
for (const required of [
  "records encounter state failures as structured evidence",
  "does not throw when evidence storage and console warning both fail",
]) {
  if (!stateFailureTestText.includes(required)) {
    violations.push(`${stateFailureTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}
for (const required of [
  "persists corrupted encounter state evidence while failing closed",
  "keeps encounter state fallback working when console warning throws",
  "keeps encounter state fallback working when failure evidence storage and warning fail",
  "HVAA:lastEncounterStateFailure",
  'capability: "encounterState"',
  'throw new Error("quota")',
  'throw new Error("warn blocked")',
  "not.toThrow()",
]) {
  if (!stateEvidenceTestText.includes(required)) {
    violations.push(`${stateEvidenceTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}
for (const required of [
  'ENCOUNTER_STATE_FAILURE: "HVAA:lastEncounterStateFailure"',
  'source("encounterStateFailure", DiagnosticEvidenceKey.ENCOUNTER_STATE_FAILURE)',
]) {
  if (!diagnosticKeysText.includes(required)) {
    violations.push(`${diagnosticKeys.replaceAll("\\", "/")} must expose ${required}`);
  }
}
for (const required of [
  "HVAA:lastEncounterStateFailure",
  'encounterStateFailure: { capability: "encounterState", stage: "read-local-json" }',
]) {
  if (!diagnosticTestText.includes(required)) {
    violations.push(`${diagnosticTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}
const optionGateText = fs.readFileSync(path.join(root, optionGateFile), "utf8");
for (const required of [
  "ENCOUNTER_OPTION_KEY",
  "HVUT_RE_NOTIFICATION_OPTION_KEY",
  "OptionEvent.READ_FIELD",
  "readOptionFlag(HVUT_RE_NOTIFICATION_OPTION_KEY, true)",
]) {
  if (!optionGateText.includes(required)) {
    violations.push(`${optionGateFile.replaceAll("\\", "/")} must own ${required}`);
  }
}
if (/key:\s*["']encounter["']/.test(optionGateText)) {
  violations.push(`${optionGateFile.replaceAll("\\", "/")} must use ENCOUNTER_OPTION_KEY`);
}
if (/key:\s*["']reNotification["']/.test(optionGateText)) {
  violations.push(
    `${optionGateFile.replaceAll("\\", "/")} must use HVUT_RE_NOTIFICATION_OPTION_KEY`
  );
}
const lobbyText = fs.readFileSync(path.join(root, "src/pages/lobby-automation.js"), "utf8");
if (!lobbyText.includes("isAutomaticEncounterEnabled")) {
  violations.push(
    "src/pages/lobby-automation.js must use encounter-option-gate for main-world encounter enablement"
  );
}
if (/isLobbyOptionEnabled\(["']encounter["']\)/.test(lobbyText)) {
  violations.push(
    "src/pages/lobby-automation.js must not bypass encounter-option-gate with raw encounter option reads"
  );
}
if (!/EncounterPolicyEvent\.READ_CLOCK/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} lobby countdown and widget countdown must read one encounter clock query`
  );
}
if (/EncounterPolicyEvent\.READINESS/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must not duplicate countdown readiness decisions; use READ_CLOCK`
  );
}
if (/\bexecuteEncounterActivation\b|\bexecuteWidgetNavigation\b/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must not keep separate lobby/widget encounter navigation executors`
  );
}
if (!/\bREAD_CLOCK\b/.test(policyText)) {
  violations.push(`${policyFile.replaceAll("\\", "/")} must expose one encounter clock query`);
}
if (!/\bMARK_ATTEMPTED\b/.test(policyText)) {
  violations.push(
    `${policyFile.replaceAll("\\", "/")} must expose attempted encounter entry state`
  );
}
if (!/\bMARK_GENERATION_ATTEMPTED\b/.test(policyText)) {
  violations.push(
    `${policyFile.replaceAll("\\", "/")} must expose missing-key generation attempt state`
  );
}
if (/\bREADINESS\b/.test(policyText)) {
  violations.push(
    `${policyFile.replaceAll("\\", "/")} must not expose a parallel readiness query; use READ_CLOCK`
  );
}
const clockBody = policyText.match(/function readEncounterClock[\s\S]*?\n}/)?.[0] || "";
if (!clockBody.includes("if (readiness.canEnter)")) {
  violations.push(
    `${policyFile.replaceAll("\\", "/")} must let available encounter keys bypass cooldown countdown`
  );
}
if (clockBody.indexOf("if (readiness.canEnter)") > clockBody.indexOf("readiness.remainingMs > 0")) {
  violations.push(`${policyFile.replaceAll("\\", "/")} must check keyAvailable before cooldown`);
}
for (const required of [
  "treats an available encounter key as ready instead of counting another cooldown",
  'reason: "keyAvailable"',
  "countdownMs: 0",
]) {
  if (!policyTestText.includes(required)) {
    violations.push(`${policyTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}
for (const required of [
  "recovers missing-timestamp daily limit state instead of waiting forever",
  "recovers impossible over-limit daily count instead of waiting until midnight",
  "dailyLimitReached: false",
  'reason: "readyWindow"',
]) {
  if (!policyCorruptStateTestText.includes(required)) {
    violations.push(`${policyCorruptStateTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}
for (const required of [
  "normalized.count > ENCOUNTER_DAILY_LIMIT",
  "starts a fresh cooldown from battle-start evidence after a stale over-limit counter",
  'state: { date: Date.now(), key: "abc", count: 1, clear: true }',
]) {
  if (!policyText.includes(required) && !widgetPolicyTestText.includes(required)) {
    violations.push(
      `${policyFile.replaceAll("\\", "/")} must recover stale over-limit encounter state: ${required}`
    );
  }
}
if (!policyText.includes("const encounterPolicyEventHandlers")) {
  violations.push(
    `${policyFile.replaceAll("\\", "/")} must route encounter policy events through a handler table`
  );
}
const policyEntryMatch = policyText.match(/export function runEncounterPolicy[\s\S]*?\n}/);
if (!policyEntryMatch) {
  violations.push(`${policyFile.replaceAll("\\", "/")} must expose runEncounterPolicy(event)`);
} else {
  const entryBody = policyEntryMatch[0];
  if (entryBody.includes("event.type")) {
    violations.push(
      `${policyFile.replaceAll("\\", "/")} entry must reject null events without throwing`
    );
  }
  if (!entryBody.includes("event?.type")) {
    violations.push(
      `${policyFile.replaceAll("\\", "/")} entry must fail closed for unknown or null events`
    );
  }
  if (
    /switch\s*\(\s*event\.type\s*\)/.test(entryBody) ||
    /if\s*\(\s*event\.type\s*===/.test(entryBody)
  ) {
    violations.push(
      `${policyFile.replaceAll("\\", "/")} entry must not reintroduce event.type branching`
    );
  }
  for (const internal of [
    "defaultEncounterState(",
    "normalizeEncounterState(",
    "readEncounterClock(",
    "planNextEncounterCheck(",
    "planEncounterActivation(",
    "parseEncounterKeyFromSearch(",
    "parseEncounterKeyFromEventpaneHtml(",
    "markEncounterKeyAvailable(",
    "markEncounterStarted(",
    "markEncounterAttempted(",
    "markEncounterGenerationAttempted(",
  ]) {
    if (entryBody.includes(internal)) {
      violations.push(
        `${policyFile.replaceAll("\\", "/")} entry must dispatch through encounterPolicyEventHandlers`
      );
    }
  }
}
if (
  !policyTestText.includes("rejects unknown and null policy events without deriving a decision") ||
  !policyTestText.includes("runEncounterPolicy(null)")
) {
  violations.push(`${policyTest.replaceAll("\\", "/")} must cover unknown and null policy events`);
}
if (!/TimeEvent\.MS_UNTIL_NEXT_UTC_DAY/.test(policyText)) {
  violations.push(
    `${policyFile.replaceAll("\\", "/")} must read UTC day rollover timing through time entry`
  );
}
if (/Date\.UTC\(.*getUTCFullYear\(\).*getUTCMonth\(\).*getUTCDate\(\)\s*\+\s*1/.test(policyText)) {
  violations.push(
    `${policyFile.replaceAll("\\", "/")} must not duplicate UTC day rollover arithmetic`
  );
}
if (!/\bPLAN_NEXT_CHECK\b/.test(policyText)) {
  violations.push(`${policyFile.replaceAll("\\", "/")} must expose one next-check plan query`);
}
for (const required of [
  "ISEKAI_SUPPRESSED_EVENTS",
  "isIsekaiEncounterContext",
  "suppressIsekaiEncounter",
  "isekaiEncounterSuppressed",
  "isIsekai: event.isIsekai",
]) {
  if (!(ownerText.includes(required) || policyText.includes(required) || entryPolicyText.includes(required))) {
    violations.push(`${owner.replaceAll("\\", "/")} must suppress isekai encounter side effects: ${required}`);
  }
}
for (const required of [
  "isIsekai: true",
  "suppresses isekai lobby auto-entry without navigation",
  "not.toHaveBeenCalled()",
  "isekaiEncounterSuppressed",
]) {
  if (!policyTestText.includes(required)) {
    violations.push(`${policyFile.replaceAll("\\", "/")} must lock isekai encounter suppression: ${required}`);
  }
}
if (/ISEKAI_ENCOUNTER_BASE_URL|hentaiverse\.org\/isekai\/\?\s*s=Battle/.test(entryPolicyText)) {
  violations.push(
    `${entryPolicyFile.replaceAll("\\", "/")} must not derive an isekai encounter entry URL`
  );
}
if (
  !/EncounterPolicyEvent\.PLAN_NEXT_CHECK/.test(
    fs.readFileSync(path.join(root, lobbyScheduleFile), "utf8")
  )
) {
  violations.push(
    `${lobbyScheduleFile.replaceAll("\\", "/")} must schedule lobby checks from the encounter next-check plan`
  );
}
const lobbyScheduleText = fs.readFileSync(path.join(root, lobbyScheduleFile), "utf8");
if (!lobbyScheduleText.includes("const encounterLobbyScheduleEventHandlers")) {
  violations.push(
    `${lobbyScheduleFile.replaceAll("\\", "/")} must route lobby schedule events through a handler table`
  );
}
for (const required of [
  "recordEncounterStateFailure",
  "schedule-lobby-check",
  "cancel-lobby-check",
]) {
  if (!lobbyScheduleText.includes(required)) {
    violations.push(
      `${lobbyScheduleFile.replaceAll("\\", "/")} must record lobby timer failure ${required}`
    );
  }
}
const lobbyScheduleEntryMatch = lobbyScheduleText.match(
  /export function runEncounterLobbySchedule[\s\S]*?\n}/
);
if (!lobbyScheduleEntryMatch) {
  violations.push(
    `${lobbyScheduleFile.replaceAll("\\", "/")} must expose runEncounterLobbySchedule(event)`
  );
} else {
  const entryBody = lobbyScheduleEntryMatch[0];
  if (entryBody.includes("event.type")) {
    violations.push(
      `${lobbyScheduleFile.replaceAll("\\", "/")} entry must reject null events without throwing`
    );
  }
  if (!entryBody.includes("event?.type")) {
    violations.push(
      `${lobbyScheduleFile.replaceAll("\\", "/")} entry must fail closed for unknown or null events`
    );
  }
  if (/if\s*\(\s*event\.type\s*===/.test(entryBody)) {
    violations.push(
      `${lobbyScheduleFile.replaceAll("\\", "/")} entry must not reintroduce an event.type if-chain`
    );
  }
  for (const internal of ["scheduleNextCheck(", "cancelNextCheck("]) {
    if (entryBody.includes(internal)) {
      violations.push(
        `${lobbyScheduleFile.replaceAll("\\", "/")} entry must dispatch through encounterLobbyScheduleEventHandlers`
      );
    }
  }
}
const lobbyScheduleTestText = fs.readFileSync(path.join(root, lobbyScheduleTest), "utf8");
if (
  !lobbyScheduleTestText.includes(
    "rejects unknown and null schedule events without creating a timer"
  ) ||
  !lobbyScheduleTestText.includes("runEncounterLobbySchedule(null)") ||
  !lobbyScheduleTestText.includes(
    "records schedule timer failures without claiming a scheduled check"
  ) ||
  !lobbyScheduleTestText.includes(
    "records cancel timer failures and keeps the pending check retryable"
  ) ||
  !lobbyScheduleTestText.includes('throw new Error("timer blocked")') ||
  !lobbyScheduleTestText.includes('throw new Error("cancel blocked")')
) {
  violations.push(
    `${lobbyScheduleTest.replaceAll("\\", "/")} must cover unknown, null, and timer failure schedule events`
  );
}
if (/\bNEXT_CHECK_DELAY\b/.test(policyText)) {
  violations.push(`${policyFile.replaceAll("\\", "/")} must not expose raw next-check delay`);
}
if (!/EncounterPolicyEvent\.READ_CLOCK/.test(widgetPolicyText)) {
  violations.push(
    `${widgetPolicyFile.replaceAll("\\", "/")} widget countdown must use the encounter clock query`
  );
}
if (!widgetPolicyText.includes("const encounterWidgetPolicyEventHandlers")) {
  violations.push(
    `${widgetPolicyFile.replaceAll("\\", "/")} must route widget policy events through a handler table`
  );
}
const widgetPolicyEntryMatch = widgetPolicyText.match(
  /export function planEncounterWidgetEvent[\s\S]*?\n}/
);
if (!widgetPolicyEntryMatch) {
  violations.push(
    `${widgetPolicyFile.replaceAll("\\", "/")} must expose planEncounterWidgetEvent(event)`
  );
} else {
  const entryBody = widgetPolicyEntryMatch[0];
  if (/if\s*\(\s*event\.type\s*===/.test(entryBody)) {
    violations.push(
      `${widgetPolicyFile.replaceAll("\\", "/")} entry must not reintroduce an event.type if-chain`
    );
  }
  if (entryBody.includes("event.type") || !entryBody.includes("event?.type")) {
    violations.push(
      `${widgetPolicyFile.replaceAll("\\", "/")} entry must fail closed for unknown or null widget policy events`
    );
  }
  for (const internal of [
    "readWidgetState(",
    "runWidgetLinkFound(",
    "runWidgetStartedEncounter(",
    "planWidgetResetDay(",
    "planWidgetClick(",
    "planWidgetTimerElapsed(",
    "planWidgetNewsLoaded(",
  ]) {
    if (entryBody.includes(internal)) {
      violations.push(
        `${widgetPolicyFile.replaceAll("\\", "/")} entry must dispatch through encounterWidgetPolicyEventHandlers`
      );
    }
  }
}
if (
  !widgetPolicyTestText.includes("ignores invalid widget policy events") ||
  !widgetPolicyTestText.includes("planEncounterWidgetEvent(null)")
) {
  violations.push(
    `${widgetPolicyTest.replaceAll("\\", "/")} must cover unknown and null widget policy events`
  );
}
for (const required of [
  "EncounterPolicyEvent.MARK_GENERATION_ATTEMPTED",
  "generationAttemptKey",
  "generationFailureCount",
  "generationNextAttemptAt",
  "generationCircuitOpenUntil",
  'reason: "generationBackoff"',
  'reason: "generationCircuitOpen"',
  'event.engage && unavailableReason === "encounterKeyMissing"',
  'reason: "dailyResetEvent"',
  'action: "dailyResetEvent"',
  'unavailableReason: "dailyResetEvent"',
  "backs off ready-window generation after a main-world news load returns no encounter key",
  "backs off repeated main-world news generation inside the same ready window",
  "opens the circuit after repeated same-window generation failures",
  "treats the CST 8 daily dawn event as a distinct generation failure with backoff",
  "keeps manual ready-window clicks able to load the encounter check",
  'action: "load"',
]) {
  if (!widgetPolicyText.includes(required) && !widgetPolicyTestText.includes(required)) {
    violations.push(
      `${widgetPolicyFile.replaceAll("\\", "/")} must preserve missing-key generation readiness evidence: ${required}`
    );
  }
}
for (const required of [
  "ENCOUNTER_GENERATION_BACKOFF_MS",
  "ENCOUNTER_GENERATION_CIRCUIT_THRESHOLD",
  "ENCOUNTER_GENERATION_CIRCUIT_OPEN_MS",
  "buildGenerationAttemptKey",
  "readGenerationRecovery",
  "generationFailureReason",
]) {
  if (!(policyText.includes(required) || generationRecoveryText.includes(required))) {
    violations.push(
      `${policyFile.replaceAll("\\", "/")} must own generation backoff/circuit recovery: ${required}`
    );
  }
}
for (const required of [
  "backs off news loading when the daily CST 8 dawn event is not an encounter",
  "dailyResetEvent",
  "generationNextAttemptAt",
]) {
  if (!stateTestText.includes(required) && !stateHelperText.includes(required)) {
    violations.push(
      `${stateHelper.replaceAll("\\", "/")} must persist dawn-event generation backoff: ${required}`
    );
  }
}
if (!/\bWIDGET_TIMER_ELAPSED\b/.test(ownerText)) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must expose widget timer expiry as an encounter event`
  );
}
if (!/\bWIDGET_TIMER_ELAPSED\b/.test(hvUtilsText)) {
  violations.push(
    `${hvUtilsFile.replaceAll("\\", "/")} widget countdown expiry must report WIDGET_TIMER_ELAPSED`
  );
}
if (/re\.type\s*=\s*\([^;]*\|\|\s*IS_ISEKAI/.test(hvUtilsText)) {
  violations.push(
    `${hvUtilsFile.replaceAll("\\", "/")} must not classify the isekai world as gallery/e-hentai page type`
  );
}
if (
  !hvUtilsText.includes(
    "re.type = !location.hostname.includes('hentaiverse.org') ? 'eh' : $id('battle_top') ? 'ba' : IS_ISEKAI ? 'is' : $id('navbar') ? 'hv' : false;"
  )
) {
  violations.push(
    `${hvUtilsFile.replaceAll("\\", "/")} must classify encounter widget page type before world-specific authority`
  );
}
for (const required of [
  "function suppressIsekaiNavigation(current) {",
  'recovery: "isekaiNavigationSuppressed"',
  'if (event.pageType === "is") return suppressIsekaiNavigation(current);',
  'if (event.pageType === "is") return suppressIsekaiNavigation(readWidgetState(event.state));',
  "suppresses isekai root encounter clicks and timer expiry without loading news",
]) {
  if (!widgetPolicyText.includes(required) && !widgetPolicyTestText.includes(required)) {
    violations.push(
      `${widgetPolicyFile.replaceAll("\\", "/")} must suppress isekai root encounter navigation: ${required}`
    );
  }
}
for (const required of [
  "href: plan.href",
  "preserves the ready-window generation URL for main-world widget loads",
  "https://e-hentai.org/news.php?encounter",
]) {
  if (!widgetPolicyText.includes(required) && !widgetPolicyTestText.includes(required)) {
    violations.push(
      `${widgetPolicyFile.replaceAll("\\", "/")} must preserve ready-window generation URL: ${required}`
    );
  }
}
for (const required of [
  "re.load(outcome.engage, outcome.href)",
  "re.load(true, outcome.href)",
  "$ajax.fetch(href || 'https://e-hentai.org/news.php')",
]) {
  if (!hvUtilsText.includes(required)) {
    violations.push(
      `${hvUtilsFile.replaceAll("\\", "/")} must fetch the typed widget generation URL when supplied: ${required}`
    );
  }
}
const baRunBranch =
  hvUtilsText.match(
    /if \(re\.type === 'ba'\) \{[\s\S]*?\n\s*\} else if \(re\.type === 'hv'\)/
  )?.[0] || "";
if (!baRunBranch.includes("WIDGET_CLICKED") || !baRunBranch.includes("outcome?.handled")) {
  violations.push(
    `${hvUtilsFile.replaceAll("\\", "/")} battle-page widget clicks must route through WIDGET_CLICKED before loading news`
  );
}
if (!/unavailableReason\s*=== ['"]equipmentInventoryFull['"]/.test(hvUtilsText)) {
  violations.push(
    `${hvUtilsFile.replaceAll("\\", "/")} equipment inventory prompt must require typed unavailableReason`
  );
}
if (
  /outcome\?\.action === ['"]unavailable['"][\s\S]{0,180}你的装备仓库快要满了/.test(hvUtilsText) &&
  !/outcome\?\.action === ['"]unavailable['"][^\n]+unavailableReason\s*=== ['"]equipmentInventoryFull['"]/.test(
    hvUtilsText
  )
) {
  violations.push(
    `${hvUtilsFile.replaceAll("\\", "/")} must not map generic encounter unavailable to equipment inventory prompt`
  );
}
for (const required of [
  "equipmentInventoryFull",
  "encounterKeyMissing",
  "messagebox_error",
  "Your equipment inventory is full",
]) {
  if (!widgetPolicyText.includes(required) && !widgetUnavailableText.includes(required)) {
    violations.push(
      `${widgetPolicyFile.replaceAll("\\", "/")} must classify widget unavailable reason ${required}`
    );
  }
  if (!widgetPolicyTestText.includes(required)) {
    violations.push(
      `${widgetPolicyTest.replaceAll("\\", "/")} must lock widget unavailable reason ${required}`
    );
  }
}
if (!widgetPolicyText.includes("classifyWidgetUnavailableReason")) {
  violations.push(
    `${widgetPolicyFile.replaceAll("\\", "/")} must classify widget unavailable reasons through one function`
  );
}
for (const required of [
  "does not classify low equipment capacity text as encounter equipment-full failure",
  "does not classify untyped equipment full text outside the news error box",
  "handles plain battle-page countdown clicks without requesting a news load",
  "Inventory Capacity:",
  "54",
  "500",
]) {
  if (!widgetPolicyTestText.includes(required)) {
    violations.push(
      `${widgetPolicyTest.replaceAll("\\", "/")} must lock low-capacity text as non equipment-full encounter failure`
    );
  }
}
if (/Inventory Capacity:[\s\S]{0,180}equipmentInventoryFull/.test(widgetPolicyText)) {
  violations.push(
    `${widgetPolicyFile.replaceAll("\\", "/")} must not derive equipment-full reason from capacity text`
  );
}

if (violations.length) {
  console.error("[verify-encounter-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-encounter-boundary] OK — encounter business state has one owner");
