import { normalizeUtilityMultipliers, UTILITY_SKILL_CODES } from "./utility-weight-model.js";

export const UTILITY_SAMPLE_COUNT = 20;
export const UTILITY_BATTLE_WINDOW = 20;
const MAX_MULTIPLIER_STEP = 0.05;
const RELATIVE_EFFICIENCY_DEADBAND = 0.05;

const roundMultiplier = (value) => Math.round(value * 100) / 100;
const clampMultiplier = (value) => Math.min(1.2, Math.max(0.8, value));

export function buildUtilityShadowProposal(samples, currentMultipliers) {
  const ready = UTILITY_SKILL_CODES.every(
    (code) => (samples[code]?.count || 0) >= UTILITY_SAMPLE_COUNT
  );
  if (!ready) return { ready: false };
  const means = Object.fromEntries(
    UTILITY_SKILL_CODES.map((code) => [code, samples[code].efficiencySum / samples[code].count])
  );
  const benchmark =
    UTILITY_SKILL_CODES.reduce((sum, code) => sum + means[code], 0) / UTILITY_SKILL_CODES.length;
  const current = normalizeUtilityMultipliers(currentMultipliers);
  const multipliers = Object.fromEntries(
    UTILITY_SKILL_CODES.map((code) => {
      const relative = benchmark > 0 ? means[code] / benchmark : 1;
      const direction =
        relative > 1 + RELATIVE_EFFICIENCY_DEADBAND
          ? 1
          : relative < 1 - RELATIVE_EFFICIENCY_DEADBAND
            ? -1
            : 0;
      return [
        code,
        roundMultiplier(clampMultiplier(current[code] + direction * MAX_MULTIPLIER_STEP)),
      ];
    })
  );
  const changed = UTILITY_SKILL_CODES.some((code) => multipliers[code] !== current[code]);
  return { ready: true, changed, means, benchmark, multipliers };
}

export function summarizeUtilityBattles(records) {
  const totals = (records || []).reduce(
    (sum, record) => ({
      oc: sum.oc + record.oc,
      progress: sum.progress + record.progress,
      potions: sum.potions + record.potions,
      turns: sum.turns + record.turns,
      flee: sum.flee + record.flee,
      pause: sum.pause + record.pause,
      recovery: sum.recovery + record.recovery,
    }),
    { oc: 0, progress: 0, potions: 0, turns: 0, flee: 0, pause: 0, recovery: 0 }
  );
  const battles = Math.max(1, records?.length || 0);
  return {
    battles: records?.length || 0,
    ocPerProgress: totals.progress > 0 ? totals.oc / totals.progress : totals.oc > 0 ? Infinity : 0,
    potionsPerBattle: totals.potions / battles,
    turnsPerBattle: totals.turns / battles,
    flee: totals.flee,
    pause: totals.pause,
    recovery: totals.recovery,
  };
}

function worsenedBy(candidate, baseline, ratio) {
  if (baseline === 0) return candidate > 0;
  return candidate > baseline * ratio;
}

export function evaluateUtilityCandidate(baselineRecords, candidateRecords) {
  const baseline = summarizeUtilityBattles(baselineRecords);
  const candidate = summarizeUtilityBattles(candidateRecords);
  const reasons = [];
  if (worsenedBy(candidate.ocPerProgress, baseline.ocPerProgress, 1.1)) {
    reasons.push("ocPerProgressWorseThan10Percent");
  }
  if (worsenedBy(candidate.potionsPerBattle, baseline.potionsPerBattle, 1.1)) {
    reasons.push("potionsPerBattleWorseThan10Percent");
  }
  if (worsenedBy(candidate.turnsPerBattle, baseline.turnsPerBattle, 1.2)) {
    reasons.push("turnsPerBattleWorseThan20Percent");
  }
  for (const key of ["flee", "pause", "recovery"]) {
    if (candidate[key] > baseline[key]) reasons.push(`${key}Increased`);
  }
  return { rollback: reasons.length > 0, reasons, baseline, candidate };
}
