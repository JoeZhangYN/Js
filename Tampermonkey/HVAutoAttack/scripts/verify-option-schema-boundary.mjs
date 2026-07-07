import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const owner = path.normalize("src/settings/schema.js");
const ownerTest = path.normalize("src/settings/schema.test.js");
const ownerTestPrefix = path.normalize("src/settings/schema-");
const settingsRender = path.normalize("src/settings/render.js");
const orderControlCatalog = path.normalize("src/settings/order-control-catalog.js");
const orderControlCatalogTest = path.normalize("src/settings/order-control-catalog.test.js");
const violations = [];

function rel(file) {
  return path.normalize(path.relative(root, file)).replaceAll("\\", "/");
}

function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith(".js")) checkFile(full);
  }
}

function checkFile(file) {
  const relative = path.normalize(path.relative(root, file));
  const text = stripComments(fs.readFileSync(file, "utf8"));
  if (relative === owner || relative === ownerTest || relative.startsWith(ownerTestPrefix)) return;

  if (
    /import\s*\{[^}]*\b(?:OPTION_SCHEMA|getOptionDefault|getFieldsByGroup)\b[^}]*\}\s*from\s*["'][^"']*\/?settings\/schema\.js["']/.test(
      text
    ) ||
    /import\s*\{[^}]*\b(?:OPTION_SCHEMA|getOptionDefault|getFieldsByGroup)\b[^}]*\}\s*from\s*["']\.\/schema\.js["']/.test(
      text
    )
  ) {
    violations.push(`${rel(file)} imports legacy option schema exits`);
  }
}

walk(srcDir);

const ownerText = fs.readFileSync(path.join(root, owner), "utf8");
for (const required of ["OptionSchemaEvent", "runOptionSchema"]) {
  if (!ownerText.includes(required))
    violations.push(`${owner.replaceAll("\\", "/")} must expose ${required}`);
}
for (const legacy of ["OPTION_SCHEMA", "getOptionDefault", "getFieldsByGroup"]) {
  if (new RegExp(`export\\s+(?:const|function)\\s+${legacy}\\b`).test(ownerText)) {
    violations.push(
      `${owner.replaceAll("\\", "/")} must keep ${legacy} private behind runOptionSchema(event)`
    );
  }
}
if (!/key:\s*["']repairCreditCap["'][\s\S]{0,500}description:\s*\{[\s\S]{0,260}credits\/run cap/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must own repair material cap help text`);
}
if (!/key:\s*["']riddleAnswerTime["'][\s\S]{0,500}description:\s*\{[\s\S]{0,260}no answer has been chosen yet/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must own riddle answer timing help text`);
}
if (!/key:\s*["']delayAlertTime["'][\s\S]{0,500}description:\s*\{[\s\S]{0,220}s, alarm/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must own action delay alarm help text`);
}
if (!/key:\s*["']delayReloadTime["'][\s\S]{0,500}description:\s*\{[\s\S]{0,220}s, reload page/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must own action delay reload help text`);
}
if (!/key:\s*["']criticalBuffMinTurns["'][\s\S]{0,500}description:\s*\{[\s\S]{0,260}critical buff ≤N & MP low/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must own critical buff threshold help text`);
}
if (!/key:\s*["']potionWasteTolerance["'][\s\S]{0,500}description:\s*\{[\s\S]{0,220}skip if deficit too small/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must own no-waste potion tolerance help text`);
}
if (!/key:\s*["']pageRefreshMinutes["'][\s\S]{0,500}description:\s*\{[\s\S]{0,240}mobile anti-hang absolute clock/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must own page refresh interval help text`);
}
if (!/export const OptionSchemaEvent\s*=\s*Object\.freeze\(/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must expose OptionSchemaEvent`);
}
if (!/export function runOptionSchema\(\s*event\b/.test(ownerText)) {
  violations.push(`${owner.replaceAll("\\", "/")} must expose runOptionSchema(event)`);
}

const renderText = fs.readFileSync(path.join(root, settingsRender), "utf8");
const orderControlCatalogText = fs.readFileSync(path.join(root, orderControlCatalog), "utf8");
const orderControlCatalogTestText = fs.readFileSync(path.join(root, orderControlCatalogTest), "utf8");
for (const required of [
  "SettingsOrderControlEvent",
  "runSettingsOrderControlCatalog",
  "READ_SUPPORT_BUFF_SKILLS",
  "READ_BUFF_ACTIONS",
  "READ_CASTABLE_DEBUFF_SKILLS",
  "READ_ALL_DEBUFF_ACTIONS",
  "READ_PHYSICAL_SKILL_ORDER",
  "READ_OFFENSIVE_SPELL_AOE_ROWS",
  "READ_IDLE_ARENA_LEVELS",
  "READ_BATTLE_ROUND_TYPES",
  "READ_BATTLE_SCROLLS",
  "exposes castable debuff controls without weapon-only effects",
  "exposes arena, round, scroll, and spell control surfaces",
]) {
  if (!orderControlCatalogText.includes(required) && !orderControlCatalogTestText.includes(required)) {
    violations.push(`${orderControlCatalog.replaceAll("\\", "/")} must own settings order control catalog ${required}`);
  }
}
for (const forbidden of [
  "from \"../data/buff-lib.js\"",
  "from \"../data/channel-fallback-order.js\"",
  "from \"../data/debuff-lib.js\"",
  "from \"../data/item-order.js\"",
  "from \"../data/physical-skill-order.js\"",
  "from \"../data/all-debuff-actions.js\"",
  "from \"../data/battle-buff-actions.js\"",
  "from \"../data/battle-round-types.js\"",
  "from \"../data/battle-scrolls.js\"",
  "from \"../data/idle-arena-levels.js\"",
  "from \"../data/spell-lib.js\"",
]) {
  if (renderText.includes(forbidden)) {
    violations.push(`${settingsRender.replaceAll("\\", "/")} must read order controls through settings order catalog`);
  }
}
if (/function\s+renderCheckboxPlusNumber\(\s*checkboxKey\s*,\s*numberKey\s*,/.test(renderText)) {
  violations.push(
    `${settingsRender.replaceAll("\\", "/")} renderCheckboxPlusNumber must not accept caller-owned description text`
  );
}
if (/renderCheckboxPlusNumber\(\s*["'][^"']+["']\s*,\s*["'][^"']+["']\s*,\s*\{/.test(renderText)) {
  violations.push(
    `${settingsRender.replaceAll("\\", "/")} must not pass local description text into renderCheckboxPlusNumber`
  );
}
for (const required of [
  /renderEquipmentSchemaFields/,
  /readSchemaField\(\s*["']repairValue["']\s*\)/,
  /renderRepairThresholdSchemaField/,
  /renderSchemaCheckboxField\(\s*["']repair["']/,
  /renderSchemaCheckboxField\(\s*["']repair["'][\s\S]*renderSchemaNumberInput\(\s*["']repairValue["']/,
  /renderCheckboxPlusNumber\(\s*["']repairBuyMaterials["']\s*,\s*["']repairCreditCap["']/,
  /renderSchemaCheckboxField\(\s*["']forgeCostShow["']\s*\)/,
  /renderSchemaSelectField\(\s*["']equipPercentileMode["']\s*\)/,
  /renderRiddleSchemaFields/,
  /renderSchemaCheckboxField\(\s*["']riddleHelperUi["']\s*\)/,
  /renderRiddleTimingSchemaFields/,
  /renderSchemaNumberInput\(\s*["']riddleAnswerTime["']/,
  /renderSchemaCheckboxField\(\s*["']riddlePopup["']/,
  /renderDropMonitorTabSchemaField/,
  /renderSchemaCheckboxField\(\s*["']dropMonitor["']/,
  /renderUsageTrackingTabSchemaField/,
  /renderSchemaCheckboxField\(\s*["']recordUsage["']/,
  /renderChannelSkillSwitchTabSchemaField/,
  /renderSchemaCheckboxField\(\s*["']channelSkillSwitch["']/,
  /renderChannelFallbackEnableSchemaField/,
  /renderSchemaCheckboxField\(\s*["']channelSkill2["']/,
  /renderBattleTabSwitchSchemaField/,
  /renderBattleTabSwitchSchemaField\(\s*["']buffSkillSwitch["']\s*\)/,
  /renderBattleTabSwitchSchemaField\(\s*["']debuffSkillSwitch["']\s*\)/,
  /renderBattleTabSwitchSchemaField\(\s*["']skillSwitch["']\s*\)/,
  /renderBattleTabSwitchSchemaField\(\s*["']scrollSwitch["']\s*\)/,
  /renderBattleTabSwitchSchemaField\(\s*["']infusionSwitch["']\s*\)/,
  /SettingsOrderControlEvent\.READ_BUFF_ACTIONS/,
  /renderBuffSkillCheckboxes/,
  /renderBuffSkillActionCheckboxes/,
  /SettingsOrderControlEvent\.READ_SUPPORT_BUFF_SKILLS/,
  /renderBuffSkillCheckboxes\(\s*["']channelSkill["']\s*\)/,
  /renderBuffSkillCheckboxes\(\s*["']buffSkillOrder["']\s*\)/,
  /SettingsOrderControlEvent\.READ_CHANNEL_FALLBACK_ORDER/,
  /renderChannelFallbackOrderCheckboxes/,
  /SettingsOrderControlEvent\.READ_CASTABLE_DEBUFF_SKILLS/,
  /renderDebuffSkillOrderCheckboxes/,
  /renderDebuffSkillCheckboxes/,
  /renderDebuffSkillNumberRows/,
  /renderDebuffExpiryAlertSchemaSection/,
  /renderSchemaCheckboxField\(\s*["']debuffSkillTurnAlert["']/,
  /SettingsOrderControlEvent\.READ_ALL_DEBUFF_ACTIONS/,
  /renderAllDebuffActionCheckboxes/,
  /renderSchemaCheckboxField\(\s*key,\s*`\{\{\$\{conditionKey\}\}\}`/,
  /SettingsOrderControlEvent\.READ_ITEM_ORDER/,
  /renderItemOrderCheckboxes/,
  /renderItemActionCheckboxes/,
  /SettingsOrderControlEvent\.READ_PHYSICAL_SKILL_ORDER/,
  /renderPhysicalSkillOrderCheckboxes/,
  /renderPhysicalSkillActionCheckboxes/,
  /SettingsOrderControlEvent\.READ_OFFENSIVE_SPELL_AOE_ROWS/,
  /renderOffensiveSpellAoeRows/,
  /renderDropMonitorSchemaFields/,
  /renderSchemaSelectField\(\s*["']dropQuality["']\s*\)/,
  /renderRuleWeightSchemaFields/,
  /READ_GROUP,\s*group:\s*["']Rule["']/,
  /renderSchemaNumberInput\(field\.key\)/,
  /renderRuleReverseSchemaField/,
  /renderSchemaCheckboxField\(\s*["']ruleReverse["']/,
  /renderSchemaCheckboxField\(\s*["']mlAnswer["']/,
  /renderSchemaCheckboxField\(\s*["']mlBackupOnFail["']\s*\)/,
  /renderSchemaTextInput\(\s*["']mlEndpoint["']/,
  /renderSchemaTextInput\(\s*["']mlApiKey["']/,
  /renderCriticalBuffSchemaFields/,
  /renderCheckboxPlusNumber\(\s*["']pauseOnCriticalBuffExpire["']\s*,\s*["']criticalBuffMinTurns["']/,
  /renderSchemaTextInput\(\s*["']criticalBuffsList["']/,
  /renderSchemaNumberInput\(\s*["']criticalBuffMpFloor["']/,
  /renderDebuffSmartSkipSchemaFields/,
  /renderSchemaCheckboxField\(\s*["']skipDebuffForBigSkill_We["']/,
  /renderSchemaCheckboxField\(\s*["']skipWeakenWhenClearReady["']/,
  /renderSchemaCheckboxField\(\s*["']skipDebuffForBigSkill_Im["']/,
  /renderSchemaNumberInput\(\s*["']skipDebuffForBigSkillThreshold["']/,
  /renderSchemaCheckboxField\(\s*["']skipImperilWhenOfcKills["']/,
  /renderSchemaNumberInput\(\s*["']bigKillMinSamples["']/,
  /renderSchemaNumberInput\(\s*["']bigKillProbThreshold["']/,
  /renderSchemaNumberInput\(\s*["']bigKillScaleDriftTol["']/,
  /renderSchemaCheckboxField\(\s*["']dynamicBigKillLog["']\s*\)/,
  /renderBurstGuardSchemaFields/,
  /renderSchemaCheckboxField\(\s*["']burstControlSwitch["']/,
  /renderSchemaNumberInput\(\s*["']burstControlHpFrac["']/,
  /renderSchemaCheckboxField\(\s*["']burstControlSilenceForSpell["']/,
  /renderSpellTierStrategySchemaFields/,
  /renderSchemaCheckboxField\(\s*["']channelForceHighTier["']/,
  /renderSchemaCheckboxField\(\s*["']spellTierDowngrade["']/,
  /renderSchemaNumberInput\(\s*["']spellDowngradeThreshold["']/,
  /renderPhysicalSkillStrategySchemaFields/,
  /renderSchemaSelectField\(\s*["']fightingStyle["']\s*\)/,
  /renderMercifulBlowSchemaField/,
  /renderSchemaCheckboxField\(\s*["']mercifulBlow["']/,
  /renderSchemaCheckboxField\(\s*["']physicalSkillDowngrade["']/,
  /renderSchemaNumberInput\(\s*["']physicalDowngradeThreshold["']/,
  /renderSchemaCheckboxField\(\s*["']drainTargetMaxHp["']/,
  /renderSchemaCheckboxField\(\s*["']autoElement["']\s*\)/,
  /renderCheckboxPlusNumber\(\s*["']pageRefresh["']\s*,\s*["']pageRefreshMinutes["']/,
  /renderSpiritStanceSchemaFields/,
  /renderSchemaCheckboxField\(\s*["']turnOnSS["'][\s\S]{0,80}turnOnSSCondition/,
  /renderSchemaCheckboxField\(\s*["']turnOffSS["'][\s\S]{0,80}turnOffSSCondition/,
  /renderSchemaCheckboxField\(\s*["']preCastSS["'][\s\S]{0,80}preCastSSCondition/,
  /renderAttackResourceSchemaFields/,
  /renderSchemaCheckboxField\(\s*["']focus["'][\s\S]{0,80}focusCondition/,
  /renderSchemaCheckboxField\(\s*["']etherTap["'][\s\S]{0,80}etherTapCondition/,
  /renderActionDelaySchemaFields/,
  /renderCheckboxPlusNumber\(\s*["']delayAlert["']\s*,\s*["']delayAlertTime["']/,
  /renderCheckboxPlusNumber\(\s*["']delayReload["']\s*,\s*["']delayReloadTime["']/,
  /renderSchemaCheckboxField\(\s*["']recordEach["']\s*\)/,
  /renderApiBridgeDelaySchemaFields/,
  /renderSchemaNumberInput\(\s*["']delay["']/,
  /renderSchemaNumberInput\(\s*["']delay2["']/,
  /renderArenaStaminaLossSchemaFields/,
  /renderSchemaNumberInput\(\s*["']staminaLose["']/,
  /renderIdleArenaSchemaFields/,
  /renderSchemaCheckboxField\(\s*["']idleArena["']/,
  /renderSchemaNumberInputWithoutPlaceholder\(\s*["']idleArenaTime["']/,
  /renderIdleArenaGrindFestInput/,
  /renderSchemaNumberInput\(\s*["']idleArenaGrTime["']/,
  /SettingsOrderControlEvent\.READ_IDLE_ARENA_LEVELS/,
  /renderIdleArenaLevelCheckboxes/,
  /SettingsOrderControlEvent\.READ_BATTLE_ROUND_TYPES/,
  /renderBattleRoundTypeCheckboxes/,
  /renderBattleRoundTypeSelectOptions/,
  /SettingsOrderControlEvent\.READ_BATTLE_SCROLLS/,
  /renderScrollFirstSchemaField/,
  /renderSchemaCheckboxField\(\s*["']scrollFirst["']/,
  /renderBattleScrollCheckboxes/,
  /renderRestoreStaminaSchemaFields/,
  /renderSchemaCheckboxField\(\s*["']restoreStamina["']/,
  /renderSchemaNumberInput\(\s*["']staminaLow["']/,
  /renderAttackStatusSchemaField/,
  /readSchemaField\(\s*["']attackStatus["']\s*\)/,
  /<select class=["']hvAANumber["'] name="\$\{field\.key\}">/,
  /renderMainPauseSchemaFields/,
  /renderSchemaCheckboxField\(\s*["']pauseButton["']/,
  /readSchemaField\(\s*["']pauseHotkey["']\s*\)/,
  /renderSchemaTextInputWithoutPlaceholder\(\s*["']pauseHotkeyStr["']/,
  /renderHiddenSchemaInputWithoutPlaceholder\(\s*["']pauseHotkeyKey["']/,
  /renderMainWarningSchemaFields/,
  /renderSchemaCheckboxField\(\s*["']alert["']/,
  /renderSchemaCheckboxField\(\s*["']notification["']/,
  /renderMainPluginSchemaFields/,
  /renderSchemaCheckboxField\(\s*["']riddleRadio["']/,
  /renderSchemaCheckboxField\(\s*["']encounter["']/,
  /renderBattleControlSchemaFields/,
  /renderSchemaCheckboxField\(\s*["']defend["'][\s\S]{0,80}defendCondition/,
  /renderSchemaCheckboxField\(\s*["']autoFlee["'][\s\S]{0,80}fleeCondition/,
  /renderSchemaCheckboxField\(\s*["']autoPause["'][\s\S]{0,80}pauseCondition/,
  /renderGemThresholdSchemaFields/,
  /renderSchemaNumberInput\(\s*["']hp1["']/,
  /renderSchemaNumberInput\(\s*["']mp1["']/,
  /renderSchemaNumberInput\(\s*["']sp1["']/,
  /renderDynamicHealSchemaFields/,
  /renderSchemaCheckboxField\(\s*["']dynamicHealThreshold["']/,
  /renderSchemaNumberInput\(\s*["']playerMaxHp["']/,
  /renderSchemaNumberInput\(\s*["']dynamicHealSafetyPad["']/,
  /renderSchemaCheckboxField\(\s*["']autoTune["']/,
  /renderNoWastePotionSchemaFields/,
  /renderCheckboxPlusNumber\(\s*["']noWastePotion["']\s*,\s*["']potionWasteTolerance["']/,
  /renderStallStrategySchemaFields/,
  /renderSchemaCheckboxField\(\s*["']stallMode["']/,
  /renderSchemaCheckboxField\(\s*["']stallFocus["']/,
  /renderSchemaNumberInput\(\s*["']stallFocusOcThreshold["']/,
  /renderSchemaNumberInput\(\s*["']stallFocusMpMax["']/,
  /renderSchemaNumberInput\(\s*["']stallTopupMpFloor["']/,
  /renderSchemaNumberInput\(\s*["']stallTopupSpFloor["']/,
  /renderSchemaCheckboxField\(\s*["']stallTurnOffSpirit["']/,
]) {
  if (!required.test(renderText)) {
    violations.push(
      `${settingsRender.replaceAll("\\", "/")} must render migrated options from schema`
    );
  }
}
for (const forbidden of [
  /name=["']repairValue["']\s+placeholder=["']60["']/,
  /id=["']repair["'][\s\S]{0,120}修复装备/,
  /<div><input id=["']repair["'] type=["']checkbox["']><label for=["']repair["']><b>\$\{renderSchemaLabel/,
  /id=["']repairBuyMaterials["'][\s\S]{0,140}维修缺料时自动/,
  /credits\/run cap \(auto-buy materials to repair; stop if over cap; unchecked = stop on shortage\)/,
  /name=["']repairCreditCap["']\s+placeholder=["']50000["']/,
  /id=["']forgeCostShow["'][\s\S]{0,120}强化价格/,
  /name=["']equipPercentileMode["'][\s\S]{0,160}<option value=["']offline["']/,
  /id=["']riddleHelperUi["'][\s\S]{0,120}小马图片助手/,
  /name=["']riddleAnswerTime["']\s+placeholder=["']3["']/,
  /no answer has been chosen yet, a random answer will be generated and submitted/,
  /id=["']riddlePopup["'][\s\S]{0,160}弹窗答题/,
  /<input id=["']dropMonitor["'] type=["']checkbox["']><l0>掉落监测/,
  /<input id=["']recordUsage["'] type=["']checkbox["']><l0>数据记录/,
  /<input id=["']channelSkillSwitch["'] type=["']checkbox["']>Channel/,
  /<input id=["']channelSkill2["'] type=["']checkbox["']><label for=["']channelSkill2["'][\s\S]{0,80}再使用技能/,
  /<input id=["']buffSkillSwitch["'] type=["']checkbox["']>BUFF/,
  /<input id=["']debuffSkillSwitch["'] type=["']checkbox["']>DEBUFF/,
  /<input id=["']skillSwitch["'] type=["']checkbox["']><l01>其他技能/,
  /<input id=["']scrollSwitch["'] type=["']checkbox["']><l0>卷轴/,
  /<input id=["']infusionSwitch["'] type=["']checkbox["']><l0>魔药/,
  /<input id=["']scrollFirst["'] type=["']checkbox["']><label for=["']scrollFirst["'][\s\S]{0,180}effects from spells/,
  /<input id=["']channelSkill_Pr["'] type=["']checkbox["']><label for=["']channelSkill_Pr["']>Protection/,
  /<input id=["']buffSkillOrder_Pr["'] type=["']checkbox["']><label for=["']buffSkillOrder_Pr["']>Protection/,
  /<div><input id=["']buffSkill_HD["'] type=["']checkbox["']><label for=["']buffSkill_HD["']>Health Draught/,
  /<div><input id=["']buffSkill_Pr["'] type=["']checkbox["']><label for=["']buffSkill_Pr["']>Protection/,
  /<div><input id=["']buffSkill_Ab["'] type=["']checkbox["']><label for=["']buffSkill_Ab["']>Absorb/,
  /<input id=["']channelSkill2Order_Cu["'] value=["']Cu,311["'] type=["']checkbox["']><label for=["']channelSkill2Order_Cu["']>Cure/,
  /<input id=["']channelSkill2Order_AF["'] value=["']AF,432["'] type=["']checkbox["']><label for=["']channelSkill2Order_AF["']>Arcane Focus/,
  /<input id=["']debuffSkillOrder_Sle["'] type=["']checkbox["']><label for=["']debuffSkillOrder_Sle["']>Sleep/,
  /<input id=["']debuffSkillOrder_Im["'] type=["']checkbox["']><label for=["']debuffSkillOrder_Im["']>Imperil/,
  /<div><input id=["']debuffSkill_Sle["'] type=["']checkbox["']><label for=["']debuffSkill_Sle["']>Sleep/,
  /<input id=["']debuffSkillAllIm["'] type=["']checkbox["']><label for=["']debuffSkillAllIm["'][\s\S]{0,140}Imperil/,
  /<input id=["']debuffSkillAllWk["'] type=["']checkbox["']><label for=["']debuffSkillAllWk["'][\s\S]{0,140}Weaken/,
  /<input id=["']debuffSkillTurnAlert["'] type=["']checkbox["']><label for=["']debuffSkillTurnAlert["'][\s\S]{0,160}DEBUFF/,
  /Sleep: <input class=["']hvAANumber["'] name=["']debuffSkillAoe_Sle["'] placeholder=["']1["'] type=["']text["']>/,
  /Imperil: <input class=["']hvAANumber["'] name=["']debuffSkillTurn_Im["'] type=["']text["']>/,
  /<input id=["']itemOrder_Cure["'] value=["']Cure,311["'] type=["']checkbox["']><label for=["']itemOrder_Cure["']>Cure/,
  /<input id=["']itemOrder_HP["'] value=["']HP,11195["'] type=["']checkbox["']><label for=["']itemOrder_HP["']>Health Potion/,
  /<div><input id=["']item_Cure["'] type=["']checkbox["']><label for=["']item_Cure["']><b>Cure<\/b><\/label>: \{\{itemCureCondition\}\}<\/div>/,
  /<div><input id=["']item_ED["'] type=["']checkbox["']><label for=["']item_ED["']><b>Energy Drink<\/b><\/label>: \{\{itemEDCondition\}\}<\/div>/,
  /<input id=["']arLevel_1["'] value=["']1,1["'] type=["']checkbox["']><label for=["']arLevel_1["']>1/,
  /<input id=["']arLevel_RB100["'] value=["']RB100,109["'] type=["']checkbox["']><label for=["']arLevel_RB100["']>RB100/,
  /<input id=["']scrollRoundType_ar["'] type=["']checkbox["']><label for=["']scrollRoundType_ar["']>The Arena/,
  /<select class=["']hvAADebug["'] name=["']roundType["']><option><\/option><option value=["']ar["']>The Arena/,
  /<div><input id=["']scroll_Go["'] type=["']checkbox["']><label for=["']scroll_Go["']>Scroll of the Gods/,
  /<div><input id=["']scroll_Ab["'] type=["']checkbox["']><label for=["']scroll_Ab["']>Scroll of Absorption/,
  /<input id=["']skillOrder_OFC["'] type=["']checkbox["']><label for=["']skillOrder_OFC["']><l0>友情小马砲/,
  /<input id=["']skillOrder_T3["'] type=["']checkbox["']><label for=["']skillOrder_T3["']>T3/,
  /<div><input id=["']skill_OFC["'] type=["']checkbox["']><label for=["']skill_OFC["']><l0>友情小马砲/,
  /<div><input id=["']skill_T3["'] type=["']checkbox["']><label for=["']skill_T3["']><l0>3阶（如果有）/,
  /Fire: T1:<input class=["']hvAANumber["'] name=["']spellAoe_11["'] placeholder=["']1["'] type=["']text["']> T2:<input class=["']hvAANumber["'] name=["']spellAoe_12["']/,
  /Dark: T1:<input class=["']hvAANumber["'] name=["']spellAoe_61["'] placeholder=["']1["'] type=["']text["']> T2:<input class=["']hvAANumber["'] name=["']spellAoe_62["']/,
  /<select name=["']dropQuality["'][\s\S]{0,220}<option value=["']7["']>Peerless/,
  /name=["']weight_Sle["']\s+placeholder=["']5["']/,
  /name=["']weight_Im["']\s+placeholder=["']-5["']/,
  /name=["']weight_BW["']\s+placeholder=["']-4["']/,
  /id=["']ruleReverse["'][\s\S]{0,180}Whichever enemy has the lowest\/highest PW/,
  /id=["']mlAnswer["'][\s\S]{0,120}ML 答题/,
  /id=["']mlBackupOnFail["'][\s\S]{0,120}备份图片/,
  /name=["']mlEndpoint["']\s+placeholder=["']https:\/\/rdma\.ooguy\.com\/help2["']/,
  /name=["']mlApiKey["']\s+placeholder=["']["']/,
  /id=["']pauseOnCriticalBuffExpire["'][\s\S]{0,160}关键 buff 即将消失/,
  /critical buff ≤N & MP low/,
  /name=["']criticalBuffMinTurns["']\s+placeholder=["']2["']/,
  /name=["']criticalBuffsList["']\s+placeholder=["']Hastened,Protection,Spark of Life["']/,
  /name=["']criticalBuffMpFloor["']\s+placeholder=["']30["']/,
  /id=["']skipDebuffForBigSkill_We["'][\s\S]{0,140}OFC\/FRD 即将就绪/,
  /id=["']skipWeakenWhenClearReady["'][\s\S]{0,140}大招本回合已就绪/,
  /id=["']skipDebuffForBigSkill_Im["'][\s\S]{0,140}OFC\/FRD 即将就绪/,
  /name=["']skipDebuffForBigSkillThreshold["']\s+placeholder=["']3["']/,
  /id=["']skipImperilWhenOfcKills["'][\s\S]{0,140}OFC 能秒/,
  /name=["']bigKillMinSamples["']\s+placeholder=["']4["']/,
  /name=["']bigKillProbThreshold["']\s+placeholder=["']0\.9["']/,
  /name=["']bigKillScaleDriftTol["']\s+placeholder=["']1\.15["']/,
  /id=["']dynamicBigKillLog["'][\s\S]{0,140}控制台输出 OFC 击杀学习日志/,
  /id=["']burstControlSwitch["'][\s\S]{0,140}学致死爆发伤害/,
  /name=["']burstControlHpFrac["']\s+placeholder=["']50["']/,
  /id=["']burstControlSilenceForSpell["'][\s\S]{0,140}法术爆发用 Silence/,
  /id=["']channelForceHighTier["'][\s\S]{0,160}强制最高阶/,
  /id=["']spellTierDowngrade["'][\s\S]{0,160}少怪降级/,
  /name=["']spellDowngradeThreshold["']\s+placeholder=["']3["']/,
  /name=["']fightingStyle["'][\s\S]{0,180}Niten Ichiryu/,
  /id=["']mercifulBlow["'][\s\S]{0,180}Merciful Blow/,
  /id=["']physicalSkillDowngrade["'][\s\S]{0,160}少怪降级/,
  /name=["']physicalDowngradeThreshold["']\s+placeholder=["']3["']/,
  /id=["']drainTargetMaxHp["'][\s\S]{0,140}Drain 优先打血最多/,
  /id=["']autoElement["'][\s\S]{0,160}按九抗自动选最弱属性攻击/,
  /id=["']pageRefresh["'][\s\S]{0,160}定时刷新页面/,
  /mobile anti-hang absolute clock/,
  /name=["']pageRefreshMinutes["']\s+placeholder=["']30["']/,
  /id=["']turnOnSS["'][\s\S]{0,160}Spirit Stance[\s\S]{0,40}turnOnSSCondition/,
  /id=["']turnOffSS["'][\s\S]{0,160}Spirit Stance[\s\S]{0,40}turnOffSSCondition/,
  /id=["']preCastSS["'][\s\S]{0,180}Spirit Stance[\s\S]{0,40}preCastSSCondition/,
  /Turn on\/off Spirit Stance[\s\S]{0,120}hvAATab-Main/,
  /id=["']focus["'][\s\S]{0,80}<b>Focus<\/b>[\s\S]{0,40}focusCondition/,
  /id=["']etherTap["'][\s\S]{0,100}<b>Ether Tap<\/b>[\s\S]{0,40}etherTapCondition/,
  /id=["']delayAlert["'][\s\S]{0,120}delayAlertTime/,
  /s, alarm/,
  /id=["']delayReload["'][\s\S]{0,120}delayReloadTime/,
  /s, reload page/,
  /id=["']recordEach["'][\s\S]{0,140}单独记录每场战役/,
  /name=["']delay["']\s+placeholder=["']200["']/,
  /name=["']delay2["']\s+placeholder=["']30["']/,
  /name=["']staminaLose["']\s+placeholder=["']5["']/,
  /id=["']staminaPause["']/,
  /id=["']staminaWarn["']/,
  /id=["']staminaFlee["']/,
  /id=["']idleArena["'][\s\S]{0,140}闲置竞技场/,
  /name=["']idleArenaTime["'][\s\S]{0,120}秒后，开始竞技场/,
  /name=["']idleArenaGrTime["']\s+placeholder=["']1["']/,
  /id=["']restoreStamina["'][\s\S]{0,140}战前回复/,
  /name=["']staminaLow["']\s+placeholder=["']30["']/,
  /name=["']attackStatus["'][\s\S]{0,160}<option value=["']0["']>物理 \/ Physical/,
  /id=["']pauseButton["'][\s\S]{0,120}使用按钮/,
  /id=["']pauseHotkey["'][\s\S]{0,160}pauseHotkeyStr/,
  /id=["']alert["'][\s\S]{0,120}音频警报/,
  /id=["']notification["'][\s\S]{0,120}桌面通知/,
  /id=["']riddleRadio["'][\s\S]{0,120}RiddleLimiter Plus/,
  /id=["']encounter["'][\s\S]{0,120}自动遭遇战/,
  /id=["']defend["'][\s\S]{0,80}<b>Defend<\/b>[\s\S]{0,40}defendCondition/,
  /id=["']autoFlee["'][\s\S]{0,120}自动逃跑[\s\S]{0,40}fleeCondition/,
  /id=["']autoPause["'][\s\S]{0,120}自动暂停[\s\S]{0,40}pauseCondition/,
  /name=["']hp1["']\s+placeholder=["']50["']/,
  /name=["']mp1["']\s+placeholder=["']70["']/,
  /name=["']sp1["']\s+placeholder=["']75["']/,
  /id=["']dynamicHealThreshold["'][\s\S]{0,180}智能 Health Gem 阈值/,
  /name=["']playerMaxHp["']\s+placeholder=["']17000["']/,
  /name=["']dynamicHealSafetyPad["']\s+placeholder=["']1\.3["']/,
  /id=["']autoTune["'][\s\S]{0,160}自学 safetyPad/,
  /id=["']noWastePotion["'][\s\S]{0,180}药品防溢出/,
  /skip if deficit too small/,
  /name=["']potionWasteTolerance["']\s+placeholder=["']0\.7["']/,
  /id=["']stallMode["'][\s\S]{0,180}拖战策略/,
  /id=["']stallFocus["'][\s\S]{0,180}拖战时 OC 高优先 Focus/,
  /name=["']stallFocusOcThreshold["']\s+placeholder=["']60["']/,
  /name=["']stallFocusMpMax["']\s+placeholder=["']80["']/,
  /name=["']stallTopupMpFloor["']\s+placeholder=["']70["']/,
  /name=["']stallTopupSpFloor["']\s+placeholder=["']70["']/,
  /id=["']stallTurnOffSpirit["'][\s\S]{0,180}拖战时关闭 Spirit Stance/,
]) {
  if (forbidden.test(renderText)) {
    violations.push(
      `${settingsRender.replaceAll("\\", "/")} must not inline migrated option defaults/labels`
    );
  }
}

if (violations.length) {
  console.error("[verify-option-schema-boundary] FAIL");
  for (const v of violations) console.error(`- ${v}`);
  process.exit(1);
}

console.log("[verify-option-schema-boundary] OK — option schema reads are behind one entry");
