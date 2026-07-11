import { GameWorld } from "../core/ingress-identity.js";

const ISEKAI_PROFILE = Object.freeze({
  identity: GameWorld.ISEKAI,
  feedbackCopy: "isekai",
  encounterPageType: "is",
  priceCatalog: Object.freeze({
    seasonalConsumables: false,
    bindings: false,
    crystals: false,
    figures: false,
  }),
  top: Object.freeze({
    label: "异世界",
    staminaRestorative: false,
    switchHref: "/",
    switchHtml: "<p>你现在在异世界</p><p>{season}</p><p>点击切换到永久区</p>",
  }),
  armory: Object.freeze({
    materialCountByQuality: Object.freeze({ 4: 3, 5: 2, default: 1 }),
  }),
});

const PERSISTENT_PROFILE = Object.freeze({
  identity: GameWorld.PERSISTENT,
  feedbackCopy: "main",
  encounterPageType: "hv",
  priceCatalog: Object.freeze({
    seasonalConsumables: true,
    bindings: true,
    crystals: true,
    figures: true,
  }),
  top: Object.freeze({
    label: "永久区",
    staminaRestorative: true,
    switchHref: "/isekai/",
    switchHtml: "<p>你现在在永久区</p><p>点击切换到异世界</p>",
  }),
  armory: Object.freeze({
    materialCountByQuality: Object.freeze({ default: 1 }),
  }),
});

const PROFILES = Object.freeze({
  [GameWorld.ISEKAI]: ISEKAI_PROFILE,
  [GameWorld.PERSISTENT]: PERSISTENT_PROFILE,
});

export function selectHvutWorldProfile(world) {
  return PROFILES[world] || null;
}
