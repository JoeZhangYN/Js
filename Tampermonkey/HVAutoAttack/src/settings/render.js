// 整个配置面板的 HTML 模板渲染 + 事件绑定。
// 阶段 5 改成 option schema-driven。当前 chunk 2 仅做物理搬迁，行为不变。
// file-size-gate: exempt phase-3-monolith
import { gE, cE } from "../dom/query.js";
import { getValue } from "../state/storage.js";
import { g } from "../state/store.js";
import { _alert } from "../core/lang.js";
import { AlarmEvent, runAlarmAutomation } from "../alarm/alarm.js";
import {
  NavigationEvent,
  NavigationReloadReason,
  runNavigationAutomation,
} from "../core/navigate.js";
import { TimeEvent, runTimeAutomation } from "../core/time.js";
import { customizeBox } from "./customize.js";
import { OptionSchemaEvent, runOptionSchema } from "./schema.js";
import { SettingsFormOptionEvent, runSettingsFormOptionAutomation } from "./form-option.js";
import { setLang } from "../i18n/core/restore-controller.js";
import { OptionEvent, runOptionAutomation } from "../state/option.js";
import { StaminaLossLogEvent, runStaminaLossLogAutomation } from "../state/stamina-loss-log.js";
import { OptionBackupEvent, runOptionBackupAutomation } from "../state/option-backup.js";
import { RiddleStatsEvent, runRiddleStatsAutomation } from "../state/riddle-stats.js";
import { RiddleLogEvent, runRiddleLogAutomation } from "../state/riddle-log.js";
import { ALARM_AUDIO_PROFILES } from "../alarm/alarm-profiles.js";
import { RiddleEvent, runRiddleAutomation } from "../pages/riddle-automation.js";
import {
  BattleMonitorEvent,
  runBattleMonitorAutomation,
} from "../monitor/battle-monitor-automation.js";
import { BattleRoundEvent, runBattleRoundAutomation } from "../battle/battle-round.js";
import { IdleArenaEvent, runIdleArenaAutomation } from "../arena/idle-arena.js";
import { QuickSiteEvent, runQuickSiteAutomation } from "../arena/quick-site.js";
import { ALL_DEBUFF_ACTION_OPTIONS } from "../data/all-debuff-actions.js";
import { BATTLE_BUFF_ACTION_OPTIONS } from "../data/battle-buff-actions.js";
import { BATTLE_ROUND_TYPE_OPTIONS } from "../data/battle-round-types.js";
import { BATTLE_SCROLL_OPTIONS } from "../data/battle-scrolls.js";
import { BUFF_SKILL_LIB } from "../data/buff-lib.js";
import { CHANNEL_FALLBACK_ORDER_OPTIONS } from "../data/channel-fallback-order.js";
import { DEBUFF_SKILL_LIB } from "../data/debuff-lib.js";
import { IDLE_ARENA_LEVEL_OPTIONS } from "../data/idle-arena-levels.js";
import { ITEM_ORDER_OPTIONS } from "../data/item-order.js";
import { PHYSICAL_SKILL_ORDER_OPTIONS } from "../data/physical-skill-order.js";
import {
  OFFENSIVE_SPELL_ELEMENTS,
  OFFENSIVE_SPELL_LIB,
  OFFENSIVE_SPELL_TIERS,
} from "../data/spell-lib.js";

export function readSingleOrderItemName(target) {
  const match = target?.id?.match(/_(.*)/);
  return match ? match[1] : null;
}

/**
 * 从 option schema 渲染 "checkbox + number + 单位文本" 这类成对字段。
 * Phase 5 渐进迁入示例：新加的 pageRefresh / criticalBuff 等用此 helper 直接消费 schema，
 * 不再手写 template string。老字段仍走 inline template。
 * @param {string} checkboxKey
 * @param {string} numberKey
 * @param {{l0:string,l1:string,l2:string}=} unit 单位/补充说明
 */
function renderCheckboxPlusNumber(checkboxKey, numberKey, unit = { l0: "", l1: "", l2: "" }) {
  const cb = runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: checkboxKey });
  const num = runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: numberKey });
  if (!cb || !num) return "";
  const checkedAttr = cb.defaultOn ? " checked data-default-on" : "";
  const description = num.description || unit;
  return (
    `<div><input id="${cb.key}" type="checkbox"${checkedAttr}>` +
    `<label for="${cb.key}"><b><l0>${cb.label.l0}</l0><l1>${cb.label.l1}</l1><l2>${cb.label.l2}</l2></b></label>: ` +
    `<input class="hvAANumber" name="${num.key}" placeholder="${num.default}" type="text">` +
    `<l0>${description.l0}</l0><l1>${description.l1}</l1><l2>${description.l2}</l2></div>`
  );
}

function renderSchemaLabel(field, { bold = false } = {}) {
  const label = `<l0>${field.label.l0}</l0><l1>${field.label.l1}</l1><l2>${field.label.l2}</l2>`;
  return bold ? `<b>${label}</b>` : label;
}

function readSchemaField(key) {
  return runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key });
}

function renderSchemaNumberInput(key, suffix = "") {
  const field = readSchemaField(key);
  if (!field) return "";
  return `<input class="hvAANumber" name="${field.key}" placeholder="${field.default}" type="text">${suffix}`;
}

function renderSchemaCheckboxField(key, suffix = "", { bold = true, style = "" } = {}) {
  const field = readSchemaField(key);
  if (!field) return "";
  const checkedAttr = field.defaultOn ? " checked data-default-on" : "";
  const styleAttr = style ? ` style="${style}"` : "";
  return (
    `<div${styleAttr}><input id="${field.key}" type="checkbox"${checkedAttr}>` +
    `<label for="${field.key}">${renderSchemaLabel(field, { bold })}</label>${suffix}</div>`
  );
}

function renderSchemaSelectField(key) {
  const field = readSchemaField(key);
  if (!field) return "";
  const options = (field.enum || [])
    .map((value) => {
      const label = Object.prototype.hasOwnProperty.call(field.enumLabel || {}, value)
        ? field.enumLabel[value]
        : value;
      return `<option value="${value}">${label}</option>`;
    })
    .join("");
  return (
    `<div>${renderSchemaLabel(field, { bold: true })}: ` +
    `<select name="${field.key}">${options}</select></div>`
  );
}

function renderSchemaTextInput(key, style = "") {
  const field = readSchemaField(key);
  if (!field) return "";
  const styleAttr = style ? ` style="${style}"` : "";
  return `<input name="${field.key}" placeholder="${field.default}" type="text"${styleAttr}>`;
}

function renderSchemaTextInputWithoutPlaceholder(key, style = "") {
  const field = readSchemaField(key);
  if (!field) return "";
  const styleAttr = style ? ` style="${style}"` : "";
  return `<input name="${field.key}" type="text"${styleAttr}>`;
}

function renderHiddenSchemaInputWithoutPlaceholder(key, attrs = "") {
  const field = readSchemaField(key);
  if (!field) return "";
  const attrText = attrs ? ` ${attrs}` : "";
  return `<input name="${field.key}" type="hidden"${attrText}>`;
}

function renderAttackStatusSchemaField() {
  const field = readSchemaField("attackStatus");
  if (!field) return "";
  const options = (field.enum || [])
    .map((value) => {
      const label = Object.prototype.hasOwnProperty.call(field.enumLabel || {}, value)
        ? field.enumLabel[value]
        : value;
      return `<option value="${value}">${label}</option>`;
    })
    .join("");
  return (
    `  <div class="hvAACenter" id="${field.key}" style="color:red;"><b>*${renderSchemaLabel(
      field
    )}</b>:` + `    <select class="hvAANumber" name="${field.key}">${options}</select></div>`
  );
}

function renderMainPauseSchemaFields() {
  const pauseButton = renderSchemaCheckboxField("pauseButton", "; ", { bold: false }).replace(
    /^<div>|<\/div>$/g,
    ""
  );
  const pauseHotkey = readSchemaField("pauseHotkey");
  if (!pauseHotkey)
    return [
      `  <div><b><l0>暂停相关</l0><l1>暫停相關</l1><l2>Pause with</l2></b>: ${pauseButton}</div>`,
    ];
  const checkedAttr = pauseHotkey.defaultOn ? " checked data-default-on" : "";
  return [
    "  <div><b><l0>暂停相关</l0><l1>暫停相關</l1><l2>Pause with</l2></b>: " +
      pauseButton +
      `<input id="${pauseHotkey.key}" type="checkbox"${checkedAttr}><label for="${pauseHotkey.key}">${renderSchemaLabel(
        pauseHotkey
      )}: ${renderSchemaTextInputWithoutPlaceholder(
        "pauseHotkeyStr",
        "width:30px;"
      )}${renderHiddenSchemaInputWithoutPlaceholder("pauseHotkeyKey", 'disabled="true"')}</label></div>`,
  ];
}

function renderMainWarningSchemaFields() {
  const alertField = renderSchemaCheckboxField("alert", "; ", { bold: false }).replace(
    /^<div>|<\/div>$/g,
    ""
  );
  const notificationField = renderSchemaCheckboxField("notification", " ", {
    bold: false,
  }).replace(/^<div>|<\/div>$/g, "");
  return [
    "  <div><b><l0>警告相关</l0><l1>警告相關</l1><l2>To Warn</l2></b>: " +
      alertField +
      notificationField +
      '<button class="testNotification"><l0>预处理</l0><l1>預處理</l1><l2>Pretreat</l2></button></div>',
  ];
}

function renderMainPluginSchemaFields() {
  const riddleRadio = renderSchemaCheckboxField("riddleRadio", "; ", { bold: false }).replace(
    /^<div>|<\/div>$/g,
    ""
  );
  const encounter = renderSchemaCheckboxField("encounter", "", { bold: false }).replace(
    /^<div>|<\/div>$/g,
    ""
  );
  return [
    "  <div><b><l01>内置插件</l01><l2>Built-in Plugin</l2></b>: " +
      riddleRadio +
      encounter +
      "</div>",
  ];
}

export function renderRepairThresholdSchemaField() {
  return renderSchemaCheckboxField(
    "repair",
    `: ${renderSchemaLabel(readSchemaField("repairValue"))} ≤ ${renderSchemaNumberInput(
      "repairValue",
      "%"
    )}`,
    { bold: true }
  );
}

function renderEquipmentSchemaFields() {
  return [
    renderRepairThresholdSchemaField(),
    renderCheckboxPlusNumber("repairBuyMaterials", "repairCreditCap"),
    renderSchemaCheckboxField("forgeCostShow"),
    renderSchemaSelectField("equipPercentileMode"),
  ];
}

function renderRiddleSchemaFields() {
  const mlAnswer = renderSchemaCheckboxField("mlAnswer", "; ").replace(/^<div>|<\/div>$/g, "");
  const mlBackup = renderSchemaCheckboxField("mlBackupOnFail").replace(/^<div>|<\/div>$/g, "");
  return [
    renderSchemaCheckboxField("riddleHelperUi"),
    `<div>${mlAnswer}${mlBackup}</div>`,
    `<div>${renderSchemaLabel(readSchemaField("mlEndpoint"))}: ${renderSchemaTextInput(
      "mlEndpoint",
      "width:50%;"
    )} ${renderSchemaLabel(readSchemaField("mlApiKey"))}: ${renderSchemaTextInput(
      "mlApiKey",
      "width:20%;"
    )}</div>`,
  ];
}

function renderRiddleTimingSchemaFields() {
  const popup = renderSchemaCheckboxField("riddlePopup", "; ", { bold: false }).replace(
    /^<div>|<\/div>$/g,
    ""
  );
  return [
    `<div><l0>当<b>小马答题</b>时间</l0><l1>當<b>小馬答題</b>時間</l1><l2>If <b>RIDDLE</b> ETR</l2><l0></l0><l1></l1><l2></l2> ≤ ${renderSchemaNumberInput(
      "riddleAnswerTime"
    )}<l0>秒，如果输入框为空则随机生成答案并提交</l0><l1>秒，如果輸入框為空則隨機生成答案並提交</l1><l2>s and no answer has been chosen yet, a random answer will be generated and submitted</l2></div>`,
    `  <div><l0>当<b>小马答题</b>时</l0><l1>當<b>小馬答題</b>時</l1><l2>If <b>RIDDLE</b></l2>: ${popup}<button class="testPopup"><l0>预处理</l0><l1>預處理</l1><l2>Pretreat</l2></button></div>`,
  ];
}

function renderDropMonitorTabSchemaField() {
  return renderSchemaCheckboxField("dropMonitor", "", { bold: false }).replace(
    /^<div>|<\/div>$/g,
    ""
  );
}

function renderUsageTrackingTabSchemaField() {
  return renderSchemaCheckboxField("recordUsage", "", { bold: false }).replace(
    /^<div>|<\/div>$/g,
    ""
  );
}

function renderChannelSkillSwitchTabSchemaField() {
  return renderSchemaCheckboxField("channelSkillSwitch", "", { bold: false }).replace(
    /^<div>|<\/div>$/g,
    ""
  );
}

export function renderChannelFallbackEnableSchemaField() {
  return renderSchemaCheckboxField("channelSkill2", ": ", { bold: true });
}

export function renderBattleTabSwitchSchemaField(key) {
  return renderSchemaCheckboxField(key, "", { bold: false }).replace(/^<div>|<\/div>$/g, "");
}

function renderLocalizedInlineLabel(label) {
  return Object.entries(label)
    .map(([tag, text]) => `<${tag}>${text}</${tag}>`)
    .join("");
}

export function renderBuffSkillCheckboxes(idPrefix) {
  return Array.from(BUFF_SKILL_LIB.entries())
    .map(
      ([key, skill]) =>
        `<input id="${idPrefix}_${key}" type="checkbox"><label for="${idPrefix}_${key}">${skill.name}</label>`
    )
    .reduce((rows, item, index) => {
      const rowIndex = index < 4 ? 0 : 1;
      rows[rowIndex] = `${rows[rowIndex] || ""}${item}`;
      return rows;
    }, [])
    .join("<br>");
}

export function renderBuffSkillActionCheckboxes() {
  return BATTLE_BUFF_ACTION_OPTIONS.map(
    ({ key, label }) =>
      `<div><input id="buffSkill_${key}" type="checkbox"><label for="buffSkill_${key}">${label}</label>{{buffSkill${key}Condition}}</div>`
  ).join("");
}

export function renderChannelFallbackOrderCheckboxes() {
  return CHANNEL_FALLBACK_ORDER_OPTIONS.map(
    (skill) =>
      `<input id="channelSkill2Order_${skill.key}" value="${skill.key},${skill.skillId}" type="checkbox"><label for="channelSkill2Order_${skill.key}">${skill.name}</label>`
  )
    .reduce((rows, item, index) => {
      const rowIndex = index < 6 ? 0 : 1;
      rows[rowIndex] = `${rows[rowIndex] || ""}${item}`;
      return rows;
    }, [])
    .join("<br>");
}

export function renderDebuffSkillOrderCheckboxes() {
  return readCastableDebuffSkills()
    .map(
      ([key, skill]) =>
        `<input id="debuffSkillOrder_${key}" type="checkbox"><label for="debuffSkillOrder_${key}">${skill.name}</label>`
    )
    .reduce((rows, item, index) => {
      const rowIndex = index < 3 ? 0 : 1;
      rows[rowIndex] = `${rows[rowIndex] || ""}${item}`;
      return rows;
    }, [])
    .join("<br>");
}

function readCastableDebuffSkills() {
  return Array.from(DEBUFF_SKILL_LIB.entries()).filter(([, skill]) => skill.id);
}

export function renderDebuffSkillCheckboxes({ afterKeyHtml = {} } = {}) {
  return readCastableDebuffSkills()
    .map(([key, skill]) => {
      const checkbox = `<div><input id="debuffSkill_${key}" type="checkbox"><label for="debuffSkill_${key}">${skill.name}</label>{{debuffSkill${key}Condition}}</div>`;
      return `${checkbox}${afterKeyHtml[key] || ""}`;
    })
    .join("");
}

export function renderDebuffSkillNumberRows(fieldPrefix, { placeholder = "" } = {}) {
  return readCastableDebuffSkills()
    .map(([key, skill]) => {
      const placeholderAttr = placeholder ? ` placeholder="${placeholder}"` : "";
      return `${skill.name}: <input class="hvAANumber" name="${fieldPrefix}_${key}"${placeholderAttr} type="text">`;
    })
    .reduce((rows, item, index) => {
      const rowIndex = Math.floor(index / 3);
      rows[rowIndex] = `${rows[rowIndex] ? `${rows[rowIndex]} ` : ""}${item}`;
      return rows;
    }, [])
    .map((row, index, rows) => `    ${row}${index < rows.length - 1 ? "<br>" : " "}`)
    .join("");
}

export function renderDebuffExpiryAlertSchemaSection() {
  const alert = renderSchemaCheckboxField("debuffSkillTurnAlert", "<br>", {
    bold: false,
  }).replace(/^<div>|<\/div>$/g, "");
  return `  <div><l0>持续</l0><l1>持續</l1><l2>Expire</l2> Turns: ${alert}`;
}

export function renderAllDebuffActionCheckboxes() {
  return ALL_DEBUFF_ACTION_OPTIONS.map(({ key, conditionKey }) =>
    renderSchemaCheckboxField(key, `{{${conditionKey}}}`, { bold: false })
  ).join("");
}

export function renderPhysicalSkillOrderCheckboxes() {
  return PHYSICAL_SKILL_ORDER_OPTIONS.map(
    ({ key, label }) =>
      `<input id="skillOrder_${key}" type="checkbox"><label for="skillOrder_${key}"><l0>${label.l0}</l0><l1>${label.l1}</l1><l2>${label.l2}</l2></label>`
  ).join("");
}

export function renderPhysicalSkillActionCheckboxes({ afterKeyHtml = {} } = {}) {
  return PHYSICAL_SKILL_ORDER_OPTIONS.map(({ key, label, actionLabel }) => {
    const displayLabel = actionLabel || label;
    const extra = afterKeyHtml[key] ? `<br>${afterKeyHtml[key]}` : "";
    return `<div><input id="skill_${key}" type="checkbox"><label for="skill_${key}"><l0>${displayLabel.l0}</l0><l1>${displayLabel.l1}</l1><l2>${displayLabel.l2}</l2></label>: <input id="skillOTOS_${key}" type="checkbox"><label for="skillOTOS_${key}"><l01>一回合只使用一次</l01><l2>One round only spell one time</l2></label>${extra}{{skill${key}Condition}}</div>`;
  }).join("");
}

export function renderOffensiveSpellAoeRows() {
  return OFFENSIVE_SPELL_ELEMENTS.map(({ code, label }, rowIndex) => {
    const controls = OFFENSIVE_SPELL_TIERS.map((tier) => {
      const key = `${code}${tier}`;
      if (!OFFENSIVE_SPELL_LIB.has(key)) return "";
      return `T${tier}:<input class="hvAANumber" name="spellAoe_${key}" placeholder="1" type="text">`;
    })
      .filter(Boolean)
      .join(" ");
    const lineBreak = rowIndex < OFFENSIVE_SPELL_ELEMENTS.length - 1 ? "<br>" : "";
    return `    ${label}: ${controls}${lineBreak}`;
  }).join("");
}

export function renderAlarmAudioProfileRows() {
  return ALARM_AUDIO_PROFILES.map(({ key, label }) => {
    const labelHtml = renderLocalizedInlineLabel(label);
    return `<input id="audioEnable_${key}" type="checkbox"><label for="audioEnable_${key}">${labelHtml}: <input name="audio_${key}" type="text"></label>`;
  }).join("<br>");
}

export function renderItemOrderCheckboxes() {
  return ITEM_ORDER_OPTIONS.map(
    ({ key, itemId, label }) =>
      `<input id="itemOrder_${key}" value="${key},${itemId}" type="checkbox"><label for="itemOrder_${key}">${label}</label>`
  )
    .reduce((rows, item, index) => {
      const rowIndex = index < 5 ? 0 : 1;
      rows[rowIndex] = `${rows[rowIndex] || ""}${item}`;
      return rows;
    }, [])
    .join("<br>");
}

export function renderItemActionCheckboxes() {
  return ITEM_ORDER_OPTIONS.map(
    ({ key, label }) =>
      `<div><input id="item_${key}" type="checkbox"><label for="item_${key}"><b>${label}</b></label>: {{item${key}Condition}}</div>`
  ).join("");
}

export function renderIdleArenaLevelCheckboxes(grindFestInput = "") {
  return IDLE_ARENA_LEVEL_OPTIONS.map(({ key, value, label, appendGrindFestInput }) => {
    const labelText = appendGrindFestInput ? `${label} ${grindFestInput}` : label;
    return `<input id="arLevel_${key}" value="${key},${value}" type="checkbox"><label for="arLevel_${key}">${labelText}</label>`;
  })
    .reduce((rows, item, index) => {
      const rowIndex = index < 12 ? 0 : index < 24 ? 1 : index < 28 ? 2 : 3;
      rows[rowIndex] = `${rows[rowIndex] || ""}${item}${index < 28 ? " " : ""}`;
      return rows;
    }, [])
    .join("<br>");
}

export function renderBattleRoundTypeCheckboxes(prefix) {
  return BATTLE_ROUND_TYPE_OPTIONS.map(
    ({ code, label }) =>
      `<input id="${prefix}_${code}" type="checkbox"><label for="${prefix}_${code}">${label}</label>`
  ).join("");
}

export function renderBattleRoundTypeSelectOptions({ includeBlank = false } = {}) {
  const blankOption = includeBlank ? "<option></option>" : "";
  return `${blankOption}${BATTLE_ROUND_TYPE_OPTIONS.map(
    ({ code, label }) => `<option value="${code}">${label}</option>`
  ).join("")}`;
}

export function renderBattleScrollCheckboxes() {
  return BATTLE_SCROLL_OPTIONS.map(
    ({ key, label }) =>
      `<div><input id="scroll_${key}" type="checkbox"><label for="scroll_${key}">${label}</label>{{scroll${key}Condition}}</div>`
  ).join("");
}

export function renderScrollFirstSchemaField() {
  return renderSchemaCheckboxField("scrollFirst", "", { bold: false });
}

function renderDropMonitorSchemaFields() {
  return [renderSchemaSelectField("dropQuality")];
}

function renderRuleWeightSchemaFields() {
  const fields = runOptionSchema({ type: OptionSchemaEvent.READ_GROUP, group: "Rule" }).filter(
    (field) => field.key.startsWith("weight_")
  );
  const rows = [fields.slice(0, 4), fields.slice(4, 8), fields.slice(8, 10), fields.slice(10)];
  return rows.map(
    (row) =>
      `    ${row
        .map((field) => `${field.label.l2}: ${renderSchemaNumberInput(field.key)}`)
        .join(" ")}<br>`
  );
}

function renderRuleReverseSchemaField() {
  const field = renderSchemaCheckboxField("ruleReverse", "", { bold: false }).replace(
    /^<div>|<\/div>$/g,
    ""
  );
  return `  <div>3. ${field}</div>`;
}

function renderCriticalBuffSchemaFields() {
  return [
    renderCheckboxPlusNumber("pauseOnCriticalBuffExpire", "criticalBuffMinTurns", {
      l0: "回合（关键 buff 剩余 ≤N 且 MP 不足时暂停脚本，需先在下方填关键 buff 名）",
      l1: "回合（關鍵 buff 剩餘 ≤N 且 MP 不足時暫停腳本，需先在下方填關鍵 buff 名）",
      l2: " turns (pause when critical buff ≤N & MP low; fill buff names below)",
    }),
    `<div>${renderSchemaLabel(readSchemaField("criticalBuffsList"))}: ${renderSchemaTextInput(
      "criticalBuffsList",
      "width:60%;"
    )} MP&lt; ${renderSchemaNumberInput("criticalBuffMpFloor", "%")}</div>`,
  ];
}

function renderDebuffSmartSkipSchemaFields() {
  return [
    renderSchemaCheckboxField("skipDebuffForBigSkill_We", "<br>"),
    renderSchemaCheckboxField("skipWeakenWhenClearReady", "<br>"),
    renderSchemaCheckboxField("skipDebuffForBigSkill_Im", "<br>"),
    `${renderSchemaLabel(readSchemaField("skipDebuffForBigSkillThreshold"))}: ${renderSchemaNumberInput(
      "skipDebuffForBigSkillThreshold"
    )}<br>`,
    renderSchemaCheckboxField("skipImperilWhenOfcKills", "<br>"),
    `${renderSchemaLabel(readSchemaField("bigKillMinSamples"))}: ${renderSchemaNumberInput(
      "bigKillMinSamples"
    )} ${renderSchemaLabel(readSchemaField("bigKillProbThreshold"))}: ${renderSchemaNumberInput(
      "bigKillProbThreshold"
    )} ${renderSchemaLabel(readSchemaField("bigKillScaleDriftTol"))}: ${renderSchemaNumberInput(
      "bigKillScaleDriftTol"
    )}<br>`,
    renderSchemaCheckboxField("dynamicBigKillLog"),
  ];
}

function renderBurstGuardSchemaFields() {
  return [
    renderSchemaCheckboxField("burstControlSwitch", "<br>"),
    `${renderSchemaLabel(readSchemaField("burstControlHpFrac"))}: ${renderSchemaNumberInput(
      "burstControlHpFrac",
      "%"
    )} ${renderSchemaCheckboxField("burstControlSilenceForSpell").replace(/^<div>|<\/div>$/g, "")}`,
  ];
}

function renderSpellTierStrategySchemaFields() {
  return [
    renderSchemaCheckboxField(
      "channelForceHighTier",
      ": <l0>Channeling 时 (150% 伤害, 1 MP) 跳过条件检查，使用最高可用阶法术</l0><l1>Channeling 時 (150% 傷害, 1 MP) 跳過條件檢查，使用最高可用階法術</l1><l2>During Channeling (150% dmg, 1 MP), skip condition checks and use highest available tier</l2>"
    ),
    renderSchemaCheckboxField(
      "spellTierDowngrade",
      `: <l0>存活怪物</l0><l1>存活怪物</l1><l2>Alive monsters</l2> ≤ ${renderSchemaNumberInput(
        "spellDowngradeThreshold"
      )}<l0>时仅用 T1 节省 MP (Channeling 时不降级)</l0><l1>時僅用 T1 節省 MP (Channeling 時不降級)</l1><l2>: use T1 only to save MP (does not apply during Channeling)</l2>`
    ),
  ];
}

function renderPhysicalSkillStrategySchemaFields() {
  return [
    renderSchemaSelectField("fightingStyle"),
    renderSchemaCheckboxField(
      "physicalSkillDowngrade",
      `: <l0>存活怪物</l0><l1>存活怪物</l1><l2>Alive monsters</l2> ≤ ${renderSchemaNumberInput(
        "physicalDowngradeThreshold"
      )}<l0>时跳过 OFC/FRD 全体攻击节省 OC (流派技能总伤害不受怪物数影响, 不跳过)</l0><l1>時跳過 OFC/FRD 全體攻擊節省 OC (流派技能總傷害不受怪物數影響, 不跳過)</l1><l2>: skip OFC/FRD to save OC (style skills total damage unaffected by monster count, not skipped)</l2>`
    ),
  ];
}

function renderMercifulBlowSchemaField() {
  return renderSchemaCheckboxField("mercifulBlow", "", { bold: false }).replace(
    /^<div>|<\/div>$/g,
    ""
  );
}

function renderDynamicHealSchemaFields() {
  return [
    renderSchemaCheckboxField("dynamicHealThreshold", "<br>"),
    `${renderSchemaLabel(readSchemaField("playerMaxHp"))}: ${renderSchemaNumberInput(
      "playerMaxHp"
    )}; ${renderSchemaLabel(readSchemaField("dynamicHealSafetyPad"))}: ${renderSchemaNumberInput(
      "dynamicHealSafetyPad"
    )}<br>`,
    renderSchemaCheckboxField("autoTune", "<br>"),
  ];
}

function renderGemThresholdSchemaFields() {
  return [
    `    Gem: ${renderSchemaLabel(readSchemaField("hp1"))}.${renderSchemaNumberInput("hp1", "%")}`,
    `    ${renderSchemaLabel(readSchemaField("mp1"))}.${renderSchemaNumberInput("mp1", "%%")}`,
    `    ${renderSchemaLabel(readSchemaField("sp1"))}.${renderSchemaNumberInput("sp1", "%")}</div>`,
  ];
}

function renderNoWastePotionSchemaFields() {
  return renderCheckboxPlusNumber("noWastePotion", "potionWasteTolerance", {
    l0: "（deficit 不够大时跳过该瓶）",
    l1: "（deficit 不夠大時跳過該瓶）",
    l2: " (skip if deficit too small)",
  });
}

function renderStallStrategySchemaFields() {
  const stallFocus = renderSchemaCheckboxField("stallFocus").replace(/^<div>|<\/div>$/g, "");
  const stallTurnOffSpirit = renderSchemaCheckboxField("stallTurnOffSpirit").replace(
    /^<div>|<\/div>$/g,
    ""
  );
  return [
    renderSchemaCheckboxField("stallMode", "<br>"),
    `<div>${stallFocus} (OC≥${renderSchemaNumberInput(
      "stallFocusOcThreshold"
    )}, MP&lt;${renderSchemaNumberInput("stallFocusMpMax", "%")})</div>`,
    `<div>${renderSchemaLabel(readSchemaField("stallTopupMpFloor"))}: MP&lt;${renderSchemaNumberInput(
      "stallTopupMpFloor",
      "%"
    )}, SP&lt;${renderSchemaNumberInput("stallTopupSpFloor", "%")}</div>`,
    `<div>${stallTurnOffSpirit}</div>`,
  ];
}

function renderBattleControlSchemaFields() {
  return [
    renderSchemaCheckboxField("defend", ": {{defendCondition}}"),
    renderSchemaCheckboxField("autoFlee", ": {{fleeCondition}}"),
    `<div><div class="hvAANew"></div>${renderSchemaCheckboxField(
      "autoPause",
      ": {{pauseCondition}}"
    ).replace(/^<div>|<\/div>$/g, "")}</div>`,
  ];
}

function renderSpiritStanceSchemaFields() {
  return [
    renderSchemaCheckboxField("turnOnSS", ": {{turnOnSSCondition}}"),
    renderSchemaCheckboxField("turnOffSS", ": {{turnOffSSCondition}}"),
    renderSchemaCheckboxField("preCastSS", ": {{preCastSSCondition}}"),
  ];
}

function renderAttackResourceSchemaFields() {
  return [
    renderSchemaCheckboxField("focus", ": {{focusCondition}}"),
    renderSchemaCheckboxField("etherTap", ": {{etherTapCondition}}"),
  ];
}

function renderActionDelaySchemaFields() {
  return [
    renderCheckboxPlusNumber("delayAlert", "delayAlertTime", {
      l0: "秒，警报",
      l1: "秒，警報",
      l2: "s, alarm",
    }),
    renderCheckboxPlusNumber("delayReload", "delayReloadTime", {
      l0: "秒，刷新页面",
      l1: "秒，刷新頁面",
      l2: "s, reload page",
    }),
  ];
}

function renderApiBridgeDelaySchemaFields() {
  return (
    `<div><b><l0>延迟</l0><l1>延遲</l1><l2>Delay</l2></b>: ` +
    `1. ${renderSchemaLabel(readSchemaField("delay"))}: ${renderSchemaNumberInput(
      "delay",
      "ms"
    )} ` +
    `2. ${renderSchemaLabel(readSchemaField("delay2"))}: ${renderSchemaNumberInput(
      "delay2",
      "ms"
    )}<br>` +
    "    <l0>说明: 单位毫秒，且在设定值基础上取其的50%-150%进行延迟，0表示不延迟</l0><l1>說明: 單位毫秒，且在設定值基礎上取其的50%-150%進行延遲，0表示不延遲</l1><l2>Note: unit milliseconds, and based on the set value multiply 50% -150% to delay, 0 means no delay</l2>" +
    "    </div>"
  );
}

function renderSchemaNumberInputWithoutPlaceholder(key, suffix = "") {
  const field = readSchemaField(key);
  if (!field) return "";
  return `<input class="hvAANumber" name="${field.key}" type="text">${suffix}`;
}

export function renderArenaStaminaLossSchemaFields() {
  return (
    `<div><b>Stamina</b>: <l0>当损失</l0><l1>當損失</l1><l2>If it lost </l2>` +
    `${renderSchemaLabel(readSchemaField("staminaLose"))} ≥ ${renderSchemaNumberInput(
      "staminaLose",
      ""
    )}: ` +
    "<l0>告警并确认是否暂停脚本</l0><l1>警報並確認是否暫停腳本</l1><l2>alert and confirm whether to pause script</l2>" +
    '    <button class="staminaLostLog"><l0>stamina损失日志</l0><l1>stamina損失日誌</l1><l2>staminaLostLog</l2></button></div>'
  );
}

export function renderIdleArenaSchemaFields() {
  return renderSchemaCheckboxField(
    "idleArena",
    `: <l0>在任意页面停留</l0><l1>在任意頁面停留</l1><l2>Idle in any page for </l2>${renderSchemaNumberInputWithoutPlaceholder(
      "idleArenaTime"
    )}<l0>秒后，开始竞技场</l0><l1>秒後，開始競技場</l1><l2>s, start Arena</l2> ` +
      '<button class="idleArenaReset"><l01>重置</l01><l2>Reset</l2></button>;<br>'
  ).replace(/<\/div>$/, "");
}

function renderIdleArenaGrindFestInput() {
  return renderSchemaNumberInput("idleArenaGrTime");
}

export function renderRestoreStaminaSchemaFields() {
  return (
    renderSchemaCheckboxField(
      "restoreStamina",
      ": " +
        `<l0>战斗前，如果</l0><l1>戰鬥前，如果</l1><l2><b></b>if before a battle and </l2>Stamina ≤ ${renderSchemaNumberInput(
          "staminaLow"
        )}<br>`
    ).replace(/<\/div>$/, "") +
    "    <l0>说明: 如果不勾选，当Stamina小于此值后，则不进行闲置竞技场</l0><l1>說明: 如果不勾選，當Stamina小於此值後，則不進行閒置競技場</l1><l2>Note: If unchecked, when Stamina is less than this value, no Idle Arena</l2></div>"
  );
}

/**
 * 打开 / 切换显隐 HVAA 配置面板。浮动按钮(button.js)与 hv-utils 顶部栏触发器(window.HVAA_openConfig)
 * 共用此单一入口（收口原 button.js 内联 onclick 逻辑，去重）。
 * @param {string=} lang 首次打开(option 未落盘、回填循环跳过)时 lang 兜底；缺省读 g("lang")
 */
export function openHVAAConfig(lang) {
  if (gE("#hvAABox")) {
    gE("#hvAABox").style.display = gE("#hvAABox").style.display === "none" ? "block" : "none";
  } else {
    optionBox();
    gE("#hvAATab-Main").style.zIndex = 1;
    // option 已装填时 select[name=lang] 由 optionBox 回填循环统一设值；仅首次(option 未落盘)用 lang/持久化值兜底。
    if (!hasStoredOption()) gE('select[name="lang"]').value = String(lang ?? g("lang") ?? "0");
  }
}

// 反向桥(对称于 hv-utils 暴露的 window.HVUT_openConfig)：hv-utils 顶部栏内 HVAA 触发器经此开 HVAA 面板。
// hv-utils 是 sloppy-mode 第三方脚本不能 ESM import，故经 window 桥(与 window.HVAA_i18n 同模式)。
if (typeof window !== "undefined") window.HVAA_openConfig = openHVAAConfig;

function readOptionField(key, fallback) {
  return runOptionAutomation({ type: OptionEvent.READ_FIELD, key, fallback });
}

export function hasSettingsInputClass(inputOrClassName, className) {
  if (inputOrClassName?.classList?.contains?.(className)) return true;
  const rawClassName =
    typeof inputOrClassName === "string" ? inputOrClassName : inputOrClassName?.className;
  return String(rawClassName || "")
    .split(/\s+/)
    .includes(className);
}

export function shouldHydrateSettingsInput(input) {
  return !hasSettingsInputClass(input, "hvAADebug");
}

export function readCustomizeHoverTarget(target) {
  let node = target;
  while (node) {
    if (hasSettingsInputClass(node, "customize")) return node;
    node = node.parentNode;
  }
  return null;
}

export function readSelectableReportTableTarget(target) {
  let node = target;
  while (node) {
    if (String(node.tagName || "").toUpperCase() === "TABLE") return node;
    node = node.parentNode;
  }
  return null;
}

function hasStoredOption() {
  return readOptionField("version", undefined) !== undefined;
}

function writeSettingsOption(option) {
  const written = runOptionAutomation({ type: OptionEvent.WRITE, option });
  if (written) return true;
  _alert(0, "配置保存失败", "配置保存失敗", "Failed to save configuration");
  return false;
}

function clearSettingsOption() {
  const cleared = runOptionAutomation({ type: OptionEvent.CLEAR });
  if (cleared) return true;
  _alert(0, "配置重置失败", "配置重置失敗", "Failed to reset configuration");
  return false;
}

function saveSettingsBackup(code) {
  const saved = runOptionBackupAutomation({ type: OptionBackupEvent.SAVE_CURRENT, code });
  if (saved) return true;
  _alert(0, "配置备份失败", "配置備份失敗", "Failed to backup configuration");
  return false;
}

function deleteSettingsBackup(code) {
  const deleted = runOptionBackupAutomation({ type: OptionBackupEvent.DELETE, code });
  if (deleted) return true;
  _alert(0, "配置备份删除失败", "配置備份刪除失敗", "Failed to delete backup");
  return false;
}

function restoreSettingsBackup(code) {
  const restored = runOptionBackupAutomation({ type: OptionBackupEvent.RESTORE, code });
  if (restored) return true;
  _alert(0, "配置还原失败", "配置還原失敗", "Failed to restore backup");
  return false;
}

function applySettingsLanguage(value) {
  gE(".hvAA-LangStyle").textContent = `l${value}{display:inline!important;}`;
  if (/^[01]$/.test(value)) gE(".hvAA-LangStyle").textContent += "l01{display:inline!important;}";
  g("lang", value);
  setLang(value);
}

function writeSettingsLanguage(value, select) {
  const previous = String(g("lang") ?? readOptionField("lang", "0") ?? "0");
  const written = runOptionAutomation({ type: OptionEvent.WRITE_FIELD, key: "lang", value });
  if (!written) {
    if (select) select.value = previous;
    _alert(0, "语言保存失败", "語言保存失敗", "Failed to save language");
    return false;
  }
  applySettingsLanguage(value);
  return true;
}

function readSettingsInputValue(name, className) {
  const directValue = readOptionField(name, undefined);
  if (directValue !== undefined) return directValue;
  const path = name.split("_");
  if (path.length !== 2 || hasSettingsInputClass(className, "hvAACustomize")) return "";
  const parent = readOptionField(path[0], undefined);
  return parent && typeof parent === "object" && parent[path[1]] !== undefined
    ? parent[path[1]]
    : "";
}

function hydrateSettingsForm(optionBox) {
  if (!hasStoredOption()) return;

  let i;
  let j;
  let k;
  const inputs = gE("input,select", "all", optionBox);
  for (i = 0; i < inputs.length; i++) {
    if (!shouldHydrateSettingsInput(inputs[i])) continue;
    const itemName = inputs[i].name || inputs[i].id;
    const itemValue = readSettingsInputValue(itemName, inputs[i].className);
    if (
      inputs[i].type === "text" ||
      inputs[i].type === "hidden" ||
      inputs[i].type === "select-one" ||
      inputs[i].type === "number"
    ) {
      inputs[i].value = itemValue;
    } else if (inputs[i].type === "checkbox") {
      inputs[i].checked = itemValue;
    }
  }

  const defaultOnInputs = gE("input[data-default-on]", "all", optionBox);
  for (const input of defaultOnInputs) {
    if (readOptionField(input.id, undefined) === undefined) input.checked = true;
  }

  const customize = gE(".customize", "all", optionBox);
  for (i = 0; i < customize.length; i++) {
    const itemName = customize[i].getAttribute("name");
    const groups = readOptionField(itemName, undefined);
    if (!groups || typeof groups !== "object") continue;
    for (j in groups) {
      const group = customize[i].appendChild(cE("div"));
      group.className = "customizeGroup";
      group.innerHTML = `${j * 1 + 1}. `;
      for (k = 0; k < groups[j].length; k++) {
        const input = group.appendChild(cE("input"));
        input.type = "text";
        input.className = "customizeInput";
        input.name = `${itemName}_${j}`;
        input.value = groups[j][k];
        // "||" 行类型哨兵：只读窄显示，原样 round-trip（非门 "!" 前缀按普通文本回填）
        if (input.value === "||") {
          input.readOnly = true;
          input.style.width = "2em";
        }
      }
    }
  }

  gE(".hvAAQuickSite>table>tbody", optionBox).innerHTML = runQuickSiteAutomation({
    type: QuickSiteEvent.RENDER_CURRENT_SETTINGS_TABLE_BODY,
  });
  gE(".hvAABackupList", optionBox).innerHTML = runOptionBackupAutomation({
    type: OptionBackupEvent.RENDER_LIST_ITEMS,
  });
}

export function optionBox() {
  // 配置界面
  const optionBox = gE("body").appendChild(cE("div"));
  optionBox.id = "hvAABox";
  optionBox.innerHTML = [
    '<div class="hvAACenter">',
    '  <h1 style="display:inline;">hvAutoAttack</h1>',
    // 旧 dodying 外链已移除（条件用法见条件框内联 "?" 帮助）；保留标签不再导航。
    '  <span style="opacity:.6;"><l0>JoezhangYN 修改版</l0><l1>JoezhangYN 修改版</l1><l2>JoezhangYN fork</l2></span>',
    '  <select name="lang"><option value="0">简体中文</option><option value="1">繁體中文</option><option value="2">English</option></select>',
    // UI 入口整合（只合入口）：HVAA 面板内开 hv-utils config，经反向桥 window.HVUT_openConfig（hv-utils 暴露）。
    '  <span class="hvAAOpenHVUT" style="cursor:pointer;text-decoration:underline;margin-left:8px;" title="HV Utils 设置"><l0>HV Utils 设置</l0><l1>HV Utils 設置</l1><l2>HV Utils Settings</l2></span>',
    '  <l2><span style="font-size:small;"><a target="_blank" href="https://greasyfork.org/forum/profile/18194/Koko191" style="color:#E3E0D1;background-color:#E3E0D1;" title="Thanks to Koko191 who give help in the translation">by Koko191</a></span></l2></div>',
    '<div class="hvAATablist">',
    '<div class="hvAATabmenu">',
    '  <span name="Main"><l0>主要选项</l0><l1>主要選項</l1><l2>Main</l2></span>',
    '  <span name="Heal"><l0>治疗药品</l0><l1>治療藥品</l1><l2>Heal</l2></span>',
    '  <span name="Tactics"><l0>战术姿态</l0><l1>戰術姿態</l1><l2>Tactics</l2></span>',
    '  <span name="Arena"><l0>竞技体力</l0><l1>競技體力</l1><l2>Arena</l2></span>',
    '  <span name="Equipment"><l0>装备维护</l0><l1>裝備維護</l1><l2>Equipment</l2></span>',
    '  <span name="System"><l0>系统页面</l0><l1>系統頁面</l1><l2>System</l2></span>',
    '  <span name="Spell"><l0>法术攻击</l0><l1>法術攻擊</l1><l2>Spell</l2></span>',
    '  <span name="Item"><l01>物品</l01><l2>Item</l2></span>',
    `  <span name="Channel">${renderChannelSkillSwitchTabSchemaField()}</span>`,
    `  <span name="Buff">${renderBattleTabSwitchSchemaField("buffSkillSwitch")}</span>`,
    `  <span name="Debuff">${renderBattleTabSwitchSchemaField("debuffSkillSwitch")}</span>`,
    `  <span name="Skill">${renderBattleTabSwitchSchemaField("skillSwitch")}</span>`,
    `  <span name="Scroll">${renderBattleTabSwitchSchemaField("scrollSwitch")}</span>`,
    `  <span name="Infusion">${renderBattleTabSwitchSchemaField("infusionSwitch")}</span>`,
    '  <span name="Alarm"><l0>警报</l0><l1>警報</l1><l2>Alarm</l2></span>',
    '  <span name="Rule"><l0>攻击规则</l0><l1>攻擊規則</l1><l2>Attack Rule</l2></span>',
    `  <span name="Drop">${renderDropMonitorTabSchemaField()}</span>`,
    `  <span name="Usage">${renderUsageTrackingTabSchemaField()}</span>`,
    '  <span name="Riddle"><l0>小马验证</l0><l1>小馬驗證</l1><l2>Riddle ML</l2></span>',
    '  <span name="About"><l0>关于本脚本</l0><l1>關於本腳本</l1><l2>About This</l2></span>',
    '  <span name="Feedback"><l01>反馈</l01><l2>Feedback</l2></span></div>',
    '<div class="hvAATab" id="hvAATab-Main">',
    renderAttackStatusSchemaField(),
    ...renderMainPauseSchemaFields(),
    ...renderMainWarningSchemaFields(),
    ...renderMainPluginSchemaFields(),
    '  <div><b><l01>魔法技能</l01><l2>Offensive Magic</l2></b>: → <a class="hvAAGoto" name="hvAATab-Spell"><l0>法术攻击</l0><l1>法術攻擊</l1><l2>Spell</l2></a></div>',
    "  </div>",
    // === Heal 治疗药品 tab（Gem 阈值 + 动态阈值/拖战 + 关键 buff 保护，原 Main 拆出）===
    '<div class="hvAATab" id="hvAATab-Heal">',
    '  <div class="hvAACenter">',
    ...renderGemThresholdSchemaFields(),
    '  <div style="border:1px dashed #888;padding:3px;font-size:12px;"><b><l0>动态阈值（PoC）</l0><l1>動態閾值（PoC）</l1><l2>Dynamic Threshold (PoC)</l2></b>:',
    ...renderDynamicHealSchemaFields(),
    renderNoWastePotionSchemaFields(),
    ...renderStallStrategySchemaFields(),
    "  </div>",
    ...renderCriticalBuffSchemaFields(),
    "  </div>",
    // === Tactics 战术姿态 tab（Spirit Stance / Defend / Focus / Ether Tap / 逃跑 / 暂停，原 Main 拆出）===
    '<div class="hvAATab" id="hvAATab-Tactics">',
    ...renderSpiritStanceSchemaFields(),
    ...renderAttackResourceSchemaFields(),
    ...renderBattleControlSchemaFields(),
    "  </div>",
    // === Arena 竞技场/体力 tab（Stamina 损失处理 + 闲置竞技场 + 战前回复，原 Main 拆出）===
    '<div class="hvAATab" id="hvAATab-Arena">',
    renderArenaStaminaLossSchemaFields(),
    renderIdleArenaSchemaFields(),
    "    <l0>进行的竞技场相对应等级</l0><l1>進行的競技場相對應等級</l1><l2>The levels of the Arena you want to complete</l2>:  ",
    '      <button class="hvAAShowLevels"><l0>显示更多</l0><l1>顯示更多</l1><l2>Show more</l2></button><button class="hvAALevelsClear"><l01>清空</l01><l2>Clear</l2></button><br>',
    '      <input name="idleArenaLevels" style="width:98%;" type="text" disabled="true"><input name="idleArenaValue" style="width:98%;" type="hidden" disabled="true">',
    '      <div class="hvAAArenaLevels">',
    `        ${renderIdleArenaLevelCheckboxes(renderIdleArenaGrindFestInput())}</div></div>`,
    renderRestoreStaminaSchemaFields(),
    "  </div>",
    // === Equipment 装备维护 tab（修复装备 + 缺料买料 + 强化价格 + 装备百分位，原 Main 拆出）===
    '<div class="hvAATab" id="hvAATab-Equipment">',
    ...renderEquipmentSchemaFields(),
    "  </div>",
    // === System 系统/页面 tab（页面停留 alert/reload + 定时刷新 + 记录每场 + 延迟，原 Main 拆出）===
    '<div class="hvAATab" id="hvAATab-System">',
    "  <div><l2>If the page </l2><b><l0>页面停留</l0><l1>頁面停留</l1><l2>stays idle</l2></b><l2> for </l2>: ",
    ...renderActionDelaySchemaFields(),
    "  </div>",
    renderCheckboxPlusNumber("pageRefresh", "pageRefreshMinutes", {
      l0: "分钟（防移动端长时间挂机卡死，无条件绝对时钟）",
      l1: "分鐘（防移動端長時間掛機卡死，無條件絕對時鐘）",
      l2: " min (mobile anti-hang absolute clock, unconditional)",
    }),
    renderSchemaCheckboxField("recordEach"),
    renderApiBridgeDelaySchemaFields(),
    "  </div>",
    '<div class="hvAATab" id="hvAATab-Spell">',
    '  <div><l0>当<a class="hvAAGoto" name="hvAATab-Main"><b>攻击模式</b></a>为法术时生效</l0><l1>當<a class="hvAAGoto" name="hvAATab-Main"><b>攻擊模式</b></a>為法術時生效</l1><l2>Active when <a class="hvAAGoto" name="hvAATab-Main"><b>Attack Mode</b></a> is set to a spell element</l2></div>',
    "  <div><b><l0>高阶技能使用条件</l0><l1>高階技能使用條件</l1><l2>Conditions for 3rd Tier</l2></b>: {{highSkillCondition}}</div>",
    "  <div><b><l0>中阶技能使用条件</l0><l1>中階技能使用條件</l1><l2>Conditions for 2nd Tier</l2></b>: {{middleSkillCondition}}</div>",
    "  <div><l0>T1: 无条件限制，始终可用</l0><l1>T1: 無條件限制，始終可用</l1><l2>T1: No condition, always available</l2></div>",
    ...renderSpellTierStrategySchemaFields(),
    "  <div><b>AoE</b>:",
    '    <l0>访问</l0><l1>訪問</l1><l2>Visit</l2> <a href="?s=Character&ss=ab" target="_blank"><l0>技能页面</l0><l1>技能頁面</l1><l2>Ability Page</l2></a>',
    "    <l0>自动检测法术 AoE 目标数</l0><l1>自動檢測法術 AoE 目標數</l1><l2>to auto-detect spell AoE target counts</l2></div></div>",
    '<div class="hvAATab" id="hvAATab-Item">',
    '  <div class="itemOrder"><l0>施放顺序</l0><l1>施放順序</l1><l2>Cast Order</l2>: <input name="itemOrderName" style="width:80%;" type="text" disabled="true"><input name="itemOrderValue" style="width:80%;" type="hidden" disabled="true"><br>',
    `    ${renderItemOrderCheckboxes()}</div>`,
    `${renderItemActionCheckboxes()}</div>`,
    '<div class="hvAATab" id="hvAATab-Channel">',
    "  <l0><b>获得Channel时</b>（此时1点MP施法与150%伤害）</l0><l1><b>獲得Channel時</b>（此時1點MP施法與150%傷害）</l1><l2><b>During Channeling effect</b> (1 mp spell cost and 150% spell damage)</l2>:",
    "  <div><b><l0>先施放Channel技能</l0><l1>先施放Channel技能</l1><l2>First cast</l2></b>: <br>",
    '    <l0>注意: 此处的施放顺序与</l0><l1>注意: 此處的施放順序与</l1><l2>Note: The cast order here is the same as in</l2><a class="hvAAGoto" name="hvAATab-Buff">BUFF<l01>技能</l01><l2> Spells</l2></a><l0>里的相同</l0><l1>裡的相同</l1><br>',
    `    ${renderBuffSkillCheckboxes("channelSkill")}</div>`,
    renderChannelFallbackEnableSchemaField(),
    '    <div class="channelSkill2Order"><l0>施放顺序</l0><l1>施放順序</l1><l2>Cast Order</l2>: <input name="channelSkill2OrderName" style="width:80%;" type="text" disabled="true"><input name="channelSkill2OrderValue" style="width:80%;" type="hidden" disabled="true"><br>',
    `    ${renderChannelFallbackOrderCheckboxes()}</div>`,
    "  <div><l0><b>最后ReBuff</b>: 重新施放最先消失的Buff</l0><l1><b>最後ReBuff</b>: 重新施放最先消失的Buff</l1><l2><b>At last, re-cast the spells which will expire first</b></l2>.</div></div>",
    '<div class="hvAATab" id="hvAATab-Buff">{{buffSkillCondition}}',
    '  <div class="buffSkillOrder"><l0>施放顺序</l0><l1>施放順序</l1><l2>Cast Order</l2>: ',
    '    <input name="buffSkillOrderValue" style="width:80%;" type="text" disabled="true"><br>',
    `    ${renderBuffSkillCheckboxes("buffSkillOrder")}</div>`,
    "  <div><l0>Buff不存在就施放的技能</l0><l1>Buff不存在就施放的技能</l1><l2>Cast spells if the buff is not present</l2>: ",
    `    ${renderBuffSkillActionCheckboxes()}</div></div>`,
    '<div class="hvAATab" id="hvAATab-Debuff">',
    '  <div class="debuffSkillOrder"><l0>施放顺序</l0><l1>施放順序</l1><l2>Cast Order</l2>:',
    '    <input name="debuffSkillOrderValue" style="width:80%;" type="text" disabled="true"><br>',
    `    ${renderDebuffSkillOrderCheckboxes()}</div>`,
    "  <div><l01>特殊</l01><l2>Special</l2></div>",
    renderAllDebuffActionCheckboxes(),
    '  <div style="border:1px dashed #888;padding:3px;"><b><l0>OFC/FRD 智能跳过</l0><l1>OFC/FRD 智能跳過</l1><l2>OFC/FRD Smart Skip</l2></b><br>',
    ...renderDebuffSmartSkipSchemaFields(),
    "  </div>",
    '  <div style="border:1px dashed #888;padding:3px;"><b><l0>爆发防护（实验，默认关）</l0><l1>爆發防護（實驗，默認關）</l1><l2>Burst Guard (Exp, off)</l2></b><br>',
    ...renderBurstGuardSchemaFields(),
    "  </div>",
    renderDebuffSkillCheckboxes({
      afterKeyHtml: {
        Dr: renderSchemaCheckboxField("drainTargetMaxHp", "", {
          bold: false,
          style: "padding-left:1.5em;",
        }),
      },
    }),
    "  <div>AoE: <l0>当前技能等级下影响的目标数(1=单体, 3=范围)</l0><l1>當前技能等級下影響的目標數(1=單體, 3=範圍)</l1><l2>Targets affected at current skill level (1=single, 3=AoE)</l2><br>",
    `${renderDebuffSkillNumberRows("debuffSkillAoe", { placeholder: "1" })}</div>`,
    renderDebuffExpiryAlertSchemaSection(),
    `${renderDebuffSkillNumberRows("debuffSkillTurn")}</div></div>`,
    '<div class="hvAATab" id="hvAATab-Skill">',
    '  <div><span><l0>注意: 默认在Spirit状态下使用，请在<a class="hvAAGoto" name="hvAATab-Tactics">战术姿态</a>勾选并设置<b>开启/关闭Spirit Stance</b></l0><l1>注意: 默認在Spirit狀態下使用，請在<a class="hvAAGoto" name="hvAATab-Tactics">戰術姿態</a>勾選並設置<b>開啟/關閉Spirit Stance</b></l1><l2>Note: use under Spirit by default, please check and set the <b>Turn on/off Spirit Stance</b> in <a class="hvAAGoto" name="hvAATab-Tactics">Tactics</a></l2></span></div>',
    '  <div class="skillOrder"><l0>施放顺序</l0><l1>施放順序</l1><l2>Cast Order</l2>: ',
    '  <input name="skillOrderValue" style="width:80%;" type="text" disabled="true"><br>',
    `  ${renderPhysicalSkillOrderCheckboxes()}</div>`,
    ...renderPhysicalSkillStrategySchemaFields(),
    renderPhysicalSkillActionCheckboxes({ afterKeyHtml: { T3: renderMercifulBlowSchemaField() } }),
    '  <div>AoE: <l0>当前技能等级下影响的目标数(1=单体, 3=范围)，访问</l0><l1>當前技能等級下影響的目標數(1=單體, 3=範圍)，訪問</l1><l2>Targets affected at current skill level (1=single, 3=AoE), visit </l2><a href="?s=Character&ss=ab" target="_blank"><l0>技能页面</l0><l1>技能頁面</l1><l2>Ability Page</l2></a><l0>自动检测</l0><l1>自動檢測</l1><l2> to auto-detect</l2><br>',
    `${renderOffensiveSpellAoeRows()}</div>`,
    renderSchemaCheckboxField("autoElement"),
    "</div>",
    '<div class="hvAATab" id="hvAATab-Scroll">',
    "  <l0>战役模式</l0><l1>戰役模式</l1><l2>Battle type</l2>: ",
    `  ${renderBattleRoundTypeCheckboxes("scrollRoundType")}{{scrollCondition}}`,
    renderScrollFirstSchemaField(),
    `  ${renderBattleScrollCheckboxes()}</div>`,
    '<div class="hvAATab" id="hvAATab-Infusion">',
    '  <l0>注意：魔药属性与</l0><l1>注意：魔藥屬性與</l1><l2>Note: The style of infusion is the same as Attack Mode in </l2><a class="hvAAGoto" name="hvAATab-Main"><l0>主要选项</l0><l1>主要選項</l1><l2>Main</l2></a><l0>里的攻击模式相同</l0><l1>裡的攻擊模式相同</l1><l2></l2><br>{{infusionCondition}}</div>',
    '<div class="hvAATab" id="hvAATab-Alarm">',
    '  <span class="hvAATitle"><l0>自定义警报</l0><l1>自定義警報</l1><l2>Alarm</l2></span><br>',
    "  <l0>注意：留空则使用默认音频，建议每个用户使用自定义音频</l0><l1>注意：留空則使用默認音頻，建議每個用戶使用自定義音頻</l1><l2>Note: Leave the box blank to use default audio, it's recommended for all user to use custom audio.</l2>",
    `  <div>${renderAlarmAudioProfileRows()}</div>`,
    '  <div><l0>请将将要测试的音频文件的地址填入这里</l0><l1>請將將要測試的音頻文件的地址填入這裡</l1><l2>Plz put in the audio file address you want to test</l2>: <br><input class="hvAADebug" name="audio_Text" type="text"></div></div>',
    '<div class="hvAATab" id="hvAATab-Rule">',
    '  <span class="hvAATitle"><l0>攻击规则</l0><l1>攻擊規則</l1><l2>Attack Rule</l2></span> <span style="font-size:small;opacity:.7;"><l0>语法同条件框（点条件 "?" 看帮助）</l0><l1>語法同條件框（點條件 "?" 看幫助）</l1><l2>Syntax = condition box (see "?" help)</l2></span>',
    "  <div>1. <l0>每回合计算敌人当前血量，血量最低的设置初始血量为10，其他敌人为当前血量倍数*10</l0><l1>每回合計算敌人當前血量，血量最低的設置初始血量為10，其他敌人為當前血量倍數*10</l1><l2>Each enemiy is assigned a number which is used to determine the target to attack, let's call that number Priority Weight or PW.</l2></div>",
    "  <div>2. <l0>初始权重与下述各Buff权重相加</l0><l1>初始權重與下述各Buff權重相加</l1><l2>PW(X) = 10 * HP(X) / Min_HP + Accumulated_Weight_of_Deprecating_Spells_In_Effect(X)</l2><br>",
    ...renderRuleWeightSchemaFields(),
    "  </div>",
    renderRuleReverseSchemaField(),
    '  <div>PS. <l0>如果你对各Buff权重有特别见解，请务必</l0><l1>如果你對各Buff權重有特別見解，請務必</l1><l2>If you have any suggestions, please </l2><a class="hvAAGoto" name="hvAATab-Feedback"><l0>告诉我</l0><l1>告訴我</l1><l2>let me know</l2></a>.</div></div>',
    '<div class="hvAATab hvAACenter" id="hvAATab-Drop">',
    '  <span class="hvAATitle"><l0>掉落监测</l0><l1>掉落監測</l1><l2>Drops Tracking</l2></span><button class="reDropMonitor"><l01>重置</l01><l2>Reset</l2></button>',
    ...renderDropMonitorSchemaFields(),
    "  <table></table></div>",
    '<div class="hvAATab hvAACenter" id="hvAATab-Usage">',
    '  <span class="hvAATitle"><l0>数据记录</l0><l1>數據記錄</l1><l2>Usage Tracking</l2></span><button class="reRecordUsage"><l01>重置</l01><l2>Reset</l2></button>',
    "  <table></table></div>",
    '<div class="hvAATab hvAACenter" id="hvAATab-Riddle">',
    // 答题配置（原 Main 拆入，与下方统计同 tab）
    ...renderRiddleSchemaFields(),
    ...renderRiddleTimingSchemaFields(),
    '  <span class="hvAATitle"><l0>小马验证统计</l0><l1>小馬驗證統計</l1><l2>Riddle ML Stats</l2></span><button class="reRiddleStats"><l01>重置</l01><l2>Reset</l2></button>',
    "  <table></table></div>",
    '<div class="hvAATab hvAACenter" id="hvAATab-About">',
    '  <div><span class="hvAATitle"><l0>当前状况</l0><l1>當前狀況</l1><l2>Current status</l2></span>: ',
    '    <l0>如果脚本长期暂停且网络无问题，请点击</l0><l1>如果腳本長期暫停且網絡無問題，請點擊</l1><l2>If the script does not work and you are sure that it\'s not because of your internet, click</l2><button class="hvAAFix"><l0>尝试修复</l0><l1>嘗試修復</l1><l2>Try to fix</l2></button><br>',
    `    <l0>战役模式</l0><l1>戰役模式</l1><l2>Battle type</l2>: <select class="hvAADebug" name="roundType">${renderBattleRoundTypeSelectOptions({ includeBlank: true })}</select> <l0>当前回合</l0><l1>當前回合</l1><l2>Current round</l2>: <input name="roundNow" class="hvAADebug hvAANumber" placeholder="1" type="text"> <l0>总回合</l0><l1>總回合</l1><l2>Total rounds</l2>: <input name="roundAll" class="hvAADebug hvAANumber" placeholder="1" type="text"></div>`,
    '  <div class="hvAAQuickSite"><span class="hvAATitle"><l0>快捷站点</l0><l1>快捷站點</l1><l2>Quick Site</l2></span><button class="quickSiteAdd"><l01>新增</l01><l2>Add</l2></button><br>',
    '    <l0>注意: 留空“姓名”一栏则表示删除该行，修改后请保存</l0><l1>注意: 留空“姓名”一欄則表示刪除該行，修改後請保存</l1><l2>Note: The "name" input box left blank will be deleted, after change please save in time.</l2>',
    '    <table><tbody><tr class="hvAATh"><td><l0>图标</l0><l1>圖標</l1><l2>ICON</l2></td><td><l0>名称</l0><l1>名稱</l1><l2>Name</l2></td><td><l0>链接</l0><l1>鏈接</l1><l2>Link</l2></td></tr></tbody></table></div>',
    '  <div><span class="hvAATitle"><l0>备份与还原</l0><l1>備份與還原</l1><l2>Backup and Restore</l2></span><button class="hvAABackup"><l0>备份设置</l0><l1>備份設置</l1><l2>Backup Confiuration</l2></button><button class="hvAARestore"><l0>还原设置</l0><l1>還原設置</l1><l2>Restore Confiuration</l2></button><button class="hvAADelete"><l0>删除设置</l0><l1>刪除設置</l1><l2>Delete Confiuration</l2></button><ul class="hvAABackupList"></ul></div>',
    '  <div><span class="hvAATitle"><l0>导入与导出</l0><l1>導入與導出</l1><l2>Import and Export</l2></span><button class="hvAAExport"><l0>导出设置</l0><l1>導出設置</l1><l2>Export Confiuration</l2></button><button class="hvAAImport"><l0>导入设置</l0><l1>導入設置</l1><l2>Import Confiuration</l2></button><textarea class="hvAAConfig"></textarea></div></div>',
    '<div class="hvAATab" id="hvAATab-Feedback">',
    '  <span class="hvAATitle"><l01>反馈</l01><l2>Feedback</l2></span>',
    '  <div><l0>链接</l0><l1>鏈接</l1><l2>Links</l2>: <a href="https://github.com/dodying/UserJs/issues/new" target="_blank">1. GitHub</a><a href="https://greasyfork.org/forum/post/discussion?script=18482" target="_blank">2. GreasyFork</a></div>',
    '  <div><span class="hvAATitle"><l0>反馈说明</l0><l1>反饋說明</l1><l2>Feedback Note</l2></span>: <br>',
    "    <l0>如果你遇见了Bug，想帮助作者修复它<br>你应当提供以下多种资料: <br>1. 场景描述<br>2. 你的配置<br>3. 控制台日志 (按Ctrl+Shift+i打开开发者助手，再选择Console(控制台)面板)<br>4. 战斗日志  (如果是在战斗中)<br>如果是无法容忍甚至使脚本失效的Bug，请尝试安装旧版本<hr>如果你有一些建议使这个脚本更加有用，那么: <br>1. 请尽量简述你的想法<br>2. 如果可以，请提供一些场景 (方便作者更好理解)</l0>",
    "    <l1>如果你遇見了Bug，想幫助作者修復它<br>你應當提供以下多種資料: <br>1. 場景描述<br>2. 你的配置<br>3. 控制台日誌 (按Ctrl+Shift+i打開開發者助手，再選擇Console(控制台)面板)<br>4. 戰鬥日誌 (如果是在戰鬥中)<br>如果是無法容忍甚至使腳本失效的Bug，請嘗試安裝舊版本<hr>如果你有一些建議使這個腳本更加有用，那麼: <br>1. 請盡量簡述你的想法<br>2.如果可以，請提供一些場景 (方便作者更好理解)</l1>",
    "    <l2>If you encounter a bug and would like to help the author fix it<br>You should provide the following information: <br>1. the Situation<br>2. Your Configuration<br>3. Console Log (press Ctrl + Shift + i to open the Developer Assistant, And then select the Console panel)<br>4. Battle Log (if in combat)<br>If you are unable to tolerate this bug or even the bug made the script fail, try installing the old version<hr>If you have some suggestions to make this script more useful, then: <br>1. Please briefly describe your thoughts<br>2. If you can, please provide some scenes (to facilitate the author to better understand)<br>PS. For English user, please express in basic English (Oh my poor English, thanks for Google Translate)</l2></div></div>",
    "</div>",
    '<div class="hvAAButtonBox hvAACenter">',
    '  <button class="hvAAReset"><l0>重置设置</l0><l1>重置設置</l1><l2>Reset</l2></button><button class="hvAAApply"><l0>应用</l0><l1>應用</l1><l2>Apply</l2></button><button class="hvAACancel"><l01>取消</l01><l2>Cancel</l2></button></div>',
  ]
    .join("")
    .replace(/{{(.*?)}}/g, '<div class="customize" name="$1"></div>');
  // 绑定事件
  gE('select[name="lang"]', optionBox).onchange = function () {
    // 持久化 lang 到 option：统一 option 事件入口（内部 getValue fallback 取完整 option），
    // 避免在 option 未装填的页残缺 {lang} 落盘覆盖完整配置（现象①持久化失效根因）。
    // HV 原生汉化(equip/interface) 即时按新 lang 重渲染显示态（0简/1繁/2英），无需重载
    writeSettingsLanguage(this.value, this);
  };
  // UI 入口整合：HVAA 面板内入口打开 hv-utils config 面板。?. 兜底：桥未就绪/非 HV 页时静默不崩。
  const openHVUT = gE(".hvAAOpenHVUT", optionBox);
  if (openHVUT) openHVUT.onclick = () => window.HVUT_openConfig?.();
  gE(".hvAATabmenu", optionBox).onclick = function (e) {
    // 标签页事件
    if (e.target.tagName === "INPUT") return;
    const target = e.target.tagName === "SPAN" ? e.target : e.target.parentNode;
    const name = target.getAttribute("name");
    let _html;
    if (name === "Drop") {
      // 掉落监测
      gE("#hvAATab-Drop>table").innerHTML = runBattleMonitorAutomation({
        type: BattleMonitorEvent.RENDER_DROP_REPORT_TABLE_BODY,
      });
    } else if (name === "Usage") {
      // 数据记录
      gE("#hvAATab-Usage>table").innerHTML = runBattleMonitorAutomation({
        type: BattleMonitorEvent.RENDER_USAGE_REPORT_TABLE_BODY,
      });
    } else if (name === "Riddle") {
      // 小马验证(riddle ML)统计：汇总 + 结局明细由 riddle stats 入口渲染。
      _html = `<tbody>${runRiddleStatsAutomation({
        type: RiddleStatsEvent.RENDER_REPORT_ROWS,
      })}`;
      _html += runRiddleLogAutomation({ type: RiddleLogEvent.RENDER_REPORT_ROWS });
      _html = `${_html}</tbody>`;
      gE("#hvAATab-Riddle>table").innerHTML = _html;
    } else if (name === "About") {
      // 关于本脚本
      const roundDebug = runBattleRoundAutomation({
        type: BattleRoundEvent.READ_DEBUG_FIELDS,
      });
      gE(".hvAADebug", "all", optionBox).forEach((input) => {
        if (input.name in roundDebug) {
          if (roundDebug[input.name]) input.value = roundDebug[input.name];
          return;
        }
        if (getValue(input.name)) input.value = getValue(input.name);
      });
    }
    if (name === "Drop" || name === "Usage") {
      gE(".selectTable", "all", optionBox).forEach((i) => {
        i.onclick = null;
        i.onclick = function (e) {
          const select = window.getSelection();
          select.removeAllRanges();
          const range = document.createRange();
          const table = readSelectableReportTableTarget(e.target);
          if (!table) return;
          range.selectNodeContents(table);
          select.addRange(range);
        };
      });
    }
    gE(".hvAATab", "all", optionBox).forEach((i) => {
      i.style.display = i.id === `hvAATab-${name}` ? "block" : "none";
    });
  };
  gE(".hvAAGoto", "all", optionBox).forEach((i) => {
    i.onclick = function () {
      gE(`.hvAATabmenu>span[name="${this.name.replace("hvAATab-", "")}"]`).click();
    };
  });

  function updateGroup() {
    const group = gE(".customizeGroup", "all", g("customizeTarget"));
    const customizeBox = gE(".customizeBox");
    if (group.length + 1 === gE('select[name="groupChoose"]>option', "all", customizeBox).length)
      return;
    gE('select[name="groupChoose"]', customizeBox).textContent = "";
    for (let i = 0; i <= group.length; i++) {
      const option = gE('select[name="groupChoose"]', customizeBox).appendChild(cE("option"));
      if (i === group.length) {
        option.value = "new";
        option.textContent = "new";
      } else {
        option.value = i + 1;
        option.textContent = i + 1;
      }
    }
  }
  optionBox.onmousemove = function (e) {
    // 自定义条件相关事件
    const target = readCustomizeHoverTarget(e.target);
    if (!gE(".customizeBox")) customizeBox();
    updateGroup();
    if (!target) {
      gE(".customizeBox").style.zIndex = -1;
      return;
    }
    g("customizeTarget", target);
    const position = target.getBoundingClientRect();
    gE(".customizeBox").style.zIndex = 5;
    gE(".customizeBox").style.top = `${position.bottom + window.scrollY}px`;
    gE(".customizeBox").style.left = `${position.left + window.scrollX}px`;
  };
  // 标签页-主要选项
  gE('input[name="pauseHotkeyStr"]', optionBox).onkeyup = function (e) {
    this.value = /^[a-z]$/.test(e.key) ? e.key.toUpperCase() : e.key;
    gE('input[name="pauseHotkeyKey"]', optionBox).value = e.key;
  };
  gE(".testNotification", optionBox).onclick = function () {
    _alert(
      0,
      "接下来开始预处理。\n如果询问是否允许，请选择允许",
      "接下來開始預處理。\n如果詢問是否允許，請選擇允許",
      "Now, pretreat.\nPlease allow to receive notifications if you are asked for permission"
    );
    runAlarmAutomation({ type: AlarmEvent.NOTIFICATION, kind: "Test" });
  };
  gE(".testPopup", optionBox).onclick = function () {
    _alert(
      0,
      "接下来开始预处理。\n关闭本警告框之后，请切换到其他标签页，\n并在足够长的时间后再打开本标签页",
      "接下來開始預處理。\n關閉本警告框之後，請切換到其他標籤頁，\n並在足夠長的時間後再打開本標籤頁",
      "Now, pretreat.\nAfter dismissing this alert, focus other tab,\nfocus this tab again after long time."
    );
    runRiddleAutomation({ type: RiddleEvent.TEST_POPUP_PRETREAT });
  };
  gE(".staminaLostLog", optionBox).onclick = function () {
    if (
      window.confirm(
        runStaminaLossLogAutomation({
          type: StaminaLossLogEvent.CLEAR_CONFIRMATION_MESSAGE,
        })
      )
    )
      runStaminaLossLogAutomation({ type: StaminaLossLogEvent.CLEAR });
  };
  gE(".idleArenaReset", optionBox).onclick = function () {
    if (_alert(1, "是否重置", "是否重置", "Whether to reset")) {
      runIdleArenaAutomation({ type: IdleArenaEvent.RESET_PROGRESS });
    }
  };
  gE(".hvAAShowLevels", optionBox).onclick = function () {
    gE(".hvAAArenaLevels").style.display =
      gE(".hvAAArenaLevels").style.display === "block" ? "none" : "block";
  };
  gE(".hvAALevelsClear", optionBox).onclick = function () {
    gE('[name="idleArenaLevels"]', optionBox).value = "";
    gE('[name="idleArenaValue"]', optionBox).value = "";
    gE(".hvAAArenaLevels>input", "all", optionBox).forEach((input) => {
      input.checked = false;
    });
  };
  function toggleOrderItem(inputName, item, checked) {
    const el = gE(`input[name="${inputName}"]`);
    if (checked) {
      el.value = el.value + (el.value ? `,${item}` : item);
    } else {
      el.value = el.value.replace(new RegExp(`(^|,)${item}(,|$)`), "$2").replace(/^,/, "");
    }
  }
  function makeOrderHandler(nameInput, valueInput) {
    return function (e) {
      if (e.target.tagName !== "INPUT" && e.target.type !== "checkbox") return;
      const valueArray = e.target.value.split(",");
      toggleOrderItem(nameInput, valueArray[0], e.target.checked);
      toggleOrderItem(valueInput, valueArray[1], e.target.checked);
    };
  }
  function makeSingleOrderHandler(valueInput) {
    return function (e) {
      if (e.target.tagName !== "INPUT" && e.target.type !== "checkbox") return;
      const name = readSingleOrderItemName(e.target);
      if (!name) return;
      toggleOrderItem(valueInput, name, e.target.checked);
    };
  }
  gE(".hvAAArenaLevels", optionBox).onclick = makeOrderHandler("idleArenaLevels", "idleArenaValue");
  // 标签页-物品
  gE(".itemOrder", optionBox).onclick = makeOrderHandler("itemOrderName", "itemOrderValue");
  // 标签页-Channel技能
  gE(".channelSkill2Order", optionBox).onclick = makeOrderHandler(
    "channelSkill2OrderName",
    "channelSkill2OrderValue"
  );
  // 标签页-BUFF技能
  gE(".buffSkillOrder", optionBox).onclick = makeSingleOrderHandler("buffSkillOrderValue");
  // 标签页-DEBUFF技能
  gE(".debuffSkillOrder", optionBox).onclick = makeSingleOrderHandler("debuffSkillOrderValue");
  // 标签页-其他技能
  gE(".skillOrder", optionBox).onclick = makeSingleOrderHandler("skillOrderValue");
  // 标签页-警报
  gE('input[name="audio_Text"]', optionBox).onchange = function () {
    const preview = runAlarmAutomation({
      type: AlarmEvent.PREVIEW_AUDIO_URL,
      url: this.value,
    });
    if (preview?.message) _alert(0, preview.message.l0, preview.message.l1, preview.message.l2);
  };
  // 标签页-掉落监测
  gE(".reDropMonitor", optionBox).onclick = function () {
    if (_alert(1, "是否重置", "是否重置", "Whether to reset")) {
      runBattleMonitorAutomation({ type: BattleMonitorEvent.CLEAR_DROP_REPORT });
    }
  };
  // 标签页-数据记录
  gE(".reRecordUsage", optionBox).onclick = function () {
    if (_alert(1, "是否重置", "是否重置", "Whether to reset")) {
      runBattleMonitorAutomation({ type: BattleMonitorEvent.CLEAR_USAGE_REPORT });
    }
  };
  // 标签页-小马验证
  gE(".reRiddleStats", optionBox).onclick = function () {
    if (_alert(1, "是否重置", "是否重置", "Whether to reset")) {
      runRiddleStatsAutomation({ type: RiddleStatsEvent.RESET });
      runRiddleLogAutomation({ type: RiddleLogEvent.CLEAR }); // 重置统计同时清滚动日志
    }
  };
  // 标签页-关于本脚本
  gE(".hvAAFix", optionBox).onclick = function () {
    runBattleRoundAutomation({
      type: BattleRoundEvent.RECORD_DEBUG_FIELDS,
      fields: gE('.hvAADebug[name^="round"]', "all", optionBox).map((input) => ({
        name: input.name,
        value: input.value,
        placeholder: input.placeholder,
      })),
    });
  };
  gE(".quickSiteAdd", optionBox).onclick = function () {
    const tr = gE(".hvAAQuickSite>table>tbody", optionBox).appendChild(cE("tr"));
    tr.innerHTML = runQuickSiteAutomation({
      type: QuickSiteEvent.RENDER_SETTINGS_EMPTY_ROW,
    });
  };
  gE(".hvAAConfig", optionBox).onclick = function () {
    this.style.height = 0;
    this.style.height = `${this.scrollHeight}px`;
    this.select();
  };
  function rmListItem(code) {
    // 同步删除界面显示对应的项
    const configs = gE('#hvAATab-About > * > ul[class="hvAABackupList"] > li', "all");
    for (const config of configs) {
      if (config.textContent == code) {
        config.remove();
      }
    }
  }
  gE(".hvAABackup", optionBox).onclick = function () {
    const code =
      _alert(
        2,
        "请输入当前配置代号",
        "請輸入當前配置代號",
        "Please put in a name for the current configuration"
      ) || runTimeAutomation({ type: TimeEvent.LOCAL_TIMESTAMP_LABEL });
    if (runOptionBackupAutomation({ type: OptionBackupEvent.HAS_CODE, code })) {
      // 覆写同名配置
      if (
        _alert(
          1,
          "是否覆盖已有的同名配置？",
          "是否覆蓋已有的同名配置？",
          "Do you want to overwrite the configuration with the same name?"
        )
      ) {
        if (!deleteSettingsBackup(code)) return;
        rmListItem(code);
      } else return;
    }
    if (!saveSettingsBackup(code)) return;
    const li = gE(".hvAABackupList", optionBox).appendChild(cE("li"));
    li.textContent = code;
  };
  gE(".hvAARestore", optionBox).onclick = function () {
    const code = _alert(
      2,
      "请输入配置代号",
      "請輸入配置代號",
      "Please put in a name for a configuration"
    );
    if (!restoreSettingsBackup(code)) return;
    runNavigationAutomation({
      type: NavigationEvent.RELOAD_NOW,
      reason: NavigationReloadReason.SETTINGS_CHANGE,
    });
  };
  gE(".hvAADelete", optionBox).onclick = function () {
    const code = _alert(
      2,
      "请输入配置代号",
      "請輸入配置代號",
      "Please put in a name for a configuration"
    );
    if (!deleteSettingsBackup(code)) return;
    // goto();
    rmListItem(code);
  };
  gE(".hvAAExport", optionBox).onclick = function () {
    gE(".hvAAConfig").value = runOptionAutomation({ type: OptionEvent.EXPORT_TEXT });
  };
  gE(".hvAAImport", optionBox).onclick = function () {
    const parsed = runOptionAutomation({
      type: OptionEvent.PARSE_IMPORT_TEXT,
      text: gE(".hvAAConfig").value,
    });
    if (!parsed.ok) {
      _alert(0, "配置格式错误", "配置格式錯誤", "Invalid configuration format");
      return;
    }
    if (_alert(1, "是否重置", "是否重置", "Whether to reset")) {
      if (!writeSettingsOption(parsed.option)) return;
      runNavigationAutomation({
        type: NavigationEvent.RELOAD_NOW,
        reason: NavigationReloadReason.SETTINGS_CHANGE,
      });
    }
  };
  //
  gE(".hvAAReset", optionBox).onclick = function () {
    if (_alert(1, "是否重置", "是否重置", "Whether to reset")) {
      clearSettingsOption();
    }
  };
  gE(".hvAAApply", optionBox).onclick = function () {
    if (gE('select[name="attackStatus"] option[value="-1"]:checked', optionBox)) {
      _alert(0, "请选择攻击模式", "請選擇攻擊模式", "Please select the attack mode");
      gE('.hvAATabmenu>span[name="Main"]').click();
      gE("#attackStatus", optionBox).style.border = "1px solid red";
      setTimeout(() => {
        gE("#attackStatus", optionBox).style.border = "";
      }, 0.5 * 1000);
      return;
    }
    const _option = runSettingsFormOptionAutomation({
      type: SettingsFormOptionEvent.COLLECT_OPTION,
      version: g("version"),
      inputs: gE("input,select", "all", optionBox),
    });
    runQuickSiteAutomation({
      type: QuickSiteEvent.COLLECT_SETTINGS_INPUTS,
      option: _option,
      inputs: gE('.hvAAQuickSite input[type="text"]', "all", optionBox),
    });
    if (!writeSettingsOption(_option)) return;
    optionBox.style.display = "none";
    runNavigationAutomation({
      type: NavigationEvent.RELOAD_NOW,
      reason: NavigationReloadReason.SETTINGS_CHANGE,
    });
  };
  gE(".hvAACancel", optionBox).onclick = function () {
    optionBox.style.display = "none";
  };
  hydrateSettingsForm(optionBox);
}
