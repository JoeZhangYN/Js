import { gE } from "../dom/query.js";
import { parseEffectName, parseEffectTurns } from "./effect-parse.js";

const EVENT_READ_CURRENT = "readCurrent";

export const BattleMonsterSurfaceEvent = Object.freeze({
  READ_CURRENT: EVENT_READ_CURRENT,
});

const battleMonsterSurfaceEventHandlers = Object.freeze({
  [EVENT_READ_CURRENT]: () => readCurrentMonsters(),
});

function readEffects(container) {
  if (!container) return [];
  return [...container.querySelectorAll("img")].map((img) => ({
    img: img.src.match(/\/e\/(.*?)\.png/)?.[1] || "",
    name: parseEffectName(img),
    turns: parseEffectTurns(img),
  }));
}

function readMonsterBuffs(mEl) {
  const effects = readEffects(mEl.querySelector(".btm6"));
  return { names: effects.map((effect) => effect.img), effects };
}

function readCurrentMonsters() {
  const els = gE("div.btm1", "all");
  return [...els].map((el, i) => {
    const isDead = el.style.opacity === "0.3" || !!el.querySelector('img[src*="nbardead"]');
    const hpBar = el.querySelector(".btm5 img[src*='nbargreen']");
    const hpRatio = hpBar ? Math.max(0, hpBar.offsetWidth) / 120 : isDead ? 0 : 1;
    const { names, effects } = readMonsterBuffs(el);
    const m2El = el.querySelector(".btm2");
    const nameEl = el.querySelector(".btm3");
    return {
      id: i === 9 ? 0 : i + 1,
      order: i,
      isDead,
      isBoss: !!(m2El && m2El.style.background),
      name: nameEl ? nameEl.textContent.trim() : "",
      hpRatio,
      buffs: names,
      buffEffects: effects,
    };
  });
}

export function runBattleMonsterSurface(event = { type: EVENT_READ_CURRENT }) {
  return battleMonsterSurfaceEventHandlers[event.type]?.() ?? [];
}
