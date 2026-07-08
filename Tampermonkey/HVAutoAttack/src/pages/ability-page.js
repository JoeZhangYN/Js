// 解析 Ability 页 ?s=Character&ss=ab，提取法术 AoE 目标数 → spellAoe 持久化。
import { gE } from "../dom/query.js";
import { getValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { g } from "../state/store.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { DEBUFF_SKILL_LIB } from "../data/debuff-lib.js";
import { OFFENSIVE_SPELL_LIB } from "../data/spell-lib.js";
import {
  DiagnosticConsoleEvent,
  runDiagnosticConsoleAutomation,
} from "../core/diagnostic-console.js";
import { persistAbilitySpellAoe, recordAbilityAoeFailure } from "./ability-aoe-failure.js";

const EVENT_LOAD_STORED_AOE = "loadStoredAoe";
const EVENT_CAPTURE_ABILITY_PAGE = "captureAbilityPage";
const EVENT_READ_SPELL_AOE = "readSpellAoe";

export const AbilityAoeEvent = Object.freeze({
  LOAD_STORED_AOE: EVENT_LOAD_STORED_AOE,
  CAPTURE_ABILITY_PAGE: EVENT_CAPTURE_ABILITY_PAGE,
  READ_SPELL_AOE: EVENT_READ_SPELL_AOE,
});

const abilityAoeEventHandlers = Object.freeze({
  [EVENT_LOAD_STORED_AOE]: () => loadStoredAoe(),
  [EVENT_CAPTURE_ABILITY_PAGE]: () => {
    if (!isAbilityPage()) return { captured: false, reason: "notAbilityPage" };
    return parseAbilityPage();
  },
  [EVENT_READ_SPELL_AOE]: () => readSpellAoe(),
});

function recordAbilityAoeDiagnostic(stage, detail) {
  return runDiagnosticConsoleAutomation({
    type: DiagnosticConsoleEvent.INFO,
    args: ["[HVAA] ability AoE diagnostic", { capability: "abilityAoe", stage, detail }],
  });
}

function isAbilityPage() {
  const params = new URLSearchParams(window.location.search);
  return params.get("s") === "Character" && params.get("ss") === "ab";
}

function loadStoredAoe() {
  const spellAoe = getValue(STORAGE_KEYS.SPELL_AOE, true) || {};
  g("spellAoe", spellAoe);
  recordAbilityAoeDiagnostic("load-stored-aoe", { spellAoe });
}

function readSpellAoe() {
  return g("spellAoe") || {};
}

function syncSpellAoeToOption(spellAoe) {
  const optionVersion = runOptionAutomation({
    type: OptionEvent.READ_FIELD,
    key: "version",
    fallback: undefined,
  });
  if (optionVersion === undefined) return;

  const debuffSkillAoe = {
    ...runOptionAutomation({
      type: OptionEvent.READ_FIELD,
      key: "debuffSkillAoe",
      fallback: {},
    }),
  };
  DEBUFF_SKILL_LIB.forEach((skill, key) => {
    if (skill.id && spellAoe[skill.name] !== undefined) {
      debuffSkillAoe[key] = spellAoe[skill.name];
    }
  });

  const offensiveSpellAoe = {
    ...runOptionAutomation({
      type: OptionEvent.READ_FIELD,
      key: "spellAoe",
      fallback: {},
    }),
  };
  OFFENSIVE_SPELL_LIB.forEach((name, key) => {
    if (spellAoe[name] !== undefined) {
      offensiveSpellAoe[key] = spellAoe[name];
    }
  });

  const debuffWritten = runOptionAutomation({
    type: OptionEvent.WRITE_FIELD,
    key: "debuffSkillAoe",
    value: debuffSkillAoe,
  });
  const spellWritten = runOptionAutomation({
    type: OptionEvent.WRITE_FIELD,
    key: "spellAoe",
    value: offensiveSpellAoe,
  });
  if (debuffWritten === false || spellWritten === false) {
    return {
      synced: false,
      reason: "optionPersistenceFailed",
      debuffWritten,
      spellWritten,
    };
  }
  recordAbilityAoeDiagnostic("sync-option", { debuffSkillAoe, spellAoe: offensiveSpellAoe });
  return { synced: true, debuffSkillAoe, spellAoe: offensiveSpellAoe };
}

function parseAbilityPage() {
  const abilityTop = gE("#ability_top");
  if (!abilityTop) {
    recordAbilityAoeFailure("capture-ability-page", {
      kind: "domMissing",
      selector: "#ability_top",
    });
    return { captured: false, reason: "abilitySurfaceMissing" };
  }
  const spellAoe = {};
  const slots = gE("[onmouseover*='overability']", "all", abilityTop);
  for (const slot of slots) {
    const onmouseover = slot.getAttribute("onmouseover");
    const params = onmouseover.split("','");
    if (params.length < 3) continue;
    const currentEffect = params[2];
    const spellSections = currentEffect.split(/Spells Modified:\s*/);
    for (let i = 1; i < spellSections.length; i++) {
      const section = spellSections[i];
      const nameMatch = section.match(/<strong>(.*?)<\/strong>/);
      if (!nameMatch) continue;
      const aoeMatch = section.match(/Changes max affected targets to (\d+)/);
      if (!aoeMatch) continue;
      spellAoe[nameMatch[1]] = parseInt(aoeMatch[1]);
    }
  }
  recordAbilityAoeDiagnostic("capture-ability-page", { spellAoe });
  if (!persistAbilitySpellAoe(spellAoe)) {
    return { captured: false, reason: "spellAoePersistenceFailed", spellAoe };
  }
  // 同步自动检测结果到 option，使设置页面 UI 同步显示
  const optionSync = syncSpellAoeToOption(spellAoe);
  if (optionSync?.synced === false) {
    recordAbilityAoeFailure("sync-option", {
      kind: "optionWrite",
      reason: optionSync.reason,
      debuffWritten: optionSync.debuffWritten,
      spellWritten: optionSync.spellWritten,
    });
  }
  return { captured: true, spellAoe, optionSync };
}

export function runAbilityAoeAutomation(event = { type: EVENT_CAPTURE_ABILITY_PAGE }) {
  const handler = abilityAoeEventHandlers[event?.type];
  return handler ? handler(event) : undefined;
}
