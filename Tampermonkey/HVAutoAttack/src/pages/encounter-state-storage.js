import { EncounterPolicyEvent, runEncounterPolicy } from "./encounter-policy.js";

const HVUT_RE_KEY = "hvut_re";
const EVENT_READ = "read";
const EVENT_WRITE = "write";

export const EncounterStateStorageEvent = Object.freeze({
  READ: EVENT_READ,
  WRITE: EVENT_WRITE,
});

const defaultState = () => runEncounterPolicy({ type: EncounterPolicyEvent.DEFAULT_STATE });
const errorText = (error) => error?.message || String(error);

function selectAuthority(deps) {
  const hasGet = typeof deps.getValue === "function";
  const hasSet = typeof deps.setValue === "function";
  if (hasGet && hasSet) return { authority: "gm", scope: "crossOrigin" };
  if (!hasGet && !hasSet) return { authority: "local", scope: "origin", degraded: true };
  return { authority: "unavailable", scope: "none", reason: "partialGmStorage" };
}

function reject(authority, reason, error, state = defaultState()) {
  return {
    ok: false,
    status: "rejected",
    ...authority,
    reason,
    error: error ? errorText(error) : undefined,
    state,
  };
}

function readLocal(authority, deps) {
  try {
    const raw = deps.localStorage.getItem(HVUT_RE_KEY);
    if (!raw) return { ok: true, status: "read", ...authority, state: defaultState() };
    try {
      return { ok: true, status: "read", ...authority, state: JSON.parse(raw) };
    } catch (error) {
      deps.warn("read-local-json", { key: HVUT_RE_KEY, error: errorText(error) });
      return reject(authority, "localStateInvalid", error);
    }
  } catch (error) {
    deps.warn("read-local", { key: HVUT_RE_KEY, error: errorText(error) });
    return reject(authority, "localReadFailed", error);
  }
}

function readState(deps) {
  const authority = selectAuthority(deps);
  if (authority.authority === "unavailable") {
    deps.warn("read-authority", { key: HVUT_RE_KEY, reason: authority.reason });
    return reject(authority, authority.reason);
  }
  if (authority.authority === "local") return readLocal(authority, deps);
  try {
    return {
      ok: true,
      status: "read",
      ...authority,
      state: deps.getValue(HVUT_RE_KEY, defaultState()),
    };
  } catch (error) {
    deps.warn("read-gm", { key: HVUT_RE_KEY, error: errorText(error) });
    return reject(authority, "gmReadFailed", error);
  }
}

function writeState(event, deps) {
  const authority = selectAuthority(deps);
  if (authority.authority === "unavailable") {
    deps.warn("write-authority", { key: HVUT_RE_KEY, reason: authority.reason });
    return reject(authority, authority.reason, undefined, event.state);
  }
  try {
    if (authority.authority === "gm") deps.setValue(HVUT_RE_KEY, event.state);
    else deps.localStorage.setItem(HVUT_RE_KEY, JSON.stringify(event.state));
    return { ok: true, status: "persisted", ...authority, state: event.state };
  } catch (error) {
    const stage = authority.authority === "gm" ? "write-gm" : "write-local";
    deps.warn(stage, { key: HVUT_RE_KEY, state: event.state, error: errorText(error) });
    return reject(authority, `${authority.authority}WriteFailed`, error, event.state);
  }
}

export function runEncounterStateStorage(event, deps) {
  if (event?.type === EVENT_READ) return readState(deps);
  if (event?.type === EVENT_WRITE) return writeState(event, deps);
  return undefined;
}
