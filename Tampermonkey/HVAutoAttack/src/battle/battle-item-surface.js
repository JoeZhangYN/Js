import { gE } from "../dom/query.js";

const EVENT_READ_GEM_NAME = "readGemName";

export const BattleItemSurfaceEvent = Object.freeze({
  READ_GEM_NAME: EVENT_READ_GEM_NAME,
});

const battleItemSurfaceEventHandlers = Object.freeze({
  [EVENT_READ_GEM_NAME]: () => readGemName(),
});

function readGemName() {
  return gE("#ikey_p")?.textContent ?? null;
}

export function runBattleItemSurface(event = { type: EVENT_READ_GEM_NAME }) {
  return battleItemSurfaceEventHandlers[event.type]?.() ?? null;
}
