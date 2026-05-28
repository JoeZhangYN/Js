// file-size-gate: exempt 移植自 Live Percentile Ranges 独立脚本-仅 showequip 页自包含功能（内部可拆属独立重写工作）
// 联网装备百分位（移植自 Live Percentile Ranges.js, 1.1.0.s3）
// 改写：ES6 module / 无 jQuery / manualRanges 抽到 data/equip-quality-ranges.js
// 数据流：本地 localStorage.EquipmentRanges → reasoningtheory.net (POST gethvitems.php) → 合 manualRanges
// 仅在 showequip.php / /equip/ 页面运行；setupEquipPercentileLive() 是入口。
// M1 修复：GM_xmlhttpRequest 兼容封装统一到 src/dom/gm-xhr.js
import { manualRanges } from "../data/equip-quality-ranges.js";
import { gmXhr } from "../dom/gm-xhr.js";

const debug = false;
const updateCheckDays = 14;
const mobile = false;

function debuglog(str) {
  if (!debug) return;
  const colonSplits = new Error().stack.split("\n")[1].split(":");
  console.log(
    colonSplits[colonSplits.length - 2] + ":" + colonSplits[colonSplits.length - 1] + " :: " + str
  );
}

const shortSummaryStatsConfig = [
  [[/axe/, /club/, /rapier/, /shortsword/, /wakizashi/, /estoc/, /longsword/, /mace/, /katana/], ["ADB"]],
  [[/staff/], ["MDB"]],
  [[/hallowed.+staff/], ["Holy EDB"]],
  [[/demonic.+staff/], ["Dark EDB"]],
  [[/tempestuous.+staff/], ["Wind EDB"]],
  [[/shocking.+staff/], ["Elec EDB"]],
  [[/arctic.+staff/], ["Cold EDB"]],
  [[/fiery.+staff/], ["Fire EDB"]],
  [[/\sshield\s/, /buckler/], ["BLK"]],
  [[/cotton.+heaven-sent/], ["Divine Prof"]],
  [[/cotton.+demon-fiend/], ["Forb Prof"]],
  [[/cotton.+elementalist/], ["Elem Prof"]],
  [[/cotton.+curse-weaver/], ["Depr Prof"]],
  [[/cotton.+earth-walker/], ["Sup Prof"]],
  [[/phase.+heimdall/], ["Holy EDB"]],
  [[/phase.+fenrir/], ["Dark EDB"]],
  [[/phase.+freyr/], ["Wind EDB"]],
  [[/phase.+mjolnir/], ["Elec EDB"]],
  [[/phase.+niflheim/], ["Cold EDB"]],
  [[/phase.+surtr/], ["Fire EDB"]],
  [[/shade/], ["ADB"]],
  [[/power/], ["ADB"]],
].map((line) => ({ nameTests: line[0], statsToShow: line[1] }));

const extendedSummaryStatsConfig = [
  [[/axe/, /club/], ["ADB", "Str", "Dex", "Agi"]],
  [[/rapier/, /shortsword/, /wakizashi/], ["ADB", "Parry", "Str", "Dex", "Agi"]],
  [[/estoc/, /longsword/, /mace/, /katana/], ["ADB", "Str", "Dex", "Agi"]],
  [[/staff/], ["MDB", "Int", "Wis"]],
  [[/hallowed.+staff/], ["Holy EDB", "Divine Prof"]],
  [[/demonic.+staff/], ["Dark EDB", "Forb Prof"]],
  [[/tempestuous.+staff/], ["Wind EDB", "Elem Prof"]],
  [[/shocking.+staff/], ["Elec EDB", "Elem Prof"]],
  [[/arctic.+staff/], ["Cold EDB", "Elem Prof"]],
  [[/fiery.+staff/], ["Fire EDB", "Elem Prof"]],
  [[/staff/], ["Depr Prof", "CR", "Burden"]],
  [[/\sshield\s/, /buckler/], ["BLK", "Pmit", "Mmit", "Str", "Dex", "End", "Agi", "Crus", "Slas", "Pier"]],
  [[/cotton.+heaven-sent/], ["Divine Prof"]],
  [[/cotton.+demon-fiend/], ["Forb Prof"]],
  [[/cotton.+elementalist/], ["Elem Prof"]],
  [[/cotton.+curse-weaver/], ["Depr Prof"]],
  [[/cotton.+earth-walker/], ["Sup Prof"]],
  [[/phase.+heimdall/], ["Holy EDB"]],
  [[/phase.+fenrir/], ["Dark EDB"]],
  [[/phase.+freyr/], ["Wind EDB"]],
  [[/phase.+mjolnir/], ["Elec EDB"]],
  [[/phase.+niflheim/], ["Cold EDB"]],
  [[/phase.+surtr/], ["Fire EDB"]],
  [[/cotton/, /phase/], ["MDB", "Int", "Wis", "Cast Speed", "Mag CD", "Evd", "Agi", "Pmit", "Mmit", "Crus"]],
  [[/leather/, /shade/], ["ADB", "Attack Speed", "Pmit", "Mmit", "Evd", "Res", "Str", "Dex", "End", "Agi", "Int", "Wis", "Crus", "Slas", "Pier"]],
  [[/leather/], ["Burden"]],
  [[/leather/, /shade/], ["Interf"]],
  [[/\splate/], ["BLK"]],
  [[/power/], ["ADB"]],
  [[/\splate/, /power/], ["Str", "Dex", "End", "Pmit", "Mmit", "Phy CC", "Phy CD", "Crus", "Slas", "Pier", "Burden", "Interf"]],
].map((line) => ({ nameTests: line[0], statsToShow: line[1] }));

const statNames = [
  ["ADB", "Physical Damage", "Attack Damage", 0.0854, 250 / 15],
  ["Phy CC", "Physical Crit Chance", "Attack Crit Chance", 0.0105, 2000],
  ["Phy CD", null, "Attack Crit Damage", 0.01, Infinity],
  ["Phy ACC", "Physical Hit Chance", "Attack Accuracy", 0.06069, 5000],
  ["Attack Speed", null, "Attack Speed", 0.0481, Infinity],
  ["MDB", "Magical Damage", "Magic Damage", 0.082969, 250 / 11],
  ["Mag CC", "Magical Crit Chance", "Magic Crit Chance", 0.0114, 2000],
  ["Mag CD", null, "Spell Crit Damage", 0.01, Infinity],
  ["Mag ACC", "Magical Hit Chance", "Magic Accuracy", 0.0491, 5000],
  ["Cast Speed", null, "Casting Speed", 0.0489, Infinity],
  ["Str", "Strength Bonus", "Strength", 0.03, 250 / 7],
  ["Dex", "Dexterity Bonus", "Dexterity", 0.03, 250 / 7],
  ["End", "Endurance Bonus", "Endurance", 0.03, 250 / 7],
  ["Agi", "Agility Bonus", "Agility", 0.03, 250 / 7],
  ["Int", "Intelligence Bonus", "Intelligence", 0.03, 250 / 7],
  ["Wis", "Wisdom Bonus", "Wisdom", 0.03, 250 / 7],
  ["Evd", "Evade Chance", "Evade Chance", 0.025, 2000],
  ["Res", "Resist Chance", "Resist Chance", 0.0804, 2000],
  ["Pmit", "Physical Defense", "Physical Mitigation", 0.021, 2000],
  ["Mmit", "Magical Defense", "Magical Mitigation", 0.0201, 2000],
  ["BLK", "Block Chance", "Block Chance", 0.0998, 2000],
  ["Parry", "Parry Chance", "Parry Chance", 0.0894, 2000],
  ["Mana C", null, "Mana Conservation", 0.1, Infinity],
  ["Crus", "Crushing Mitigation", "Crushing", 0.0155, Infinity],
  ["Slas", "Slashing Mitigation", "Slashing", 0.0153, Infinity],
  ["Pier", "Piercing Mitigation", "Piercing", 0.015, Infinity],
  ["Burden", null, "Burden", 0, Infinity],
  ["Interf", null, "Interference", 0, Infinity],
  ["Elem Prof", "Elemental Proficiency", "Elemental", 0.0306, 250 / 7],
  ["Divine Prof", "Divine Proficiency", "Divine", 0.0306, 250 / 7],
  ["Forb Prof", "Forbidden Proficiency", "Forbidden", 0.0306, 250 / 7],
  ["Depr Prof", "Deprecating Proficiency", "Deprecating", 0.0306, 250 / 7],
  ["Sup Prof", "Supportive Proficiency", "Supportive", 0.0306, 250 / 7],
  ["Holy EDB", "Holy Spell Damage", "Holy EDB", 0.0804, 200],
  ["Dark EDB", "Dark Spell Damage", "Dark EDB", 0.0804, 200],
  ["Wind EDB", "Wind Spell Damage", "Wind EDB", 0.0804, 200],
  ["Elec EDB", "Elec Spell Damage", "Elec EDB", 0.0804, 200],
  ["Cold EDB", "Cold Spell Damage", "Cold EDB", 0.0804, 200],
  ["Fire EDB", "Fire Spell Damage", "Fire EDB", 0.0804, 200],
  ["Holy MIT", "Holy Mitigation", "Holy MIT", 0.1, Infinity],
  ["Dark MIT", "Dark Mitigation", "Dark MIT", 0.1, Infinity],
  ["Wind MIT", "Wind Mitigation", "Wind MIT", 0.1, Infinity],
  ["Elec MIT", "Elec Mitigation", "Elec MIT", 0.1, Infinity],
  ["Cold MIT", "Cold Mitigation", "Cold MIT", 0.1, Infinity],
  ["Fire MIT", "Fire Mitigation", "Fire MIT", 0.1, Infinity],
  ["CR", null, "Counter-Resist", 0.1, Infinity],
].map((a) => ({ abbr: a[0], forgeName: a[1], htmlName: a[2], baseMultiplier: a[3], levelScalingFactor: a[4] }));

const htmlMagicTypes = ["Holy", "Dark", "Wind", "Elec", "Cold", "Fire"];

const peerlessPXP = Object.entries({
  axe: 375, club: 375, rapier: 377, shortsword: 377, wakizashi: 378,
  estoc: 377, katana: 375, longsword: 375, mace: 375,
  "katalox staff": 368, "oak staff": 371, "redwood staff": 371, "willow staff": 371,
  buckler: 374, "force shield": 374, "kite shield": 374,
  phase: 377, cotton: 377,
  arcanist: 421, shade: 394, leather: 393,
  power: 382, " plate": 377,
});

const PercentileRanges = (() => {
  let ready = true;
  const equipList = [];
  let parsingDone = {};
  let delayedDone = null;
  let delayedstatusElm = null;
  const rangesNeeded = [];
  let usingThisDocument = false;

  function getDb() {
    const ranges = localStorage.EquipmentRanges ? JSON.parse(localStorage.EquipmentRanges) : {};
    mergeDeep(ranges, manualRanges);
    return ranges;
  }
  let EquipmentRanges = getDb();

  function addEquipDocument(equipDocument, eid, useQuality) {
    usingThisDocument = true;
    parseEquip(equipDocument, eid, useQuality);
  }
  function addEquipLink(link, useQuality) {
    usingThisDocument = false;
    const eid = /\/equip\//.test(link) ? link.match(/equip\/(\d+)\//)[1] : link.match(/eid=(\d+)/)[1];
    parsingDone[eid] = false;
    get(link, (equipDocument) => {
      parseEquip(equipDocument, eid, useQuality);
      parsingDone[eid] = true;
      if (delayedDone && Object.keys(parsingDone).every((p) => parsingDone[p] === true))
        run(delayedDone, delayedstatusElm);
    });
  }

  function getName(equipDocument) {
    if (typeof equipDocument.body.children[1] === "undefined") return "No such item";
    const showequip = equipDocument.body.children[1];
    const nameDiv = showequip.children.length === 3
      ? showequip.children[0].children[0]
      : showequip.children[1].children[0];
    const name = nameDiv.children.length === 3
      ? nameDiv.children[0].textContent + " " + nameDiv.children[2].textContent
      : nameDiv.children[0].textContent;
    return name;
  }

  function getEquipInfo(equipDocument, eid, useQuality) {
    const name = getName(equipDocument);
    if (name === "No such item") return { name: "No such item" };
    const pageHtml = equipDocument.body.innerHTML;
    const matchD = pageHtml.match(/<div>([^&]+)\s(?:&nbsp; ){2}(?:Level\s([0-9]+|Unassigned)\s)?.+(Soulbound|Tradeable|Untradeable).+Condition:.+\((\d+)%.+Tier:\s(\d+)\s(?:\((\d+)\s\/\s(\d+))?/i);
    let matchN = name.match(/([\w-]+) ([\w-]*?) ?(Axe|Club|Rapier|Shortsword|Wakizashi|Dagger|Sword Chucks|Estoc|Longsword|Mace|Katana|Scythe|Oak|Redwood|Willow|Katalox|Ebony|Buckler|Kite|Force|Tower|Cotton|Phase|Gossamer|Silk|Leather|Shade|Kevlar|Dragon Hide|Plate|Power|Shield|Chainmail|Gold|Silver|Bronze|Diamond|Emerald|Prism|Platinum|Steel|Titanium|Iron) ?((?!of)\w*) ?((?=of)[\w- ]*|$)/i);
    const matchP = pageHtml.match(/Strength|Dexterity|Endurance|Agility|Wisdom|Intelligence/gi) || [];
    const matchO = /Flimsy|Fine|Bronze|Iron|Silver|Steel|Gold|Platinum|Titanium|Emerald|Sapphire|Diamond|Prism|trimmed|adorned|tipped|the Ox|the Raccoon|the Cheetah|the Turtle|the Fox|the Owl|Chucks|Ebony|Scythe|Dagger|Astral|Quintessential|Silk|Hide|Buckler of the Fleet|Cloth of the Fleet|Hulk|Aura|Stone-Skinned|Fire-eater|Frost-born|Thunder-child|Wind-waker|Thrice-blessed|Spirit-ward|Chainmail|Coif|Mitons|Hauberk|Chausses|Kevlar|Gossamer|Tower/i;
    const matchButcher = pageHtml.match(/Butcher\sLv.(\d)/);
    const matchSwiftStrike = pageHtml.match(/Swift\sStrike\sLv.(\d)/);
    const matchArchmage = pageHtml.match(/Archmage\sLv.(\d)/);
    const matchPenetrator = pageHtml.match(/Penetrator\sLv.(\d)/);
    if (matchN === null || matchN.length !== 6)
      matchN = ["%%%", "%%%", "%%%", "%%%", "%%%", "%%%"];

    const pabs = matchP.filter((item, pos, self) => self.indexOf(item) === pos);

    const equipInfo = {
      eid: eid || "",
      name,
      nameLower: name.toLowerCase(),
      level: +matchD[2] || matchD[2] || matchD[3],
      tier: +matchD[5],
      totalPxpThisLevel: +matchD[7] || 0,
      quality: useQuality || matchN[1],
      prefix: matchN[2],
      slot: matchN[4],
      type: matchN[3],
      suffix: matchN[5],
      pabs,
      obsolete: name.match(matchO) ? true : false,
      forging: getForging(equipDocument),
      butcher: matchButcher ? parseInt(matchButcher[1]) : 0,
      swiftStrike: matchSwiftStrike ? parseInt(matchSwiftStrike[1]) : 0,
      archmage: matchArchmage ? parseInt(matchArchmage[1]) : 0,
      penetrator: matchPenetrator ? parseInt(matchPenetrator[1]) : 0,
    };
    if (/of\sthe\s/i.test(equipInfo.suffix)) equipInfo.suffix = equipInfo.suffix.substring(7);
    else if (/^of\s/i.test(equipInfo.suffix)) equipInfo.suffix = equipInfo.suffix.substring(3);
    const typesWithSlots = ["Cotton", "Phase", "Leather", "Shade", "Plate", "Power"];
    if (!typesWithSlots.includes(equipInfo.type)) equipInfo.slot = "";
    const forgingKeys = Object.keys(equipInfo.forging);
    equipInfo.maxForging = forgingKeys.length === 0
      ? 0
      : forgingKeys.reduce((m, k) => Math.max(m, equipInfo.forging[k].forgeLevel), 0);
    return equipInfo;
  }

  function calcPxp0(pxpN, n) {
    let pxp0Est = 300;
    for (let i = 1; i < 15; i++) {
      const sumNext = 1000 * (Math.pow(1 + pxp0Est / 1000, n + 1) - 1);
      const sumThis = 1000 * (Math.pow(1 + pxp0Est / 1000, n) - 1);
      const estimate = sumNext - sumThis;
      if (estimate > pxpN) pxp0Est -= 300 / Math.pow(2, i);
      else pxp0Est += 300 / Math.pow(2, i);
    }
    return Math.round(pxp0Est);
  }

  function getPxp0(item) {
    if (item.tier === 0) return item.totalPxpThisLevel;
    if (item.tier === 10) {
      const pxp0 = (peerlessPXP.find((n) => item.nameLower.includes(n[0])) || [null, 400])[1];
      const quality = item.name.split(" ")[0];
      if (quality === "Peerless") return pxp0;
      else if (quality === "Legendary") return Math.round(pxp0 * 0.95);
      else if (quality === "Magnificent") return Math.round(pxp0 * 0.89);
      else return Math.round(pxp0 * 0.8);
    }
    return calcPxp0(item.totalPxpThisLevel, item.tier);
  }

  function reverseForgeMultiplierDamage(forgedBase, forgeLevelObj, pxp0, iwCoeff) {
    const qualityBonus = ((pxp0 - 100) / 25) * forgeLevelObj.baseMultiplier;
    const forgeCoeff = 1 + 0.279575 * Math.log(0.1 * forgeLevelObj.forgeLevel + 1);
    return (forgedBase - qualityBonus) / forgeCoeff / iwCoeff + qualityBonus;
  }

  function reverseForgeMultiplierNondamage(forgedBase, forgeLevelObj, pxp0) {
    const qualityBonus = ((pxp0 - 100) / 25) * forgeLevelObj.baseMultiplier;
    const forgeCoeff = 1 + 0.2 * Math.log(0.1 * forgeLevelObj.forgeLevel + 1);
    return (forgedBase - qualityBonus) / forgeCoeff + qualityBonus;
  }

  function getForging(equipDocument) {
    const forging = {};
    [
      { textContent: "Physical Damage Lv.0" },
      { textContent: "Magical Damage Lv.0" },
      ...equipDocument.querySelectorAll("#eu > span"),
    ].forEach((span) => {
      const re = span.textContent.match(/(.+)\sLv\.(\d+)/);
      const statNameObj = statObjFromForgeName(re[1]);
      if (!statNameObj) debuglog("no statNameObj found for " + re[1]);
      forging[statNameObj.htmlName] = {
        forgeLevel: parseInt(re[2]),
        baseMultiplier: statNameObj.baseMultiplier,
        scalingFactor: statNameObj.levelScalingFactor,
      };
    });
    return forging;
  }

  function statObjFromForgeName(forgeName) {
    return statNames.find((s) => forgeName === s.forgeName);
  }
  function htmlNameFromAbbrevName(abbrevName) {
    try { return statNames.find((s) => abbrevName === s.abbr).htmlName; }
    catch (e) { debuglog("htmlNameFromAbbrevName missing " + abbrevName); }
  }
  function abbrevNameFromHtmlName(htmlName) {
    try { return statNames.find((s) => htmlName === s.htmlName).abbr; }
    catch (e) { debuglog("abbrevNameFromHtmlName missing " + htmlName); }
  }
  function titleStrToBase(title) { return parseFloat(title.substr(6)); }

  function getEquipStats(equipDocument, equipInfo) {
    const equipStats = [];
    const plusAndPercentNodes = [];
    equipDocument.querySelectorAll("div[title]").forEach((div) => {
      const equipStatObj = {};
      const spans = div.querySelectorAll("span");
      if (spans[0].textContent !== "+") equipStatObj.span = spans[0];
      else equipStatObj.span = spans[1];
      const span = equipStatObj.span;
      if (/Damage/.test(span.textContent)) {
        const damageAmount = span.textContent.match(/^\d+/);
        const extraStr = span.textContent.match(/[^\d]+$/);
        span.textContent = damageAmount;
        div.appendChild(equipDocument.createElement("span")).textContent = extraStr;
      }
      let htmlName;
      if (div.parentElement.parentElement.id === "equip_extended") htmlName = "Attack Damage";
      else {
        htmlName = div.childNodes[0].textContent.trim();
        if (/\+/.test(htmlName)) htmlName = htmlName.substr(0, htmlName.length - 2);
      }
      if (htmlMagicTypes.includes(htmlName)) {
        if (div.parentElement.children[0].textContent === "Damage Mitigations") htmlName += " MIT";
        else htmlName += " EDB";
      }
      if (isHtmlNameFromIW(htmlName, equipInfo)) return;

      equipStatObj.htmlName = htmlName;
      equipStatObj.scaledValue = parseFloat(span.textContent);
      equipStatObj.baseForgedValue = titleStrToBase(div.title);
      equipStatObj.baseUnforgedValue = equipStatObj.baseForgedValue;

      const previousNode = span.previousSibling;
      if (/\+/.test(previousNode.textContent)) {
        if (previousNode.tagName !== "SPAN") {
          previousNode.textContent = span.previousSibling.textContent.slice(0, -1);
          const newPlusSpan = span.parentElement.insertBefore(equipDocument.createElement("span"), span);
          newPlusSpan.textContent = "+";
          plusAndPercentNodes.push(newPlusSpan);
        } else plusAndPercentNodes.push(previousNode);
      }
      if (span.parentElement.nextElementSibling && span.parentElement.nextElementSibling.textContent.trim() === "%")
        plusAndPercentNodes.push(span.parentElement.nextElementSibling);

      if (htmlName === "Attack Damage" || htmlName === "Magic Damage") {
        const iwLevel = htmlName === "Attack Damage" ? equipInfo.butcher : htmlName === "Magic Damage" ? equipInfo.archmage : 0;
        const iwCoeff = 1 + 0.02 * iwLevel;
        if (equipInfo.forging[htmlName] || iwLevel)
          equipStatObj.baseUnforgedValue = reverseForgeMultiplierDamage(equipStatObj.baseUnforgedValue, equipInfo.forging[htmlName], equipInfo.pxp0, iwCoeff);
      } else if (equipInfo.forging[htmlName])
        equipStatObj.baseUnforgedValue = reverseForgeMultiplierNondamage(equipStatObj.baseUnforgedValue, equipInfo.forging[htmlName], equipInfo.pxp0);

      if (htmlName === "Counter-Resist" && equipInfo.penetrator)
        equipStatObj.baseUnforgedValue = equipStatObj.baseUnforgedValue - 4 * equipInfo.penetrator;
      else if (htmlName === "Attack Speed" && equipInfo.swiftStrike)
        equipStatObj.baseUnforgedValue = equipStatObj.baseUnforgedValue - 1.92 * equipInfo.swiftStrike;

      equipStats.push(equipStatObj);
    });
    if (plusAndPercentNodes.length > 0) equipStats.plusAndPercentNodes = plusAndPercentNodes;
    return equipStats;
  }

  function isHtmlNameFromIW(htmlName, equipInfo) {
    if (
      htmlName === "HP Bonus" ||
      htmlName === "MP Bonus" ||
      (htmlName === "Holy MIT" && equipInfo.prefix !== "Zircon") ||
      (htmlName === "Dark MIT" && equipInfo.prefix !== "Onyx") ||
      (htmlName === "Wind MIT" && equipInfo.prefix !== "Jade") ||
      (htmlName === "Elec MIT" && equipInfo.prefix !== "Amber") ||
      (htmlName === "Cold MIT" && equipInfo.prefix !== "Cobalt") ||
      (htmlName === "Fire MIT" && equipInfo.prefix !== "Ruby") ||
      (htmlName === "Attack Crit Damage" && equipInfo.prefix !== "Savage" && equipInfo.type !== "Power") ||
      htmlName === "Counter-Parry" ||
      (htmlName === "Attack Speed" && equipInfo.type !== "Wakizashi" && equipInfo.suffix !== "Swiftness" && equipInfo.prefix !== "Agile") ||
      (htmlName === "Spell Crit Damage" && equipInfo.prefix !== "Mystic" && equipInfo.type !== "Phase") ||
      (htmlName === "Mana Conservation" && equipInfo.suffix !== "Focus" && equipInfo.suffix !== "Battlecaster" && equipInfo.prefix !== "Frugal") ||
      (htmlName === "Counter-Resist" && equipInfo.type !== "Willow" && equipInfo.type !== "Oak") ||
      (htmlName === "Casting Speed" && equipInfo.prefix !== "Charged")
    ) return true;
    return false;
  }

  function parseEquip(equipDocument, eid, useQuality) {
    const equipInfo = getEquipInfo(equipDocument, eid, useQuality);
    if (equipInfo.name === "No such item") {
      equipInfo.level = "No such item";
      return equipInfo;
    }
    equipInfo.infoStr = equipInfo.level;
    if (/(Shield\s)|(Buckler)/.test(equipInfo.name))
      equipInfo.infoStr += ", " + equipInfo.pabs.map((p) => p.substring(0, 3)).join(" ");
    if (equipInfo.tier > 0) equipInfo.infoStr += ", IW " + equipInfo.tier;
    equipInfo.pxp0 = getPxp0(equipInfo);
    if (equipInfo.tier < 10) equipInfo.infoStr += ", PXP " + equipInfo.pxp0;
    equipInfo.negativeInfoStr = "";
    if (equipInfo.maxForging > 0) equipInfo.infoStr += ", forged " + equipInfo.maxForging;
    [["Magnificent", "Mag"], ["Exquisite", "Exq"], ["Superior", "Sup"]].forEach((q) => {
      if (equipInfo.quality === q[0]) equipInfo.infoStr += ", " + q[1] + " ranges: ";
    });
    const equipStats = getEquipStats(equipDocument, equipInfo);
    const htmlNames = equipStats.map((s) => s.htmlName);
    const haveRanges = !!validateRanges(equipInfo.type, equipInfo.slot, equipInfo.quality, htmlNames);
    if (!haveRanges) {
      if (equipInfo.type === "%%%" || equipInfo.obsolete) return;
      rangesNeeded.push({ type: equipInfo.type, slot: equipInfo.slot, quality: equipInfo.quality, statNames: htmlNames });
      ready = false;
    }
    equipList.push({ equipInfo, equipStats });
  }

  function validateRanges(type, slot, quality, htmlNames) {
    EquipmentRanges = getDb();
    if (!Object.keys(EquipmentRanges).includes(type)) return false;
    if (slot && !Object.keys(EquipmentRanges[type]).includes(slot)) return false;
    const equipsByQuality = slot ? EquipmentRanges[type][slot] : EquipmentRanges[type];
    if (equipsByQuality === false) return true;
    if (quality === "Peerless") quality = "Legendary";
    if (!Object.keys(equipsByQuality).includes(quality)) return false;
    if (!htmlNames.every((h) => {
      if (!Object.keys(equipsByQuality[quality]).includes(h)) {
        debuglog("for " + type + " " + slot + " " + quality + ", DB lacking " + h);
        return false;
      }
      return true;
    })) return false;
    if (updateCheckDays && Date.now() / 1000 - (equipsByQuality[quality].lastCheck || 0) > 3600 * 24 * updateCheckDays)
      return false;
    return !!equipsByQuality[quality];
  }

  function run(done, statusElm) {
    if (!Object.keys(parsingDone).every((eid) => parsingDone[eid] === true)) {
      delayedDone = done;
      delayedstatusElm = statusElm;
      return;
    }
    if (ready) {
      statusElm.textContent = "Using local database...";
      makeResults(done, statusElm);
    } else {
      statusElm.textContent = "从在线数据库获取数据中...";
      updateDatabase(done, statusElm);
    }
  }

  function updateDatabase(done, statusElm) {
    post("https://reasoningtheory.net/gethvitems.php", "rangesNeeded=" + JSON.stringify(rangesNeeded), (newRangesStr) => {
      let newRanges;
      try {
        newRanges = JSON.parse(newRangesStr);
        setLastCheck(newRanges, parseInt(Date.now() / 1000));
      } catch (e) {
        statusElm.textContent = 'Response Error: "' + newRangesStr + '"';
        return;
      }
      EquipmentRanges = getDb();
      mergeDeep(EquipmentRanges, newRanges);
      mergeDeep(EquipmentRanges, manualRanges);
      localStorage.EquipmentRanges = JSON.stringify(EquipmentRanges);
      makeResults(done, statusElm);
    }, statusElm);
  }

  function mergeDeep(target, source) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else Object.assign(target, { [key]: source[key] });
    }
  }
  function setLastCheck(source, date) {
    for (const key in source) if (isObject(source[key])) setLastCheck(source[key], date);
    if (Object.prototype.hasOwnProperty.call(source, "lastUpdate")) source.lastCheck = date;
  }
  function isObject(item) { return item && typeof item === "object" && !Array.isArray(item); }

  function makeResults(done, statusElm) {
    if (equipList.length === 0) statusElm.textContent = "No equips to parse";
    statusElm.textContent = "Making results...";
    const singlePageResult = usingThisDocument && equipList.length === 1 && equipValid(equipList[0]);

    let results = {};
    equipList.forEach((equip) => {
      const equipResult = { infos: equip.equipInfo };
      if (!equipValid(equip)) {
        equipResult.summaries = ["Unknown equip type", "Unknown equip type"];
        results[equip.equipInfo.eid] = equipResult;
        return;
      }
      const { summary: extendedSummary, htmlNamePriorities, weightedValues } = makeSummaryAndPriorities(extendedSummaryStatsConfig, equip);
      equip.equipInfo.htmlNamePriorities = htmlNamePriorities;
      equipResult.summaries = {
        short: makeSummaryAndPriorities(shortSummaryStatsConfig, equip).summary,
        extended: extendedSummary,
        weighted: weightedValues,
      };
      const equipPercentiles = { unforged: {}, forged: {} };
      const equipBases = { unforged: {}, forged: {} };
      equip.equipStats.forEach((s) => {
        equipPercentiles.unforged[s.htmlName] = getPercentile(equip.equipInfo, s.htmlName, s.baseUnforgedValue);
        equipPercentiles.forged[s.htmlName] = getPercentile(equip.equipInfo, s.htmlName, s.baseForgedValue);
        equipBases.unforged[s.htmlName] = s.baseUnforgedValue;
        equipBases.forged[s.htmlName] = s.baseForgedValue;
      });
      equipResult.percentiles = equipPercentiles;
      equipResult.bases = equipBases;
      equipResult.ranges = {};

      if (singlePageResult) {
        equipResult.transformations = makeTransformations(equip);
        results = equipResult;
      } else {
        results[equip.equipInfo.eid] = equipResult;
      }
    });

    ready = true;
    equipList.length = 0;
    rangesNeeded.length = 0;
    parsingDone = {};
    delayedDone = null;
    statusElm.textContent = "Results finished";
    done(results);
  }

  function getRanges(equipInfo) {
    let equipsByQuality, qualityToUse, statsArray;
    try {
      equipsByQuality = equipInfo.slot ? EquipmentRanges[equipInfo.type][equipInfo.slot] : EquipmentRanges[equipInfo.type];
      qualityToUse = equipInfo.quality === "Peerless" ? "Legendary" : equipInfo.quality;
      statsArray = equipsByQuality[qualityToUse];
      if (!statsArray) throw new Error();
    } catch (e) {
      console.log(`In database, didn't find ${equipInfo.quality} ${equipInfo.type} ${equipInfo.slot}`);
      return false;
    }
    const matchingRanges = {};
    Object.keys(statsArray).forEach((h) => {
      const r = getMatchingRange(statsArray[h], equipInfo.prefix, equipInfo.suffix);
      if (!r) return;
      matchingRanges[h] = r;
    });
    return matchingRanges;
  }

  function getMatchingRange(statArray, thisPrefix, thisSuffix) {
    const thisKey = Object.keys(statArray).find((ps) => {
      const [prefixTest, suffixTest] = ps.split(" | ");
      if (prefixTest !== "all" && prefixTest !== thisPrefix && !prefixTest.includes("not!")) return false;
      else if (prefixTest.includes("not!") && prefixTest.split("!").indexOf(thisPrefix) !== -1) return false;
      else if (suffixTest !== "all" && suffixTest !== thisSuffix && !suffixTest.includes("not!")) return false;
      else if (suffixTest.includes("not!") && suffixTest.split("!").indexOf(thisSuffix) !== -1) return false;
      return true;
    });
    if (!thisKey) return false;
    return statArray[thisKey];
  }

  function getPercentile(equipInfo, htmlName, baseValue) {
    const equipsByQuality = equipInfo.slot ? EquipmentRanges[equipInfo.type][equipInfo.slot] : EquipmentRanges[equipInfo.type];
    const qualityToUse = equipInfo.quality === "Peerless" ? "Legendary" : equipInfo.quality;
    const statArray = equipsByQuality[qualityToUse][htmlName];
    const r = getMatchingRange(statArray, equipInfo.prefix, equipInfo.suffix);
    if (!r) return false;
    return Math.round((100 * (baseValue - r.min)) / (r.max - r.min));
  }

  function getAbsolutePercentile(equipInfo, htmlName, baseValue) {
    const equipsByQuality = equipInfo.slot ? EquipmentRanges[equipInfo.type][equipInfo.slot] : EquipmentRanges[equipInfo.type];
    const statArray = equipsByQuality["Legendary"][htmlName];
    const r = getMatchingRange(statArray, equipInfo.prefix, equipInfo.suffix);
    if (!r) return false;
    const diff = Math.round((baseValue - r.max) * 100) / 100;
    return "<span>P" + (diff > 0 ? "+" + diff.toFixed(2) : diff < 0 ? diff.toFixed(2) : "") + "<br>" + ((100 * baseValue) / r.max).toFixed(2) + "%</span>";
  }

  function getFullyForgedBase(equip, equipStat) {
    const equipInfo = equip.equipInfo;
    const htmlName = equipStat.htmlName;
    const forgeObj = statNames.find((s) => htmlName === s.htmlName);
    if (!forgeObj.forgeName) return;
    let forgeFactor = 0.2, forgeLevel = 50, iwLevel = 0;
    if (htmlName === "Attack Damage" || htmlName === "Magic Damage") {
      forgeFactor = 0.279575;
      forgeLevel = 100;
      if (equipInfo.type === "Phase" && equipInfo.prefix === "Radiant") forgeLevel = 50;
      if (!equipInfo.slot && equipInfo.suffix === "Slaughter") iwLevel = 5;
    }
    const pxp0 = equipInfo.pxp0;
    const unforgedBase = equipStat.baseUnforgedValue;
    const qualityBonus = ((pxp0 - 100) / 25) * forgeObj.baseMultiplier;
    const forgeCoeff = 1 + forgeFactor * Math.log(0.1 * forgeLevel + 1);
    const iwCoeff = 1 + 0.02 * iwLevel;
    return (unforgedBase - qualityBonus) * forgeCoeff * iwCoeff + qualityBonus;
  }

  function equipValid(equip) {
    const equipsByQuality = equip.equipInfo.slot ? EquipmentRanges[equip.equipInfo.type][equip.equipInfo.slot] : EquipmentRanges[equip.equipInfo.type];
    return !!equipsByQuality;
  }

  function makeSummaryAndPriorities(config, equip) {
    let summary = equip.equipInfo.infoStr.toString();
    const htmlNamePriorities = [];
    config.forEach((line) => {
      line.nameTests.forEach((t) => {
        if (!t.test(equip.equipInfo.nameLower)) return;
        line.statsToShow.forEach((abbrev) => {
          const htmlName = htmlNameFromAbbrevName(abbrev);
          const found = equip.equipStats.find((s) => s.htmlName === htmlName);
          if (!found) return;
          const percentile = getPercentile(equip.equipInfo, htmlName, found.baseUnforgedValue);
          if (percentile < 0) return;
          if (summary.includes("%") || !summary.includes("ranges")) summary += ", ";
          summary += abbrevNameFromHtmlName(htmlName) + " " + percentile + "%";
          htmlNamePriorities.push(htmlName);
        });
      });
    });
    return { summary, htmlNamePriorities, weightedValues: [] };
  }

  function makeTransformations(equip) {
    const transformations = {};
    const ee = document.querySelector("#equip_extended");
    if (!ee || !ee.lastElementChild) return transformations;
    const formatDiv = ee.lastElementChild.appendChild(document.createElement("div"));
    formatDiv.style.cssText = "margin-top:6px";
    formatDiv.textContent = "Display style: Forged Scaled";
    const qualityToShow = equip.equipInfo.quality === "Peerless" ? "Legendary" : equip.equipInfo.quality;
    transformations.showUnforgedPercentiles = function () {
      equip.equipStats.forEach((s) => {
        s.span.textContent = getPercentile(equip.equipInfo, s.htmlName, s.baseUnforgedValue) + "%";
      });
      if (equip.equipStats.plusAndPercentNodes)
        equip.equipStats.plusAndPercentNodes.forEach((n) => (n.style.display = "none"));
      formatDiv.textContent = "显示样式: 不计入强化属性的浮动值(按F返回) (" + qualityToShow + ")";
    };
    transformations.showForgedPercentiles = function () {
      equip.equipStats.forEach((s) => {
        s.span.textContent = getPercentile(equip.equipInfo, s.htmlName, s.baseForgedValue) + "%";
      });
      if (equip.equipStats.plusAndPercentNodes)
        equip.equipStats.plusAndPercentNodes.forEach((n) => (n.style.display = "none"));
      formatDiv.textContent = "显示样式: 计入强化属性的浮动值 (" + qualityToShow + ")";
    };
    transformations.showAbsoltuePercentiles = function () {
      equip.equipStats.forEach((s) => {
        s.span.innerHTML = getAbsolutePercentile(equip.equipInfo, s.htmlName, s.baseUnforgedValue);
      });
      if (equip.equipStats.plusAndPercentNodes)
        equip.equipStats.plusAndPercentNodes.forEach((n) => (n.style.display = "none"));
      formatDiv.textContent = "显示样式: 绝对浮动值";
    };
    transformations.showUnforgedBase = function () {
      equip.equipStats.forEach((s) => (s.span.textContent = Math.round(s.baseUnforgedValue * 100) / 100));
      if (equip.equipStats.plusAndPercentNodes)
        equip.equipStats.plusAndPercentNodes.forEach((n) => (n.style.display = "inline"));
      formatDiv.textContent = "显示样式: 不含强化属性的基础属性";
    };
    transformations.showForgedBase = function () {
      equip.equipStats.forEach((s) => (s.span.textContent = s.baseForgedValue));
      if (equip.equipStats.plusAndPercentNodes)
        equip.equipStats.plusAndPercentNodes.forEach((n) => (n.style.display = "inline"));
      formatDiv.textContent = "显示样式: 包含强化属性的基础属性";
    };
    transformations.showFullyForgedBase = function () {
      equip.equipStats.forEach((s) => {
        const forgedBase = getFullyForgedBase(equip, s) || s.baseForgedValue;
        s.span.textContent = Math.round(forgedBase * 100) / 100;
      });
      if (equip.equipStats.plusAndPercentNodes)
        equip.equipStats.plusAndPercentNodes.forEach((n) => (n.style.display = "inline"));
      formatDiv.textContent = "显示样式: 最大强化后的基础属性";
    };
    transformations.showScaledDefault = function () {
      equip.equipStats.forEach((s) => (s.span.textContent = s.scaledValue));
      if (equip.equipStats.plusAndPercentNodes)
        equip.equipStats.plusAndPercentNodes.forEach((n) => (n.style.display = "inline"));
      formatDiv.textContent = "显示样式: 当前属性";
    };
    transformations.showScaledMylevel = function () {
      formatDiv.textContent = "正在获取你的等级...";
      EquipmentRanges = getDb();
      if (EquipmentRanges.userLevelObj && EquipmentRanges.userLevelObj.level === 500) {
        changeDisplay(500);
        return;
      }
      if (EquipmentRanges.userLevelObj && Date.now() - EquipmentRanges.userLevelObj.timestamp < 1000 * 60 * 60 * 24 * 7) {
        changeDisplay(parseInt(EquipmentRanges.userLevelObj.level));
        return;
      }
      const rootDomain = window.location.href.match(/^(.+\.org)/)[1];
      get(rootDomain, (response) => {
        formatDiv.textContent = "Got response from root domain...";
        let level;
        try {
          level = parseInt(response.querySelector("#level_readout").children[0].children[0].textContent.match(/\d+/)[0]);
        } catch (e) {
          formatDiv.textContent = "Couldn't parse the response";
          return;
        }
        EquipmentRanges.userLevelObj = { level, timestamp: Date.now() };
        localStorage.EquipmentRanges = JSON.stringify(EquipmentRanges);
        changeDisplay(level);
      });
      function changeDisplay(myLevel) {
        equip.equipStats.forEach((s) => {
          const lsf = statNames.find((sn) => sn.htmlName === s.htmlName).levelScalingFactor;
          s.span.textContent = Math.round(100 * (1 + myLevel / lsf) * s.baseForgedValue) / 100;
        });
        if (equip.equipStats.plusAndPercentNodes)
          equip.equipStats.plusAndPercentNodes.forEach((n) => (n.style.display = "inline"));
        formatDiv.textContent = "显示样式: 当前等级+当前强化状态下的属性 Lv" + myLevel;
      }
    };
    transformations.showScaledCustomlevel = function () {
      const customLevel = parseInt(prompt("输入目标等级:", EquipmentRanges.userLevelObj ? EquipmentRanges.userLevelObj.level : ""));
      if (!customLevel) return;
      equip.equipStats.forEach((s) => {
        const lsf = statNames.find((sn) => sn.htmlName === s.htmlName).levelScalingFactor;
        s.span.textContent = Math.round(100 * (1 + customLevel / lsf) * s.baseForgedValue) / 100;
      });
      if (equip.equipStats.plusAndPercentNodes)
        equip.equipStats.plusAndPercentNodes.forEach((n) => (n.style.display = "inline"));
      formatDiv.textContent = "显示样式: 目标等级+当前强化状态下的属性 Lv" + customLevel;
    };
    transformations.showFullyForgedScaled = function () {
      const customLevel = parseInt(prompt("输入目标等级:", EquipmentRanges.userLevelObj ? EquipmentRanges.userLevelObj.level : ""));
      if (!customLevel) return;
      equip.equipStats.forEach((s) => {
        const forgedBase = getFullyForgedBase(equip, s) || s.baseForgedValue;
        const lsf = statNames.find((sn) => sn.htmlName === s.htmlName).levelScalingFactor;
        s.span.textContent = Math.round(100 * (1 + customLevel / lsf) * forgedBase) / 100;
      });
      if (equip.equipStats.plusAndPercentNodes)
        equip.equipStats.plusAndPercentNodes.forEach((n) => (n.style.display = "inline"));
      formatDiv.textContent = "显示样式: 目标等级+最大强化下的属性 Lv" + customLevel;
    };
    return transformations;
  }

  function get(url, done) {
    gmXhr({
      method: "GET",
      url,
      responseType: "document",
      onload: (r) => {
        if (r.status === 200) {
          const doc = r.response || new DOMParser().parseFromString(r.responseText, "text/html");
          done(doc);
        }
      },
    });
  }
  function post(url, data, done, statusElm) {
    gmXhr({
      method: "POST",
      url,
      data,
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      onload: (r) => {
        if (r.status !== 200) {
          statusElm.textContent = 'Response Error: Response code of "' + r.status + '"';
          return;
        }
        done(r.responseText);
      },
      onerror: () => {
        statusElm.textContent = "Request Error";
      },
    });
  }

  return { addEquipLink, addEquipDocument, run, getRanges };
})();

/** POST 当前装备页给 hvitems.niblseed.com 喂数据 */
function sendThisPageToHvitems(responseDiv) {
  const url = window.location.href;
  const match = /\/equip\//.test(url)
    ? url.match(/\/equip\/(\d+)\/([0-9a-f]+)/)
    : url.match(/\.php\?eid=(\d+)&key=([0-9a-f]+)/);
  if (!match) {
    responseDiv.textContent = "无法解析装备链接（缺 eid/key）";
    return;
  }
  const [, eid, key] = match;
  const rangeToSend = [{ eid, key }];
  const data = "action=store&equipment=" + encodeURIComponent(JSON.stringify(rangeToSend));
  const onSuccess = (responseText) => {
    if (responseText === "1") responseDiv.textContent = "Done!";
    else responseDiv.textContent = 'Error, response was: "' + responseText + '"';
  };
  const onFail = (msg) => (responseDiv.textContent = msg);

  gmXhr({
    method: "POST",
    url: "https://hvitems.niblseed.com/",
    data,
    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
    onload: (r) => (r.status === 200 ? onSuccess(r.responseText) : onFail("HTTP " + r.status)),
    onerror: (e) => onFail("Network Error" + (e?.statusText ? ": " + e.statusText : "")),
  });
}

function injectLiveStyle() {
  const css = `
    #equip_extended { height: initial !important; min-height: 400px !important; }
    #summaryDiv { margin-top: 20px; }
    #optionsDiv { display: none; margin-top: 10px; margin-bottom: 10px; }
    option { border:0 !important; margin:0 !important; padding:0 !important; }
    #linksDiv { width: 400px; margin:auto; padding-top: 10px; }
    #linksDiv > a { float: left; }
    #linksDiv > a:nth-child(2) { padding-left: 85px; padding-right: 55px; }
    #linksDiv > button { padding: 0; }
    #compareDiv { padding-top: 35px; }
    #compareDiv > span:nth-child(1) { padding-right: 10px; }
    #compareDiv > input:nth-child(2) { width: 500px; }
    .ex > div, .ep > div { height:auto !important }
    .eq span > span { display:inline-block; vertical-align:middle; text-align:center }
  `;
  const styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);
}

function documentInteractor(options) {
  if (!document.querySelector("#showequip")) return;
  const sendRangeEnabled = options?.sendRangeEnabled ?? true;

  const summaryDiv = document.body.appendChild(document.createElement("div"));
  summaryDiv.id = "summaryDiv";
  let baseQuality;
  const optionsDiv = document.body.appendChild(document.createElement("div"));
  optionsDiv.id = "optionsDiv";
  const select = optionsDiv.appendChild(document.createElement("select"));
  ["Legendary", "Magnificent", "Exquisite", "Superior"].forEach((q) =>
    (select.appendChild(document.createElement("option")).textContent = q)
  );
  select.onchange = () => tryChangeQuality();

  const sendRangeDiv = optionsDiv.appendChild(document.createElement("div"));

  const linksDiv = optionsDiv.appendChild(document.createElement("div"));
  linksDiv.id = "linksDiv";
  const serverLink = linksDiv.appendChild(document.createElement("a"));
  serverLink.target = "_blank";
  serverLink.href = "https://reasoningtheory.net/viewranges";
  serverLink.textContent = "浮动范围数据库";
  const wikiLink = linksDiv.appendChild(document.createElement("a"));
  wikiLink.target = "_blank";
  wikiLink.href = "https://ehwiki.org/wiki/Equipment_Ranges";
  wikiLink.textContent = "Wiki浮动范围链接";
  const clearButton = linksDiv.appendChild(document.createElement("button"));
  clearButton.textContent = "Clear Database";
  clearButton.onclick = () => {
    delete localStorage.EquipmentRanges;
    clearButton.textContent = "done";
  };

  let results;
  let compareResults = null;
  let elementsToRemoveOnReset = [];
  let svgDiv = null;
  let bodyKeydownHandler = null;
  addAndRunParser(null);

  function addAndRunParser(changeToQuality) {
    summaryDiv.textContent = "Checking...";
    PercentileRanges.addEquipDocument(document, null, changeToQuality);
    PercentileRanges.run(addResultsToDocument, summaryDiv);
  }

  function addResultsToDocument(resultsParam) {
    if (!resultsParam.infos) {
      summaryDiv.textContent = "No data available for this equip type";
      return;
    }
    results = resultsParam;
    const { infos, summaries, percentiles, transformations } = resultsParam;
    if (infos.type === "Cotton" || infos.type === "Phase")
      wikiLink.href = "https://ehwiki.org/wiki/Equipment_Ranges_Clothes#" + infos.type + "_" + infos.slot;
    else if (infos.type === "Leather" || infos.type === "Shade")
      wikiLink.href = "https://ehwiki.org/wiki/Equipment_Ranges_Light#" + infos.type + "_" + infos.slot;
    else if (infos.type === "Plate" || infos.type === "Power")
      wikiLink.href = "https://ehwiki.org/wiki/Equipment_Ranges_Heavy#" + infos.type + "_" + infos.slot;
    else wikiLink.href = "https://ehwiki.org/wiki/Equipment_Ranges#" + infos.type;

    if (!baseQuality) baseQuality = infos.quality;
    summaryDiv.textContent = summaries.extended;
    if (summaries.weighted) summaries.weighted.forEach((t) => summaryDiv.append(document.createElement("br"), t));
    if (summaries.extended === "Unknown equip type") return;

    const actions = [
      [81, transformations.showUnforgedPercentiles], // Q
      [87, transformations.showForgedPercentiles],   // W
      [69, transformations.showAbsoltuePercentiles], // E
      [65, transformations.showUnforgedBase],        // A
      [83, transformations.showForgedBase],          // S (无 shift)
      [68, transformations.showFullyForgedBase],     // D
      [90, transformations.showScaledMylevel],       // Z
      [88, transformations.showScaledCustomlevel],   // X
      [67, transformations.showFullyForgedScaled],   // C
      [70, transformations.showScaledDefault],       // F
    ].map(([keyCode, func]) => ({ keyCode, func }));

    bodyKeydownHandler = (e) => {
      if (e.ctrlKey || e.altKey) return;
      if (e.target.tagName === "INPUT" && e.target.type !== "checkbox") return;
      // Shift+S → Send Range
      if (e.shiftKey) {
        if (e.keyCode === 83 && sendRangeEnabled) {
          e.preventDefault();
          triggerSendRange();
        }
        return;
      }
      const action = actions.find((a) => e.keyCode === a.keyCode);
      if (!action) return;
      action.func();
    };
    document.body.addEventListener("keydown", bodyKeydownHandler);

    const displayStyleDiv = document.querySelector("#equip_extended")?.children[1]?.lastChild;
    if (displayStyleDiv) {
      displayStyleDiv.onclick = () => {
        optionsDiv.style.display = "block";
        if (svgDiv) svgDiv.style.display = "block";
      };
      summaryDiv.onclick = displayStyleDiv.onclick;
      elementsToRemoveOnReset.push(displayStyleDiv);
    }
    select.style.display = "inline";
    const qualityToShow = infos.quality === "Peerless" ? "Legendary" : infos.quality;
    select.childNodes.forEach((opt) => {
      if (opt.textContent === qualityToShow) {
        opt.selected = true;
        opt.style.backgroundColor = "#00ef37";
      } else {
        opt.style.backgroundColor = null;
      }
    });

    // Send Range：仅 percentile 显示异常时才提示喂数据
    const percentilesAreForThisQuality = baseQuality === infos.quality;
    const rangeShouldBeSent =
      sendRangeEnabled &&
      percentilesAreForThisQuality &&
      infos.tier === 0 &&
      infos.maxForging === 0 &&
      !sendRangeDiv.textContent &&
      Object.keys(percentiles.unforged).some((statName) => {
        const p = percentiles.unforged[statName];
        return p >= 101 || p <= -1;
      });
    if (rangeShouldBeSent) {
      renderSendRangeLink();
    }

    // compareDiv 装备对比
    const compareDiv = optionsDiv.appendChild(document.createElement("div"));
    compareDiv.id = "compareDiv";
    compareDiv.appendChild(document.createElement("span")).textContent = "装备对比:";
    const compareInput = compareDiv.appendChild(document.createElement("input"));
    compareInput.placeholder = "https://hentaiverse.org/equip/.../...";
    elementsToRemoveOnReset.push(compareDiv);
    const compareButton = compareDiv.appendChild(document.createElement("button"));
    compareButton.textContent = "Compare!";
    compareButton.addEventListener("click", () => {
      compareInput.style.backgroundColor = null;
      const m = window.location.href.match(/^.+\.org/);
      const newLink = compareInput.value.replace(/^.+\.org/, m ? m[0] : "");
      if (!newLink) return;
      if (newLink.includes(" :::") || (!/\/equip\//.test(newLink) && !/showequip\.php/.test(newLink))) {
        compareButton.textContent = "Invalid link";
        return;
      }
      compareButton.disabled = true;
      compareButton.textContent = "Getting info...";
      PercentileRanges.addEquipLink(newLink);
      PercentileRanges.run(doCompare.bind(null, compareDiv, checkboxContainer), compareButton);
    });

    // checkboxContainer 多品质 SVG 选择
    const checkboxHeader = optionsDiv.appendChild(document.createElement("h4"));
    checkboxHeader.textContent = "图形化显示浮动范围:";
    elementsToRemoveOnReset.push(checkboxHeader);
    const checkboxContainer = optionsDiv.appendChild(document.createElement("div"));
    checkboxContainer.id = "checkboxContainer";
    elementsToRemoveOnReset.push(checkboxContainer);
    ["Legendary", "Magnificent", "Exquisite", "Superior"].forEach((quality) => {
      const checkboxDiv = checkboxContainer.appendChild(document.createElement("div"));
      const checkbox = checkboxDiv.appendChild(document.createElement("input"));
      checkbox.type = "checkbox";
      if (quality === infos.quality || (quality === "Legendary" && infos.quality === "Peerless")) {
        checkbox.checked = true;
        checkbox.disabled = true;
      } else {
        const thisQualityEquipInfo = Object.assign({}, infos, { quality });
        if (PercentileRanges.getRanges(thisQualityEquipInfo) === false) checkbox.disabled = true;
      }
      checkbox.addEventListener("change", () => buildGraphic(checkboxContainer));
      checkboxDiv.appendChild(document.createTextNode(quality));
    });

    buildGraphic(checkboxContainer);
    transformations.showUnforgedPercentiles();
  }

  function renderSendRangeLink() {
    sendRangeDiv.textContent = "Send Range (Shift+S)";
    sendRangeDiv.style.marginTop = "10px";
    sendRangeDiv.style.cursor = "pointer";
    sendRangeDiv.style.color = "#5C0D11";
    sendRangeDiv.style.textDecoration = "underline";
    sendRangeDiv.onclick = triggerSendRange;
  }

  function triggerSendRange() {
    if (!sendRangeDiv.textContent) renderSendRangeLink();
    sendRangeDiv.textContent = "Sending Range...";
    sendRangeDiv.onclick = null;
    sendThisPageToHvitems(sendRangeDiv);
  }

  function tryChangeQuality() {
    const changeTo = select.options[select.selectedIndex].textContent;
    if (changeTo !== results.infos.quality) reset(changeTo);
  }

  function reset(changeToQuality) {
    if (bodyKeydownHandler) {
      document.body.removeEventListener("keydown", bodyKeydownHandler);
      bodyKeydownHandler = null;
    }
    try {
      results.transformations.showScaledDefault();
    } catch (e) { /* ignore */ }
    select.style.display = "none";
    elementsToRemoveOnReset.forEach((el) => el && el.remove && el.remove());
    elementsToRemoveOnReset = [];
    compareResults = null;
    if (svgDiv) {
      svgDiv.remove();
      svgDiv = null;
    }
    sendRangeDiv.textContent = "";
    sendRangeDiv.onclick = null;
    addAndRunParser(changeToQuality);
  }

  function doCompare(compareDiv, checkboxContainer, compareResultsPacked) {
    const [, compareInput, compareButton] = compareDiv.children;
    compareButton.disabled = false;
    const unpacked = Object.values(compareResultsPacked)[0];
    if (!unpacked || !unpacked.infos) {
      compareButton.textContent = !unpacked
        ? "Equip parsing failed"
        : "No data available for this equip type";
      compareResults = null;
      buildGraphic(checkboxContainer);
      return;
    }
    compareResults = unpacked;
    compareButton.textContent = "Compare!";
    compareInput.value = compareResults.infos.name + " ::: " + compareInput.value;
    compareInput.style.backgroundColor = "#c9ffd1";
    buildGraphic(checkboxContainer);
  }

  function buildGraphic(checkboxContainer) {
    if (!results) return;
    const { infos, bases } = results;
    const nativeQuality = infos.quality === "Peerless" ? "Legendary" : infos.quality;
    const qualitiesToDisplay = !checkboxContainer
      ? [nativeQuality]
      : Array.from(checkboxContainer.children).reduce((acc, d) => {
          if (!d.children[0].checked) return acc;
          acc.push(d.childNodes[1].textContent);
          return acc;
        }, []);
    const htmlNames = (infos.htmlNamePriorities || []).slice();
    Object.keys(bases.unforged).forEach((h) => {
      if (!htmlNames.includes(h)) htmlNames.push(h);
    });
    if (compareResults) {
      Object.keys(compareResults.bases.unforged).forEach((h) => {
        if (!htmlNames.includes(h)) htmlNames.push(h);
      });
    }

    const rangesByQuality = {};
    qualitiesToDisplay.forEach((q) => {
      const thisQualityEquipInfo = Object.assign({}, infos, { quality: q });
      const r = PercentileRanges.getRanges(thisQualityEquipInfo);
      if (r) rangesByQuality[q] = r;
    });
    if (!rangesByQuality[nativeQuality]) return;

    let pageJustLoaded = !svgDiv;
    if (svgDiv) svgDiv.remove();
    svgDiv = document.body.appendChild(document.createElement("div"));
    svgDiv.id = "svgDiv";
    if (pageJustLoaded) svgDiv.style.display = "none";

    const svg = svgDiv.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "svg"));
    svg.style.width = "720px";
    addInnerHTML(svg, "rect", 'x="0" y="0" width="100%" height="100%" fill="#DFEBED">');
    const equipTypeStr =
      infos.type + ", " + (infos.slot ? infos.slot + ", " : "") + infos.quality +
      " [" + (infos.prefix || "") + " | " + (infos.suffix || "") + "]";
    addInnerHTML(
      svg, "text",
      `x="360" y="30" fill="black" font-size="16" font-weight="bolder" text-anchor="middle">Ranges for ${equipTypeStr}</text>`
    );

    const axisStart = 170;
    const axisWidth = 510;
    let y = 70;
    htmlNames.forEach((htmlName) => {
      let graphMin, graphMax;
      qualitiesToDisplay.forEach((q) => {
        if (!rangesByQuality[q] || !rangesByQuality[q][htmlName]) return;
        const r = rangesByQuality[q][htmlName];
        if (graphMin === undefined || r.min < graphMin) graphMin = Number(r.min);
        if (graphMax === undefined || r.max > graphMax) graphMax = Number(r.max);
      });
      if (graphMax === undefined && compareResults && compareResults.bases.unforged[htmlName]) {
        graphMin = 0;
        graphMax = compareResults.bases.unforged[htmlName];
      }
      if (graphMax === undefined) return;

      const calcX = (v) => (axisWidth * (v - graphMin)) / (graphMax - graphMin || 1);
      const nativeRange = rangesByQuality[nativeQuality][htmlName];
      if (!nativeRange) return;

      const g = svg.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "g"));
      const gBg = addInnerHTML(g, "rect",
        `x="0" y="${y - 23}" width="720" height="${35 + 15 * qualitiesToDisplay.length}" fill="none"/>`
      );
      g.addEventListener("mouseover", () => gBg.setAttribute("fill", "yellow"));
      g.addEventListener("mouseleave", () => gBg.setAttribute("fill", "none"));
      addInnerHTML(g, "text", `x="10" y="${y}" fill="blue">${htmlName}</text>`);

      let nativeQualityY;
      qualitiesToDisplay.forEach((q) => {
        const qr = rangesByQuality[q] && rangesByQuality[q][htmlName];
        if (!qr) { y += 15; return; }
        addInnerHTML(g, "text", `x="${axisStart - 62}" y="${y}" fill="blue">${q.slice(0, 3)}</text>`);
        if (qr.max !== 0) {
          addInnerHTML(g, "text", `x="${axisStart - 10}" y="${y}" fill="blue" text-anchor="end">${qr.min}</text>`);
          addInnerHTML(g, "rect",
            `x="${axisStart + calcX(qr.min)}" y="${y - 6}" width="${calcX(qr.max) - calcX(qr.min)}" height="4" fill="black"/>`
          );
          addInnerHTML(g, "text", `x="${axisStart + axisWidth + 10}" y="${y}" fill="blue">${qr.max}</text>`);
        }
        if (q === nativeQuality) nativeQualityY = y;
        y += 15;
      });

      const origX = drawStatCircle(bases.unforged[htmlName], nativeQualityY, false);
      if (compareResults && compareResults.bases.unforged[htmlName]) {
        const compareX = drawStatCircle(compareResults.bases.unforged[htmlName], nativeQualityY, true);
        const [lo, hi] = [origX, compareX].sort((a, b) => a - b);
        if (hi - lo > 12 && !((lo < axisStart && hi < axisStart) || (lo > axisStart + axisWidth && hi > axisStart + axisWidth))) {
          const startX = clamp(lo + 6, axisStart, axisStart + axisWidth);
          const endX = clamp(hi - 6, axisStart, axisStart + axisWidth);
          addInnerHTML(g, "rect",
            `x="${startX}" y="${nativeQualityY - 9}" width="${endX - startX}" height="10" fill="${origX > compareX ? "red" : "#00ff11"}"/>`
          );
        }
      } else if (compareResults && !compareResults.bases.unforged[htmlName]) {
        const endX = clamp(origX - 6, axisStart, axisStart + axisWidth);
        addInnerHTML(g, "rect",
          `x="${axisStart}" y="${nativeQualityY - 9}" width="${endX - axisStart}" height="10" fill="red"/>`
        );
      }

      y += 35;

      function drawStatCircle(unforgedStat, baseY, below) {
        if (baseY === undefined) return undefined;
        const { min, max } = nativeRange;
        if (!unforgedStat && min === 0) {
          addInnerHTML(g, "text",
            `x="${axisStart}" y="${baseY + (below ? 13 : -13)}" stroke="#DFEBED" stroke-width="8" paint-order="stroke" fill="black" text-anchor="middle">0 = 0%</text>`
          );
          addInnerHTML(g, "circle",
            `cx="${axisStart}" cy="${baseY - 4}" r="6" stroke="black" fill="${below ? "#d391ff" : "yellow"}"/>`
          );
          return axisStart;
        }
        const accuratePercentile = (unforgedStat - min) / (max - min);
        const statStr = (Math.round(unforgedStat * 100) / 100) + " = " + Math.round(accuratePercentile * 100) + "%";
        const statXLoc = axisStart + calcX(unforgedStat);
        const visibleX = Math.min(Math.max(statXLoc, 40), 680);
        addInnerHTML(g, "text",
          `x="${visibleX}" y="${baseY + (below ? 13 : -13)}" stroke="#DFEBED" stroke-width="8" paint-order="stroke" fill="black" text-anchor="middle">${statStr}</text>`
        );
        addInnerHTML(g, "circle",
          `cx="${statXLoc}" cy="${baseY - 4}" r="6" stroke="black" fill="${below ? "#d391ff" : "yellow"}"/>`
        );
        return statXLoc;
      }
    });
    svg.style.height = y + "px";
  }
}

function addInnerHTML(parent, elmName, continuedString) {
  parent.appendChild(document.createElement(elmName)).outerHTML =
    "<" + elmName + " " + continuedString;
  return parent.lastChild;
}

function clamp(x, lo, hi) {
  return x < lo ? lo : x > hi ? hi : x;
}

let setupDone = false;

/**
 * @param {{sendRangeEnabled?: boolean}} [options]
 */
export function setupEquipPercentileLive(options) {
  if (setupDone) return;
  setupDone = true;
  // 仅在 showequip.php / /equip/ 页运行
  if (!/\/equip\//.test(location.pathname) && !/showequip\.php/.test(location.pathname)) return;
  injectLiveStyle();
  documentInteractor(options);
}
