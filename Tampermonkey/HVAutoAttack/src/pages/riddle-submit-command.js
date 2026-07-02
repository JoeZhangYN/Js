import { ANSWER_MAP } from "../data/riddle-answers.js";
import { recordRiddleSubmitFailure } from "./riddle-submit-failure.js";

function checkboxForAnswer(riddler1, answer) {
  const idx = ANSWER_MAP[answer];
  if (idx === undefined) return null;
  return riddler1.children?.[idx]?.children?.[0]?.children?.[0] || null;
}

export function submitRiddleAnswerCommand(answers) {
  const riddler1 = document.getElementById("riddler1");
  if (!riddler1) {
    recordRiddleSubmitFailure("missing-riddler", { answers });
    return false;
  }
  let selected = 0;
  for (const answer of answers || []) {
    const checkbox = checkboxForAnswer(riddler1, answer);
    if (!checkbox) {
      recordRiddleSubmitFailure("missing-checkbox", { answer });
      continue;
    }
    try {
      checkbox.checked = true;
      selected += 1;
    } catch (error) {
      recordRiddleSubmitFailure("select-answer", { answer, error: error.message });
    }
  }
  if (!selected) {
    recordRiddleSubmitFailure("no-answer-selected", { answers });
    return false;
  }
  const submit = document.getElementById("riddlesubmit");
  if (!submit) {
    recordRiddleSubmitFailure("missing-submit", { selected });
    return false;
  }
  try {
    // HV keeps the submit button disabled until native checkbox handlers run.
    submit.disabled = false;
    submit.click();
  } catch (error) {
    recordRiddleSubmitFailure("click-submit", { selected, error: error.message });
    return false;
  }
  return true;
}
