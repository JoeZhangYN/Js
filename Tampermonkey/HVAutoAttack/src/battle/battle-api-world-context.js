import { CURRENT_WORLD_POLICY } from "../core/current-runtime.js";

const EVENT_READ_CURRENT = "readCurrent";
export const BattleApiWorldContextEvent = Object.freeze({ READ_CURRENT: EVENT_READ_CURRENT });

function readCurrentWorldContext(policy, deps) {
  const hvcScriptSrc =
    deps.document?.querySelector('script[src*="/hvc.js"]')?.getAttribute("src") || "";
  return Object.freeze({
    world: policy.world,
    apiBaseUrl: policy.battleApi.baseUrl,
    apiJsonUrl: policy.battleApi.jsonUrl,
    hvcAssetId: /\/z\/([^/]+)\/hvc\.js/.exec(hvcScriptSrc)?.[1] || "",
    hvcScriptSrc,
  });
}

export function createBattleApiWorldContextCapability(policy, deps = {}) {
  if (!policy?.world || !policy?.battleApi?.baseUrl || !policy?.battleApi?.jsonUrl) {
    throw new TypeError("Battle API capability requires a complete world policy");
  }
  const runtime = { document: deps.document || document };
  return Object.freeze({
    run(event = { type: EVENT_READ_CURRENT }) {
      if (event?.type !== EVENT_READ_CURRENT) return undefined;
      return readCurrentWorldContext(policy, runtime);
    },
  });
}

const currentBattleApiWorldContext = createBattleApiWorldContextCapability(CURRENT_WORLD_POLICY);

export function runBattleApiWorldContext(event = { type: EVENT_READ_CURRENT }) {
  return currentBattleApiWorldContext.run(event);
}
