import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/pages/encounter.js");
const entryExecutionFile = path.normalize("src/pages/encounter-entry-execution.js");
const stateHelper = path.normalize("src/pages/encounter-state.js");
const stateTest = path.normalize("src/pages/encounter-state.test.js");
const policyFile = path.normalize("src/pages/encounter-policy.js");
const policyTest = path.normalize("src/pages/encounter-policy.test.js");
const routingTest = path.normalize("src/pages/encounter-routing.test.js");
const rejectionFile = path.normalize("src/pages/encounter-rejection.js");
const bridgeFile = path.normalize("src/pages/encounter-bridge.js");
const hvUtilsFile = path.normalize("src/i18n/hv-utils.js");
const legacyWidgetFile = path.normalize("src/pages/encounter-widget.js");
const widgetPolicyFile = path.normalize("src/pages/encounter-widget-policy.js");
const widgetPolicyTest = path.normalize("src/pages/encounter-widget-policy.test.js");
const lobbyScheduleFile = path.normalize("src/pages/encounter-lobby-schedule.js");
const lobbyScheduleTest = path.normalize("src/pages/encounter-lobby-schedule.test.js");
const optionGateFile = path.normalize("src/pages/encounter-option-gate.js");
const dayRecordFile = path.normalize("src/state/day-record.js");
const timeFile = path.normalize("src/core/time.js");
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
    if (relative !== policyFile && /encounter=\(\[A-Za-z0-9=\]\+\)/.test(line)) {
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
const policyText = fs.readFileSync(path.join(root, policyFile), "utf8");
const policyTestText = fs.readFileSync(path.join(root, policyTest), "utf8");
const rejectionText = fs.readFileSync(path.join(root, rejectionFile), "utf8");
const hvUtilsText = fs.readFileSync(path.join(root, hvUtilsFile), "utf8");
const widgetPolicyText = fs.readFileSync(path.join(root, widgetPolicyFile), "utf8");
const widgetPolicyTestText = fs.readFileSync(path.join(root, widgetPolicyTest), "utf8");
if (!/\bfunction executeEncounterEntry\b/.test(entryExecutionText)) {
  violations.push(
    `${entryExecutionFile.replaceAll("\\", "/")} must execute manual and automatic encounter entry through one function`
  );
}
for (const required of ["isAutomaticEncounterEnabled", "EVENT_RANDOM_ENCOUNTER_STARTED"]) {
  if (!ownerText.includes(required)) {
    violations.push(`${owner.replaceAll("\\", "/")} must own ${required}`);
  }
}
for (const required of ["EncounterStateEvent.MARK_ATTEMPTED", "markEncounterAttempted"]) {
  if (!entryExecutionText.includes(required)) {
    violations.push(`${entryExecutionFile.replaceAll("\\", "/")} must own ${required}`);
  }
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
const optionGateText = fs.readFileSync(path.join(root, optionGateFile), "utf8");
for (const required of ["ENCOUNTER_OPTION_KEY", "OptionEvent.READ_FIELD"]) {
  if (!optionGateText.includes(required)) {
    violations.push(`${optionGateFile.replaceAll("\\", "/")} must own ${required}`);
  }
}
if (/key:\s*["']encounter["']/.test(optionGateText)) {
  violations.push(`${optionGateFile.replaceAll("\\", "/")} must use ENCOUNTER_OPTION_KEY`);
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
  ]) {
    if (entryBody.includes(internal)) {
      violations.push(
        `${policyFile.replaceAll("\\", "/")} entry must dispatch through encounterPolicyEventHandlers`
      );
    }
  }
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
const lobbyScheduleEntryMatch = lobbyScheduleText.match(
  /export function runEncounterLobbySchedule[\s\S]*?\n}/
);
if (!lobbyScheduleEntryMatch) {
  violations.push(
    `${lobbyScheduleFile.replaceAll("\\", "/")} must expose runEncounterLobbySchedule(event)`
  );
} else {
  const entryBody = lobbyScheduleEntryMatch[0];
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
  "Your equipment inventory is full",
]) {
  if (!widgetPolicyText.includes(required)) {
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

if (violations.length) {
  console.error("[verify-encounter-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-encounter-boundary] OK — encounter business state has one owner");
