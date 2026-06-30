const BIG_SKILL_SPECS = Object.freeze({
  OFC: Object.freeze({ id: "1111", oc: 205 }),
  FRD: Object.freeze({ id: "1101", oc: 105 }),
});

export function bigSkillCodes() {
  return Object.keys(BIG_SKILL_SPECS);
}

export function readBigSkillSpec(code) {
  return BIG_SKILL_SPECS[code] || null;
}

export function isBigSkillEnabled(opt, code) {
  return !!(opt?.[`skill_${code}`] || opt?.skill?.[code]);
}
