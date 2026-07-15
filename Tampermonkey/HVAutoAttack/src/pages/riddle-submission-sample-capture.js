import { ANSWER_MAP } from "../data/riddle-answers.js";
import {
  RiddleDatasetEvent,
  RiddleSampleSource,
  runRiddleDatasetAutomation,
} from "../state/riddle-dataset.js";
import { RiddleLogEvent, runRiddleLogAutomation } from "../state/riddle-log.js";
import { RiddleImageEvent, runRiddleImageAutomation } from "./riddle-image.js";
import {
  RiddleSubmissionTimingEvent,
  runRiddleSubmissionTiming,
} from "./riddle-submission-timing.js";
import { createRiddleSubmitGate } from "./riddle-submit-gate.js";
import { recordRiddleSubmitFailure } from "./riddle-submit-failure.js";

function submittedCodes() {
  const riddler1 = document.getElementById("riddler1");
  if (!riddler1) return "";
  const hits = [];
  for (const [code, index] of Object.entries(ANSWER_MAP)) {
    const checkbox = riddler1.children?.[index]?.children?.[0]?.children?.[0];
    if (checkbox?.checked) hits.push(code);
  }
  return hits.join(",");
}

function captureSubmission(context) {
  const source = context.pendingSource
    ? context.pendingSource === "ML"
      ? RiddleSampleSource.ML
      : RiddleSampleSource.RANDOM
    : RiddleSampleSource.MANUAL;
  const answers = submittedCodes();
  const image = runRiddleImageAutomation({ type: RiddleImageEvent.CAPTURE_SAMPLE });
  const persistence = runRiddleDatasetAutomation({
    type: RiddleDatasetEvent.RECORD_SAMPLE,
    imageDataUrl: image.imageDataUrl,
    answers,
    source,
    imageSrc: image.imageSrc,
  });
  try {
    runRiddleLogAutomation({
      type: RiddleLogEvent.PUSH,
      message: `sample source=${source} answers=${answers}`,
    });
  } catch (error) {
    recordRiddleSubmitFailure("sample-log", { error: error?.message || String(error) });
  }
  return persistence;
}

export function installRiddleSubmissionSampleCapture(context) {
  const submitButton = document.getElementById("riddlesubmit");
  if (!submitButton) return false;
  const gate = createRiddleSubmitGate({
    recordAttempt: () =>
      runRiddleSubmissionTiming({ type: RiddleSubmissionTimingEvent.EXTERNAL_SUBMITTED }),
    persistAttempt: () => captureSubmission(context),
    releaseSubmit: () => submitButton.click(),
    onFailure: (error) =>
      recordRiddleSubmitFailure("persistence-gate", {
        error: error?.message || String(error),
        recovery: "submissionReleased",
      }),
  });
  submitButton.addEventListener("click", (event) => gate.handleClick(event), { capture: true });
  return true;
}
