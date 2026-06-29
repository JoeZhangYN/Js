// 整个配置面板的 HTML 模板渲染 + 事件绑定。
// 阶段 5 改成 option schema-driven。当前 chunk 2 仅做物理搬迁，行为不变。
// file-size-gate: exempt phase-3-monolith
import { gE, cE } from "../dom/query.js";
import { getValue } from "../state/storage.js";
import { g } from "../state/store.js";
import { _alert } from "../core/lang.js";
import { AlarmEvent, runAlarmAutomation } from "../alarm/alarm.js";
import { NavigationEvent, runNavigationAutomation } from "../core/navigate.js";
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
import { RiddleEvent, runRiddleAutomation } from "../pages/riddle-automation.js";
import {
  BattleMonitorEvent,
  runBattleMonitorAutomation,
} from "../monitor/battle-monitor-automation.js";
import { BattleRoundEvent, runBattleRoundAutomation } from "../battle/battle-round.js";
import { IdleArenaEvent, runIdleArenaAutomation } from "../arena/idle-arena.js";
import { QuickSiteEvent, runQuickSiteAutomation } from "../arena/quick-site.js";

/**
 * 从 option schema 渲染 "checkbox + number + 单位文本" 这类成对字段。
 * Phase 5 渐进迁入示例：新加的 pageRefresh / criticalBuff 等用此 helper 直接消费 schema，
 * 不再手写 template string。老字段仍走 inline template。
 * @param {string} checkboxKey
 * @param {string} numberKey
 * @param {{l0:string,l1:string,l2:string}} unit 单位/补充说明
 */
function renderCheckboxPlusNumber(checkboxKey, numberKey, unit) {
  const cb = runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: checkboxKey });
  const num = runOptionSchema({ type: OptionSchemaEvent.READ_FIELD, key: numberKey });
  if (!cb || !num) return "";
  const checkedAttr = cb.defaultOn ? " checked data-default-on" : "";
  return (
    `<div><input id="${cb.key}" type="checkbox"${checkedAttr}>` +
    `<label for="${cb.key}"><b><l0>${cb.label.l0}</l0><l1>${cb.label.l1}</l1><l2>${cb.label.l2}</l2></b></label>: ` +
    `<input class="hvAANumber" name="${num.key}" placeholder="${num.default}" type="text">` +
    `<l0>${unit.l0}</l0><l1>${unit.l1}</l1><l2>${unit.l2}</l2></div>`
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
    .map((value) => `<option value="${value}">${field.enumLabel?.[value] || value}</option>`)
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

function renderEquipmentSchemaFields() {
  return [
    `    ${renderSchemaLabel(readSchemaField("repairValue"))} ≤ ${renderSchemaNumberInput(
      "repairValue",
      "%"
    )}</div>`,
    renderCheckboxPlusNumber("repairBuyMaterials", "repairCreditCap", {
      l0: " 信用点单轮上限（缺料则联动物品商店买齐再修，超限停机告警；不勾=缺料即停机）",
      l1: " 信用點單輪上限（缺料則聯動物品商店買齊再修，超限停機告警；不勾=缺料即停機）",
      l2: " credits/run cap (auto-buy materials to repair; stop if over cap; unchecked = stop on shortage)",
    }),
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
    )}`,
  ];
}

function renderBurstGuardSchemaFields() {
  return [
    renderSchemaCheckboxField("burstControlSwitch", "<br>"),
    `${renderSchemaLabel(readSchemaField("burstControlHpFrac"))}: ${renderSchemaNumberInput(
      "burstControlHpFrac",
      "%"
    )} ${renderSchemaCheckboxField("burstControlSilenceForSpell").replace(
      /^<div>|<\/div>$/g,
      ""
    )}`,
  ];
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

function hasStoredOption() {
  return readOptionField("version", undefined) !== undefined;
}

function readSettingsInputValue(name, className) {
  const directValue = readOptionField(name, undefined);
  if (directValue !== undefined) return directValue;
  const path = name.split("_");
  if (path.length !== 2 || className === "hvAACustomize") return "";
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
    if (inputs[i].className === "hvAADebug") continue;
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
    type: QuickSiteEvent.RENDER_SETTINGS_TABLE_BODY,
    option: { quickSite: readOptionField("quickSite", undefined) },
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
    '  <span name="Channel"><input id="channelSkillSwitch" type="checkbox">Channel<l01>技能</l01><l2> Spells</l2></span>',
    '  <span name="Buff"><input id="buffSkillSwitch" type="checkbox">BUFF<l01>技能</l01><l2> Spells</l2></span>',
    '  <span name="Debuff"><input id="debuffSkillSwitch" type="checkbox">DEBUFF<l01>技能</l01><l2> Spells</l2></span>',
    '  <span name="Skill"><input id="skillSwitch" type="checkbox"><l01>其他技能</l01><l2>Skills</l2></span>',
    '  <span name="Scroll"><input id="scrollSwitch" type="checkbox"><l0>卷轴</l0><l1>捲軸</l1><l2>Scroll</l2></span>',
    '  <span name="Infusion"><input id="infusionSwitch" type="checkbox"><l0>魔药</l0><l1>魔藥</l1><l2>Infusion</l2></span>',
    '  <span name="Alarm"><l0>警报</l0><l1>警報</l1><l2>Alarm</l2></span>',
    '  <span name="Rule"><l0>攻击规则</l0><l1>攻擊規則</l1><l2>Attack Rule</l2></span>',
    '  <span name="Drop"><input id="dropMonitor" type="checkbox"><l0>掉落监测</l0><l1>掉落監測</l1><l2>Drops Tracking</l2></span>',
    '  <span name="Usage"><input id="recordUsage" type="checkbox"><l0>数据记录</l0><l1>數據記錄</l1><l2>Usage Tracking</l2></span>',
    '  <span name="Riddle"><l0>小马验证</l0><l1>小馬驗證</l1><l2>Riddle ML</l2></span>',
    '  <span name="About"><l0>关于本脚本</l0><l1>關於本腳本</l1><l2>About This</l2></span>',
    '  <span name="Feedback"><l01>反馈</l01><l2>Feedback</l2></span></div>',
    '<div class="hvAATab" id="hvAATab-Main">',
    '  <div class="hvAACenter" id="attackStatus" style="color:red;"><b>*<l0>攻击模式</l0><l1>攻擊模式</l1><l2>Attack Mode</l2></b>:',
    '    <select class="hvAANumber" name="attackStatus"><option value="-1"></option><option value="0">物理 / Physical</option><option value="1">火 / Fire</option><option value="2">冰 / Cold</option><option value="3">雷 / Elec</option><option value="4">风 / Wind</option><option value="5">圣 / Divine</option><option value="6">暗 / Forbidden</option></select></div>',
    "  <div><b><l0>暂停相关</l0><l1>暫停相關</l1><l2>Pause with</l2></b>: ",
    '    <input id="pauseButton" type="checkbox"><label for="pauseButton"><l0>使用按钮</l0><l1>使用按鈕</l1><l2>Button</l2></label>; ',
    '    <input id="pauseHotkey" type="checkbox"><label for="pauseHotkey"><l0>使用热键</l0><l1>使用熱鍵</l1><l2>Hotkey</l2>: <input name="pauseHotkeyStr" style="width:30px;" type="text"><input name="pauseHotkeyKey" type="hidden" disabled="true"></label></div>',
    "  <div><b><l0>警告相关</l0><l1>警告相關</l1><l2>To Warn</l2></b>: ",
    '    <input id="alert" type="checkbox"><label for="alert"><l0>音频警报</l0><l1>音頻警報</l1><l2>Audio Alarms</l2></label>; ',
    '    <input id="notification" type="checkbox"><label for="notification"><l0>桌面通知</l0><l1>桌面通知</l1><l2>Notifications</l2></label> ',
    '    <button class="testNotification"><l0>预处理</l0><l1>預處理</l1><l2>Pretreat</l2></button></div>',
    "  <div><b><l01>内置插件</l01><l2>Built-in Plugin</l2></b>: ",
    '    <input id="riddleRadio" type="checkbox"><label for="riddleRadio">RiddleLimiter Plus</label>; ',
    '    <input id="encounter" type="checkbox"><label for="encounter"><l0>自动遭遇战</l0><l1>自動遭遇戰</l1><l2>Auto Encounter</l2></label></div>',
    '  <div><b><l01>魔法技能</l01><l2>Offensive Magic</l2></b>: → <a class="hvAAGoto" name="hvAATab-Spell"><l0>法术攻击</l0><l1>法術攻擊</l1><l2>Spell</l2></a></div>',
    "  </div>",
    // === Heal 治疗药品 tab（Gem 阈值 + 动态阈值/拖战 + 关键 buff 保护，原 Main 拆出）===
    '<div class="hvAATab" id="hvAATab-Heal">',
    '  <div class="hvAACenter">',
    '    Gem: Health.<input class="hvAANumber" name="hp1" placeholder="50" type="text">%',
    '    Mana.<input class="hvAANumber" name="mp1" placeholder="70" type="text">%%',
    '    Spirt.<input class="hvAANumber" name="sp1" placeholder="75" type="text">%</div>',
    '  <div style="border:1px dashed #888;padding:3px;font-size:12px;"><b><l0>动态阈值（PoC）</l0><l1>動態閾值（PoC）</l1><l2>Dynamic Threshold (PoC)</l2></b>:',
    '    <input id="dynamicHealThreshold" type="checkbox"><label for="dynamicHealThreshold"><l0>智能 Health Gem 阈值（按敌方 DPS + 剩余回合估算危险线）</l0><l1>智能 Health Gem 閾值</l1><l2>Smart Health Gem threshold (DPS-based)</l2></label><br>',
    '    <l0>玩家最大 HP</l0><l1>玩家最大 HP</l1><l2>Player max HP</l2>: <input class="hvAANumber" name="playerMaxHp" placeholder="17000" type="text">; ',
    '    <l0>安全系数</l0><l1>安全係數</l1><l2>Safety pad</l2>: <input class="hvAANumber" name="dynamicHealSafetyPad" placeholder="1.3" type="text"><br>',
    '    <input id="autoTune" type="checkbox"><label for="autoTune"><l0>自学 safetyPad（每 5 场战斗自动调节，覆盖上方静态值）</l0><l1>自學 safetyPad（每 5 場戰鬥自動調節）</l1><l2>Auto-tune safetyPad (online learning, overrides static value)</l2></label><br>',
    '    <input id="noWastePotion" type="checkbox" checked data-default-on><label for="noWastePotion"><l0>药品防溢出：deficit 不够大时跳过该瓶</l0><l1>藥品防溢出</l1><l2>No-waste potion: skip if deficit too small</l2></label> (容差 <input class="hvAANumber" name="potionWasteTolerance" placeholder="0.7" type="text">)<br>',
    '    <input id="stallMode" type="checkbox" checked data-default-on><label for="stallMode"><l0>拖战策略：仅剩 1 怪+后续轮还有时主动喝 MP/SP pot 拉满下轮开局，同时跳 useDeSkill</l0><l1>拖戰策略</l1><l2>Stall mode: when 1 alive + more rounds, drink MP/SP pots to top up</l2></label><br>',
    '    <input id="stallFocus" type="checkbox" checked data-default-on><label for="stallFocus"><l0>拖战时 OC 高优先 Focus 换 Channeling（mana regen）</l0><l1>拖戰時 Focus 換 Channeling</l1><l2>Stall: prefer Focus when OC high (Channeling for MP regen)</l2></label> (OC≥<input class="hvAANumber" name="stallFocusOcThreshold" placeholder="60" type="text">, MP&lt;<input class="hvAANumber" name="stallFocusMpMax" placeholder="80" type="text">%)<br>',
    '    <l0>拖战 Draught 阈值</l0><l1>拖戰 Draught 閾值</l1><l2>Stall Draught threshold</l2>: MP&lt;<input class="hvAANumber" name="stallTopupMpFloor" placeholder="70" type="text">%, SP&lt;<input class="hvAANumber" name="stallTopupSpFloor" placeholder="70" type="text">%<br>',
    '    <input id="stallTurnOffSpirit" type="checkbox" checked data-default-on><label for="stallTurnOffSpirit"><l0>拖战时关闭 Spirit Stance（避免与 Focus 双向耗 OC）</l0><l1>拖戰時關閉 Spirit Stance</l1><l2>Stall: turn off Spirit Stance (avoid double OC drain with Focus)</l2></label>',
    "  </div>",
    ...renderCriticalBuffSchemaFields(),
    "  </div>",
    // === Tactics 战术姿态 tab（Spirit Stance / Defend / Focus / Ether Tap / 逃跑 / 暂停，原 Main 拆出）===
    '<div class="hvAATab" id="hvAATab-Tactics">',
    '  <div><input id="turnOnSS" type="checkbox"><label for="turnOnSS"><b><l0>开启</l0><l1>開啟</l1><l2>Turn on </l2>Spirit Stance</b></label>: {{turnOnSSCondition}}</div>',
    '  <div><input id="turnOffSS" type="checkbox"><label for="turnOffSS"><b><l0>关闭</l0><l1>關閉</l1><l2>Turn off </l2>Spirit Stance</b></label>: {{turnOffSSCondition}}</div>',
    '  <div><input id="preCastSS" type="checkbox"><label for="preCastSS"><b><l0>释放Buff/Debuff前开启Spirit Stance</l0><l1>釋放Buff/Debuff前開啟Spirit Stance</l1><l2>Activate Spirit Stance before Buff/Debuff</l2></b></label>: {{preCastSSCondition}}</div>',
    '  <div><input id="defend" type="checkbox"><label for="defend"><b>Defend</b></label>: {{defendCondition}}</div>',
    '  <div><input id="focus" type="checkbox"><label for="focus"><b>Focus</b></label>: {{focusCondition}}</div>',
    '  <div><input id="etherTap" type="checkbox"><label for="etherTap"><b>Ether Tap</b></label>: {{etherTapCondition}}</div>',
    '  <div><input id="autoFlee" type="checkbox"><label for="autoFlee"><b><l0>自动逃跑</l0><l1>自動逃跑</l1><l2>Flee</l2></b></label>: {{fleeCondition}}</div>',
    '  <div><div class="hvAANew"></div><input id="autoPause" type="checkbox"><label for="autoPause"><b><l0>自动暂停</l0><l1>自動暫停</l1><l2>Pause</l2></b></label>: {{pauseCondition}}</div>',
    "  </div>",
    // === Arena 竞技场/体力 tab（Stamina 损失处理 + 闲置竞技场 + 战前回复，原 Main 拆出）===
    '<div class="hvAATab" id="hvAATab-Arena">',
    '  <div><b>Stamina</b>: <l0>当损失</l0><l1>當損失</l1><l2>If it lost </l2>Stamina ≥ <input class="hvAANumber" name="staminaLose" placeholder="5" type="text">: ',
    '    <input id="staminaPause" type="checkbox"><label for="staminaPause"><l0>脚本暂停</l0><l1>腳本暫停</l1><l2>pause script</l2></label>; ',
    '    <input id="staminaWarn" type="checkbox"><label for="staminaWarn"><l01>警告</l01><l2>warn</l2></label>; ',
    '    <input id="staminaFlee" type="checkbox"><label for="staminaFlee"><l01>逃跑</l01><l2>flee</l2></label>',
    '    <button class="staminaLostLog"><l0>stamina损失日志</l0><l1>stamina損失日誌</l1><l2>staminaLostLog</l2></button></div>',
    '  <div><input id="idleArena" type="checkbox"><label for="idleArena"><b><l0>闲置竞技场</l0><l1>閒置競技場</l1><l2>Idle Arena</l2></b>: ',
    '    <l0>在任意页面停留</l0><l1>在任意頁面停留</l1><l2>Idle in any page for </l2><input class="hvAANumber" name="idleArenaTime" type="text"><l0>秒后，开始竞技场</l0><l1>秒後，開始競技場</l1><l2>s, start Arena</l2></label> <button class="idleArenaReset"><l01>重置</l01><l2>Reset</l2></button>;<br>',
    "    <l0>进行的竞技场相对应等级</l0><l1>進行的競技場相對應等級</l1><l2>The levels of the Arena you want to complete</l2>:  ",
    '      <button class="hvAAShowLevels"><l0>显示更多</l0><l1>顯示更多</l1><l2>Show more</l2></button><button class="hvAALevelsClear"><l01>清空</l01><l2>Clear</l2></button><br>',
    '      <input name="idleArenaLevels" style="width:98%;" type="text" disabled="true"><input name="idleArenaValue" style="width:98%;" type="hidden" disabled="true">',
    '      <div class="hvAAArenaLevels">',
    '        <input id="arLevel_1" value="1,1" type="checkbox"><label for="arLevel_1">1</label> <input id="arLevel_10" value="10,3" type="checkbox"><label for="arLevel_10">10</label> <input id="arLevel_20" value="20,5" type="checkbox"><label for="arLevel_20">20</label> <input id="arLevel_30" value="30,8" type="checkbox"><label for="arLevel_30">30</label> <input id="arLevel_40" value="40,9" type="checkbox"><label for="arLevel_40">40</label> <input id="arLevel_50" value="50,11" type="checkbox"><label for="arLevel_50">50</label> <input id="arLevel_60" value="60,12" type="checkbox"><label for="arLevel_60">60</label> <input id="arLevel_70" value="70,13" type="checkbox"><label for="arLevel_70">70</label> <input id="arLevel_80" value="80,15" type="checkbox"><label for="arLevel_80">80</label> <input id="arLevel_90" value="90,16" type="checkbox"><label for="arLevel_90">90</label> <input id="arLevel_100" value="100,17" type="checkbox"><label for="arLevel_100">100</label> <input id="arLevel_110" value="110,19" type="checkbox"><label for="arLevel_110">110</label><br>',
    '        <input id="arLevel_120" value="120,20" type="checkbox"><label for="arLevel_120">120</label> <input id="arLevel_130" value="130,21" type="checkbox"><label for="arLevel_130">130</label> <input id="arLevel_140" value="140,23" type="checkbox"><label for="arLevel_140">140</label> <input id="arLevel_150" value="150,24" type="checkbox"><label for="arLevel_150">150</label> <input id="arLevel_165" value="165,26" type="checkbox"><label for="arLevel_165">165</label> <input id="arLevel_180" value="180,27" type="checkbox"><label for="arLevel_180">180</label> <input id="arLevel_200" value="200,28" type="checkbox"><label for="arLevel_200">200</label> <input id="arLevel_225" value="225,29" type="checkbox"><label for="arLevel_225">225</label> <input id="arLevel_250" value="250,32" type="checkbox"><label for="arLevel_250">250</label> <input id="arLevel_300" value="300,33" type="checkbox"><label for="arLevel_300">300</label> <input id="arLevel_400" value="400,34" type="checkbox"><label for="arLevel_400">400</label> <input id="arLevel_500" value="500,35" type="checkbox"><label for="arLevel_500">500</label><br>',
    '        <input id="arLevel_RB50" value="RB50,105" type="checkbox"><label for="arLevel_RB50">RB50</label> <input id="arLevel_RB75A" value="RB75A,106" type="checkbox"><label for="arLevel_RB75A">RB75A</label> <input id="arLevel_RB75B" value="RB75B,107" type="checkbox"><label for="arLevel_RB75B">RB75B</label> <input id="arLevel_RB75C" value="RB75C,108" type="checkbox"><label for="arLevel_RB75C">RB75C</label><br>',
    '        <input id="arLevel_RB100" value="RB100,109" type="checkbox"><label for="arLevel_RB100">RB100</label> <input id="arLevel_RB150" value="RB150,110" type="checkbox"><label for="arLevel_RB150">RB150</label> <input id="arLevel_RB200" value="RB200,111" type="checkbox"><label for="arLevel_RB200">RB200</label> <input id="arLevel_RB250" value="RB250,112" type="checkbox"><label for="arLevel_RB250">RB250</label> <input id="arLevel_GF" value="GF,gr" type="checkbox"><label for="arLevel_GF">GrindFest <input class="hvAANumber" name="idleArenaGrTime" placeholder="1" type="text"></label></div></div>',
    '  <div><input id="restoreStamina" type="checkbox"><label for="restoreStamina"><b><l0>战前回复</l0><l1>戰前回复</l1><l2>Restore stamina</l2></b>: ',
    '    <l0>战斗前，如果</l0><l1>戰鬥前，如果</l1><l2><b></b>if before a battle and </l2>Stamina ≤ <input class="hvAANumber" name="staminaLow" placeholder="30" type="text"></label><br>',
    "    <l0>说明: 如果不勾选，当Stamina小于此值后，则不进行闲置竞技场</l0><l1>說明: 如果不勾選，當Stamina小於此值後，則不進行閒置競技場</l1><l2>Note: If unchecked, when Stamina is less than this value, no Idle Arena</l2></div>",
    "  </div>",
    // === Equipment 装备维护 tab（修复装备 + 缺料买料 + 强化价格 + 装备百分位，原 Main 拆出）===
    '<div class="hvAATab" id="hvAATab-Equipment">',
    '  <div><input id="repair" type="checkbox"><label for="repair"><b><l0>修复装备</l0><l1>修復裝備</l1><l2>Repair Equipment</l2></b></label>: ',
    ...renderEquipmentSchemaFields(),
    "  </div>",
    // === System 系统/页面 tab（页面停留 alert/reload + 定时刷新 + 记录每场 + 延迟，原 Main 拆出）===
    '<div class="hvAATab" id="hvAATab-System">',
    "  <div><l2>If the page </l2><b><l0>页面停留</l0><l1>頁面停留</l1><l2>stays idle</l2></b><l2> for </l2>: ",
    '    <input id="delayAlert" type="checkbox"><label for="delayAlert"><input class="hvAANumber" name="delayAlertTime" type="text"><l0>秒，警报</l0><l1>秒，警報</l1><l2>s, alarm</l2></label>; ',
    '    <input id="delayReload" type="checkbox"><label for="delayReload"><input class="hvAANumber" name="delayReloadTime" type="text"><l0>秒，刷新页面</l0><l1>秒，刷新頁面</l1><l2>s, reload page</l2></label></div>',
    renderCheckboxPlusNumber("pageRefresh", "pageRefreshMinutes", {
      l0: "分钟（防移动端长时间挂机卡死，无条件绝对时钟）",
      l1: "分鐘（防移動端長時間掛機卡死，無條件絕對時鐘）",
      l2: " min (mobile anti-hang absolute clock, unconditional)",
    }),
    '  <div><input id="recordEach" type="checkbox"><label for="recordEach"><b><l0>单独记录每场战役</l0><l1>單獨記錄每場戰役</l1><l2>Record each battle separately</l2></b></label></div>',
    '  <div><b><l0>延迟</l0><l1>延遲</l1><l2>Delay</l2></b>: 1. <l0>其他/Buff/Debuff技能</l0><l1>其他/Buff/Debuff技能</l1><l2>Skills&BUFF/DEBUFF Spells</l2>: <input class="hvAANumber" name="delay" placeholder="200" type="text">ms 2. <l01>其他</l01><l2>Other</l2>: <input class="hvAANumber" name="delay2" placeholder="30" type="text">ms<br>',
    "    <l0>说明: 单位毫秒，且在设定值基础上取其的50%-150%进行延迟，0表示不延迟</l0><l1>說明: 單位毫秒，且在設定值基礎上取其的50%-150%進行延遲，0表示不延遲</l1><l2>Note: unit milliseconds, and based on the set value multiply 50% -150% to delay, 0 means no delay</l2>",
    "    </div>",
    "  </div>",
    '<div class="hvAATab" id="hvAATab-Spell">',
    '  <div><l0>当<a class="hvAAGoto" name="hvAATab-Main"><b>攻击模式</b></a>为法术时生效</l0><l1>當<a class="hvAAGoto" name="hvAATab-Main"><b>攻擊模式</b></a>為法術時生效</l1><l2>Active when <a class="hvAAGoto" name="hvAATab-Main"><b>Attack Mode</b></a> is set to a spell element</l2></div>',
    "  <div><b><l0>高阶技能使用条件</l0><l1>高階技能使用條件</l1><l2>Conditions for 3rd Tier</l2></b>: {{highSkillCondition}}</div>",
    "  <div><b><l0>中阶技能使用条件</l0><l1>中階技能使用條件</l1><l2>Conditions for 2nd Tier</l2></b>: {{middleSkillCondition}}</div>",
    "  <div><l0>T1: 无条件限制，始终可用</l0><l1>T1: 無條件限制，始終可用</l1><l2>T1: No condition, always available</l2></div>",
    '  <div><input id="channelForceHighTier" type="checkbox" checked data-default-on>',
    '    <label for="channelForceHighTier"><b>Channeling <l0>强制最高阶</l0><l1>強制最高階</l1><l2>Force Highest Tier</l2></b></label>:',
    "    <l0>Channeling 时 (150% 伤害, 1 MP) 跳过条件检查，使用最高可用阶法术</l0><l1>Channeling 時 (150% 傷害, 1 MP) 跳過條件檢查，使用最高可用階法術</l1><l2>During Channeling (150% dmg, 1 MP), skip condition checks and use highest available tier</l2></div>",
    '  <div><input id="spellTierDowngrade" type="checkbox" checked data-default-on>',
    '    <label for="spellTierDowngrade"><b><l0>少怪降级</l0><l1>少怪降級</l1><l2>Few Monsters Downgrade</l2></b></label>:',
    '    <l0>存活怪物</l0><l1>存活怪物</l1><l2>Alive monsters</l2> ≤ <input class="hvAANumber" name="spellDowngradeThreshold" placeholder="3" type="text">',
    "    <l0>时仅用 T1 节省 MP (Channeling 时不降级)</l0><l1>時僅用 T1 節省 MP (Channeling 時不降級)</l1><l2>: use T1 only to save MP (does not apply during Channeling)</l2></div>",
    "  <div><b>AoE</b>:",
    '    <l0>访问</l0><l1>訪問</l1><l2>Visit</l2> <a href="?s=Character&ss=ab" target="_blank"><l0>技能页面</l0><l1>技能頁面</l1><l2>Ability Page</l2></a>',
    "    <l0>自动检测法术 AoE 目标数</l0><l1>自動檢測法術 AoE 目標數</l1><l2>to auto-detect spell AoE target counts</l2></div></div>",
    '<div class="hvAATab" id="hvAATab-Item">',
    '  <div class="itemOrder"><l0>施放顺序</l0><l1>施放順序</l1><l2>Cast Order</l2>: <input name="itemOrderName" style="width:80%;" type="text" disabled="true"><input name="itemOrderValue" style="width:80%;" type="hidden" disabled="true"><br>',
    '    <input id="itemOrder_Cure" value="Cure,311" type="checkbox"><label for="itemOrder_Cure">Cure</label><input id="itemOrder_FC" value="FC,313" type="checkbox"><label for="itemOrder_FC">Full-Cure</label><input id="itemOrder_HP" value="HP,11195" type="checkbox"><label for="itemOrder_HP">Health Potion</label><input id="itemOrder_HE" value="HE,11199" type="checkbox"><label for="itemOrder_HE">Health Elixir</label><input id="itemOrder_MP" value="MP,11295" type="checkbox"><label for="itemOrder_MP">Mana Potion</label><br>',
    '    <input id="itemOrder_ME" value="ME,11299" type="checkbox"><label for="itemOrder_ME">Mana Elixir</label><input id="itemOrder_SP" value="SP,11395" type="checkbox"><label for="itemOrder_SP">Spirit Potion</label><input id="itemOrder_SE" value="SE,11399" type="checkbox"><label for="itemOrder_SE">Spirit Elixir</label><input id="itemOrder_LE" value="LE,11501" type="checkbox"><label for="itemOrder_LE">Last Elixir</label><input id="itemOrder_ED" value="ED,11401" type="checkbox"><label for="itemOrder_ED">Energy Drink</label></div>',
    '  <div><input id="item_Cure" type="checkbox"><label for="item_Cure"><b>Cure</b></label>: {{itemCureCondition}}</div>',
    '  <div><input id="item_FC" type="checkbox"><label for="item_FC"><b>Full-Cure</b></label>: {{itemFCCondition}}</div>',
    '  <div><input id="item_HP" type="checkbox"><label for="item_HP"><b>Health Potion</b></label>: {{itemHPCondition}}</div>',
    '  <div><input id="item_HE" type="checkbox"><label for="item_HE"><b>Health Elixir</b></label>: {{itemHECondition}}</div>',
    '  <div><input id="item_MP" type="checkbox"><label for="item_MP"><b>Mana Potion</b></label>: {{itemMPCondition}}</div>',
    '  <div><input id="item_ME" type="checkbox"><label for="item_ME"><b>Mana Elixir</b></label>: {{itemMECondition}}</div>',
    '  <div><input id="item_SP" type="checkbox"><label for="item_SP"><b>Spirit Potion</b></label>: {{itemSPCondition}}</div>',
    '  <div><input id="item_SE" type="checkbox"><label for="item_SE"><b>Spirit Elixir</b></label>: {{itemSECondition}}</div>',
    '  <div><input id="item_LE" type="checkbox"><label for="item_LE"><b>Last Elixir</b></label>: {{itemLECondition}}</div>',
    '  <div><input id="item_ED" type="checkbox"><label for="item_ED"><b>Energy Drink</b></label>: {{itemEDCondition}}</div></div>',
    '<div class="hvAATab" id="hvAATab-Channel">',
    "  <l0><b>获得Channel时</b>（此时1点MP施法与150%伤害）</l0><l1><b>獲得Channel時</b>（此時1點MP施法與150%傷害）</l1><l2><b>During Channeling effect</b> (1 mp spell cost and 150% spell damage)</l2>:",
    "  <div><b><l0>先施放Channel技能</l0><l1>先施放Channel技能</l1><l2>First cast</l2></b>: <br>",
    '    <l0>注意: 此处的施放顺序与</l0><l1>注意: 此處的施放順序与</l1><l2>Note: The cast order here is the same as in</l2><a class="hvAAGoto" name="hvAATab-Buff">BUFF<l01>技能</l01><l2> Spells</l2></a><l0>里的相同</l0><l1>裡的相同</l1><br>',
    '    <input id="channelSkill_Pr" type="checkbox"><label for="channelSkill_Pr">Protection</label><input id="channelSkill_SL" type="checkbox"><label for="channelSkill_SL">Spark of Life</label><input id="channelSkill_SS" type="checkbox"><label for="channelSkill_SS">Spirit Shield</label><input id="channelSkill_Ha" type="checkbox"><label for="channelSkill_Ha">Haste</label><br>',
    '    <input id="channelSkill_AF" type="checkbox"><label for="channelSkill_AF">Arcane Focus</label><input id="channelSkill_He" type="checkbox"><label for="channelSkill_He">Heartseeker</label><input id="channelSkill_Re" type="checkbox"><label for="channelSkill_Re">Regen</label><input id="channelSkill_SV" type="checkbox"><label for="channelSkill_SV">Shadow Veil</label><input id="channelSkill_Ab" type="checkbox"><label for="channelSkill_Ab">Absorb</label></div>',
    '  <div><input id="channelSkill2" type="checkbox"><label for="channelSkill2"><l0><b>再使用技能</b></label>: ',
    '    <div class="channelSkill2Order"><l0>施放顺序</l0><l1>施放順序</l1><l2>Cast Order</l2>: <input name="channelSkill2OrderName" style="width:80%;" type="text" disabled="true"><input name="channelSkill2OrderValue" style="width:80%;" type="hidden" disabled="true"><br>',
    '    <input id="channelSkill2Order_Cu" value="Cu,311" type="checkbox"><label for="channelSkill2Order_Cu">Cure</label><input id="channelSkill2Order_FC" value="FC,313" type="checkbox"><label for="channelSkill2Order_FC">Full-Cure</label><input id="channelSkill2Order_Pr" value="Pr,411" type="checkbox"><label for="channelSkill2Order_Pr">Protection</label><input id="channelSkill2Order_SL" value="SL,422" type="checkbox"><label for="channelSkill2Order_SL">Spark of Life</label><input id="channelSkill2Order_SS" value="SS,423" type="checkbox"><label for="channelSkill2Order_SS">Spirit Shield</label><input id="channelSkill2Order_Ha" value="Ha,412" type="checkbox"><label for="channelSkill2Order_Ha">Haste</label><br>',
    '    <input id="channelSkill2Order_AF" value="AF,432" type="checkbox"><label for="channelSkill2Order_AF">Arcane Focus</label><input id="channelSkill2Order_He" value="He,431" type="checkbox"><label for="channelSkill2Order_He">Heartseeker</label><input id="channelSkill2Order_Re" value="Re,312" type="checkbox"><label for="channelSkill2Order_Re">Regen</label><input id="channelSkill2Order_SV" value="SV,413" type="checkbox"><label for="channelSkill2Order_SV">Shadow Veil</label><input id="channelSkill2Order_Ab" value="Ab,421" type="checkbox"><label for="channelSkill2Order_Ab">Absorb</label></div></div>',
    "  <div><l0><b>最后ReBuff</b>: 重新施放最先消失的Buff</l0><l1><b>最後ReBuff</b>: 重新施放最先消失的Buff</l1><l2><b>At last, re-cast the spells which will expire first</b></l2>.</div></div>",
    '<div class="hvAATab" id="hvAATab-Buff">{{buffSkillCondition}}',
    '  <div class="buffSkillOrder"><l0>施放顺序</l0><l1>施放順序</l1><l2>Cast Order</l2>: ',
    '    <input name="buffSkillOrderValue" style="width:80%;" type="text" disabled="true"><br>',
    '    <input id="buffSkillOrder_Pr" type="checkbox"><label for="buffSkillOrder_Pr">Protection</label><input id="buffSkillOrder_SL" type="checkbox"><label for="buffSkillOrder_SL">Spark of Life</label><input id="buffSkillOrder_SS" type="checkbox"><label for="buffSkillOrder_SS">Spirit Shield</label><input id="buffSkillOrder_Ha" type="checkbox"><label for="buffSkillOrder_Ha">Haste</label><br>',
    '    <input id="buffSkillOrder_AF" type="checkbox"><label for="buffSkillOrder_AF">Arcane Focus</label><input id="buffSkillOrder_He" type="checkbox"><label for="buffSkillOrder_He">Heartseeker</label><input id="buffSkillOrder_Re" type="checkbox"><label for="buffSkillOrder_Re">Regen</label><input id="buffSkillOrder_SV" type="checkbox"><label for="buffSkillOrder_SV">Shadow Veil</label><input id="buffSkillOrder_Ab" type="checkbox"><label for="buffSkillOrder_Ab">Absorb</label></div>',
    "  <div><l0>Buff不存在就施放的技能</l0><l1>Buff不存在就施放的技能</l1><l2>Cast spells if the buff is not present</l2>: ",
    '    <div><input id="buffSkill_HD" type="checkbox"><label for="buffSkill_HD">Health Draught</label>{{buffSkillHDCondition}}</div>',
    '    <div><input id="buffSkill_MD" type="checkbox"><label for="buffSkill_MD">Mana Draught</label>{{buffSkillMDCondition}}</div>',
    '    <div><input id="buffSkill_SD" type="checkbox"><label for="buffSkill_SD">Spirit Draught</label>{{buffSkillSDCondition}}</div>',
    '    <div><input id="buffSkill_FV" type="checkbox"><label for="buffSkill_FV">Flower Vase</label>{{buffSkillFVCondition}}</div>',
    '    <div><input id="buffSkill_BG" type="checkbox"><label for="buffSkill_BG">Bubble-Gum</label>{{buffSkillBGCondition}}</div>',
    '    <div><input id="buffSkill_Pr" type="checkbox"><label for="buffSkill_Pr">Protection</label>{{buffSkillPrCondition}}</div>',
    '    <div><input id="buffSkill_SL" type="checkbox"><label for="buffSkill_SL">Spark of Life</label>{{buffSkillSLCondition}}</div>',
    '    <div><input id="buffSkill_SS" type="checkbox"><label for="buffSkill_SS">Spirit Shield</label>{{buffSkillSSCondition}}</div>',
    '    <div><input id="buffSkill_Ha" type="checkbox"><label for="buffSkill_Ha">Haste</label>{{buffSkillHaCondition}}</div>',
    '    <div><input id="buffSkill_AF" type="checkbox"><label for="buffSkill_AF">Arcane Focus</label>{{buffSkillAFCondition}}</div>',
    '    <div><input id="buffSkill_He" type="checkbox"><label for="buffSkill_He">Heartseeker</label>{{buffSkillHeCondition}}</div>',
    '    <div><input id="buffSkill_Re" type="checkbox"><label for="buffSkill_Re">Regen</label>{{buffSkillReCondition}}</div>',
    '    <div><input id="buffSkill_SV" type="checkbox"><label for="buffSkill_SV">Shadow Veil</label>{{buffSkillSVCondition}}</div>',
    '    <div><input id="buffSkill_Ab" type="checkbox"><label for="buffSkill_Ab">Absorb</label>{{buffSkillAbCondition}}</div></div></div>',
    '<div class="hvAATab" id="hvAATab-Debuff">',
    '  <div class="debuffSkillOrder"><l0>施放顺序</l0><l1>施放順序</l1><l2>Cast Order</l2>:',
    '    <input name="debuffSkillOrderValue" style="width:80%;" type="text" disabled="true"><br>',
    '    <input id="debuffSkillOrder_Sle" type="checkbox"><label for="debuffSkillOrder_Sle">Sleep</label><input id="debuffSkillOrder_Bl" type="checkbox"><label for="debuffSkillOrder_Bl">Blind</label><input id="debuffSkillOrder_Slo" type="checkbox"><label for="debuffSkillOrder_Slo">Slow</label><br>',
    '    <input id="debuffSkillOrder_Im" type="checkbox"><label for="debuffSkillOrder_Im">Imperil</label><input id="debuffSkillOrder_MN" type="checkbox"><label for="debuffSkillOrder_MN">MagNet</label><input id="debuffSkillOrder_Si" type="checkbox"><label for="debuffSkillOrder_Si">Silence</label><input id="debuffSkillOrder_Dr" type="checkbox"><label for="debuffSkillOrder_Dr">Drain</label><input id="debuffSkillOrder_We" type="checkbox"><label for="debuffSkillOrder_We">Weaken</label><input id="debuffSkillOrder_Co" type="checkbox"><label for="debuffSkillOrder_Co">Confuse</label></div>',
    '  <div><l01>特殊</l01><l2>Special</l2><input id="debuffSkillAllIm" type="checkbox"><label for="debuffSkillAllIm"><l0>给所有敌人上Imperil</l0><l1>給所有敵人上Imperil</l1><l2>Imperiled all enemies.</l2></label></div>{{debuffSkillImpCondition}}',
    '  <div><l01>特殊</l01><l2>Special</l2><input id="debuffSkillAllWk" type="checkbox"><label for="debuffSkillAllWk"><l0>给所有敌人上Weaken</l0><l1>給所有敵人上Weaken</l1><l2>Weakened all enemies.</l2></label></div>{{debuffSkillWkCondition}}',
    '  <div style="border:1px dashed #888;padding:3px;"><b><l0>OFC/FRD 智能跳过</l0><l1>OFC/FRD 智能跳過</l1><l2>OFC/FRD Smart Skip</l2></b><br>',
    ...renderDebuffSmartSkipSchemaFields(),
    "  </div>",
    '  <div style="border:1px dashed #888;padding:3px;"><b><l0>爆发防护（实验，默认关）</l0><l1>爆發防護（實驗，默認關）</l1><l2>Burst Guard (Exp, off)</l2></b><br>',
    ...renderBurstGuardSchemaFields(),
    "  </div>",
    '    <div><input id="debuffSkill_Sle" type="checkbox"><label for="debuffSkill_Sle">Sleep</label>{{debuffSkillSleCondition}}</div>',
    '    <div><input id="debuffSkill_Bl" type="checkbox"><label for="debuffSkill_Bl">Blind</label>{{debuffSkillBlCondition}}</div>',
    '    <div><input id="debuffSkill_Slo" type="checkbox"><label for="debuffSkill_Slo">Slow</label>{{debuffSkillSloCondition}}</div>',
    '    <div><input id="debuffSkill_Im" type="checkbox"><label for="debuffSkill_Im">Imperil</label>{{debuffSkillImCondition}}</div>',
    '    <div><input id="debuffSkill_MN" type="checkbox"><label for="debuffSkill_MN">MagNet</label>{{debuffSkillMNCondition}}</div>',
    '    <div><input id="debuffSkill_Si" type="checkbox"><label for="debuffSkill_Si">Silence</label>{{debuffSkillSiCondition}}</div>',
    '    <div><input id="debuffSkill_Dr" type="checkbox"><label for="debuffSkill_Dr">Drain</label>{{debuffSkillDrCondition}}</div>',
    renderSchemaCheckboxField("drainTargetMaxHp", "", { bold: false, style: "padding-left:1.5em;" }),
    '    <div><input id="debuffSkill_We" type="checkbox"><label for="debuffSkill_We">Weaken</label>{{debuffSkillWeCondition}}</div>',
    '    <div><input id="debuffSkill_Co" type="checkbox"><label for="debuffSkill_Co">Confuse</label>{{debuffSkillCoCondition}}</div>',
    "  <div>AoE: <l0>当前技能等级下影响的目标数(1=单体, 3=范围)</l0><l1>當前技能等級下影響的目標數(1=單體, 3=範圍)</l1><l2>Targets affected at current skill level (1=single, 3=AoE)</l2><br>",
    '    Sleep: <input class="hvAANumber" name="debuffSkillAoe_Sle" placeholder="1" type="text"> Blind: <input class="hvAANumber" name="debuffSkillAoe_Bl" placeholder="1" type="text"> Slow: <input class="hvAANumber" name="debuffSkillAoe_Slo" placeholder="1" type="text"><br>',
    '    Imperil: <input class="hvAANumber" name="debuffSkillAoe_Im" placeholder="1" type="text"> MagNet: <input class="hvAANumber" name="debuffSkillAoe_MN" placeholder="1" type="text"> Silence: <input class="hvAANumber" name="debuffSkillAoe_Si" placeholder="1" type="text"><br>',
    '    Drain: <input class="hvAANumber" name="debuffSkillAoe_Dr" placeholder="1" type="text"> Weaken: <input class="hvAANumber" name="debuffSkillAoe_We" placeholder="1" type="text"> Confuse: <input class="hvAANumber" name="debuffSkillAoe_Co" placeholder="1" type="text"> </div>',
    '  <div><l0>持续</l0><l1>持續</l1><l2>Expire</l2> Turns: <input id="debuffSkillTurnAlert" type="checkbox"><label for="debuffSkillTurnAlert"><l0>无法正常施放DEBUFF技能时，警报</l0><l1>無法正常施放DEBUFF技能時，警報</l1><l2>If it can not cast de-skills normally, alert.</l2></label><br>',
    '    Sleep: <input class="hvAANumber" name="debuffSkillTurn_Sle" type="text"> Blind: <input class="hvAANumber" name="debuffSkillTurn_Bl" type="text"> Slow: <input class="hvAANumber" name="debuffSkillTurn_Slo" type="text"><br>',
    '    Imperil: <input class="hvAANumber" name="debuffSkillTurn_Im" type="text"> MagNet: <input class="hvAANumber" name="debuffSkillTurn_MN" type="text"> Silence: <input class="hvAANumber" name="debuffSkillTurn_Si" type="text"><br>',
    '    Drain: <input class="hvAANumber" name="debuffSkillTurn_Dr" type="text"> Weaken: <input class="hvAANumber" name="debuffSkillTurn_We" type="text"> Confuse: <input class="hvAANumber" name="debuffSkillTurn_Co" type="text"> </div></div>',
    '<div class="hvAATab" id="hvAATab-Skill">',
    '  <div><span><l0>注意: 默认在Spirit状态下使用，请在<a class="hvAAGoto" name="hvAATab-Main">主要选项</a>勾选并设置<b>开启/关闭Spirit Stance</b></l0><l1>注意: 默認在Spirit狀態下使用，請在<a class="hvAAGoto" name="hvAATab-Main">主要選項</a>勾選並設置<b>開啟/關閉Spirit Stance</b></l1><l2>Note: use under Spirit by default, please check and set the <b>Turn on/off Spirit Stance</b> in <a class="hvAAGoto" name="hvAATab-Main">Main</a></l2></span></div>',
    '  <div class="skillOrder"><l0>施放顺序</l0><l1>施放順序</l1><l2>Cast Order</l2>: ',
    '  <input name="skillOrderValue" style="width:80%;" type="text" disabled="true"><br>',
    '  <input id="skillOrder_OFC" type="checkbox"><label for="skillOrder_OFC"><l0>友情小马砲</l0><l1>友情小馬砲</l1><l2>OFC</l2></label><input id="skillOrder_FRD" type="checkbox"><label for="skillOrder_FRD"><l0>龙吼</l0><l1>龍吼</l1><l2>FRD</l2></label><input id="skillOrder_T3" type="checkbox"><label for="skillOrder_T3">T3</label><input id="skillOrder_T2" type="checkbox"><label for="skillOrder_T2">T2</label><input id="skillOrder_T1" type="checkbox"><label for="skillOrder_T1">T1</label></div>',
    '  <div><input id="skill_OFC" type="checkbox"><label for="skill_OFC"><l0>友情小马砲</l0><l1>友情小馬砲</l1><l2>OFC</l2></label>: <input id="skillOTOS_OFC" type="checkbox"><label for="skillOTOS_OFC"><l01>一回合只使用一次</l01><l2>One round only spell one time</l2></label>{{skillOFCCondition}}</div>',
    '  <div><input id="skill_FRD" type="checkbox"><label for="skill_FRD"><l0>龙吼</l0><l1>龍吼</l1><l2>FRD</l2></label>: <input id="skillOTOS_FRD" type="checkbox"><label for="skillOTOS_FRD"><l01>一回合只使用一次</l01><l2>One round only spell one time</l2></label>{{skillFRDCondition}}</div>',
    '  <div><l0>战斗风格</l0><l1>戰鬥風格</l1><l2>Fighting style</l2>: <select name="fightingStyle"><option value="1">二天一流 / Niten Ichiryu</option><option value="2">单手 / One-Handed</option><option value="3">双手 / 2-Handed Weapon</option><option value="4">双持 / Dual Wielding</option><option value="5">法杖 / Staff</option></select></div>',
    '  <div><input id="skill_T3" type="checkbox"><label for="skill_T3"><l0>3阶（如果有）</l0><l1>3階（如果有）</l1><l2>T3(if exist)</l2></label>: <input id="skillOTOS_T3" type="checkbox"><label for="skillOTOS_T3"><l01>一回合只使用一次</l01><l2>One round only spell one time</l2></label><br><input id="mercifulBlow" type="checkbox"><label for="mercifulBlow">Merciful Blow: <l0>优先攻击满足条件的敌人 (25% HP, 流血)</l0><l1>優先攻擊滿足條件的敵人 (25% HP, 流血)</l1><l2>Attack the enemy which has 25% HP and is bleeding first</l2></label>{{skillT3Condition}}</div>',
    '  <div><input id="skill_T2" type="checkbox"><label for="skill_T2"><l0>2阶（如果有）</l0><l1>2階（如果有）</l1><l2>T2(if exist)</l2></label>: <input id="skillOTOS_T2" type="checkbox"><label for="skillOTOS_T2"><l01>一回合只使用一次</l01><l2>One round only spell one time</l2></label>{{skillT2Condition}}</div>',
    '  <div><input id="skill_T1" type="checkbox"><label for="skill_T1"><l0>1阶</l0><l1>1階</l1><l2>T1</l2></label>: <input id="skillOTOS_T1" type="checkbox"><label for="skillOTOS_T1"><l01>一回合只使用一次</l01><l2>One round only spell one time</l2></label>{{skillT1Condition}}</div>',
    '  <div><input id="physicalSkillDowngrade" type="checkbox" checked data-default-on>',
    '    <label for="physicalSkillDowngrade"><b><l0>少怪降级</l0><l1>少怪降級</l1><l2>Few Monsters Downgrade</l2></b></label>:',
    '    <l0>存活怪物</l0><l1>存活怪物</l1><l2>Alive monsters</l2> ≤ <input class="hvAANumber" name="physicalDowngradeThreshold" placeholder="3" type="text">',
    "    <l0>时跳过 OFC/FRD 全体攻击节省 OC (流派技能总伤害不受怪物数影响, 不跳过)</l0><l1>時跳過 OFC/FRD 全體攻擊節省 OC (流派技能總傷害不受怪物數影響, 不跳過)</l1><l2>: skip OFC/FRD to save OC (style skills total damage unaffected by monster count, not skipped)</l2></div>",
    '  <div>AoE: <l0>当前技能等级下影响的目标数(1=单体, 3=范围)，访问</l0><l1>當前技能等級下影響的目標數(1=單體, 3=範圍)，訪問</l1><l2>Targets affected at current skill level (1=single, 3=AoE), visit </l2><a href="?s=Character&ss=ab" target="_blank"><l0>技能页面</l0><l1>技能頁面</l1><l2>Ability Page</l2></a><l0>自动检测</l0><l1>自動檢測</l1><l2> to auto-detect</l2><br>',
    '    Fire: T1:<input class="hvAANumber" name="spellAoe_11" placeholder="1" type="text"> T2:<input class="hvAANumber" name="spellAoe_12" placeholder="1" type="text"> T3:<input class="hvAANumber" name="spellAoe_13" placeholder="1" type="text"><br>',
    '    Cold: T1:<input class="hvAANumber" name="spellAoe_21" placeholder="1" type="text"> T2:<input class="hvAANumber" name="spellAoe_22" placeholder="1" type="text"> T3:<input class="hvAANumber" name="spellAoe_23" placeholder="1" type="text"><br>',
    '    Elec: T1:<input class="hvAANumber" name="spellAoe_31" placeholder="1" type="text"> T2:<input class="hvAANumber" name="spellAoe_32" placeholder="1" type="text"> T3:<input class="hvAANumber" name="spellAoe_33" placeholder="1" type="text"><br>',
    '    Wind: T1:<input class="hvAANumber" name="spellAoe_41" placeholder="1" type="text"> T2:<input class="hvAANumber" name="spellAoe_42" placeholder="1" type="text"> T3:<input class="hvAANumber" name="spellAoe_43" placeholder="1" type="text"><br>',
    '    Holy: T1:<input class="hvAANumber" name="spellAoe_51" placeholder="1" type="text"> T2:<input class="hvAANumber" name="spellAoe_52" placeholder="1" type="text"> T3:<input class="hvAANumber" name="spellAoe_53" placeholder="1" type="text"><br>',
    '    Dark: T1:<input class="hvAANumber" name="spellAoe_61" placeholder="1" type="text"> T2:<input class="hvAANumber" name="spellAoe_62" placeholder="1" type="text"> T3:<input class="hvAANumber" name="spellAoe_63" placeholder="1" type="text"></div>',
    '  <div><input id="autoElement" type="checkbox"><label for="autoElement"><b><l0>按九抗自动选最弱属性攻击</l0><l1>按九抗自動選最弱屬性攻擊</l1><l2>Auto-pick weakest element by resists</l2></b>: <l0>读 scan 的怪物九抗，自动用最克它的属性法术（无 scan 数据则回退当前攻击模式）</l0><l1>讀 scan 的怪物九抗，自動用最剋它的屬性法術（無 scan 數據則回退當前攻擊模式）</l1><l2>uses scanned monster resists to pick the weakest element; falls back to current attack mode if absent</l2></label></div></div>',
    '<div class="hvAATab" id="hvAATab-Scroll">',
    "  <l0>战役模式</l0><l1>戰役模式</l1><l2>Battle type</l2>: ",
    '  <input id="scrollRoundType_ar" type="checkbox"><label for="scrollRoundType_ar">The Arena</label><input id="scrollRoundType_rb" type="checkbox"><label for="scrollRoundType_rb">Ring of Blood</label><input id="scrollRoundType_gr" type="checkbox"><label for="scrollRoundType_gr">GrindFest</label><input id="scrollRoundType_iw" type="checkbox"><label for="scrollRoundType_iw">Item World</label><input id="scrollRoundType_ba" type="checkbox"><label for="scrollRoundType_ba">Encounter</label><input id="scrollRoundType_tw" type="checkbox"><label for="scrollRoundType_tw">The Tower</label>{{scrollCondition}}',
    '  <input id="scrollFirst" type="checkbox"><label for="scrollFirst"><l0>存在技能生成的Buff时，仍然使用卷轴</l0><l1>存在技能生成的Buff時，仍然使用捲軸</l1><l2>Use Scrolls even when there are effects from spells</l2>.</label>',
    '  <div><input id="scroll_Go" type="checkbox"><label for="scroll_Go">Scroll of the Gods</label>{{scrollGoCondition}}</div>',
    '  <div><input id="scroll_Av" type="checkbox"><label for="scroll_Av">Scroll of the Avatar</label>{{scrollAvCondition}}</div>',
    '  <div><input id="scroll_Pr" type="checkbox"><label for="scroll_Pr">Scroll of Protection</label>{{scrollPrCondition}}</div>',
    '  <div><input id="scroll_Sw" type="checkbox"><label for="scroll_Sw">Scroll of Swiftness</label>{{scrollSwCondition}}</div>',
    '  <div><input id="scroll_Li" type="checkbox"><label for="scroll_Li">Scroll of Life</label>{{scrollLiCondition}}</div>',
    '  <div><input id="scroll_Sh" type="checkbox"><label for="scroll_Sh">Scroll of Shadows</label>{{scrollShCondition}}</div>',
    '  <div><input id="scroll_Ab" type="checkbox"><label for="scroll_Ab">Scroll of Absorption</label>{{scrollAbCondition}}</div></div>',
    '<div class="hvAATab" id="hvAATab-Infusion">',
    '  <l0>注意：魔药属性与</l0><l1>注意：魔藥屬性與</l1><l2>Note: The style of infusion is the same as Attack Mode in </l2><a class="hvAAGoto" name="hvAATab-Main"><l0>主要选项</l0><l1>主要選項</l1><l2>Main</l2></a><l0>里的攻击模式相同</l0><l1>裡的攻擊模式相同</l1><l2></l2><br>{{infusionCondition}}</div>',
    '<div class="hvAATab" id="hvAATab-Alarm">',
    '  <span class="hvAATitle"><l0>自定义警报</l0><l1>自定義警報</l1><l2>Alarm</l2></span><br>',
    "  <l0>注意：留空则使用默认音频，建议每个用户使用自定义音频</l0><l1>注意：留空則使用默認音頻，建議每個用戶使用自定義音頻</l1><l2>Note: Leave the box blank to use default audio, it's recommended for all user to use custom audio.</l2>",
    '  <div><input id="audioEnable_Common" type="checkbox"><label for="audioEnable_Common"><l01>通用</l01><l2>Common</l2>: <input name="audio_Common" type="text"></label><br><input id="audioEnable_Error" type="checkbox"><label for="audioEnable_Error"><l0>错误</l0><l1>錯誤</l1><l2>Error</l2>: <input name="audio_Error" type="text"></label><br><input id="audioEnable_Defeat" type="checkbox"><label for="audioEnable_Defeat"><l0>失败</l0><l1>失敗</l1><l2>Defeat</l2>: <input name="audio_Defeat" type="text"></label><br><input id="audioEnable_Riddle" type="checkbox"><label for="audioEnable_Riddle"><l0>答题</l0><l1>答題</l1><l2>Riddle</l2>: <input name="audio_Riddle" type="text"></label><br><input id="audioEnable_Victory" type="checkbox"><label for="audioEnable_Victory"><l0>胜利</l0><l1>勝利</l1><l2>Victory</l2>: <input name="audio_Victory" type="text"></label></div>',
    '  <div><l0>请将将要测试的音频文件的地址填入这里</l0><l1>請將將要測試的音頻文件的地址填入這裡</l1><l2>Plz put in the audio file address you want to test</l2>: <br><input class="hvAADebug" name="audio_Text" type="text"></div></div>',
    '<div class="hvAATab" id="hvAATab-Rule">',
    '  <span class="hvAATitle"><l0>攻击规则</l0><l1>攻擊規則</l1><l2>Attack Rule</l2></span> <span style="font-size:small;opacity:.7;"><l0>语法同条件框（点条件 "?" 看帮助）</l0><l1>語法同條件框（點條件 "?" 看幫助）</l1><l2>Syntax = condition box (see "?" help)</l2></span>',
    "  <div>1. <l0>每回合计算敌人当前血量，血量最低的设置初始血量为10，其他敌人为当前血量倍数*10</l0><l1>每回合計算敌人當前血量，血量最低的設置初始血量為10，其他敌人為當前血量倍數*10</l1><l2>Each enemiy is assigned a number which is used to determine the target to attack, let's call that number Priority Weight or PW.</l2></div>",
    "  <div>2. <l0>初始权重与下述各Buff权重相加</l0><l1>初始權重與下述各Buff權重相加</l1><l2>PW(X) = 10 * HP(X) / Min_HP + Accumulated_Weight_of_Deprecating_Spells_In_Effect(X)</l2><br>",
    '    Sleep: <input class="hvAANumber" name="weight_Sle" placeholder="5" type="text"> Blind: <input class="hvAANumber" name="weight_Bl" placeholder="3" type="text"> Slow: <input class="hvAANumber" name="weight_Slo" placeholder="3" type="text"> Imperil: <input class="hvAANumber" name="weight_Im" placeholder="-5" type="text"><br>',
    '    MagNet: <input class="hvAANumber" name="weight_MN" placeholder="-4" type="text"> Silence: <input class="hvAANumber" name="weight_Si" placeholder="-4" type="text"> Drain: <input class="hvAANumber" name="weight_Dr" placeholder="-4" type="text"> Weaken: <input class="hvAANumber" name="weight_We" placeholder="-4" type="text"><br>',
    '    Confuse: <input class="hvAANumber" name="weight_Co" placeholder="-1" type="text"> Coalesced Mana: <input class="hvAANumber" name="weight_CM" placeholder="-5" type="text"><br>',
    '    Stunned: <input class="hvAANumber" name="weight_Stun" placeholder="-4" type="text"> Penetrated Armor: <input class="hvAANumber" name="weight_PA" placeholder="-4" type="text"> Bleeding Wound: <input class="hvAANumber" name="weight_BW" placeholder="-4" type="text"></div>',
    '  <div>3. <input id="ruleReverse" type="checkbox"><label for="ruleReverse"><l0>计算出最终权重，攻击权重最小/最大的敌人(勾选: 最大)</l0><l1>計算出最終權重，攻擊權重最小/最大的敌人(勾選: 最大)</l1><l2>Whichever enemy has the lowest/highest PW will be the target. (ON means highest)</l2></label></div>',
    '  <div>PS. <l0>如果你对各Buff权重有特别见解，请务必</l0><l1>如果你對各Buff權重有特別見解，請務必</l1><l2>If you have any suggestions, please </l2><a class="hvAAGoto" name="hvAATab-Feedback"><l0>告诉我</l0><l1>告訴我</l1><l2>let me know</l2></a>.</div></div>',
    '<div class="hvAATab hvAACenter" id="hvAATab-Drop">',
    '  <span class="hvAATitle"><l0>掉落监测</l0><l1>掉落監測</l1><l2>Drops Tracking</l2></span><button class="reDropMonitor"><l01>重置</l01><l2>Reset</l2></button>',
    '  <div><l0>记录装备的最低品质</l0><l1>記錄裝備的最低品質</l1><l2>Minimum drop quality</l2>: <select name="dropQuality"><option value="0">Crude</option><option value="1">Fair</option><option value="2">Average</option><option value="3">Superior</option><option value="4">Exquisite</option><option value="5">Magnificent</option><option value="6">Legendary</option><option value="7">Peerless</option></select></div>',
    "  <table></table></div>",
    '<div class="hvAATab hvAACenter" id="hvAATab-Usage">',
    '  <span class="hvAATitle"><l0>数据记录</l0><l1>數據記錄</l1><l2>Usage Tracking</l2></span><button class="reRecordUsage"><l01>重置</l01><l2>Reset</l2></button>',
    "  <table></table></div>",
    '<div class="hvAATab hvAACenter" id="hvAATab-Riddle">',
    // 答题配置（原 Main 拆入，与下方统计同 tab）
    ...renderRiddleSchemaFields(),
    '  <div><l0>当<b>小马答题</b>时间</l0><l1>當<b>小馬答題</b>時間</l1><l2>If <b>RIDDLE</b> ETR</l2><l0></l0><l1></l1><l2></l2> ≤ <input class="hvAANumber" name="riddleAnswerTime" placeholder="3" type="text"><l0>秒，如果输入框为空则随机生成答案并提交</l0><l1>秒，如果輸入框為空則隨機生成答案並提交</l1><l2>s and no answer has been chosen yet, a random answer will be generated and submitted</l2></div>',
    "  <div><l0>当<b>小马答题</b>时</l0><l1>當<b>小馬答題</b>時</l1><l2>If <b>RIDDLE</b></l2>: ",
    '    <input id="riddlePopup" type="checkbox"><label for="riddlePopup"><l0>弹窗答题</l0><l1>弹窗答题</l1><l2>POPUP a window to answer</l2></label>; <button class="testPopup"><l0>预处理</l0><l1>預處理</l1><l2>Pretreat</l2></button></div>',
    '  <span class="hvAATitle"><l0>小马验证统计</l0><l1>小馬驗證統計</l1><l2>Riddle ML Stats</l2></span><button class="reRiddleStats"><l01>重置</l01><l2>Reset</l2></button>',
    "  <table></table></div>",
    '<div class="hvAATab hvAACenter" id="hvAATab-About">',
    '  <div><span class="hvAATitle"><l0>当前状况</l0><l1>當前狀況</l1><l2>Current status</l2></span>: ',
    '    <l0>如果脚本长期暂停且网络无问题，请点击</l0><l1>如果腳本長期暫停且網絡無問題，請點擊</l1><l2>If the script does not work and you are sure that it\'s not because of your internet, click</l2><button class="hvAAFix"><l0>尝试修复</l0><l1>嘗試修復</l1><l2>Try to fix</l2></button><br>',
    '    <l0>战役模式</l0><l1>戰役模式</l1><l2>Battle type</l2>: <select class="hvAADebug" name="roundType"><option></option><option value="ar">The Arena</option><option value="rb">Ring of Blood</option><option value="gr">GrindFest</option><option value="iw">Item World</option><option value="ba">Encounter</option><option value="tw">The Tower</option></select> <l0>当前回合</l0><l1>當前回合</l1><l2>Current round</l2>: <input name="roundNow" class="hvAADebug hvAANumber" placeholder="1" type="text"> <l0>总回合</l0><l1>總回合</l1><l2>Total rounds</l2>: <input name="roundAll" class="hvAADebug hvAANumber" placeholder="1" type="text"></div>',
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
    // 选择语言
    gE(".hvAA-LangStyle").textContent = `l${this.value}{display:inline!important;}`;
    if (/^[01]$/.test(this.value))
      gE(".hvAA-LangStyle").textContent += "l01{display:inline!important;}";
    g("lang", this.value);
    // 持久化 lang 到 option：统一 option 事件入口（内部 getValue fallback 取完整 option），
    // 避免在 option 未装填的页残缺 {lang} 落盘覆盖完整配置（现象①持久化失效根因）。
    runOptionAutomation({ type: OptionEvent.WRITE_FIELD, key: "lang", value: this.value });
    // HV 原生汉化(equip/interface) 即时按新 lang 重渲染显示态（0简/1繁/2英），无需重载
    setLang(this.value);
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
          range.selectNodeContents(e.target.parentNode.parentNode.parentNode);
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
    const target =
      e.target.className === "customize"
        ? e.target
        : e.target.parentNode.className === "customize"
          ? e.target.parentNode
          : e.target.parentNode.parentNode;
    if (!gE(".customizeBox")) customizeBox();
    updateGroup();
    if (target.className !== "customize" && target.parentNode.className !== "customize") {
      if (!target.className.match("customize")) gE(".customizeBox").style.zIndex = -1;
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
      const name = e.target.id.match(/_(.*)/)[1];
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
        runOptionBackupAutomation({ type: OptionBackupEvent.DELETE, code });
        rmListItem(code);
      } else return;
    }
    runOptionBackupAutomation({ type: OptionBackupEvent.SAVE_CURRENT, code });
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
    if (!runOptionBackupAutomation({ type: OptionBackupEvent.RESTORE, code })) return;
    runNavigationAutomation({ type: NavigationEvent.RELOAD_NOW });
  };
  gE(".hvAADelete", optionBox).onclick = function () {
    const code = _alert(
      2,
      "请输入配置代号",
      "請輸入配置代號",
      "Please put in a name for a configuration"
    );
    if (!runOptionBackupAutomation({ type: OptionBackupEvent.DELETE, code })) return;
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
      runOptionAutomation({ type: OptionEvent.WRITE, option: parsed.option });
      runNavigationAutomation({ type: NavigationEvent.RELOAD_NOW });
    }
  };
  //
  gE(".hvAAReset", optionBox).onclick = function () {
    if (_alert(1, "是否重置", "是否重置", "Whether to reset")) {
      runOptionAutomation({ type: OptionEvent.CLEAR });
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
    runOptionAutomation({ type: OptionEvent.WRITE, option: _option });
    optionBox.style.display = "none";
    runNavigationAutomation({ type: NavigationEvent.RELOAD_NOW });
  };
  gE(".hvAACancel", optionBox).onclick = function () {
    optionBox.style.display = "none";
  };
  hydrateSettingsForm(optionBox);
}
