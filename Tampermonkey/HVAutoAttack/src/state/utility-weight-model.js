export const UTILITY_WEIGHT_SCHEMA_VERSION = 1;
export const UTILITY_SKILL_CODES = Object.freeze(["OFC", "FRD", "T3", "T2", "T1"]);
export const DEFAULT_UTILITY_MULTIPLIERS = Object.freeze(
  Object.fromEntries(UTILITY_SKILL_CODES.map((code) => [code, 1]))
);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function createUtilitySkillSamples() {
  return Object.fromEntries(
    UTILITY_SKILL_CODES.map((code) => [code, { count: 0, efficiencySum: 0 }])
  );
}

export function normalizeUtilityMultipliers(value = {}) {
  return Object.fromEntries(
    UTILITY_SKILL_CODES.map((code) => {
      const multiplier = Number(value[code]);
      return [code, Number.isFinite(multiplier) ? clamp(multiplier, 0.8, 1.2) : 1];
    })
  );
}

function normalizeSamples(value = {}) {
  return Object.fromEntries(
    UTILITY_SKILL_CODES.map((code) => {
      const count = Number(value[code]?.count);
      const efficiencySum = Number(value[code]?.efficiencySum);
      return [
        code,
        {
          count: Number.isFinite(count) && count > 0 ? Math.trunc(count) : 0,
          efficiencySum: Number.isFinite(efficiencySum) && efficiencySum >= 0 ? efficiencySum : 0,
        },
      ];
    })
  );
}

function normalizeBattleRecord(value) {
  if (!value || typeof value !== "object") return null;
  const number = (key) => {
    const current = Number(value[key]);
    return Number.isFinite(current) && current >= 0 ? current : 0;
  };
  return {
    oc: number("oc"),
    progress: number("progress"),
    potions: number("potions"),
    turns: Math.max(1, Math.trunc(number("turns"))),
    flee: Math.trunc(number("flee")),
    pause: Math.trunc(number("pause")),
    recovery: Math.trunc(number("recovery")),
    outcome: String(value.outcome || "unknown"),
  };
}

function normalizeBattleWindow(value) {
  return Array.isArray(value) ? value.map(normalizeBattleRecord).filter(Boolean).slice(-20) : [];
}

function normalizeCandidate(value) {
  if (!value || typeof value !== "object") return null;
  return {
    previousMultipliers: normalizeUtilityMultipliers(value.previousMultipliers),
    appliedMultipliers: normalizeUtilityMultipliers(value.appliedMultipliers),
    baseline: normalizeBattleWindow(value.baseline),
    evaluation: normalizeBattleWindow(value.evaluation),
  };
}

function normalizeActiveBattle(value) {
  if (!value || typeof value !== "object") return null;
  const normalized = {};
  for (const key of ["startGlobalTurn", "oc", "progress", "potions", "flee", "pause", "recovery"]) {
    const current = Number(value[key]);
    normalized[key] = Number.isFinite(current) && current >= 0 ? current : 0;
  }
  return normalized;
}

export function createUtilityStyleState() {
  return {
    multipliers: { ...DEFAULT_UTILITY_MULTIPLIERS },
    samples: createUtilitySkillSamples(),
    shadow: null,
    baselineWindow: [],
    candidate: null,
    activeBattle: null,
    pendingAction: null,
    lastDecision: null,
  };
}

export function normalizeUtilityStyleState(value = {}) {
  return {
    multipliers: normalizeUtilityMultipliers(value.multipliers),
    samples: normalizeSamples(value.samples),
    shadow: value.shadow
      ? { ...value.shadow, multipliers: normalizeUtilityMultipliers(value.shadow.multipliers) }
      : null,
    baselineWindow: normalizeBattleWindow(value.baselineWindow),
    candidate: normalizeCandidate(value.candidate),
    activeBattle: normalizeActiveBattle(value.activeBattle),
    pendingAction:
      value.pendingAction && typeof value.pendingAction === "object" ? value.pendingAction : null,
    lastDecision:
      value.lastDecision && typeof value.lastDecision === "object" ? value.lastDecision : null,
  };
}

export function normalizeUtilityWeightDocument(value) {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  if (!parsed || parsed.schemaVersion !== UTILITY_WEIGHT_SCHEMA_VERSION) {
    return { schemaVersion: UTILITY_WEIGHT_SCHEMA_VERSION, styles: {} };
  }
  const styles = Object.fromEntries(
    Object.entries(parsed.styles || {}).map(([style, state]) => [
      style,
      normalizeUtilityStyleState(state),
    ])
  );
  return { schemaVersion: UTILITY_WEIGHT_SCHEMA_VERSION, styles };
}

export function readUtilityStyleState(documentValue, fightingStyle) {
  return normalizeUtilityStyleState(documentValue.styles?.[String(fightingStyle)]);
}

export function writeUtilityStyleState(documentValue, fightingStyle, state) {
  return {
    schemaVersion: UTILITY_WEIGHT_SCHEMA_VERSION,
    styles: {
      ...(documentValue.styles || {}),
      [String(fightingStyle)]: normalizeUtilityStyleState(state),
    },
  };
}
