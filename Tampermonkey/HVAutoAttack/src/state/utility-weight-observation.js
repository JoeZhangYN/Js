import { UTILITY_SKILL_CODES } from "./utility-weight-model.js";

function readAliveMonsters(view) {
  return (view || [])
    .filter((monster) => !monster.isDead)
    .map((monster) => ({
      id: monster.id,
      hpAbs: Number(monster.hpAbsNow),
      hpMax: Number(monster.hpMax),
    }))
    .filter(
      (monster) =>
        monster.id != null &&
        Number.isFinite(monster.hpAbs) &&
        monster.hpAbs >= 0 &&
        Number.isFinite(monster.hpMax) &&
        monster.hpMax > 0
    );
}

export function createUtilityActionPending(event) {
  const code = String(event?.code || "");
  const ocCost = Number(event?.ocCost);
  const monsters = readAliveMonsters(event?.view);
  if (!UTILITY_SKILL_CODES.includes(code) || !Number.isFinite(ocCost) || ocCost <= 0) return null;
  if (!monsters.length) return null;
  return {
    code,
    ocCost,
    firedGlobalTurn: Number(event.globalTurn) || 0,
    monsters,
  };
}

export function settleUtilityActionObservation(pending, currentView) {
  if (!pending?.monsters?.length || !Array.isArray(currentView)) return null;
  const post = new Map(
    (currentView || []).map((monster) => [
      monster.id,
      {
        dead: Boolean(monster.isDead),
        hpAbs: Math.max(0, Number(monster.hpAbsNow) || 0),
      },
    ])
  );
  const preActionAliveMaxHp = pending.monsters.reduce((sum, monster) => sum + monster.hpMax, 0);
  const preActionAliveCount = pending.monsters.length;
  if (preActionAliveMaxHp <= 0 || preActionAliveCount <= 0) return null;

  let damage = 0;
  let killed = 0;
  for (const monster of pending.monsters) {
    const current = post.get(monster.id);
    const postHp = current && !current.dead ? current.hpAbs : 0;
    damage += Math.max(0, monster.hpAbs - postHp);
    if (!current || current.dead || postHp <= 0) killed += 1;
  }
  const progress = damage / preActionAliveMaxHp + killed / preActionAliveCount;
  const resourceEfficiency = progress / Math.max(1, pending.ocCost / 30);
  return {
    code: pending.code,
    ocCost: pending.ocCost,
    damage,
    killed,
    preActionAliveMaxHp,
    preActionAliveCount,
    progress,
    resourceEfficiency,
  };
}
