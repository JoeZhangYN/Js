import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/pages/encounter.js");
const battleLifecycleFile = path.normalize("src/pages/encounter-battle-lifecycle.js");
const entryExecutionFile = path.normalize("src/pages/encounter-entry-execution.js");
const entryExecutionFailureTest = path.normalize(
  "src/pages/encounter-entry-execution-failure.test.js"
);
const stateHelper = path.normalize("src/pages/encounter-state.js");
const stateTest = path.normalize("src/pages/encounter-state.test.js");
const stateIoTest = path.normalize("src/pages/encounter-state-io.test.js");
const stateDawnRecoveryTest = path.normalize("src/pages/encounter-state-dawn-recovery.test.js");
const stateGenerationFile = path.normalize("src/pages/encounter-generation-state.js");
const generationRequestFile = path.normalize("src/pages/encounter-generation-request.js");
const stateStorageFile = path.normalize("src/pages/encounter-state-storage.js");
const stateStorageTest = path.normalize("src/pages/encounter-state-storage.test.js");
const stateGenerationFailureTest = path.normalize(
  "src/pages/encounter-state-generation-failure.test.js"
);
const generationRequestFailureTest = path.normalize(
  "src/pages/encounter-generation-request-failure.test.js"
);
const stateEvidenceTest = path.normalize("src/pages/encounter-state-evidence.test.js");
const stateFailureFile = path.normalize("src/pages/encounter-state-failure.js");
const stateFailureTest = path.normalize("src/pages/encounter-state-failure.test.js");
const entryPolicyFile = path.normalize("src/pages/encounter-entry-policy.js");
const generationRecoveryFile = path.normalize("src/pages/encounter-generation-recovery.js");
const generationRecoveryTest = path.normalize("src/pages/encounter-generation-recovery.test.js");
const generationResultFile = path.normalize("src/pages/encounter-generation-result.js");
const generationResultTest = path.normalize("src/pages/encounter-generation-result.test.js");
const generationBlockFile = path.normalize("src/pages/encounter-generation-block.js");
const generationIncidentFile = path.normalize("src/pages/encounter-generation-incident.js");
const generationIncidentClearFile = path.normalize(
  "src/pages/encounter-generation-incident-clear.js"
);
const generationBlockTest = path.normalize("src/pages/encounter-generation-block.test.js");
const dawnLoopRecoveryTest = path.normalize("src/pages/encounter-dawn-loop-recovery.test.js");
const dawnIncidentExpiryTest = path.normalize("src/pages/encounter-dawn-incident-expiry.test.js");
const clearedKeyGenerationTest = path.normalize(
  "src/pages/encounter-cleared-key-generation.test.js"
);
const circuitResumeTest = path.normalize("src/pages/encounter-circuit-resume.test.js");
const persistenceLoopTest = path.normalize("src/pages/encounter-persistence-loop-recovery.test.js");
const widgetFailureFlowTest = path.normalize("src/pages/encounter-widget-failure-flow.test.js");
const lobbyFlowFile = path.normalize("src/pages/encounter-lobby-flow.js");
const lobbyOutcomeFile = path.normalize("src/pages/encounter-lobby-outcome.js");
const lobbyActiveBlockFile = path.normalize("src/pages/encounter-lobby-active-block.js");
const lobbyCircuitResponseFile = path.normalize("src/pages/encounter-lobby-circuit-response.js");
const crossSiteStaleTest = path.normalize("src/pages/encounter-cross-site-stale.test.js");
const policyFile = path.normalize("src/pages/encounter-policy.js");
const dayStateFile = path.normalize("src/pages/encounter-day-state.js");
const stateMigrationFile = path.normalize("src/pages/encounter-state-migration.js");
const entryStateFile = path.normalize("src/pages/encounter-entry-state.js");
const clockFile = path.normalize("src/pages/encounter-clock.js");
const policyTest = path.normalize("src/pages/encounter-policy.test.js");
const limitPolicyTest = path.normalize("src/pages/encounter-limit-policy.test.js");
const limitConfirmationTest = path.normalize("src/pages/encounter-limit-confirmation.test.js");
const policyRouteTest = path.normalize("src/pages/encounter-policy-route.test.js");
const policyCorruptStateTest = path.normalize("src/pages/encounter-policy-corrupt-state.test.js");
const routingTest = path.normalize("src/pages/encounter-routing.test.js");
const rejectionFile = path.normalize("src/pages/encounter-rejection.js");
const bridgeFile = path.normalize("src/pages/encounter-bridge.js");
const hvUtilsFile = path.normalize("src/i18n/hv-utils.js");
const legacyWidgetFile = path.normalize("src/pages/encounter-widget.js");
const widgetPolicyFile = path.normalize("src/pages/encounter-widget-policy.js");
const widgetStateFile = path.normalize("src/pages/encounter-widget-state.js");
const widgetObservationFile = path.normalize("src/pages/encounter-widget-observation.js");
const widgetPolicyTest = path.normalize("src/pages/encounter-widget-policy.test.js");
const widgetMainWorldTest = path.normalize("src/pages/encounter-widget-main-world.test.js");
const widgetTimerTest = path.normalize("src/pages/encounter-widget-timer.test.js");
const widgetGenerationRecoveryTest = path.normalize(
  "src/pages/encounter-widget-generation-recovery.test.js"
);
const optionGateFile = path.normalize("src/pages/encounter-option-gate.js");
const nextBattleEncounterCheckFile = path.normalize("src/pages/next-battle-encounter-check.js");
const dayRecordFile = path.normalize("src/state/day-record.js");
const timeFile = path.normalize("src/core/time.js");
const diagnosticKeys = path.normalize("src/core/diagnostic-evidence-keys.js");
const diagnosticTest = path.normalize("src/core/diagnostic-evidence.test.js");
const violations = [];
const policyInternalFiles = new Set([
  policyFile,
  dayStateFile,
  stateMigrationFile,
  entryStateFile,
  clockFile,
]);

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
      relative !== battleLifecycleFile &&
      relative !== stateHelper &&
      relative !== stateStorageFile &&
      relative !== stateStorageTest &&
      relative !== stateTest &&
      relative !== stateIoTest &&
      relative !== stateDawnRecoveryTest &&
      relative !== stateGenerationFailureTest &&
      relative !== dawnLoopRecoveryTest &&
      relative !== dawnIncidentExpiryTest &&
      relative !== clearedKeyGenerationTest &&
      relative !== circuitResumeTest &&
      relative !== persistenceLoopTest &&
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
      relative !== battleLifecycleFile &&
      relative !== entryExecutionFile &&
      relative !== lobbyFlowFile &&
      relative !== stateTest &&
      relative !== stateIoTest &&
      relative !== stateDawnRecoveryTest &&
      relative !== stateGenerationFailureTest &&
      relative !== generationRequestFailureTest &&
      relative !== stateEvidenceTest &&
      relative !== lobbyCircuitResponseFile &&
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
      !policyInternalFiles.has(relative) &&
      relative !== policyTest &&
      relative !== limitPolicyTest &&
      relative !== dawnLoopRecoveryTest &&
      relative !== widgetGenerationRecoveryTest &&
      relative !== limitConfirmationTest &&
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
      relative !== generationResultFile &&
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
      !policyInternalFiles.has(relative) &&
      relative !== policyTest &&
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
        `${where} encounter capability must return a deadline instead of owning a timer`
      );
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
const battleLifecycleText = fs.readFileSync(path.join(root, battleLifecycleFile), "utf8");
const entryExecutionText = fs.readFileSync(path.join(root, entryExecutionFile), "utf8");
const stateHelperText = fs.readFileSync(path.join(root, stateHelper), "utf8");
const stateGenerationText = fs.readFileSync(path.join(root, stateGenerationFile), "utf8");
const generationRequestText = fs.readFileSync(path.join(root, generationRequestFile), "utf8");
const stateStorageText = fs.readFileSync(path.join(root, stateStorageFile), "utf8");
const stateFailureText = fs.readFileSync(path.join(root, stateFailureFile), "utf8");
const stateFailureTestText = fs.readFileSync(path.join(root, stateFailureTest), "utf8");
const stateEvidenceTestText = fs.readFileSync(path.join(root, stateEvidenceTest), "utf8");
const diagnosticKeysText = fs.readFileSync(path.join(root, diagnosticKeys), "utf8");
const diagnosticTestText = fs.readFileSync(path.join(root, diagnosticTest), "utf8");
const policyText = fs.readFileSync(path.join(root, policyFile), "utf8");
const dayStateText = fs.readFileSync(path.join(root, dayStateFile), "utf8");
const stateMigrationText = fs.readFileSync(path.join(root, stateMigrationFile), "utf8");
const entryStateText = fs.readFileSync(path.join(root, entryStateFile), "utf8");
const clockText = fs.readFileSync(path.join(root, clockFile), "utf8");
const entryPolicyText = fs.readFileSync(path.join(root, entryPolicyFile), "utf8");
const generationRecoveryText = fs.readFileSync(path.join(root, generationRecoveryFile), "utf8");
const generationResultText = fs.readFileSync(path.join(root, generationResultFile), "utf8");
const generationBlockText = fs.readFileSync(path.join(root, generationBlockFile), "utf8");
const generationIncidentText = fs.readFileSync(path.join(root, generationIncidentFile), "utf8");
const generationIncidentClearText = fs.readFileSync(
  path.join(root, generationIncidentClearFile),
  "utf8"
);
const generationBlockTestText = fs.readFileSync(path.join(root, generationBlockTest), "utf8");
const generationRequestFailureTestText = fs.readFileSync(
  path.join(root, generationRequestFailureTest),
  "utf8"
);
const persistenceLoopTestText = fs.readFileSync(path.join(root, persistenceLoopTest), "utf8");
const circuitResumeTestText = fs.readFileSync(path.join(root, circuitResumeTest), "utf8");
const widgetFailureFlowTestText = fs.readFileSync(path.join(root, widgetFailureFlowTest), "utf8");
const lobbyFlowText = fs.readFileSync(path.join(root, lobbyFlowFile), "utf8");
const lobbyOutcomeText = fs.readFileSync(path.join(root, lobbyOutcomeFile), "utf8");
const lobbyActiveBlockText = fs.readFileSync(path.join(root, lobbyActiveBlockFile), "utf8");
const lobbyCircuitResponseText = fs.readFileSync(path.join(root, lobbyCircuitResponseFile), "utf8");
const dawnLoopRecoveryTestText = fs.readFileSync(path.join(root, dawnLoopRecoveryTest), "utf8");
const dawnIncidentExpiryTestText = fs.readFileSync(path.join(root, dawnIncidentExpiryTest), "utf8");
const crossSiteStaleTestText = fs.readFileSync(path.join(root, crossSiteStaleTest), "utf8");
const policyTestText = [policyTest, policyRouteTest, generationRecoveryTest]
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n");
const policyCorruptStateTestText = fs.existsSync(path.join(root, policyCorruptStateTest))
  ? fs.readFileSync(path.join(root, policyCorruptStateTest), "utf8")
  : "";
const rejectionText = fs.readFileSync(path.join(root, rejectionFile), "utf8");
const hvUtilsText = fs.readFileSync(path.join(root, hvUtilsFile), "utf8");
const widgetPolicyText = fs.readFileSync(path.join(root, widgetPolicyFile), "utf8");
const widgetObservationText = fs.readFileSync(path.join(root, widgetObservationFile), "utf8");
const widgetPolicyTestText = [
  widgetPolicyTest,
  widgetMainWorldTest,
  widgetTimerTest,
  widgetGenerationRecoveryTest,
  generationResultTest,
]
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n");
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
  'action: "blocked"',
  "blocked: true",
  "clear: false",
  "blocks before navigation when attempted-state persistence is rejected",
]) {
  if (!entryExecutionFailureTestText.includes(required)) {
    violations.push(
      `${entryExecutionFailureTest.replaceAll("\\", "/")} must cover failed encounter navigation without claiming success: ${required}`
    );
  }
}
if (
  !dawnIncidentExpiryTestText.includes(
    "checks for an encounter only after the dawn-owned cooldown expires"
  )
) {
  violations.push(
    `${dawnIncidentExpiryTest.replaceAll("\\", "/")} must cover dawn cooldown expiry`
  );
}
const prepareIndex = entryExecutionText.indexOf("const prepared = prepareEntry(outcome)");
const navigationIndex = entryExecutionText.indexOf("const navigated = runNavigationAutomation");
if (prepareIndex < 0 || navigationIndex < 0 || prepareIndex > navigationIndex) {
  violations.push(
    `${entryExecutionFile.replaceAll("\\", "/")} must persist attempted state before navigation`
  );
}
for (const required of ["statePersistenceFailed", "restoreEncounterEntry", "rollback"]) {
  if (!entryExecutionText.includes(required)) {
    violations.push(`${entryExecutionFile.replaceAll("\\", "/")} must preserve ${required}`);
  }
}
for (const required of [
  "isAutomaticEncounterEnabled",
  "EncounterStateEvent.MARK_COMPLETED",
  "encounterCompletionPersistenceFailed",
]) {
  if (!battleLifecycleText.includes(required)) {
    violations.push(`${battleLifecycleFile.replaceAll("\\", "/")} must own ${required}`);
  }
}
for (const required of ["EVENT_RANDOM_ENCOUNTER_STARTED", "EVENT_RANDOM_ENCOUNTER_COMPLETED"]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}
if (
  !fs
    .readFileSync(path.join(root, "src/battle/battle-round-start.js"), "utf8")
    .includes('source: "battleRoundStart"')
) {
  violations.push(
    "src/battle/battle-round-start.js must mark random encounters with battleRoundStart evidence"
  );
}
if (!entryStateText.includes('event.source === "battleRoundStart"')) {
  violations.push(
    `${entryStateFile.replaceAll("\\", "/")} must recognize battle-start identity without owning completion count`
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
  stateIoTest,
  stateDawnRecoveryTest,
  stateGenerationFailureTest,
  generationRequestFailureTest,
  stateStorageTest,
]
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n");
if (
  !stateTestText.includes(
    "rejects unknown and null state events without reading or writing encounter state"
  ) ||
  !stateTestText.includes("runEncounterStateAutomation(null)")
) {
  violations.push(`${stateTest.replaceAll("\\", "/")} must cover unknown and null state events`);
}
for (const required of [
  "backs off and preserves typed evidence when news key loading fails",
  "backs off and preserves typed evidence when news key loading times out",
  "fails closed to default state when stored encounter JSON is corrupted",
  "fails closed instead of mixing local state when GM encounter state read fails",
  "does not report local fallback as persistence when GM encounter state write fails",
  "uses GM as the only authority when GM and local state conflict",
  "fails closed when only half of the GM storage authority exists",
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
  "read-local-json",
  "read-gm",
  "write-gm",
  "write-local",
  "load-key-error",
  "load-key-timeout",
]) {
  if (
    !stateHelperText.includes(required) &&
    !stateGenerationText.includes(required) &&
    !stateStorageText.includes(required) &&
    !generationRequestText.includes(required)
  ) {
    violations.push(
      `${stateHelper.replaceAll("\\", "/")} must own encounter state failure ${required}`
    );
  }
}
for (const required of [
  "ENCOUNTER_STATE_FAILURE_KEY",
  "DiagnosticConsoleEvent.WARN",
  "runDiagnosticConsoleAutomation",
  "HVAA:lastEncounterStateFailure",
  'capability: "encounterState"',
  'source: "encounterState"',
  "storage?.setItem",
  '"[HVAA] encounter state failed"',
]) {
  if (!stateFailureText.includes(required)) {
    violations.push(
      `${stateFailureFile.replaceAll("\\", "/")} must own encounter failure evidence ${required}`
    );
  }
}
for (const required of [
  "generates and enters a different key after the old key cooldown",
  "waits a full primary cycle when generation returns the same already attempted key",
  "encounterKeyAlreadyAttempted",
]) {
  const text = fs.readFileSync(path.join(root, clearedKeyGenerationTest), "utf8");
  if (!text.includes(required)) {
    violations.push(`${clearedKeyGenerationTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}
if (/\bconsole\.(?:log|warn|error|info|debug)\s*\(/.test(stateFailureText)) {
  violations.push(
    `${stateFailureFile.replaceAll("\\", "/")} must route encounter state diagnostics through the typed diagnostic console entry`
  );
}
for (const required of [
  "records encounter state failures as structured evidence",
  "does not throw when evidence storage and typed warning both fail",
]) {
  if (!stateFailureTestText.includes(required)) {
    violations.push(`${stateFailureTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}
for (const required of [
  "EncounterGenerationIncidentEvent.RECORD",
  "EncounterGenerationIncidentEvent.MARK_DISPLAYED",
  "incidentPersistence",
]) {
  if (!generationBlockText.includes(required)) {
    violations.push(`${generationBlockFile.replaceAll("\\", "/")} must preserve ${required}`);
  }
}
for (const required of [
  "EVENT_READ_ACTIVE",
  "EVENT_CLEAR",
  "sharedAuthorityUnavailable",
  "alreadyActive",
  "ENCOUNTER_GENERATION_INCIDENT",
]) {
  if (!generationIncidentText.includes(required)) {
    violations.push(`${generationIncidentFile.replaceAll("\\", "/")} must preserve ${required}`);
  }
}
for (const required of ["GM_setValue", "clearMirroredIncident", "gmClearFailed"]) {
  if (!generationIncidentClearText.includes(required)) {
    violations.push(
      `${generationIncidentClearFile.replaceAll("\\", "/")} must preserve ${required}`
    );
  }
}
for (const required of [
  "persists the complete incident before opening the blocking prompt",
  "deduplicates the same blocking incident after it was displayed",
  "keeps cross-site automation blocked when shared incident storage is unavailable",
  "toBeLessThan",
  "toHaveBeenCalledTimes(2)",
]) {
  if (!generationBlockTestText.includes(required)) {
    violations.push(`${generationBlockTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}
for (const required of [
  "persists corrupted encounter state evidence while failing closed",
  "keeps encounter state fallback working when typed warning fails",
  "keeps encounter state fallback working when failure evidence storage and typed warning fail",
  "HVAA:lastEncounterStateFailure",
  'capability: "encounterState"',
  'throw new Error("quota")',
  "runDiagnosticConsoleAutomation",
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
  "createAutomaticEncounterGate",
  "CURRENT_WORLD_POLICY.features.randomEncounter",
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
const nextBattleText = fs.readFileSync(
  path.join(root, "src/pages/next-battle-arbitration.js"),
  "utf8"
);
const nextBattleEncounterCheckText = fs.readFileSync(
  path.join(root, nextBattleEncounterCheckFile),
  "utf8"
);
if (
  !nextBattleText.includes("createNextBattleEncounterCheck") ||
  !nextBattleEncounterCheckText.includes("isAutomaticEncounterEnabled")
) {
  violations.push(
    "next-battle encounter check must use encounter-option-gate for main-world enablement"
  );
}
if (/isLobbyOptionEnabled\(["']encounter["']\)/.test(lobbyText)) {
  violations.push(
    "src/pages/lobby-automation.js must not bypass encounter-option-gate with raw encounter option reads"
  );
}
if (!/EncounterPolicyEvent\.READ_CLOCK/.test(lobbyFlowText)) {
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
if (!/\bMARK_GENERATION_FAILED\b/.test(policyText)) {
  violations.push(
    `${policyFile.replaceAll("\\", "/")} must expose typed generation fault recovery`
  );
}
for (const required of [
  'ENCOUNTER_FAILED: "encounterFailed"',
  'GENERATION_FAULT: "generationFault"',
  "result.status === EncounterGenerationResultStatus.UNAVAILABLE",
  "markEncounterFailed(current, nowMs)",
]) {
  if (!entryStateText.includes(required)) {
    violations.push(
      `${entryStateFile.replaceAll("\\", "/")} must separate authoritative encounter failure from technical generation faults: ${required}`
    );
  }
}
for (const required of [
  "schemaVersion: 3",
  "cycleReadyAt",
  "utcDay",
  "EncounterDayPhase.AWAITING_NEW_DAY",
  "EncounterDayPhase.CONFIRMING_LIMIT",
  "EncounterDayPhase.STOPPED_FOR_DAY",
  "EncounterAnchorReason.NEW_DAY",
  "EncounterAnchorReason.ENCOUNTER_COMPLETED",
  "EncounterAnchorReason.ENCOUNTER_FAILED",
  "EncounterAnchorReason.CIRCUIT_RESPONSE",
  "ENCOUNTER_DAILY_LIMIT = 24",
  "ENCOUNTER_LIMIT_EMPTY_CYCLES = 3",
  "ENCOUNTER_BASE_COOLDOWN_MS = 30 * 60 * 1000",
  "ENCOUNTER_COOLDOWN_MS = ENCOUNTER_BASE_COOLDOWN_MS + 5000",
  "ENCOUNTER_CIRCUIT_JITTER_SECONDS = 30",
]) {
  if (!dayStateText.includes(required)) {
    violations.push(`${dayStateFile.replaceAll("\\", "/")} must own ${required}`);
  }
}
const limitConfirmationTestText = fs.readFileSync(path.join(root, limitConfirmationTest), "utf8");
for (const required of [
  "stops after three persisted authoritative no-key cycles",
  "keeps transport and persistence Unknown outside the empty-cycle count",
  'application: "limitProbeEmpty"',
  'dayPhase).toBe("stoppedForDay")',
]) {
  if (!limitConfirmationTestText.includes(required)) {
    violations.push(`${limitConfirmationTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}
if (/\bREADINESS\b/.test(policyText)) {
  violations.push(
    `${policyFile.replaceAll("\\", "/")} must not expose a parallel readiness query; use READ_CLOCK`
  );
}
const primaryClockBody = clockText.match(/function primaryClock[\s\S]*?\n}/)?.[0] || "";
if (!primaryClockBody.includes("if (readiness.canEnter)")) {
  violations.push(
    `${clockFile.replaceAll("\\", "/")} must let available encounter keys bypass cooldown countdown`
  );
}
if (
  primaryClockBody.indexOf("if (readiness.canEnter)") >
  primaryClockBody.indexOf("readiness.remainingMs > 0")
) {
  violations.push(`${clockFile.replaceAll("\\", "/")} must check keyAvailable before cooldown`);
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
  "migrates a missing-timestamp limit state into confirmation instead of stopping",
  "caps an impossible over-limit count while retaining its cooldown anchor",
  "dailyLimitReached: true",
  'dayPhase: "confirmingLimit"',
]) {
  if (!policyCorruptStateTestText.includes(required)) {
    violations.push(`${policyCorruptStateTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}
for (const required of [
  "Math.min(ENCOUNTER_DAILY_LIMIT",
  "marks entry attempted without counting or moving the completion-owned cooldown",
  'state: { date, key: "abc", count: 24, clear: true }',
]) {
  if (!dayStateText.includes(required) && !widgetPolicyTestText.includes(required)) {
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
    "markEncounterGenerationFailed(",
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
if (!/TimeEvent\.MS_UNTIL_NEXT_UTC_DAY/.test(clockText)) {
  violations.push(
    `${policyFile.replaceAll("\\", "/")} must read UTC day rollover timing through time entry`
  );
}
if (/Date\.UTC\(.*getUTCFullYear\(\).*getUTCMonth\(\).*getUTCDate\(\)\s*\+\s*1/.test(policyText)) {
  violations.push(
    `${policyFile.replaceAll("\\", "/")} must not duplicate UTC day rollover arithmetic`
  );
}
if (
  /ISEKAI_ENCOUNTER_BASE_URL|isekaiEncounterSuppressed|hentaiverse\.org\/isekai\/\?\s*s=Battle/.test(
    ownerText + policyText + entryPolicyText
  )
) {
  violations.push(
    `${owner.replaceAll("\\", "/")} must not own isekai encounter orchestration; route isekai at page/lobby identity`
  );
}
for (const retired of [
  "src/pages/encounter-lobby-schedule.js",
  "src/pages/encounter-lobby-schedule.test.js",
]) {
  if (fs.existsSync(path.join(root, retired))) {
    violations.push(`${retired} retired per-capability timer must stay deleted`);
  }
}
if (
  /\b(?:PLAN_NEXT_CHECK|planNextEncounterCheck|setTimeout|clearTimeout)\b/.test(
    policyText + clockText + lobbyFlowText
  )
) {
  violations.push(
    `${lobbyFlowFile.replaceAll("\\", "/")} must return resumeAtMs without a minute heartbeat`
  );
}
if (/\bNEXT_CHECK_DELAY\b/.test(policyText)) {
  violations.push(`${policyFile.replaceAll("\\", "/")} must not expose raw next-check delay`);
}
const widgetStateText = fs.readFileSync(path.join(root, widgetStateFile), "utf8");
if (!/EncounterPolicyEvent\.READ_CLOCK/.test(widgetStateText)) {
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
  "EncounterPolicyEvent.MARK_GENERATION_FAILED",
  "operationalStatus",
  "recoveryStatus",
  "recoveryRemainingMs",
  "classifyEncounterGenerationResult",
  'reason: "dailyResetEvent"',
  'action: "dailyResetEvent"',
  'unavailableReason: "dailyResetEvent"',
  "uses encounter failure, not a probe timer, for authoritative no-key results",
  "shows primary and technical recovery clocks as independent identities",
  "clears technical recovery when an authoritative no-key failure resets the primary cycle",
  "treats the UTC dawn response as the non-counting new-day cooldown anchor",
  "lets a plain battle-page countdown click recheck immediately",
  "rechecks during the primary countdown and enters immediately when a key is found",
  'action: "load"',
]) {
  if (!widgetPolicyText.includes(required) && !widgetPolicyTestText.includes(required)) {
    violations.push(
      `${widgetPolicyFile.replaceAll("\\", "/")} must separate the primary cycle, technical recovery, and manual recheck: ${required}`
    );
  }
}
for (const required of [
  "records dawn once and starts cooldown without navigation, feedback, or a second request",
  "coalesces simultaneous rollover ticks into one generation request",
  "turns a legacy missing-key circuit into a normal primary failure cycle",
  "vi.getTimerCount()",
]) {
  if (!dawnLoopRecoveryTestText.includes(required)) {
    violations.push(`${dawnLoopRecoveryTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}
if (
  !crossSiteStaleTestText.includes(
    "treats a stale cross-site generation page as an immediate blocking result"
  )
) {
  violations.push(`${crossSiteStaleTest.replaceAll("\\", "/")} must cover stale page blocking`);
}
for (const required of [
  'action: "generate"',
  'request: { method: "GET", url: ENCOUNTER_GENERATION_URL }',
]) {
  if (!entryPolicyText.includes(required)) {
    violations.push(`${entryPolicyFile.replaceAll("\\", "/")} must plan ${required}`);
  }
}
if (/reason\s*=\s*["']encounterKeyMissing["']/.test(generationRecoveryText)) {
  violations.push(
    `${generationRecoveryFile.replaceAll("\\", "/")} must not default fault recovery to authoritative no-key`
  );
}
for (const required of [
  "migrateEncounterCycle",
  "migrateGenerationRecoveryDeadline",
  "clearGenerationRecovery",
  "markEncounterGenerationFailed",
]) {
  if (!(generationRecoveryText + dayStateText + stateMigrationText).includes(required)) {
    violations.push(
      `${generationRecoveryFile.replaceAll("\\", "/")} must preserve legacy migration and typed fault separation: ${required}`
    );
  }
}
for (const retired of [
  'PROBE_EMPTY: "probeEmpty"',
  "markEncounterProbeEmpty",
  'reason: "probeCycle"',
  "probeAttemptKey",
]) {
  if ((entryStateText + clockText + widgetPolicyText).includes(retired)) {
    violations.push(
      `${entryStateFile.replaceAll("\\", "/")} primary encounter flow must keep retired probe path absent: ${retired}`
    );
  }
}
for (const required of [
  "primaryStatus",
  "primaryCountdownMs",
  "recoveryStatus",
  "recoveryCountdownMs",
  "recoveryReason",
]) {
  if (!(clockText + widgetStateText).includes(required)) {
    violations.push(
      `${clockFile.replaceAll("\\", "/")} must expose independent clock identity ${required}`
    );
  }
}
if (/action:\s*["']navigate["'][^\n]+ENCOUNTER_GENERATION_URL/.test(entryPolicyText)) {
  violations.push(
    `${entryPolicyFile.replaceAll("\\", "/")} must not collapse generation requests into navigation`
  );
}
for (const required of [
  "pendingLobbyGeneration",
  "blockActiveEncounterIncident",
  "recordEncounterEntryDegradation",
  "EncounterLobbyStatus",
  "resumeAtMs",
  "EncounterStateEvent.LOAD_KEY",
  'generation.status !== "available"',
  'outcome?.action !== "navigated" || !outcome?.state?.key',
]) {
  if (!(lobbyFlowText + lobbyOutcomeText).includes(required)) {
    violations.push(`${lobbyFlowFile.replaceAll("\\", "/")} must preserve ${required}`);
  }
}
for (const required of [
  "EncounterGenerationIncidentEvent.READ_ACTIVE",
  "EncounterGenerationIncidentEvent.CLEAR",
  "runEncounterGenerationIncident",
  "recordEncounterGenerationDegradation",
  "REPLAYABLE_PERSISTENCE_REASONS",
]) {
  if (!lobbyActiveBlockText.includes(required)) {
    violations.push(`${lobbyActiveBlockFile.replaceAll("\\", "/")} must preserve ${required}`);
  }
}
for (const required of [
  "EncounterGenerationStateEvent",
  "executeEncounterGenerationRequest",
  "generationStatePersistenceFailed",
  'recovery.recoveryReason === "generationCircuitOpen"',
]) {
  if (!stateGenerationText.includes(required)) {
    violations.push(`${stateGenerationFile.replaceAll("\\", "/")} must preserve ${required}`);
  }
}
for (const required of [
  "classifyEncounterGenerationResult",
  "EncounterGenerationFailureReason.REQUEST_REJECTED",
  "load-key-error",
  "load-key-timeout",
  "load-key-exception",
  "load-key-callback-exception",
  "ENCOUNTER_GENERATION_REQUEST_TIMEOUT_MS",
  "onabort",
]) {
  if (!generationRequestText.includes(required)) {
    violations.push(`${generationRequestFile.replaceAll("\\", "/")} must preserve ${required}`);
  }
}
for (const required of [
  "settles with typed recovery when response parsing throws",
  "settles through its watchdog when GM never invokes a callback",
  "timeout: 15_000",
]) {
  if (!generationRequestFailureTestText.includes(required)) {
    violations.push(`${generationRequestFailureTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}
for (const required of [
  "degrades a stale-GM second tick without issuing another request or popup",
  "gmXhr).toHaveBeenCalledOnce()",
  "runUserFeedbackAutomation).not.toHaveBeenCalled()",
]) {
  if (!persistenceLoopTestText.includes(required)) {
    violations.push(`${persistenceLoopTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}
for (const required of [
  "UserFeedbackEvent.BLOCKING_ERROR",
  "encounter-generation:",
  "generationResult",
]) {
  if (!generationBlockText.includes(required)) {
    violations.push(`${generationBlockFile.replaceAll("\\", "/")} must own ${required}`);
  }
}
for (const required of [
  "ENCOUNTER_GENERATION_BACKOFF_MS",
  "ENCOUNTER_GENERATION_CIRCUIT_OPEN_MS",
  "ENCOUNTER_GENERATION_STEPS_PER_CIRCUIT",
  "ENCOUNTER_GENERATION_MAX_CIRCUITS",
  "buildGenerationAttemptKey",
  "readGenerationRecovery",
  "isGenerationCircuitResponseDue",
  "generationFailureReason",
]) {
  if (!(policyText.includes(required) || generationRecoveryText.includes(required))) {
    violations.push(
      `${policyFile.replaceAll("\\", "/")} must own generation backoff/circuit recovery: ${required}`
    );
  }
}
for (const required of [
  "const ENCOUNTER_GENERATION_BACKOFF_MS = [1 * 60 * 1000, 3 * 60 * 1000]",
  "const ENCOUNTER_GENERATION_CIRCUIT_OPEN_MS = 5 * 60 * 1000",
  "const ENCOUNTER_GENERATION_MAX_CIRCUITS = 2",
  'status: "responseDue"',
  'reason: "generationCircuitResponse"',
]) {
  if (!generationRecoveryText.includes(required)) {
    violations.push(
      `${generationRecoveryFile.replaceAll("\\", "/")} must lock two 1/3/5 minute recovery rounds: ${required}`
    );
  }
}
for (const required of [
  "runs two 1/3/5 minute recovery rounds before a typed circuit response",
  "keeps technical recovery separate from the primary encounter deadline",
  "keeps one recovery episode when the independent primary clock becomes ready",
  "ENCOUNTER_BASE_COOLDOWN_MS + 15 * 1000",
]) {
  if (!policyTestText.includes(required)) {
    violations.push(`${generationRecoveryTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}
const attemptKeyBody =
  generationRecoveryText.match(/export function buildGenerationAttemptKey[\s\S]*?\n}/)?.[0] || "";
if (attemptKeyBody.includes("status")) {
  violations.push(
    `${generationRecoveryFile.replaceAll("\\", "/")} generation recovery identity must not depend on primary clock status`
  );
}
if (
  !circuitResumeTestText.includes(
    "persists the second circuit response as a jittered primary cooldown"
  )
) {
  violations.push(
    `${circuitResumeTest.replaceAll("\\", "/")} must cover persisted circuit response`
  );
}
for (const required of [
  "EncounterPolicyEvent.RESOLVE_GENERATION_CIRCUIT",
  "EncounterStateEvent.RESOLVE_GENERATION_CIRCUIT",
  'clock.status !== "responseDue"',
  "EncounterAnchorReason.CIRCUIT_RESPONSE",
]) {
  if (
    !(
      policyText +
      stateHelperText +
      lobbyFlowText +
      lobbyCircuitResponseText +
      dayStateText
    ).includes(required)
  ) {
    violations.push(`encounter circuit response flow must preserve ${required}`);
  }
}
for (const required of [
  "persists dawn as the non-counting UTC day anchor",
  "dailyResetEvent",
  'anchorReason: "newDay"',
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
for (const required of [
  "WIDGET_GENERATION_FAILED",
  "handleWidgetGenerationFailed",
  "recordWidgetGeneration",
]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}
for (const required of [
  "starts the widget cooldown from dawn without reporting a generation failure",
  "backs off a widget fetch failure before its timer can request again",
  'operationalReason: "generationBackoff"',
]) {
  if (!widgetFailureFlowTestText.includes(required)) {
    violations.push(`${widgetFailureFlowTest.replaceAll("\\", "/")} must cover ${required}`);
  }
}
for (const required of [
  "run_hvut_encounter_bridge('WIDGET_GENERATION_FAILED'",
  "if (applyEncounterState(outcome) === false) return false;",
  "if (outcome?.handled) return false;",
]) {
  if (!hvUtilsText.includes(required)) {
    violations.push(`${hvUtilsFile.replaceAll("\\", "/")} must preserve ${required}`);
  }
}
if (!/\bWIDGET_TIMER_ELAPSED\b/.test(hvUtilsText)) {
  violations.push(
    `${hvUtilsFile.replaceAll("\\", "/")} widget countdown expiry must report WIDGET_TIMER_ELAPSED`
  );
}
if (widgetPolicyText.includes("event.force")) {
  violations.push(
    `${widgetPolicyFile.replaceAll("\\", "/")} manual WIDGET_CLICKED identity must not require a modifier force flag`
  );
}
for (const required of [
  "re.button.addEventListener('click', () => { re.run(true); });",
  "readiness.recoveryStatus === 'countdown'",
  "readiness.recoveryRemainingMs",
]) {
  if (!hvUtilsText.includes(required)) {
    violations.push(
      `${hvUtilsFile.replaceAll("\\", "/")} must expose ordinary-click recheck and separate recovery display: ${required}`
    );
  }
}
if (/\bIS_ISEKAI\b/.test(hvUtilsText)) {
  violations.push(
    `${hvUtilsFile.replaceAll("\\", "/")} must not classify the isekai world as gallery/e-hentai page type`
  );
}
if (
  !hvUtilsText.includes(
    "re.type = !location.hostname.includes('hentaiverse.org') ? 'eh' : $id('battle_top') ? 'ba' : $id('navbar') ? ctx.hvPageType : false;"
  )
) {
  violations.push(
    `${hvUtilsFile.replaceAll("\\", "/")} must consume the page type bound at world composition`
  );
}
for (const required of [
  "function suppressIsekaiNavigation(current) {",
  'recovery: "isekaiNavigationSuppressed"',
  'if (event.pageType === "is") return suppressIsekaiNavigation(current);',
  "return suppressIsekaiNavigation(widgetState(event));",
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
  if (!widgetPolicyText.includes(required) && !generationResultText.includes(required)) {
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
if (!widgetPolicyText.includes("classifyEncounterGenerationResult")) {
  violations.push(
    `${widgetPolicyFile.replaceAll("\\", "/")} must classify widget unavailable reasons through one function`
  );
}
for (const required of [
  "does not classify low equipment capacity text as encounter equipment-full failure",
  "does not classify untyped equipment full text outside the news error box",
  "lets a plain battle-page countdown click recheck immediately",
  "ignores root-page started checks even when a stale encounter key is present",
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
if (
  !(widgetPolicyText + widgetObservationText).includes(
    'if (event.pageType !== "ba") return widgetState(event);'
  )
) {
  violations.push(
    `${widgetPolicyFile.replaceAll("\\", "/")} must reject widget started events outside the battle page`
  );
}
if (/Inventory Capacity:[\s\S]{0,180}equipmentInventoryFull/.test(generationResultText)) {
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
