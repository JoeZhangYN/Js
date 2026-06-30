import { gE } from "../dom/query.js";
import { g } from "../state/store.js";

const EVENT_READ_CURRENT = "readCurrent";
const EVENT_MIRROR_RUNTIME = "mirrorRuntime";

export const BattlePlayerVitalsEvent = Object.freeze({
  READ_CURRENT: EVENT_READ_CURRENT,
  MIRROR_RUNTIME: EVENT_MIRROR_RUNTIME,
});

function readLegacyVitals() {
  return {
    hp: (gE("#vbh>div>img").offsetWidth / 500) * 100,
    mp: (gE("#vbm>div>img").offsetWidth / 210) * 100,
    sp: (gE("#vbs>div>img").offsetWidth / 210) * 100,
    oc: gE("#vcp>div>div")
      ? (gE("#vcp>div>div", "all").length - gE("#vcp>div>div#vcr", "all").length) * 25
      : 0,
  };
}

function readModernVitals() {
  return {
    hp: (gE("#dvbh>div>img").offsetWidth / 414) * 100,
    mp: (gE("#dvbm>div>img").offsetWidth / 414) * 100,
    sp: (gE("#dvbs>div>img").offsetWidth / 414) * 100,
    oc: parseInt(gE("#dvrc")?.textContent) || 0,
  };
}

function readCurrentVitals() {
  const current = gE("#vbh") ? readLegacyVitals() : readModernVitals();
  const hpMax = parseInt(gE("#dvrhd")?.textContent) || 0;
  const mpMax = parseInt(gE("#dvrm")?.textContent) || 0;
  const spMax = parseInt(gE("#dvrs")?.textContent) || 0;
  return {
    ...current,
    hpMax,
    mpMax,
    spMax,
    hpAbs: (current.hp / 100) * hpMax,
    mpAbs: (current.mp / 100) * mpMax,
    spAbs: (current.sp / 100) * spMax,
    hpDeficit: hpMax - (current.hp / 100) * hpMax,
    mpDeficit: mpMax - (current.mp / 100) * mpMax,
    spDeficit: spMax - (current.sp / 100) * spMax,
  };
}

function mirrorRuntime(vitals = {}) {
  g("hp", vitals.hp);
  g("mp", vitals.mp);
  g("sp", vitals.sp);
  g("oc", vitals.oc);
  return true;
}

export function runBattlePlayerVitals(event = { type: EVENT_READ_CURRENT }) {
  if (event.type === EVENT_READ_CURRENT) return readCurrentVitals();
  if (event.type === EVENT_MIRROR_RUNTIME) return mirrorRuntime(event.vitals);
  return {};
}
