import { FORGE_COSTS } from "../data/forge-costs.js";
import { GameWorld } from "./ingress-identity.js";

const MAIN_ROOT = "https://hentaiverse.org/";
const ISEKAI_ROOT = "https://hentaiverse.org/isekai/";

const WORLD_POLICIES = Object.freeze({
  [GameWorld.PERSISTENT]: Object.freeze({
    world: GameWorld.PERSISTENT,
    auditIdentity: "hv:persistent",
    storage: Object.freeze({ prefix: "hvAA_" }),
    battleApi: Object.freeze({ baseUrl: MAIN_ROOT, jsonUrl: `${MAIN_ROOT}json` }),
    monsterKnowledge: Object.freeze({
      dbName: "hvAA_monsterdb",
      dataUrl: "https://hv-monsterdb-data.skk.moe/persistent.json",
    }),
    battleReport: Object.freeze({ dbName: "hvAA_battle_reports" }),
    staminaLoss: Object.freeze({ dbName: "hvAA_stamina_loss" }),
    learnedMonster: Object.freeze({ dbName: "hvAA_learned_monsters" }),
    hvutDerived: Object.freeze({ dbName: "hvAA_hvut_derived" }),
    storageMaintenance: Object.freeze({ dbName: "hvAA_storage_maintenance" }),
    routes: Object.freeze({
      rootUrl: MAIN_ROOT,
      encounterGenerationUrl: "https://e-hentai.org/news.php",
    }),
    features: Object.freeze({ randomEncounter: true }),
    hvut: Object.freeze({ namespace: "hvut" }),
    forgeCost: FORGE_COSTS.persistent,
  }),
  [GameWorld.ISEKAI]: Object.freeze({
    world: GameWorld.ISEKAI,
    auditIdentity: "hv:isekai",
    storage: Object.freeze({ prefix: "hvAA_isekai_" }),
    battleApi: Object.freeze({ baseUrl: ISEKAI_ROOT, jsonUrl: `${ISEKAI_ROOT}json` }),
    monsterKnowledge: Object.freeze({
      dbName: "hvAA_monsterdb_isekai",
      dataUrl: "https://hv-monsterdb-data.skk.moe/isekai.json",
    }),
    battleReport: Object.freeze({ dbName: "hvAA_battle_reports_isekai" }),
    staminaLoss: Object.freeze({ dbName: "hvAA_stamina_loss_isekai" }),
    learnedMonster: Object.freeze({ dbName: "hvAA_learned_monsters_isekai" }),
    hvutDerived: Object.freeze({ dbName: "hvAA_hvut_derived_isekai" }),
    storageMaintenance: Object.freeze({ dbName: "hvAA_storage_maintenance_isekai" }),
    routes: Object.freeze({ rootUrl: ISEKAI_ROOT, encounterGenerationUrl: null }),
    features: Object.freeze({ randomEncounter: false }),
    hvut: Object.freeze({ namespace: "hvuti" }),
    forgeCost: FORGE_COSTS.isekai,
  }),
});

export function selectWorldPolicy(world) {
  const policy = WORLD_POLICIES[world];
  if (!policy) throw new TypeError(`Unsupported HV world: ${String(world)}`);
  return policy;
}
