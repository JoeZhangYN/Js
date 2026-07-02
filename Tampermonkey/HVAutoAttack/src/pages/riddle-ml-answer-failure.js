import { RiddleLogEvent, runRiddleLogAutomation } from "../state/riddle-log.js";

function errorText(error) {
  return error?.message || error?.name || String(error || "unknown");
}

export function recordRiddleMlAnswerFailure(error) {
  runRiddleLogAutomation({
    type: RiddleLogEvent.PUSH,
    message: `ml answer failed error=${errorText(error)} fallback=random`,
  });
}
