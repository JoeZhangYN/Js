export const ALARM_NOTIFICATION_FAILURE_KEY = "HVAA:lastAlarmNotificationFailure";

export function recordAlarmNotificationFailure(stage, error) {
  const evidence = {
    capability: "alarmNotification",
    stage,
    error: error?.message || String(error),
  };
  try {
    sessionStorage.setItem(ALARM_NOTIFICATION_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // Alarm fallback must not depend on diagnostic storage.
  }
  return evidence;
}
