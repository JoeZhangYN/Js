// 解析 Ability 页 ?s=Character&ss=ab，提取法术 AoE 目标数 → spellAoe 持久化。
import { gE } from "../dom/query.js";
import { getValue, setValue } from "../state/storage.js";
import { STORAGE_KEYS } from "../state/persist-keys.js";
import { g } from "../state/store.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { DEBUFF_SKILL_LIB } from "../data/debuff-lib.js";
import { OFFENSIVE_SPELL_LIB } from "../data/spell-lib.js";

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
    if (isAbilityPage()) parseAbilityPage();
  },
  [EVENT_READ_SPELL_AOE]: () => readSpellAoe(),
});

function isAbilityPage() {
  const params = new URLSearchParams(window.location.search);
  return params.get("s") === "Character" && params.get("ss") === "ab";
}

function loadStoredAoe() {
  g("spellAoe", getValue(STORAGE_KEYS.SPELL_AOE, true) || {});
  console.log("[AoE] 启动加载 spellAoe:", JSON.stringify(g("spellAoe")));
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

  runOptionAutomation({
    type: OptionEvent.WRITE_FIELD,
    key: "debuffSkillAoe",
    value: debuffSkillAoe,
  });
  runOptionAutomation({
    type: OptionEvent.WRITE_FIELD,
    key: "spellAoe",
    value: offensiveSpellAoe,
  });
  console.log(
    "[AoE] 已同步到 option:",
    JSON.stringify({ debuffSkillAoe, spellAoe: offensiveSpellAoe })
  );
}

function parseAbilityPage() {
  const abilityTop = gE("#ability_top");
  if (!abilityTop) return;
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
  console.log("[AoE] 检测结果:", JSON.stringify(spellAoe));
  setValue(STORAGE_KEYS.SPELL_AOE, spellAoe);
  // 同步自动检测结果到 option，使设置页面 UI 同步显示
  syncSpellAoeToOption(spellAoe);
}

export function runAbilityAoeAutomation(event = { type: EVENT_CAPTURE_ABILITY_PAGE }) {
  const handler = abilityAoeEventHandlers[event.type];
  return handler ? handler(event) : undefined;
}
