import { gE } from "../dom/query.js";
import { parseEffectName, parseEffectTurns } from "./effect-parse.js";

const EVENT_READ_CURRENT = "readCurrent";

export const BattlePlayerEffectsEvent = Object.freeze({
  READ_CURRENT: EVENT_READ_CURRENT,
});

const EMPTY_PLAYER_EFFECT_FACTS = Object.freeze({
  channeling: false,
  etherTapActiveX2: false,
  etherTapExpiring: false,
  playerBuffs: [],
  playerEffects: [],
  playerEffectTurns: {},
});

const battlePlayerEffectsEventHandlers = Object.freeze({
  [EVENT_READ_CURRENT]: () => readCurrentPlayerEffects(),
});

function readEffects(container) {
  if (!container) return [];
  return [...container.querySelectorAll("img")].map((img) => ({
    img: img.src.match(/\/e\/(.*?)\.png/)?.[1] || "",
    name: parseEffectName(img),
    turns: parseEffectTurns(img),
  }));
}

function readCurrentPlayerEffects() {
  const playerEffects = readEffects(gE("#pane_effects"));
  return {
    channeling: !!gE('#pane_effects>img[src*="channeling"]'),
    etherTapActiveX2: !!gE('#pane_effects>img[onmouseover*="Ether Tap (x2)"]'),
    etherTapExpiring: !!gE('#pane_effects>img[src*="wpn_et"][id*="effect_expire"]'),
    playerBuffs: playerEffects.map((effect) => effect.img),
    playerEffects,
    playerEffectTurns: Object.fromEntries(
      playerEffects.map((effect) => [effect.img, effect.turns])
    ),
  };
}

export function runBattlePlayerEffects(event = { type: EVENT_READ_CURRENT }) {
  return battlePlayerEffectsEventHandlers[event.type]?.() ?? EMPTY_PLAYER_EFFECT_FACTS;
}
