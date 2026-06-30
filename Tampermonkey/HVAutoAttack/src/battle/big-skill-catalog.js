const BIG_SKILL_SPECS = Object.freeze({
  OFC: Object.freeze({ id: "1111", oc: 205 }),
  FRD: Object.freeze({ id: "1101", oc: 105 }),
});

const EVENT_READ_CODES = "readCodes";
const EVENT_READ_SPEC = "readSpec";
const EVENT_IS_ENABLED = "isEnabled";

export const BigSkillCatalogEvent = Object.freeze({
  READ_CODES: EVENT_READ_CODES,
  READ_SPEC: EVENT_READ_SPEC,
  IS_ENABLED: EVENT_IS_ENABLED,
});

const bigSkillCatalogEventHandlers = Object.freeze({
  [EVENT_READ_CODES]: () => readCodes(),
  [EVENT_READ_SPEC]: (event) => readSpec(event.code),
  [EVENT_IS_ENABLED]: (event) => isEnabled(event.opt, event.code),
});

function readCodes() {
  return Object.keys(BIG_SKILL_SPECS);
}

function readSpec(code) {
  return BIG_SKILL_SPECS[code] || null;
}

function isEnabled(opt, code) {
  return !!(opt?.[`skill_${code}`] || opt?.skill?.[code]);
}

export function runBigSkillCatalog(event = { type: EVENT_READ_CODES }) {
  return bigSkillCatalogEventHandlers[event.type]?.(event);
}
