const EVENT_WARN = "warn";
const EVENT_ERROR = "error";
const EVENT_INFO = "info";
const EVENT_DEBUG = "debug";

export const DiagnosticConsoleEvent = Object.freeze({
  WARN: EVENT_WARN,
  ERROR: EVENT_ERROR,
  INFO: EVENT_INFO,
  DEBUG: EVENT_DEBUG,
});

const diagnosticConsoleMethod = Object.freeze({
  [EVENT_WARN]: "warn",
  [EVENT_ERROR]: "error",
  [EVENT_INFO]: "info",
  [EVENT_DEBUG]: "debug",
});

export function runDiagnosticConsoleAutomation(event = { type: EVENT_WARN }, deps = {}) {
  const method = diagnosticConsoleMethod[event?.type];
  if (!method) return false;
  try {
    (deps.console || globalThis.console)?.[method]?.(...(event.args || []));
  } catch {
    return false;
  }
  return true;
}
