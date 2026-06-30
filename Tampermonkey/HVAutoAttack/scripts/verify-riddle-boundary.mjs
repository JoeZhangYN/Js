import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const initFile = path.join(root, "src/pages/init.js");
const riddleFile = path.join(root, "src/pages/riddle-automation.js");
const riddleAnswerFile = path.join(root, "src/pages/riddle.js");
const riddleTimingFile = path.join(root, "src/pages/riddle-submission-timing.js");
const riddleImageFile = path.join(root, "src/pages/riddle-image.js");
const riddleMlFile = path.join(root, "src/pages/riddle-ml.js");
const settingsFile = path.join(root, "src/settings/render.js");
const srcDir = path.join(root, "src");
const battleDir = path.join(root, "src/battle");
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function checkInit() {
  const lines = fs.readFileSync(initFile, "utf8").split(/\r?\n/);
  const forbidden = [
    /\briddleAlert\b/,
    /\briddlePopup\b/,
    /\briddleWindow\b/,
    /\bwindow\.open\b/,
    /\bwindow\.opener\b/,
  ];
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) return;
    if (line.includes("runRiddleAutomation")) return;
    if (forbidden.some((re) => re.test(line))) {
      violations.push(
        `${rel(initFile)}:${index + 1} riddle workflow belongs in runRiddleAutomation()`
      );
    }
  });
}

function checkBattleLayer() {
  const forbidden = [
    /\briddlePopup\b/,
    /\briddleWindow\b/,
    /\bwindow\.open\b/,
    /\bwindow\.opener\b/,
  ];
  for (const entry of fs.readdirSync(battleDir, { withFileTypes: true })) {
    const file = path.join(battleDir, entry.name);
    if (!entry.isFile() || !entry.name.endsWith(".js")) continue;
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("//")) return;
      if (line.includes("runRiddleAutomation") || line.includes("RiddleEvent")) return;
      if (forbidden.some((re) => re.test(line))) {
        violations.push(
          `${rel(file)}:${index + 1} battle riddle interruption belongs in runRiddleAutomation(event)`
        );
      }
    });
  }
}

function checkRiddleEntry() {
  const text = fs.readFileSync(riddleFile, "utf8");
  if (!/export function runRiddleAutomation\(/.test(text)) {
    violations.push(`${rel(riddleFile)} must expose runRiddleAutomation()`);
  }
  if (!text.includes("runRiddleAnsweringSession")) {
    violations.push(`${rel(riddleFile)} must route riddle answering through its implementation`);
  }
  for (const required of [
    "riddleEventHandlers",
    "runCurrentRiddlePage",
    "runBattlePostResult",
    "runTestPopupPretreat",
    "BATTLE_POST_RESULT",
    "TEST_POPUP_PRETREAT",
    "NavigationEvent.OPEN_WINDOW",
  ]) {
    if (!text.includes(required)) {
      violations.push(`${rel(riddleFile)} must own riddle popup ${required}`);
    }
  }
  if (
    !/\[EVENT_RIDDLE_PAGE\]: runCurrentRiddlePage[\s\S]*\[EVENT_BATTLE_POST_RESULT\]: runBattlePostResult[\s\S]*\[EVENT_TEST_POPUP_PRETREAT\]: runTestPopupPretreat/.test(
      text
    )
  ) {
    violations.push(`${rel(riddleFile)} must route riddle events through riddleEventHandlers`);
  }
  const entryBody =
    text.match(/export function runRiddleAutomation\(event = \{ type: EVENT_RIDDLE_PAGE \}\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (/if\s*\(\s*event\.type\s*===/.test(entryBody)) {
    violations.push(`${rel(riddleFile)} entry must route events through handler table`);
  }
  for (const forbidden of ["runRiddleAnsweringSession", "runNavigationAutomation", "openRiddlePopup"]) {
    if (entryBody.includes(forbidden)) {
      violations.push(`${rel(riddleFile)} entry must route riddle work through event handlers`);
    }
  }
  if (!text.includes("OptionEvent.READ_FIELD")) {
    violations.push(`${rel(riddleFile)} must read riddlePopup through option entry`);
  }
  if (/from\s+["']\.\.\/state\/store\.js["']/.test(text)) {
    violations.push(`${rel(riddleFile)} must not import store for riddle popup option reads`);
  }
  if (/\bg\(\s*["']option["']\s*\)/.test(text)) {
    violations.push(`${rel(riddleFile)} must not read riddle popup option directly`);
  }
  if (/\bwindow\.open\b/.test(text)) {
    violations.push(`${rel(riddleFile)} must open riddle popup through navigation entry`);
  }
}

function checkRiddleAnswerImplementationConsumers() {
  const allowed = new Set([
    path.normalize("src/pages/riddle-automation.js"),
    path.normalize("src/pages/riddle-automation.test.js"),
    path.normalize("src/pages/riddle.js"),
  ]);
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith(".js")) {
        const relative = path.normalize(path.relative(root, full));
        const text = fs.readFileSync(full, "utf8");
        if (allowed.has(relative)) continue;
        if (/from\s+["']\.\/riddle\.js["']/.test(text)) {
          violations.push(
            `${rel(full)} must use runRiddleAutomation(event), not the riddle answering implementation`
          );
        }
        if (/\brunRiddleAnsweringSession\b/.test(text)) {
          violations.push(
            `${rel(full)} must not call the riddle answering implementation directly`
          );
        }
      }
    }
  }
  walk(srcDir);
}

function checkRiddleSettingsConsumer() {
  const lines = fs.readFileSync(settingsFile, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/\bwindow\.open\b|\briddleWindow\b/.test(line)) {
      violations.push(
        `${rel(settingsFile)}:${index + 1} riddle popup details belong in runRiddleAutomation(event)`
      );
    }
  });
  const text = lines.join("\n");
  if (!text.includes("RiddleEvent.TEST_POPUP_PRETREAT")) {
    violations.push(
      `${rel(settingsFile)} must report riddle popup pretreat to runRiddleAutomation(event)`
    );
  }
}

function checkRiddleSubmissionTiming() {
  const answerText = fs.readFileSync(riddleAnswerFile, "utf8");
  for (const required of [
    "RIDDLE_ANSWERING_FLOW_STEPS",
    "createRiddleAnsweringContext",
    "recordRiddleAppearance",
    "runOptionalRiddleVisualAid",
    "startOptionalRiddleMlHealth",
    "startRiddleSubmissionTiming",
    "installOptionalSubmissionSampleCapture",
    "startOptionalRiddleMlAnswer",
  ]) {
    if (!answerText.includes(required)) {
      violations.push(`${rel(riddleAnswerFile)} must own answering session flow ${required}`);
    }
  }
  if (
    !/const RIDDLE_ANSWERING_FLOW_STEPS = \[\s*recordRiddleAppearance,\s*runOptionalRiddleVisualAid,\s*startOptionalRiddleMlHealth,\s*startRiddleSubmissionTiming,\s*installOptionalSubmissionSampleCapture,\s*startOptionalRiddleMlAnswer,\s*\]/.test(
      answerText
    )
  ) {
    violations.push(`${rel(riddleAnswerFile)} must own explicit riddle answering flow order`);
  }
  const answerEntryBody =
    answerText.match(/export function runRiddleAnsweringSession\(\) \{[\s\S]*?\n\}/)?.[0] || "";
  for (const forbidden of [
    "runAlarmAutomation",
    "runRiddleSubmissionTiming",
    "runRiddleMlAutomation",
    "runRiddleDatasetAutomation",
    "runRiddleImageAutomation",
  ]) {
    if (answerEntryBody.includes(forbidden)) {
      violations.push(
        `${rel(riddleAnswerFile)} entry must route answering through flow steps`
      );
    }
  }
  if (!answerText.includes("runRiddleSubmissionTiming")) {
    violations.push(
      `${rel(riddleAnswerFile)} must route submit timing through runRiddleSubmissionTiming(event)`
    );
  }
  if (!answerText.includes("OptionEvent.READ_FIELD")) {
    violations.push(`${rel(riddleAnswerFile)} must read riddleAnswerTime through option entry`);
  }
  if (/\bg\(\s*["']option["']\s*\)/.test(answerText)) {
    violations.push(`${rel(riddleAnswerFile)} must not read option fields directly`);
  }
  for (const required of [
    "RiddleSubmissionTimingEvent.START",
    "RiddleSubmissionTimingEvent.EXTERNAL_SUBMITTED",
    "RiddleSubmissionTimingEvent.ML_ANSWERS_READY",
  ]) {
    if (!answerText.includes(required)) {
      violations.push(`${rel(riddleAnswerFile)} must report ${required} to the timing entry`);
    }
  }
  if (/=\s*runRiddleSubmissionTiming\s*\(/.test(answerText)) {
    violations.push(
      `${rel(riddleAnswerFile)} must not keep timing command objects from runRiddleSubmissionTiming(event)`
    );
  }
  if (/\btiming\.(?:recordExternalSubmission|scheduleMlSubmit)\s*\(/.test(answerText)) {
    violations.push(
      `${rel(riddleAnswerFile)} must report timing events instead of calling returned timing commands`
    );
  }
  answerText.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) return;
    for (const forbidden of [/\bsetTimeout\s*\(/, /\bsetInterval\s*\(/, /\bdocument\.title\b/]) {
      if (forbidden.test(line)) {
        violations.push(
          `${rel(riddleAnswerFile)}:${index + 1} riddle submit timing belongs in riddle-submission-timing.js`
        );
      }
    }
  });
  const timingText = fs.readFileSync(riddleTimingFile, "utf8");
  for (const required of [
    "runRiddleSubmissionTiming",
    "RiddleSubmissionTimingEvent",
    "riddleSubmissionTimingEventHandlers",
    "recordActiveExternalSubmission",
    "scheduleActiveMlSubmission",
  ]) {
    if (!timingText.includes(required)) {
      violations.push(`${rel(riddleTimingFile)} must own ${required}`);
    }
  }
  if (
    !/\[EVENT_READ_REMAINING\]: readRemainingSeconds[\s\S]*\[EVENT_START\]: startSubmissionTiming[\s\S]*\[EVENT_EXTERNAL_SUBMITTED\]: recordActiveExternalSubmission[\s\S]*\[EVENT_ML_ANSWERS_READY\]: scheduleActiveMlSubmission/.test(
      timingText
    )
  ) {
    violations.push(`${rel(riddleTimingFile)} must route timing events through handler table`);
  }
  const timingEntryBody =
    timingText.match(/export function runRiddleSubmissionTiming\(event = \{ type: EVENT_READ_REMAINING \}\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (/if\s*\(\s*event\.type\s*===/.test(timingEntryBody)) {
    violations.push(`${rel(riddleTimingFile)} entry must route events through handler table`);
  }
  for (const forbidden of [
    "readRemainingSeconds",
    "startSubmissionTiming",
    "recordActiveExternalSubmission",
    "scheduleActiveMlSubmission",
  ]) {
    if (timingEntryBody.includes(forbidden)) {
      violations.push(`${rel(riddleTimingFile)} entry must route timing work through event handlers`);
    }
  }
  for (const required of ["EXTERNAL_SUBMITTED", "ML_ANSWERS_READY"]) {
    if (!timingText.includes(required)) {
      violations.push(`${rel(riddleTimingFile)} must own ${required} timing event`);
    }
  }
  if (/return\s+Object\.freeze\(\{[^}]*\b(?:stop|submitOnce)\b/s.test(timingText)) {
    violations.push(
      `${rel(riddleTimingFile)} must not expose raw timer primitives outside the timing entry`
    );
  }
}

function checkRiddleImageEntry() {
  const owner = path.normalize("src/pages/riddle-image.js");
  const ownerTest = path.normalize("src/pages/riddle-image.test.js");
  const ownerText = fs.readFileSync(riddleImageFile, "utf8");
  for (const required of ["runRiddleImageAutomation", "RiddleImageEvent"]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(riddleImageFile)} must own ${required}`);
    }
  }
  const entryBody =
    ownerText.match(/export function runRiddleImageAutomation\([^)]*\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (!/const riddleImageEventHandlers\s*=\s*Object\.freeze\(\{[\s\S]*\[EVENT_CAPTURE_SAMPLE\]/.test(ownerText)) {
    violations.push(`${rel(riddleImageFile)} must route events through a frozen handler table`);
  }
  if (/event\.type\s*===/.test(entryBody)) {
    violations.push(`${rel(riddleImageFile)} entry must dispatch by handler table`);
  }
  const ownerTestText = fs.existsSync(path.join(root, ownerTest))
    ? fs.readFileSync(path.join(root, ownerTest), "utf8")
    : "";
  if (!ownerTestText.includes("rejects unknown image events without reading image state")) {
    violations.push(`${ownerTest.replaceAll("\\", "/")} must cover unknown image events`);
  }
  for (const legacy of [
    "getRiddleImgEl",
    "waitImageLoaded",
    "getImageBlob",
    "captureRiddleDataUrl",
  ]) {
    if (new RegExp(`export\\s+(?:async\\s+)?function\\s+${legacy}\\s*\\(`).test(ownerText)) {
      violations.push(
        `${rel(riddleImageFile)} legacy ${legacy} export must stay private behind runRiddleImageAutomation(event)`
      );
    }
  }

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith(".js")) {
        const relative = path.normalize(path.relative(root, full));
        if (relative === owner || relative === ownerTest) continue;
        fs.readFileSync(full, "utf8")
          .split(/\r?\n/)
          .forEach((line, index) => {
            if (!/from\s+["']\.\/riddle-image\.js["']/.test(line)) return;
            if (!/\bRiddleImageEvent\b/.test(line) || !/\brunRiddleImageAutomation\b/.test(line)) {
              violations.push(
                `${rel(full)}:${index + 1} riddle image consumers must use runRiddleImageAutomation(event)`
              );
            }
          });
      }
    }
  }
  walk(srcDir);
}

function checkRiddleMlEntry() {
  const owner = path.normalize("src/pages/riddle-ml.js");
  const ownerText = fs.readFileSync(riddleMlFile, "utf8");
  for (const required of [
    "runRiddleMlAutomation",
    "RiddleMlEvent",
    "riddleMlEventHandlers",
    "RIDDLE_ML_ANSWER_FLOW_STEPS",
    "createRiddleMlAnswerContext",
    "readRiddleMlAnswerOptions",
    "ensureRiddleMlAnswerEnabled",
    "notePreviousRiddleMlHealthState",
    "normalizeRiddleMlApiKey",
    "prepareRiddleMlPayload",
    "submitRiddleMlPayload",
    "resolveRiddleMlAnswerResult",
    "decideRiddleMlServiceResponse",
    "applyRiddleMlResponseDecision",
  ]) {
    if (!ownerText.includes(required)) {
      violations.push(`${rel(riddleMlFile)} must own ${required}`);
    }
  }
  if (
    !/const RIDDLE_ML_ANSWER_FLOW_STEPS = \[\s*readRiddleMlAnswerOptions,\s*ensureRiddleMlAnswerEnabled,\s*notePreviousRiddleMlHealthState,\s*normalizeRiddleMlApiKey,\s*prepareRiddleMlPayload,\s*submitRiddleMlPayload,\s*resolveRiddleMlAnswerResult,\s*\]/.test(
      ownerText
    )
  ) {
    violations.push(`${rel(riddleMlFile)} must own explicit ML answer attempt flow order`);
  }
  if (
    !/const riddleMlEventHandlers\s*=\s*Object\.freeze\(\{[\s\S]*\[EVENT_START_HEALTH\]:\s*\(\)\s*=>\s*\{[\s\S]*startRiddleMlHealthCheck\(\);[\s\S]*return true;[\s\S]*\[EVENT_TRY_ANSWER\]: tryMLAnswer/.test(
      ownerText
    )
  ) {
    violations.push(`${rel(riddleMlFile)} must route ML events through a frozen handler table`);
  }
  const mlEntryBody =
    ownerText.match(/export function runRiddleMlAutomation\(event = \{ type: EVENT_TRY_ANSWER \}\) \{[\s\S]*?\n\}/)?.[0] ||
    "";
  if (/if\s*\(\s*event\.type\s*===/.test(mlEntryBody)) {
    violations.push(`${rel(riddleMlFile)} entry must route events through handler table`);
  }
  for (const forbidden of ["startRiddleMlHealthCheck", "tryMLAnswer"]) {
    if (mlEntryBody.includes(forbidden)) {
      violations.push(`${rel(riddleMlFile)} entry must route ML work through event handlers`);
    }
  }
  const ownerTest = path.normalize("src/pages/riddle-ml.test.js");
  const ownerTestText = fs.existsSync(path.join(root, ownerTest))
    ? fs.readFileSync(path.join(root, ownerTest), "utf8")
    : "";
  if (!ownerTestText.includes("rejects unknown ML events without starting health checks or answering")) {
    violations.push(`${ownerTest.replaceAll("\\", "/")} must cover unknown ML events`);
  }
  const requestBody =
    ownerText.match(/async function requestRiddleMlAnswer\([\s\S]*?\n\}/)?.[0] || "";
  if (
    !requestBody.includes("applyRiddleMlResponseDecision(decideRiddleMlServiceResponse(res), resolve)")
  ) {
    violations.push(`${rel(riddleMlFile)} request IO must use the ML response decision point`);
  }
  const onloadBody = requestBody.match(/onload: \(res\) => \{[\s\S]*?\n {6}\},/)?.[0] || "";
  for (const forbidden of [
    'resolve("rate_limited")',
    'resolve("non_json")',
    'resolve("no_answer_code")',
    'resolve("finish")',
    'resolve("server_error")',
    'resolve("unknown")',
  ]) {
    if (onloadBody.includes(forbidden)) {
      violations.push(`${rel(riddleMlFile)} onload must not own ML response result ${forbidden}`);
    }
  }
  for (const legacy of ["tryMLAnswer", "startRiddleMlHealthCheck"]) {
    if (new RegExp(`export\\s+(?:async\\s+)?function\\s+${legacy}\\s*\\(`).test(ownerText)) {
      violations.push(
        `${rel(riddleMlFile)} legacy ${legacy} export must stay private behind runRiddleMlAutomation(event)`
      );
    }
  }
  if (!ownerText.includes("TimeEvent.UTC_DATE_KEY")) {
    violations.push(`${rel(riddleMlFile)} must read ML health day through time entry`);
  }
  if (!ownerText.includes("OptionEvent.READ_FIELD")) {
    violations.push(`${rel(riddleMlFile)} must read ML options through option entry`);
  }
  if (/from\s+["']\.\.\/state\/store\.js["']/.test(ownerText)) {
    violations.push(`${rel(riddleMlFile)} must not import store for ML option reads`);
  }
  if (/\bg\(\s*["']option["']\s*\)/.test(ownerText)) {
    violations.push(`${rel(riddleMlFile)} must not read ML options directly`);
  }
  if (/\bgetUTCFullYear\b|\bgetUTCMonth\b|\bgetUTCDate\b/.test(ownerText)) {
    violations.push(`${rel(riddleMlFile)} must not build UTC date keys directly`);
  }

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith(".js")) {
        const relative = path.normalize(path.relative(root, full));
        if (relative === owner) continue;
        fs.readFileSync(full, "utf8")
          .split(/\r?\n/)
          .forEach((line, index) => {
            if (!/from\s+["']\.\/riddle-ml\.js["']/.test(line)) return;
            if (!/\bRiddleMlEvent\b/.test(line) || !/\brunRiddleMlAutomation\b/.test(line)) {
              violations.push(
                `${rel(full)}:${index + 1} riddle ML consumers must use runRiddleMlAutomation(event)`
              );
            }
          });
      }
    }
  }
  walk(srcDir);
}

function checkDeletedSetupEntrypoints() {
  const files = [
    path.join(root, "src/pages/riddle-automation.js"),
    path.join(root, "src/pages/riddle.js"),
    path.join(root, "src/pages/riddle-helper.js"),
    path.join(root, "src/pages/riddle-ml.js"),
  ];
  const forbidden = /\b(?:riddleAlert|setupRiddleHelper|setupRMAHealth)\b/;
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    if (forbidden.test(text)) {
      violations.push(`${rel(file)} must use riddle business entrypoint names`);
    }
  }
}

checkInit();
checkBattleLayer();
checkRiddleEntry();
checkRiddleAnswerImplementationConsumers();
checkRiddleSettingsConsumer();
checkRiddleSubmissionTiming();
checkRiddleImageEntry();
checkRiddleMlEntry();
checkDeletedSetupEntrypoints();

if (violations.length) {
  console.error("[verify-riddle-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-riddle-boundary] OK — riddle workflow is behind one entry");
