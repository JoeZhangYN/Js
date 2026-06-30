import { gE } from "../dom/query.js";

const EVENT_READ_GEM_NAME = "readGemName";

export const BattleItemSurfaceEvent = Object.freeze({
  READ_GEM_NAME: EVENT_READ_GEM_NAME,
});

function readGemName() {
  return gE("#ikey_p")?.textContent ?? null;
}

export function runBattleItemSurface(event = { type: EVENT_READ_GEM_NAME }) {
  if (event.type === EVENT_READ_GEM_NAME) return readGemName();
  return null;
}
