const EVENT_READ_READY_MAP = "readReadyMap";

export const BattleSkillReadinessEvent = Object.freeze({
  READ_READY_MAP: EVENT_READ_READY_MAP,
});

const BATTLE_SKILL_IDS = Object.freeze([
  "111",
  "112",
  "113",
  "121",
  "122",
  "123",
  "131",
  "132",
  "133",
  "141",
  "142",
  "143",
  "151",
  "152",
  "153",
  "161",
  "162",
  "163",
  "211",
  "212",
  "213",
  "221",
  "222",
  "223",
  "231",
  "232",
  "233",
  "311",
  "312",
  "313",
  "411",
  "412",
  "413",
  "421",
  "422",
  "423",
  "431",
  "432",
  "1011",
  "1101",
  "1111",
  "2101",
  "2102",
  "2103",
  "2201",
  "2202",
  "2203",
  "2301",
  "2302",
  "2303",
]);

function readReadyMap() {
  const map = {};
  for (const id of BATTLE_SKILL_IDS) {
    const el = document.getElementById(id);
    if (!el) continue;
    map[id] = el.style.opacity !== "0.5";
  }
  return map;
}

export function runBattleSkillReadiness(event = { type: EVENT_READ_READY_MAP }) {
  if (event.type === EVENT_READ_READY_MAP) return readReadyMap();
  return {};
}
