import { ISEKAI_URL, MAIN_URL, isIsekai } from "../env.js";

const EVENT_READ_CURRENT = "readCurrent";
const WORLD_ISEKAI = "isekai";
const WORLD_PERSISTENT = "persistent";

export const BattleApiWorldContextEvent = Object.freeze({ READ_CURRENT: EVENT_READ_CURRENT });

function readCurrentWorldContext(deps) {
  const world = deps.isIsekai ? WORLD_ISEKAI : WORLD_PERSISTENT;
  const apiBaseUrl = deps.isIsekai ? deps.isekaiUrl : deps.mainUrl;
  const hvcScriptSrc =
    deps.document?.querySelector('script[src*="/hvc.js"]')?.getAttribute("src") || "";
  return Object.freeze({
    world,
    apiBaseUrl,
    apiJsonUrl: `${apiBaseUrl}json`,
    hvcAssetId: /\/z\/([^/]+)\/hvc\.js/.exec(hvcScriptSrc)?.[1] || "",
    hvcScriptSrc,
  });
}

const battleApiWorldContextEventHandlers = Object.freeze({
  [EVENT_READ_CURRENT]: (_event, deps) => readCurrentWorldContext(deps),
});

export function runBattleApiWorldContext(
  event = { type: EVENT_READ_CURRENT },
  deps = { isIsekai, mainUrl: MAIN_URL, isekaiUrl: ISEKAI_URL, document }
) {
  return battleApiWorldContextEventHandlers[event?.type]?.(event, deps);
}
