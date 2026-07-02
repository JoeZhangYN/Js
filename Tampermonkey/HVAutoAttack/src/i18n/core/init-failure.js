export const I18N_INIT_FAILURE_KEY = "HVAA:lastI18nInitFailure";

function i18nInitErrorText(error) {
  return error?.message || String(error);
}

export function recordI18nInitFailure(entry, error) {
  const evidence = {
    capability: "i18nInit",
    entry,
    error: i18nInitErrorText(error),
  };
  try {
    globalThis.sessionStorage?.setItem(I18N_INIT_FAILURE_KEY, JSON.stringify(evidence));
  } catch (_error) {
    // i18n init fallback must not depend on diagnostic storage.
  }
  try {
    console.error("[HVAA][i18n] " + entry + " 初始化出错:", error);
  } catch (_error) {
    // Console hooks are diagnostic only.
  }
  return evidence;
}
