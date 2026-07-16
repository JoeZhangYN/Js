import { describe, expect, it } from "vitest";
import { classifyIngress, GameWorld, SiteIdentity } from "./ingress-identity.js";
import { selectWorldPolicy } from "./world-policy.js";

function locationAt(host, pathname) {
  return { host, hostname: host, origin: `https://${host}`, pathname };
}

describe("ingress identity and world policy", () => {
  it.each([
    ["hentaiverse.org", "/", SiteIdentity.HV, GameWorld.PERSISTENT],
    ["hentaiverse.org", "/isekai/", SiteIdentity.HV, GameWorld.ISEKAI],
    ["alt.hentaiverse.org", "/isekai/", SiteIdentity.HV, GameWorld.ISEKAI],
    ["e-hentai.org", "/news.php", SiteIdentity.EXTERNAL, GameWorld.PERSISTENT],
  ])("classifies %s%s once", (host, pathname, site, world) => {
    expect(classifyIngress(locationAt(host, pathname))).toMatchObject({
      site,
      world,
      host,
      pathname,
    });
  });

  it("binds all world-owned authorities in one frozen policy", () => {
    expect(selectWorldPolicy(GameWorld.PERSISTENT)).toMatchObject({
      storage: { prefix: "hvAA_" },
      monsterKnowledge: { dbName: "hvAA_monsterdb" },
      battleReport: { dbName: "hvAA_battle_reports" },
      staminaLoss: { dbName: "hvAA_stamina_loss" },
      learnedMonster: { dbName: "hvAA_learned_monsters" },
      hvutDerived: { dbName: "hvAA_hvut_derived" },
      storageMaintenance: { dbName: "hvAA_storage_maintenance" },
      routes: { encounterGenerationUrl: "https://e-hentai.org/news.php" },
      features: { randomEncounter: true },
      hvut: { namespace: "hvut" },
    });
    expect(selectWorldPolicy(GameWorld.ISEKAI)).toMatchObject({
      storage: { prefix: "hvAA_isekai_" },
      monsterKnowledge: { dbName: "hvAA_monsterdb_isekai" },
      battleReport: { dbName: "hvAA_battle_reports_isekai" },
      staminaLoss: { dbName: "hvAA_stamina_loss_isekai" },
      learnedMonster: { dbName: "hvAA_learned_monsters_isekai" },
      hvutDerived: { dbName: "hvAA_hvut_derived_isekai" },
      storageMaintenance: { dbName: "hvAA_storage_maintenance_isekai" },
      routes: { encounterGenerationUrl: null },
      features: { randomEncounter: false },
      hvut: { namespace: "hvuti" },
    });
    expect(Object.isFrozen(selectWorldPolicy(GameWorld.ISEKAI))).toBe(true);
  });

  it("rejects unclassified worlds instead of silently falling back", () => {
    expect(() => selectWorldPolicy("unknown")).toThrow("Unsupported HV world");
  });
});
